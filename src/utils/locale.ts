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
  errorRateLimitUser: (minutes: number) => string;
  errorRateLimitGuild: (minutes: number) => string;
  errorBudgetExceeded: string;
  errorQueueFull: string;
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
  embedFooter: "Une autre tasse de liber-thé ? | /report pour generer un rapport | /support pour soutenir le bot",
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
  errorRateLimitUser: (minutes) =>
    `Tu as atteint la limite de rapports (5/heure). Reessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
  errorRateLimitGuild: (minutes) =>
    `Ce serveur a atteint la limite de rapports (20/heure). Reessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
  errorBudgetExceeded:
    "Le bot a atteint son budget mensuel d'appels API. Il sera de retour le mois prochain !",
  errorQueueFull:
    "Le bot est surcharge, trop de rapports en attente. Reessaie dans quelques minutes.",
  unknownPlayer: "Inconnu",
  unknownMission: "Inconnue",
  narrativeLanguageInstruction: "Redige en francais.",
  styleEmbedTitles: {
    heroic: "Rapport Heroique",
    tragic: "Rapport Tragique",
    propaganda: "Bulletin de Propagande",
    cynical: "Rapport Cynique",
    statistical: "Analyse Statistique",
    random: "Rapport Surprise",
  },
};

const en: Locale = {
  embedShip: "Ship",

  embedKills: "Kills",
  embedDeaths: "Deaths",
  embedSamples: "Samples",
  embedFooter: "For Managed Democracy! | /report to generate a report | /support to support the bot",
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
  errorRateLimitUser: (minutes) =>
    `You've reached the report limit (5/hour). Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
  errorRateLimitGuild: (minutes) =>
    `This server has reached the report limit (20/hour). Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
  errorBudgetExceeded:
    "The bot has reached its monthly API budget. It will be back next month!",
  errorQueueFull:
    "The bot is overloaded, too many reports pending. Please try again in a few minutes.",
  unknownPlayer: "Unknown",
  unknownMission: "Unknown",
  narrativeLanguageInstruction: "Write in English.",
  styleEmbedTitles: {
    heroic: "Heroic Report",
    tragic: "Tragic Report",
    propaganda: "Propaganda Bulletin",
    cynical: "Cynical Report",
    statistical: "Statistical Analysis",
    random: "Surprise Report",
  },
};

const LOCALES: Record<Language, Locale> = { fr, en };

export function t(lang: Language): Locale {
  return LOCALES[lang];
}
