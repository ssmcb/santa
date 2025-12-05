import { randomBytes } from 'crypto';

/**
 * CSRF Protection Utilities
 *
 * This module provides CSRF token generation and validation to protect against
 * Cross-Site Request Forgery attacks. Tokens are stored in the session and must
 * be included in all state-changing requests.
 */

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate a CSRF token against the session token
 * Uses timing-safe comparison to prevent timing attacks
 */
export function validateCSRFToken(
  sessionToken: string | undefined,
  requestToken: string | undefined
): boolean {
  if (!sessionToken || !requestToken) {
    return false;
  }

  // Convert to buffers for timing-safe comparison
  const sessionBuffer = Buffer.from(sessionToken);
  const requestBuffer = Buffer.from(requestToken);

  // Ensure same length to prevent timing attacks
  if (sessionBuffer.length !== requestBuffer.length) {
    return false;
  }

  // Timing-safe comparison
  return timingSafeEqual(sessionBuffer, requestBuffer);
}

/**
 * Timing-safe equality comparison
 * Prevents timing attacks by ensuring comparison always takes the same time
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}
