// API cost tracking and monthly budget enforcement.
// Stores token usage in the events table and checks against a monthly budget cap.

import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { apiCosts } from "../db/schema.js";

// Approximate pricing per 1M tokens (EUR) — Mistral free tier is 0, but we track
// for when the user switches to a paid plan.
const COST_PER_MILLION_INPUT: Record<string, number> = {
  "pixtral-large-latest": 2.0,
  "mistral-small-latest": 0.2,
};

const COST_PER_MILLION_OUTPUT: Record<string, number> = {
  "pixtral-large-latest": 6.0,
  "mistral-small-latest": 0.6,
};

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (COST_PER_MILLION_INPUT[model] ?? 1.0) * (inputTokens / 1_000_000);
  const outputCost = (COST_PER_MILLION_OUTPUT[model] ?? 3.0) * (outputTokens / 1_000_000);
  return inputCost + outputCost;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Record an API call's cost in the database.
 */
export function trackApiCost(
  model: string,
  usage: TokenUsage,
  discordId?: string
): void {
  const cost = estimateCost(model, usage.inputTokens, usage.outputTokens);
  db.insert(apiCosts)
    .values({
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostEur: cost,
      discordId: discordId ?? null,
    })
    .run();
}

/**
 * Get total estimated cost for the current calendar month.
 */
export function getMonthlySpend(): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startUnix = Math.floor(startOfMonth.getTime() / 1000);

  const result = db
    .select({
      total: sql<number>`coalesce(sum(${apiCosts.estimatedCostEur}), 0)`,
    })
    .from(apiCosts)
    .where(sql`${apiCosts.createdAt} >= ${startUnix}`)
    .get();

  return result?.total ?? 0;
}

/**
 * Get token usage breakdown for the current month.
 */
export function getMonthlyStats(): {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostEur: number;
  byModel: { model: string; calls: number; costEur: number }[];
} {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startUnix = Math.floor(startOfMonth.getTime() / 1000);

  const totals = db
    .select({
      totalCalls: sql<number>`count(*)`,
      totalInputTokens: sql<number>`coalesce(sum(${apiCosts.inputTokens}), 0)`,
      totalOutputTokens: sql<number>`coalesce(sum(${apiCosts.outputTokens}), 0)`,
      totalCostEur: sql<number>`coalesce(sum(${apiCosts.estimatedCostEur}), 0)`,
    })
    .from(apiCosts)
    .where(sql`${apiCosts.createdAt} >= ${startUnix}`)
    .get()!;

  const byModel = db
    .select({
      model: apiCosts.model,
      calls: sql<number>`count(*)`,
      costEur: sql<number>`coalesce(sum(${apiCosts.estimatedCostEur}), 0)`,
    })
    .from(apiCosts)
    .where(sql`${apiCosts.createdAt} >= ${startUnix}`)
    .groupBy(apiCosts.model)
    .all();

  return { ...totals, byModel };
}

const MONTHLY_BUDGET_EUR = parseFloat(process.env.MONTHLY_BUDGET_EUR ?? "5");

/**
 * Check if the monthly budget has been exceeded.
 * Returns true if the bot should accept more requests.
 */
export function isBudgetAvailable(): { ok: boolean; spentEur: number; budgetEur: number } {
  const spent = getMonthlySpend();
  return { ok: spent < MONTHLY_BUDGET_EUR, spentEur: spent, budgetEur: MONTHLY_BUDGET_EUR };
}

/**
 * Check if spending has reached the warning threshold (80%).
 */
export function isBudgetWarning(): boolean {
  const spent = getMonthlySpend();
  return spent >= MONTHLY_BUDGET_EUR * 0.8;
}
