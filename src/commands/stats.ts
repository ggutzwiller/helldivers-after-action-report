import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { players, reports } from "../db/schema.js";
import type { Language } from "../types.js";
import { t } from "../utils/locale.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Affiche ton historique de Democratie repandue")
  .addStringOption((opt) =>
    opt
      .setName("lang")
      .setDescription("Language / Langue")
      .setRequired(false)
      .addChoices(
        { name: "Français", value: "fr" },
        { name: "English", value: "en" }
      )
  );

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const lang = (interaction.options.getString("lang") ?? "fr") as Language;
  const l = t(lang);

  const player = db
    .select()
    .from(players)
    .where(eq(players.discordId, interaction.user.id))
    .get();

  if (!player) {
    await interaction.reply({
      content: `❌ ${l.errorNoReport}`,
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const totals = db
    .select({
      totalMissions: sql<number>`count(*)`,
      totalKills: sql<number>`coalesce(sum(${reports.kills}), 0)`,
      totalDeaths: sql<number>`coalesce(sum(${reports.deaths}), 0)`,
      totalSamples: sql<number>`coalesce(sum(${reports.samples}), 0)`,
    })
    .from(reports)
    .where(eq(reports.playerId, player.id))
    .get()!;

  const recentReports = db
    .select()
    .from(reports)
    .where(eq(reports.playerId, player.id))
    .orderBy(desc(reports.createdAt))
    .limit(5)
    .all();

  const kd =
    totals.totalDeaths > 0
      ? (totals.totalKills / totals.totalDeaths).toFixed(1)
      : "∞";

  const embed = new EmbedBuilder()
    .setTitle(`📋 ${l.embedStatsTitle(interaction.user.username)}`)
    .setColor(0x4169e1)
    .addFields(
      { name: `🎖️ ${l.embedMissionsCompleted}`, value: String(totals.totalMissions), inline: true },
      { name: `🔫 ${l.embedTotalKills}`, value: String(totals.totalKills), inline: true },
      { name: `📈 ${l.embedGlobalKD}`, value: kd, inline: true },
      { name: `🧪 ${l.embedTotalSamples}`, value: String(totals.totalSamples), inline: true },
      { name: `💀 ${l.embedTotalDeaths}`, value: String(totals.totalDeaths), inline: true }
    )
    .setTimestamp();

  if (recentReports.length > 0) {
    const recentText = recentReports
      .map(
        (r) =>
          `• **${r.missionName ?? l.unknownMission}** (${r.difficulty ?? "?"}) — ${r.kills} kills, ${r.deaths} ${l.embedDeaths.toLowerCase()}`
      )
      .join("\n");
    embed.addFields({ name: `📜 ${l.embedRecentMissions}`, value: recentText, inline: false });
  }

  embed.setFooter({ text: l.embedFooter });

  await interaction.editReply({ embeds: [embed] });
}
