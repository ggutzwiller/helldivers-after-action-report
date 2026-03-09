// In-memory sliding window rate limiter per user and per guild.
// Resets on bot restart, which is acceptable for this scale.

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const USER_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const GUILD_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// Maps of ID -> sorted array of request timestamps
const userRequests = new Map<string, number[]>();
const guildRequests = new Map<string, number[]>();

function cleanAndCheck(
  store: Map<string, number[]>,
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let timestamps = store.get(key) ?? [];
  // Remove expired timestamps
  timestamps = timestamps.filter((ts) => ts > cutoff);
  store.set(key, timestamps);

  if (timestamps.length >= config.maxRequests) {
    // Earliest timestamp that would expire next
    const retryAfterMs = timestamps[0] + config.windowMs - now;
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

function record(store: Map<string, number[]>, key: string): void {
  const timestamps = store.get(key) ?? [];
  timestamps.push(Date.now());
  store.set(key, timestamps);
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: "user" | "guild";
  retryAfterMs: number;
}

/**
 * Check if a request is allowed for the given user and guild.
 * Does NOT record the request — call recordRequest() after successful processing.
 */
export function checkRateLimit(
  userId: string,
  guildId: string | null
): RateLimitResult {
  const userCheck = cleanAndCheck(userRequests, userId, USER_LIMIT);
  if (!userCheck.allowed) {
    return { allowed: false, reason: "user", retryAfterMs: userCheck.retryAfterMs };
  }

  if (guildId) {
    const guildCheck = cleanAndCheck(guildRequests, guildId, GUILD_LIMIT);
    if (!guildCheck.allowed) {
      return { allowed: false, reason: "guild", retryAfterMs: guildCheck.retryAfterMs };
    }
  }

  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Record a request after it has been accepted and processed.
 */
export function recordRequest(userId: string, guildId: string | null): void {
  record(userRequests, userId);
  if (guildId) {
    record(guildRequests, guildId);
  }
}
