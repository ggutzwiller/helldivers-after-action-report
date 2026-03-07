import { Mistral } from "@mistralai/mistralai";
import type { MissionStats, PlayerStats } from "../types.js";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const EXTRACTION_PROMPT = `Tu es un analyseur de screenshots de fin de mission Helldivers 2.
Analyse cette image et extrais les statistiques de mission au format JSON strict.

Si l'image n'est PAS un écran de fin de mission Helldivers 2, réponds uniquement : {"error": "not_helldivers"}

Sinon, réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte autour) :
{
  "shipName": "nom du vaisseau",
  "players": [
    {
      "name": "nom du joueur",
      "kills": 0,
      "accuracy": 0,
      "deaths": 0,
      "stimsUsed": 0,
      "samples": 0,
      "meleeKills": 0,
      "friendlyFireDamage": 0
    }
  ]
}

Voici des instructions pour remplir le JSON :
- shipName : le nom du vaisseau utilisé (ex: "USS Justice")
- players : un tableau contenant les stats de CHAQUE joueur visible sur le screenshot (jusqu'à 4 joueurs)
  - name : le nom du joueur tel qu'affiché sur le screenshot
  - kills : le nombre de kills réalisés
  - accuracy : la précision en pourcentage (ex: 75 pour 75%)
  - deaths : le nombre de morts
  - stimsUsed : le nombre de stims utilisés
  - samples : le nombre d'échantillons collectés
  - meleeKills : le nombre de kills au corps à corps
  - friendlyFireDamage : les dégâts causés aux alliés

Remplis chaque champ avec les valeurs visibles sur le screenshot. Si une valeur n'est pas visible, mets 0 pour les nombres et "Unknown" pour les noms.`;

function extractJson(text: string): string {
  // Pixtral sometimes wraps JSON in markdown code blocks
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

function parsePlayer(raw: Record<string, unknown>): PlayerStats {
  return {
    name: (raw.name as string) ?? "Unknown",
    kills: (raw.kills as number) ?? 0,
    accuracy: (raw.accuracy as number) ?? 0,
    deaths: (raw.deaths as number) ?? 0,
    stimsUsed: (raw.stimsUsed as number) ?? 0,
    samples: (raw.samples as number) ?? 0,
    meleeKills: (raw.meleeKills as number) ?? 0,
    friendlyFireDamage: (raw.friendlyFireDamage as number) ?? 0,
  };
}

export async function analyzeScreenshot(
  imageUrl: string
): Promise<MissionStats> {
  console.log("[Pixtral] Sending image for analysis...");
  const response = await client.chat.complete({
    model: "pixtral-large-latest",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          { type: "image_url", imageUrl: { url: imageUrl } },
        ],
      },
    ],
  });

  const text = response.choices?.[0]?.message?.content;
  console.log("[Pixtral] Raw response:", text);
  if (!text || typeof text !== "string") {
    throw new Error("No response from Pixtral.");
  }

  const parsed = JSON.parse(extractJson(text));
  console.log("[Pixtral] Extracted stats:", parsed);

  if (parsed.error === "not_helldivers") {
    throw new Error(
      "This screenshot does not appear to be a Helldivers 2 end-of-mission screen."
    );
  }

  const rawPlayers = Array.isArray(parsed.players) ? parsed.players : [];
  const players: PlayerStats[] = rawPlayers.map((p: Record<string, unknown>) =>
    parsePlayer(p)
  );

  if (players.length === 0) {
    players.push(parsePlayer(parsed));
  }

  return {
    shipName: parsed.shipName ?? "Unknown",
    players,
  };
}
