import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey(),
  discordId: text("discord_id").unique().notNull(),
  username: text("username").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey(),
  submittedBy: integer("submitted_by")
    .notNull()
    .references(() => players.id),
  shipName: text("ship_name"),
  style: text("style").notNull(),
  narrative: text("narrative"),
  imageUrl: text("image_url"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const reportPlayerStats = sqliteTable("report_player_stats", {
  id: integer("id").primaryKey(),
  reportId: integer("report_id")
    .notNull()
    .references(() => reports.id),
  playerName: text("player_name").notNull(),
  kills: integer("kills"),
  accuracy: integer("accuracy"),
  deaths: integer("deaths"),
  stimsUsed: integer("stims_used"),
  samples: integer("samples"),
  meleeKills: integer("melee_kills"),
  friendlyFireDamage: integer("friendly_fire_damage"),
});

// Tracks API costs for budget monitoring
export const apiCosts = sqliteTable("api_costs", {
  id: integer("id").primaryKey(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  estimatedCostEur: real("estimated_cost_eur").notNull(),
  discordId: text("discord_id"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

// Tracks bot events for the /usage command
export const events = sqliteTable("events", {
  id: integer("id").primaryKey(),
  type: text("type").notNull(), // "report_success", "report_error", "not_helldivers", "invalid_image"
  discordId: text("discord_id"),
  detail: text("detail"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});
