import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { players, reports, events } from "../db/schema.js";
import { getMonthlyStats, isBudgetAvailable } from "../services/costs.js";

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

  // Cost monitoring
  const costStats = getMonthlyStats();
  const budget = isBudgetAvailable();
  const budgetPercent = budget.budgetEur > 0
    ? Math.round((budget.spentEur / budget.budgetEur) * 100)
    : 0;

  const budgetBar = renderProgressBar(budgetPercent);
  const modelBreakdown = costStats.byModel
    .map((m) => `${m.model}: ${m.calls} calls (${m.costEur.toFixed(4)}€)`)
    .join("\n") || "No API calls this month";

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
      { name: "Rate limited", value: String(countMap["rate_limited"] ?? 0), inline: true },
      { name: "Budget exceeded", value: String(countMap["budget_exceeded"] ?? 0), inline: true },
      {
        name: `Monthly budget ${budgetBar}`,
        value: `${budget.spentEur.toFixed(4)}€ / ${budget.budgetEur}€ (${budgetPercent}%)`,
        inline: false,
      },
      {
        name: "API calls this month",
        value: `${costStats.totalCalls} calls | ${costStats.totalInputTokens.toLocaleString()} in / ${costStats.totalOutputTokens.toLocaleString()} out tokens`,
        inline: false,
      },
      {
        name: "Cost by model",
        value: `\`\`\`\n${modelBreakdown}\n\`\`\``,
        inline: false,
      },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

function renderProgressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}]`;
}
