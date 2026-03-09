import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { players, reports, reportPlayerStats, events } from "../db/schema.js";
import { analyzeScreenshot, PIXTRAL_MODEL } from "../services/pixtral.js";
import { reportQueue, isQueueFull } from "../services/queue.js";
import { generateNarrative, STYLES, NARRATIVE_MODEL } from "../services/templates.js";
import { checkRateLimit, recordRequest } from "../services/ratelimit.js";
import { trackApiCost, isBudgetAvailable, isBudgetWarning } from "../services/costs.js";
import type { Language, Style } from "../types.js";
import { buildReportEmbed } from "../utils/embeds.js";
import { t } from "../utils/locale.js";
import { validateImage } from "../utils/validation.js";

export const data = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Analyse un screenshot de fin de mission Helldivers 2")
  .addAttachmentOption((opt) =>
    opt
      .setName("image")
      .setDescription("Screenshot de fin de mission")
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("style")
      .setDescription("Style du rapport")
      .setRequired(false)
      .addChoices(
        { name: "🎲 Random", value: "random" },
        ...STYLES.filter((s) => s !== "random").map((s) => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: s }))
      )
  )
  .addStringOption((opt) =>
    opt
      .setName("lang")
      .setDescription("Report language / Langue du rapport")
      .setRequired(false)
      .addChoices(
        { name: "Français", value: "fr" },
        { name: "English", value: "en" }
      )
  );

function trackEvent(type: string, discordId: string, detail?: string) {
  db.insert(events).values({ type, discordId, detail }).run();
}

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const attachment = interaction.options.getAttachment("image", true);
  const style = (interaction.options.getString("style") ?? "heroic") as Style;
  const lang = (interaction.options.getString("lang") ?? "fr") as Language;
  const l = t(lang);
  const userId = interaction.user.id;
  const guildId = interaction.guildId;

  // Validate image format/size
  const validation = validateImage(attachment, lang);
  if (!validation.valid) {
    trackEvent("invalid_image", userId, validation.reason);
    await interaction.reply({ content: `❌ ${validation.reason}`, ephemeral: true });
    return;
  }

  // Check rate limits
  const rateLimit = checkRateLimit(userId, guildId);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfterMs / 60_000);
    const message =
      rateLimit.reason === "user"
        ? l.errorRateLimitUser(minutes)
        : l.errorRateLimitGuild(minutes);
    trackEvent("rate_limited", userId, rateLimit.reason);
    await interaction.reply({ content: `⏳ ${message}`, ephemeral: true });
    return;
  }

  // Check queue capacity
  const queue = isQueueFull();
  if (queue.full) {
    trackEvent("queue_full", userId, `pending:${queue.pending}`);
    await interaction.reply({
      content: `⏳ ${l.errorQueueFull}`,
      ephemeral: true,
    });
    return;
  }

  // Check budget
  const budget = isBudgetAvailable();
  if (!budget.ok) {
    console.warn(
      `[Budget] Monthly budget exceeded: ${budget.spentEur.toFixed(4)}€ / ${budget.budgetEur}€`
    );
    trackEvent("budget_exceeded", userId);
    await interaction.reply({ content: `💸 ${l.errorBudgetExceeded}`, ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    await reportQueue.add(async () => {
      // Analyze screenshot via Pixtral
      const { stats, usage: pixtralUsage } = await analyzeScreenshot(attachment.url);
      trackApiCost(PIXTRAL_MODEL, pixtralUsage, userId);

      // Generate narrative via Mistral Small
      const { text: narrative, usage: narrativeUsage } = await generateNarrative(
        stats,
        style,
        lang
      );
      trackApiCost(NARRATIVE_MODEL, narrativeUsage, userId);

      // Log budget warning if approaching limit
      if (isBudgetWarning()) {
        const b = isBudgetAvailable();
        console.warn(
          `[Budget] WARNING: Monthly spend at ${b.spentEur.toFixed(4)}€ / ${b.budgetEur}€ (${Math.round((b.spentEur / b.budgetEur) * 100)}%)`
        );
      }

      // Find or create player
      let player = db
        .select()
        .from(players)
        .where(eq(players.discordId, userId))
        .get();

      if (!player) {
        player = db
          .insert(players)
          .values({
            discordId: userId,
            username: interaction.user.username,
          })
          .returning()
          .get();
      }

      // Persist report
      const report = db
        .insert(reports)
        .values({
          submittedBy: player.id,
          shipName: stats.shipName,
          style,
          narrative,
          imageUrl: attachment.url,
        })
        .returning()
        .get();

      // Persist per-player stats
      for (const p of stats.players) {
        db.insert(reportPlayerStats)
          .values({
            reportId: report.id,
            playerName: p.name,
            kills: p.kills,
            accuracy: p.accuracy,
            deaths: p.deaths,
            stimsUsed: p.stimsUsed,
            samples: p.samples,
            meleeKills: p.meleeKills,
            friendlyFireDamage: p.friendlyFireDamage,
          })
          .run();
      }

      // Record rate limit hit only after successful processing
      recordRequest(userId, guildId);
      trackEvent("report_success", userId);

      const embed = buildReportEmbed(stats, narrative, style, lang, attachment.url);
      await interaction.editReply({ embeds: [embed] });
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const isNotHelldivers =
      rawMessage.includes("not appear") || rawMessage.includes("ne semble pas");

    // Log the full error server-side, but only show safe messages to the user
    console.error(`[Report] Error for user ${userId}:`, rawMessage);
    trackEvent(isNotHelldivers ? "not_helldivers" : "report_error", userId, rawMessage);

    const userMessage = isNotHelldivers ? rawMessage : l.errorGeneric;
    await interaction.editReply({ content: `❌ ${userMessage}` });
  }
}
