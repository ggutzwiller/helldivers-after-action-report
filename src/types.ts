export interface MissionStats {
  missionName: string;
  difficulty: string;
  kills: number;
  deaths: number;
  samples: number;
  objectives: number;
  playerName: string | null;
}

export type Style =
  | "heroique"
  | "tragique"
  | "propagande"
  | "cynique"
  | "statistique";

export type Language = "fr" | "en";
