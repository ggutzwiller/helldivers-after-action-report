const API_BASE = "https://api.helldivers2.dev/api/v1";
const HEADERS = {
  "X-Super-Client": "super-earth-daily-news",
  "X-Super-Contact": "discord-bot",
};

// Cache war context for 10 minutes to avoid hammering the API
let cachedContext: WarContext | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface WarContext {
  majorOrder: string | null;
  recentDispatch: string | null;
  activePlanets: string[];
  playerCount: number;
  factions: string[];
}

function stripMarkup(text: string): string {
  return text.replace(/<i=\d+>/g, "").replace(/<\/i>/g, "");
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: HEADERS });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface Assignment {
  title: string;
  briefing: string;
}

interface Dispatch {
  message: string;
  published: string;
}

interface Campaign {
  planet: {
    name: string;
    currentOwner: string;
    playerCount: number;
  };
}

interface WarStatus {
  factions: string[];
  statistics: {
    playerCount: number;
  };
}

export async function getWarContext(): Promise<WarContext | null> {
  if (cachedContext && Date.now() < cacheExpiry) {
    return cachedContext;
  }

  try {
    const [assignments, dispatches, campaigns, war] = await Promise.all([
      fetchJson<Assignment[]>("/assignments"),
      fetchJson<Dispatch[]>("/dispatches"),
      fetchJson<Campaign[]>("/campaigns"),
      fetchJson<WarStatus>("/war"),
    ]);

    const majorOrder = assignments?.[0]?.briefing ?? null;

    const recentDispatch = dispatches?.[0]?.message
      ? stripMarkup(dispatches[0].message)
      : null;

    const activePlanets = (campaigns ?? [])
      .sort((a, b) => b.planet.playerCount - a.planet.playerCount)
      .slice(0, 5)
      .map((c) => `${c.planet.name} (vs ${c.planet.currentOwner})`);

    const context: WarContext = {
      majorOrder: majorOrder ? stripMarkup(majorOrder) : null,
      recentDispatch,
      activePlanets,
      playerCount: war?.statistics?.playerCount ?? 0,
      factions: war?.factions ?? [],
    };

    cachedContext = context;
    cacheExpiry = Date.now() + CACHE_TTL_MS;

    console.log(
      `[GalacticWar] Context refreshed: ${activePlanets.length} active planets, ${context.playerCount} players online`
    );

    return context;
  } catch (err) {
    console.warn("[GalacticWar] Failed to fetch war context:", err);
    return null;
  }
}

export function formatWarContext(ctx: WarContext): string {
  const lines: string[] = ["=== GALACTIC WAR CONTEXT ==="];

  if (ctx.majorOrder) {
    lines.push(`Current Major Order: ${ctx.majorOrder}`);
  }

  if (ctx.recentDispatch) {
    lines.push(`Latest Super Earth Dispatch: ${ctx.recentDispatch}`);
  }

  if (ctx.activePlanets.length > 0) {
    lines.push(`Active frontlines: ${ctx.activePlanets.join(", ")}`);
  }

  if (ctx.playerCount > 0) {
    lines.push(`Helldivers currently deployed: ${ctx.playerCount.toLocaleString()}`);
  }

  return lines.join("\n");
}
