import type { Language, Style } from "../types.js";

interface Locale {
  embedMission: string;
  embedKills: string;
  embedDeaths: string;
  embedKD: string;
  embedSamples: string;
  embedObjectives: string;
  embedFooter: string;
  embedStatsTitle: (username: string) => string;
  embedMissionsCompleted: string;
  embedTotalKills: string;
  embedGlobalKD: string;
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
  embedMission: "Mission",
  embedKills: "Kills",
  embedDeaths: "Morts",
  embedKD: "K/D",
  embedSamples: "Echantillons",
  embedObjectives: "Objectifs",
  embedFooter: "Pour la Democratie Geree ! | /report pour generer un rapport",
  embedStatsTitle: (username) => `Dossier de ${username}`,
  embedMissionsCompleted: "Missions completees",
  embedTotalKills: "Kills totaux",
  embedGlobalKD: "K/D global",
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
    heroique: "Rapport Heroique",
    tragique: "Rapport Tragique",
    propagande: "Bulletin de Propagande",
    cynique: "Rapport Cynique",
    statistique: "Analyse Statistique",
  },
};

const en: Locale = {
  embedMission: "Mission",
  embedKills: "Kills",
  embedDeaths: "Deaths",
  embedKD: "K/D",
  embedSamples: "Samples",
  embedObjectives: "Objectives",
  embedFooter: "For Managed Democracy! | /report to generate a report",
  embedStatsTitle: (username) => `Dossier of ${username}`,
  embedMissionsCompleted: "Missions completed",
  embedTotalKills: "Total kills",
  embedGlobalKD: "Overall K/D",
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
    heroique: "Heroic Report",
    tragique: "Tragic Report",
    propagande: "Propaganda Bulletin",
    cynique: "Cynical Report",
    statistique: "Statistical Analysis",
  },
};

const LOCALES: Record<Language, Locale> = { fr, en };

export function t(lang: Language): Locale {
  return LOCALES[lang];
}
