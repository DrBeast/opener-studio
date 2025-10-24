// Rate limiting utility for Edge Functions
// All rate limits are configurable in one place for easy adjustment

// ============================================================================
// RATE LIMIT CONFIGURATION
// ============================================================================

// Expensive AI Operations (Gemini API calls)
export const RATE_LIMITS = {
  // AI Generation Functions
  GENERATE_MESSAGE: {
    maxRequests: 10,
    windowMs: 60000, // 60 seconds
  },
  GENERATE_PROFILE: {
    maxRequests: 5,
    windowMs: 60000, // 60 seconds
  },
  GENERATE_COMPANY_INTERACTION_OVERVIEW: {
    maxRequests: 10,
    windowMs: 60000, // 60 seconds
  },
  GENERATE_CONTACT_INTERACTION_OVERVIEW: {
    maxRequests: 10,
    windowMs: 60000, // 60 seconds
  },

  // Standard Operations
  ADD_CONTACT_BY_BIO: {
    maxRequests: 20,
    windowMs: 60000, // 60 seconds
  },
  ENRICH_COMPANY: {
    maxRequests: 20,
    windowMs: 60000, // 60 seconds
  },

  // Lightweight Operations
  GUEST_MESSAGE_SELECTION: {
    maxRequests: 50,
    windowMs: 60000, // 60 seconds
  },
  LINK_GUEST_PROFILE: {
    maxRequests: 5,
    windowMs: 60000, // 60 seconds
  },
} as const;

// ============================================================================
// RATE LIMITING LOGIC
// ============================================================================

// In-memory store for rate limiting
const requestStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = requestStore.get(identifier);

  console.log(`[RATE LIMIT DEBUG] Checking ${identifier}, current store size: ${requestStore.size}`);

  // Clean up expired entries periodically to prevent memory leaks
  if (requestStore.size > 10000) {
    for (const [key, value] of requestStore.entries()) {
      if (value.resetAt < now) {
        requestStore.delete(key);
      }
    }
  }

  // No existing record or record has expired
  if (!record || record.resetAt < now) {
    requestStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    console.log(`[RATE LIMIT DEBUG] New record created for ${identifier}, count: 1`);
    return { allowed: true };
  }

  // Within limit
  if (record.count < config.maxRequests) {
    record.count++;
    console.log(`[RATE LIMIT DEBUG] Incremented count for ${identifier}, count: ${record.count}/${config.maxRequests}`);
    return { allowed: true };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((record.resetAt - now) / 1000);
  console.log(`[RATE LIMIT DEBUG] Rate limit exceeded for ${identifier}, retry after: ${retryAfter}s`);
  return { allowed: false, retryAfter };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get identifier for rate limiting based on request type
 */
export function getRateLimitIdentifier(
  isGuest: boolean,
  sessionId?: string,
  userId?: string
): string {
  if (isGuest && sessionId) {
    return `guest:${sessionId}`;
  }
  if (userId) {
    return `user:${userId}`;
  }
  // Fallback to IP-based limiting if no user/session info
  return 'anonymous';
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  retryAfter: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      status: 'error',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}
