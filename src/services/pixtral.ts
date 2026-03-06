import { Mistral } from "@mistralai/mistralai";
import type { MissionStats } from "../types.js";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const EXTRACTION_PROMPT = `Tu es un analyseur de screenshots de fin de mission Helldivers 2.
Analyse cette image et extrais les statistiques de mission au format JSON strict.

Si l'image n'est PAS un écran de fin de mission Helldivers 2, réponds uniquement : {"error": "not_helldivers"}

Sinon, réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte autour) :
{
  "missionName": "nom de la mission",
  "difficulty": "niveau de difficulté",
  "kills": 0,
  "deaths": 0,
  "samples": 0,
  "objectives": 0,
  "playerName": "nom du joueur ou null"
}

Remplis chaque champ avec les valeurs visibles sur le screenshot. Si une valeur n'est pas visible, mets 0 pour les nombres et null pour les textes.`;

function extractJson(text: string): string {
  // Pixtral sometimes wraps JSON in markdown code blocks
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

export async function analyzeScreenshot(
  imageUrl: string
): Promise<MissionStats> {
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
  if (!text || typeof text !== "string") {
    throw new Error("No response from Pixtral.");
  }

  const parsed = JSON.parse(extractJson(text));

  if (parsed.error === "not_helldivers") {
    throw new Error(
      "This screenshot does not appear to be a Helldivers 2 end-of-mission screen."
    );
  }

  return {
    missionName: parsed.missionName ?? "Unknown",
    difficulty: parsed.difficulty ?? "Unknown",
    kills: parsed.kills ?? 0,
    deaths: parsed.deaths ?? 0,
    samples: parsed.samples ?? 0,
    objectives: parsed.objectives ?? 0,
    playerName: parsed.playerName ?? null,
  };
}
