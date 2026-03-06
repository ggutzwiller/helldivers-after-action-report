import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
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
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  missionName: text("mission_name"),
  difficulty: text("difficulty"),
  kills: integer("kills"),
  deaths: integer("deaths"),
  samples: integer("samples"),
  objectives: integer("objectives"),
  style: text("style").notNull(),
  narrative: text("narrative"),
  imageUrl: text("image_url"),
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
