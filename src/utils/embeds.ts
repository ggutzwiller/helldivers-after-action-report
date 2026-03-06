import { EmbedBuilder } from "discord.js";
import type { MissionStats, Style, Language } from "../types.js";
import { t } from "./locale.js";

const STYLE_CONFIG: Record<Style, { color: number; emoji: string }> = {
  heroique: { color: 0xffd700, emoji: "⚔️" },
  tragique: { color: 0x8b0000, emoji: "💀" },
  propagande: { color: 0x00ff00, emoji: "🦅" },
  cynique: { color: 0x808080, emoji: "🙄" },
  statistique: { color: 0x4169e1, emoji: "📊" },
};

export function buildReportEmbed(
  stats: MissionStats,
  narrative: string,
  style: Style,
  lang: Language,
  imageUrl?: string
): EmbedBuilder {
  const config = STYLE_CONFIG[style];
  const l = t(lang);
  const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(1) : "∞";
  const title = l.styleEmbedTitles[style];

  const embed = new EmbedBuilder()
    .setTitle(`${config.emoji} ${title}`)
    .setColor(config.color)
    .setDescription(narrative)
    .addFields(
      {
        name: `🎯 ${l.embedMission}`,
        value: `${stats.missionName} (${stats.difficulty})`,
        inline: false,
      },
      { name: `🔫 ${l.embedKills}`, value: String(stats.kills), inline: true },
      { name: `💀 ${l.embedDeaths}`, value: String(stats.deaths), inline: true },
      { name: `📈 ${l.embedKD}`, value: kd, inline: true },
      { name: `🧪 ${l.embedSamples}`, value: String(stats.samples), inline: true },
      { name: `✅ ${l.embedObjectives}`, value: String(stats.objectives), inline: true }
    )
    .setFooter({ text: l.embedFooter })
    .setTimestamp();

  if (stats.playerName) {
    embed.setAuthor({ name: stats.playerName });
  }

  if (imageUrl) {
    embed.setThumbnail(imageUrl);
  }

  return embed;
}
