export interface PlayerStats {
  name: string;
  kills: number;
  accuracy: number;
  deaths: number;
  stimsUsed: number;
  samples: number;
  meleeKills: number;
  friendlyFireDamage: number;
}

export interface MissionStats {
  shipName: string;
  players: PlayerStats[];
}

export type Style =
  | "heroic"
  | "tragic"
  | "propaganda"
  | "cynical"
  | "statistical";

export type Language = "fr" | "en";
