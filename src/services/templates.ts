import { Mistral } from "@mistralai/mistralai";
import type { MissionStats, Style, Language } from "../types.js";
import { t } from "../utils/locale.js";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export const STYLES: Style[] = [
  "heroic",
  "tragic",
  "propaganda",
  "cynical",
  "statistical",
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

Rédige un rapport de 3 à 5 phrases maximum. Mentionne les joueurs par leur nom. Sois concis et percutant. {languageInstruction}`;

export async function generateNarrative(
  stats: MissionStats,
  style: Style,
  lang: Language
): Promise<string> {
  const l = t(lang);
  const userPrompt = BASE_PROMPT.replace("{shipName}", stats.shipName)
    .replace("{playerStats}", formatPlayerStats(stats))
    .replace("{languageInstruction}", l.narrativeLanguageInstruction);

  console.log(`[Mistral] Generating narrative (style: ${style}, lang: ${lang})...`);
  const response = await client.chat.complete({
    model: "mistral-small-latest",
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

  console.log("[Mistral] Generated narrative:", text);
  return text.trim();
}
