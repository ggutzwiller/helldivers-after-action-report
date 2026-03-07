import { EmbedBuilder } from "discord.js";
import type { MissionStats, Style, Language } from "../types.js";
import { t } from "./locale.js";

const STYLE_CONFIG: Record<Style, { color: number; emoji: string }> = {
  heroic: { color: 0xffd700, emoji: "⚔️" },
  tragic: { color: 0x8b0000, emoji: "💀" },
  propaganda: { color: 0x00ff00, emoji: "🦅" },
  cynical: { color: 0x808080, emoji: "🙄" },
  statistical: { color: 0x4169e1, emoji: "📊" },
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
  const title = l.styleEmbedTitles[style];

  const embed = new EmbedBuilder()
    .setTitle(`${config.emoji} ${title}`)
    .setColor(config.color)
    .setDescription(narrative)
    .addFields({
      name: `🎯 ${l.embedShip}`,
      value: stats.shipName,
      inline: false,
    });

  for (const p of stats.players) {
    const line = `🔫 ${p.kills} ${l.embedKills} · 💀 ${p.deaths} ${l.embedDeaths} · 🧪 ${p.samples} ${l.embedSamples} · 🎯 ${p.accuracy}%`;
    embed.addFields({
      name: `👤 ${p.name}`,
      value: line,
      inline: false,
    });
  }

  embed
    .setAuthor({ name: "Greg, from the Super-Earth Daily News" })
    .setFooter({ text: l.embedFooter })
    .setTimestamp();

  if (imageUrl) {
    embed.setThumbnail(imageUrl);
  }

  return embed;
}
