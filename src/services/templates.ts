import { Mistral } from "@mistralai/mistralai";
import type { MissionStats, Style, Language } from "../types.js";
import type { TokenUsage } from "./costs.js";
import { t } from "../utils/locale.js";
import { getWarContext, formatWarContext } from "./galactic-war.js";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export const NARRATIVE_MODEL = "mistral-small-latest";

export const STYLES: Style[] = [
  "heroic",
  "tragic",
  "propaganda",
  "cynical",
  "statistical",
  "random",
];

const STYLE_PROMPTS: Record<Style, string> = {
  heroic: `Tu es un chroniqueur épique de Super Earth. Rédige un rapport après-action héroïque et glorieux.
Utilise un ton martial, des métaphores grandioses, et célèbre les exploits de l'escouade.
Fais référence à la Démocratie Gérée et à la gloire de Super Earth.`,

  tragic: `Tu es un correspondant de guerre traumatisé. Rédige un rapport après-action sombre et mélancolique.
Insiste sur les pertes, le chaos, et le coût humain de la mission.
Le ton doit être grave et poignant, comme une lettre du front.`,

  propaganda: `Tu es le Ministère de la Vérité de Super Earth. Rédige un bulletin de propagande triomphaliste.
Tout est une victoire écrasante, même les échecs. Minimise les pertes, exagère les succès.
Utilise des slogans patriotiques et des références à la Démocratie Gérée.`,

  cynical: `Tu es un vétéran désabusé qui a tout vu. Rédige un rapport sarcastique et cynique.
Moque la bureaucratie de Super Earth, les ordres absurdes, et l'incompétence générale.
Le ton est sec, drôle, et désenchanté.`,

  statistical: `Tu es un analyste militaire froid et méthodique. Rédige un rapport purement factuel.
Présente les données de manière structurée avec des indicateurs de performance.
Calcule des ratios (kills/deaths, efficacité), et donne une note globale de mission.`,

  random: `Choisis toi-même un ton totalement inattendu et surprenant pour ce rapport après-action.
Tu peux être poétique, romantique, façon film noir, à la manière d'un commentateur sportif surexcité,
en mode journal intime, comme un rapport de bug informatique, façon conte de fées, en mode rap battle,
comme un critique gastronomique, ou tout autre ton créatif et original de ton invention.
Surprends le lecteur. Ne précise pas quel ton tu as choisi — laisse-le deviner.`,
};

function formatPlayerStats(stats: MissionStats): string {
  return stats.players
    .map(
      (p, i) =>
        `Joueur ${i + 1} — ${p.name} :
  Kills : ${p.kills}, Précision : ${p.accuracy}%, Morts : ${p.deaths}, Stims : ${p.stimsUsed}, Échantillons : ${p.samples}, Melee : ${p.meleeKills}, Tir allié : ${p.friendlyFireDamage}`
    )
    .join("\n");
}

const BASE_PROMPT = `Tu rédiges un rapport après-action pour une mission Helldivers 2 réalisée par une escouade.
Voici les statistiques de la mission :

Vaisseau : {shipName}

{playerStats}

{warContext}

Si un contexte de guerre galactique est fourni, intègre-le subtilement dans le rapport (référence au Major Order en cours, aux fronts actifs, ou aux dépêches récentes). Ne te contente pas de le citer — tisse-le dans le récit.

Rédige un rapport de 4 à 7 phrases. Mentionne les joueurs par leur nom. Sois concis et percutant. {languageInstruction}`;

export interface NarrativeResult {
  text: string;
  usage: TokenUsage;
}

export async function generateNarrative(
  stats: MissionStats,
  style: Style,
  lang: Language
): Promise<NarrativeResult> {
  const l = t(lang);

  // Fetch galactic war context (non-blocking, returns null on failure)
  const warCtx = await getWarContext();
  const warContextStr = warCtx ? formatWarContext(warCtx) : "";

  const userPrompt = BASE_PROMPT.replace("{shipName}", stats.shipName)
    .replace("{playerStats}", formatPlayerStats(stats))
    .replace("{warContext}", warContextStr)
    .replace("{languageInstruction}", l.narrativeLanguageInstruction);

  console.log(`[Mistral] Generating narrative (style: ${style}, lang: ${lang})...`);
  const response = await client.chat.complete({
    model: NARRATIVE_MODEL,
    messages: [
      { role: "system", content: STYLE_PROMPTS[style] },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 500,
  });

  const text = response.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("No response from Mistral for narrative generation.");
  }

  const usage: TokenUsage = {
    inputTokens: response.usage?.promptTokens ?? 0,
    outputTokens: response.usage?.completionTokens ?? 0,
  };

  console.log("[Mistral] Generated narrative:", text);
  return { text: text.trim(), usage };
}
