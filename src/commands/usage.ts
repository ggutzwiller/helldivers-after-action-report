import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { players, reports, events } from "../db/schema.js";

export const data = new SlashCommandBuilder()
  .setName("usage")
  .setDescription("Bot usage statistics (admin)");

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const totalPlayers = db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .get()!.count;

  const totalReports = db
    .select({ count: sql<number>`count(*)` })
    .from(reports)
    .get()!.count;

  const eventCounts = db
    .select({
      type: events.type,
      count: sql<number>`count(*)`,
    })
    .from(events)
    .groupBy(events.type)
    .all();

  const countMap = Object.fromEntries(eventCounts.map((e) => [e.type, e.count]));

  const last24h = Math.floor(Date.now() / 1000) - 86400;
  const reportsLast24h = db
    .select({ count: sql<number>`count(*)` })
    .from(events)
    .where(sql`${events.type} = 'report_success' AND ${events.createdAt} >= ${last24h}`)
    .get()!.count;

  const embed = new EmbedBuilder()
    .setTitle("Bot Usage Statistics")
    .setColor(0x5865f2)
    .addFields(
      { name: "Total players", value: String(totalPlayers), inline: true },
      { name: "Total reports", value: String(totalReports), inline: true },
      { name: "Reports (24h)", value: String(reportsLast24h), inline: true },
      { name: "Successful reports", value: String(countMap["report_success"] ?? 0), inline: true },
      { name: "Errors", value: String(countMap["report_error"] ?? 0), inline: true },
      { name: "Not Helldivers", value: String(countMap["not_helldivers"] ?? 0), inline: true },
      { name: "Invalid images", value: String(countMap["invalid_image"] ?? 0), inline: true },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
