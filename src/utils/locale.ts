import type { Language, Style } from "../types.js";

interface Locale {
  embedShip: string;

  embedKills: string;
  embedDeaths: string;
  embedSamples: string;
  embedFooter: string;
  embedStatsTitle: (username: string) => string;
  embedMissionsCompleted: string;
  embedTotalKills: string;
  embedTotalSamples: string;
  embedTotalDeaths: string;
  embedRecentMissions: string;
  errorNoReport: string;
  errorInvalidFormat: string;
  errorImageTooLarge: (sizeMb: string) => string;
  errorGeneric: string;
  unknownPlayer: string;
  unknownMission: string;
  narrativeLanguageInstruction: string;
  styleEmbedTitles: Record<Style, string>;
}

const fr: Locale = {
  embedShip: "Vaisseau",

  embedKills: "Kills",
  embedDeaths: "Morts",
  embedSamples: "Echantillons",
  embedFooter: "Une autre tasse de liber-thé ? | /report pour generer un rapport",
  embedStatsTitle: (username) => `Dossier de ${username}`,
  embedMissionsCompleted: "Missions completees",
  embedTotalKills: "Kills totaux",
  embedTotalSamples: "Echantillons collectes",
  embedTotalDeaths: "Morts totales",
  embedRecentMissions: "Dernieres missions",
  errorNoReport: "Aucun rapport trouve. Utilise `/report` pour commencer !",
  errorInvalidFormat: "Format invalide. Seuls les fichiers JPG et PNG sont acceptes.",
  errorImageTooLarge: (sizeMb) => `Image trop lourde (${sizeMb} Mo). Maximum : 10 Mo.`,
  errorGeneric: "Une erreur est survenue.",
  unknownPlayer: "Inconnu",
  unknownMission: "Inconnue",
  narrativeLanguageInstruction: "Redige en francais.",
  styleEmbedTitles: {
    heroic: "Rapport Heroique",
    tragic: "Rapport Tragique",
    propaganda: "Bulletin de Propagande",
    cynical: "Rapport Cynique",
    statistical: "Analyse Statistique",
  },
};

const en: Locale = {
  embedShip: "Ship",

  embedKills: "Kills",
  embedDeaths: "Deaths",
  embedSamples: "Samples",
  embedFooter: "For Managed Democracy! | /report to generate a report",
  embedStatsTitle: (username) => `Dossier of ${username}`,
  embedMissionsCompleted: "Missions completed",
  embedTotalKills: "Total kills",
  embedTotalSamples: "Samples collected",
  embedTotalDeaths: "Total deaths",
  embedRecentMissions: "Recent missions",
  errorNoReport: "No reports found. Use `/report` to get started!",
  errorInvalidFormat: "Invalid format. Only JPG and PNG files are accepted.",
  errorImageTooLarge: (sizeMb) => `Image too large (${sizeMb} MB). Maximum: 10 MB.`,
  errorGeneric: "An error occurred.",
  unknownPlayer: "Unknown",
  unknownMission: "Unknown",
  narrativeLanguageInstruction: "Write in English.",
  styleEmbedTitles: {
    heroic: "Heroic Report",
    tragic: "Tragic Report",
    propaganda: "Propaganda Bulletin",
    cynical: "Cynical Report",
    statistical: "Statistical Analysis",
  },
};

const LOCALES: Record<Language, Locale> = { fr, en };

export function t(lang: Language): Locale {
  return LOCALES[lang];
}
