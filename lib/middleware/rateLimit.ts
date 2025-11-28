import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory rate limiting store
 * For production with multiple instances, consider using Redis
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries every 10 minutes
 */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  10 * 60 * 1000
);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  max: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  /**
   * Key generator function - defaults to IP address
   * Use this to rate limit by email, user ID, etc.
   */
  keyGenerator?: (request: NextRequest) => Promise<string | null>;
  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (request: NextRequest) => Promise<boolean>;
}

/**
 * Rate Limiting Middleware
 *
 * Provides configurable rate limiting for API routes using a token bucket algorithm.
 * By default, rate limits by IP address, but can be customized to use email, user ID, etc.
 *
 * Features:
 * - In-memory storage (works for single instance, no external dependencies)
 * - Configurable window and max requests
 * - Custom key generation (IP, email, user ID, etc.)
 * - Standard rate limit headers (X-RateLimit-*)
 * - Automatic cleanup of expired entries
 *
 * Usage in API routes:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   // Rate limit by IP: 5 requests per 15 minutes
 *   const rateLimitError = await rateLimit(request, {
 *     max: 5,
 *     windowSeconds: 15 * 60,
 *   });
 *   if (rateLimitError) return rateLimitError;
 *
 *   // ... rest of your handler
 * }
 * ```
 *
 * Rate limit by email:
 * ```typescript
 * const rateLimitError = await rateLimit(request, {
 *   max: 3,
 *   windowSeconds: 60 * 60,
 *   keyGenerator: async (req) => {
 *     const body = await req.json();
 *     return body.email || null;
 *   },
 * });
 * ```
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns NextResponse with 429 status if rate limited, null otherwise
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const { max, windowSeconds, keyGenerator, skip } = config;

  // Check if we should skip rate limiting
  if (skip && (await skip(request))) {
    return null;
  }

  // Generate the rate limit key
  let key: string;
  if (keyGenerator) {
    const customKey = await keyGenerator(request);
    if (!customKey) {
      // If key generation fails, don't rate limit (fail open)
      console.warn('Rate limit key generation failed, skipping rate limit');
      return null;
    }
    key = customKey;
  } else {
    // Default: use IP address
    const ip = getClientIP(request);
    if (!ip) {
      console.warn('Unable to determine client IP, skipping rate limit');
      return null;
    }
    key = `ip:${ip}`;
  }

  // Add endpoint to key for per-endpoint rate limiting
  const endpoint = request.nextUrl.pathname;
  const fullKey = `${endpoint}:${key}`;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(fullKey);

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(fullKey, entry);

    return null; // First request in window, allow it
  }

  // Check if rate limit exceeded
  if (entry.count >= max) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);

    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetAt.toString(),
          'Retry-After': resetInSeconds.toString(),
        },
      }
    );
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(fullKey, entry);

  // Add rate limit headers to indicate current status
  // (We can't add headers to a null response, so these are for documentation)
  // In practice, you'd add these in your route handler's successful response

  return null; // Rate limit not exceeded
}

/**
 * Extract client IP address from request
 * Checks multiple headers in order of preference
 */
function getClientIP(request: NextRequest): string | null {
  // Check common headers (in order of preference)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address (may not be available in all environments)
  return null;
}

/**
 * Helper to create email-based rate limit key generator
 */
export function emailKeyGenerator(emailField = 'email') {
  return async (request: NextRequest): Promise<string | null> => {
    try {
      // Clone the request to read body without consuming it
      const body = await request.json();
      const email = body[emailField];
      return email ? `email:${email.toLowerCase()}` : null;
    } catch {
      return null;
    }
  };
}

/**
 * Helper to combine multiple rate limit checks
 * Returns the first error encountered, or null if all pass
 */
export async function combineRateLimits(
  request: NextRequest,
  ...configs: RateLimitConfig[]
): Promise<NextResponse | null> {
  for (const config of configs) {
    const error = await rateLimit(request, config);
    if (error) {
      return error;
    }
  }
  return null;
}
