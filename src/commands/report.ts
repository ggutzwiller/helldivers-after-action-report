import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { players, reports, reportPlayerStats, events } from "../db/schema.js";
import { analyzeScreenshot } from "../services/pixtral.js";
import { reportQueue } from "../services/queue.js";
import { generateNarrative, STYLES } from "../services/templates.js";
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
        ...STYLES.map((s) => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: s }))
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

  const validation = validateImage(attachment, lang);
  if (!validation.valid) {
    trackEvent("invalid_image", userId, validation.reason);
    await interaction.reply({ content: `❌ ${validation.reason}`, ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    await reportQueue.add(async () => {
      const stats = await analyzeScreenshot(attachment.url);
      const narrative = await generateNarrative(stats, style, lang);

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

      trackEvent("report_success", userId);

      const embed = buildReportEmbed(stats, narrative, style, lang, attachment.url);
      await interaction.editReply({ embeds: [embed] });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : l.errorGeneric;
    const isNotHelldivers = message.includes("not appear") || message.includes("ne semble pas");
    trackEvent(isNotHelldivers ? "not_helldivers" : "report_error", userId, message);
    await interaction.editReply({ content: `❌ ${message}` });
  }
}
