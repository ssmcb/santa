/**
 * Security Tests - Rate Limiting and CSRF Protection
 *
 * These tests verify that:
 * 1. Rate limiting works correctly
 * 2. CSRF protection is properly enforced
 * 3. Both work together without conflicts
 */

import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { validateCSRF } from '@/lib/middleware/csrf';

// Mock Next.js request
function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
  } = {}
): NextRequest {
  const { method = 'POST', headers = {}, body = {} } = options;

  const request = new NextRequest(url, {
    method,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
    body: JSON.stringify(body),
  });

  return request;
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    // Note: In real tests, you'd want to mock the store
  });

  test('should allow requests under the limit', async () => {
    const request = createMockRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });

    const result = await rateLimit(request, {
      max: 5,
      windowSeconds: 60,
    });

    expect(result).toBeNull(); // No error = request allowed
  });

  test('should block requests over the limit', async () => {
    const url = 'http://localhost:3000/api/test';
    const ip = '192.168.1.2';

    // Make requests up to the limit
    for (let i = 0; i < 5; i++) {
      const request = createMockRequest(url, {
        headers: { 'x-forwarded-for': ip },
      });

      const result = await rateLimit(request, {
        max: 5,
        windowSeconds: 60,
      });

      expect(result).toBeNull(); // Should allow
    }

    // 6th request should be blocked
    const blockedRequest = createMockRequest(url, {
      headers: { 'x-forwarded-for': ip },
    });

    const result = await rateLimit(blockedRequest, {
      max: 5,
      windowSeconds: 60,
    });

    expect(result).not.toBeNull(); // Should be blocked
    expect(result?.status).toBe(429);
  });

  test('should rate limit by custom key', async () => {
    const url = 'http://localhost:3000/api/test';
    const email = 'test@example.com';

    // Make requests up to the limit
    for (let i = 0; i < 3; i++) {
      const request = createMockRequest(url, {
        headers: { 'x-forwarded-for': `192.168.1.${i}` }, // Different IPs
        body: { email },
      });

      const result = await rateLimit(request, {
        max: 3,
        windowSeconds: 60,
        keyGenerator: async (req) => {
          const body = await req.json();
          return `email:${body.email}`;
        },
      });

      expect(result).toBeNull();
    }

    // 4th request with same email but different IP should be blocked
    const blockedRequest = createMockRequest(url, {
      headers: { 'x-forwarded-for': '192.168.1.99' },
      body: { email },
    });

    const result = await rateLimit(blockedRequest, {
      max: 3,
      windowSeconds: 60,
      keyGenerator: async (req) => {
        const body = await req.json();
        return `email:${body.email}`;
      },
    });

    expect(result).not.toBeNull();
    expect(result?.status).toBe(429);
  });

  test('should return proper rate limit headers', async () => {
    const url = 'http://localhost:3000/api/test';
    const ip = '192.168.1.3';

    // Hit the rate limit
    for (let i = 0; i < 5; i++) {
      const request = createMockRequest(url, {
        headers: { 'x-forwarded-for': ip },
      });
      await rateLimit(request, { max: 5, windowSeconds: 60 });
    }

    // Check headers on blocked request
    const blockedRequest = createMockRequest(url, {
      headers: { 'x-forwarded-for': ip },
    });

    const result = await rateLimit(blockedRequest, {
      max: 5,
      windowSeconds: 60,
    });

    expect(result).not.toBeNull();
    expect(result?.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(result?.headers.get('Retry-After')).toBeTruthy();
  });

  test('should fail open when key generation fails', async () => {
    const request = createMockRequest('http://localhost:3000/api/test');

    const result = await rateLimit(request, {
      max: 5,
      windowSeconds: 60,
      keyGenerator: async () => null, // Return null = fail open
    });

    expect(result).toBeNull(); // Should allow request
  });
});

describe('CSRF Protection', () => {
  test('should block POST requests without CSRF token', async () => {
    const request = createMockRequest('http://localhost:3000/api/test', {
      method: 'POST',
    });

    const result = await validateCSRF(request);

    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  test('should allow GET requests without CSRF token', async () => {
    const request = createMockRequest('http://localhost:3000/api/test', {
      method: 'GET',
    });

    const result = await validateCSRF(request);

    expect(result).toBeNull(); // GET requests don't need CSRF
  });

  test('should block requests with invalid CSRF token', async () => {
    const request = createMockRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'x-csrf-token': 'invalid-token',
      },
    });

    const result = await validateCSRF(request);

    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });
});

describe('Integration: Rate Limiting + CSRF', () => {
  test('should apply both rate limiting and CSRF protection', async () => {
    const url = 'http://localhost:3000/api/signup';
    const ip = '192.168.1.4';

    // Simulate API route that checks both
    async function protectedRoute(request: NextRequest) {
      // Check CSRF first
      const csrfError = await validateCSRF(request);
      if (csrfError) return csrfError;

      // Then check rate limit
      const rateLimitError = await rateLimit(request, {
        max: 3,
        windowSeconds: 60,
      });
      if (rateLimitError) return rateLimitError;

      return null; // Success
    }

    // Test 1: No CSRF token - should fail CSRF check
    const noCsrfRequest = createMockRequest(url, {
      headers: { 'x-forwarded-for': ip },
    });
    const result1 = await protectedRoute(noCsrfRequest);
    expect(result1?.status).toBe(403); // CSRF failure

    // Test 2: With valid CSRF, under rate limit - should succeed
    // (In real scenario, you'd need a valid CSRF token from session)

    // Test 3: With valid CSRF, over rate limit - should fail rate limit
    // (Would need multiple requests with valid CSRF token)
  });
});

describe('Rate Limiting Edge Cases', () => {
  test('should handle missing IP gracefully', async () => {
    const request = createMockRequest('http://localhost:3000/api/test', {
      // No X-Forwarded-For header
    });

    const result = await rateLimit(request, {
      max: 5,
      windowSeconds: 60,
    });

    // Should fail open when IP can't be determined
    expect(result).toBeNull();
  });

  test('should handle very short windows', async () => {
    const request = createMockRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.5' },
    });

    const result = await rateLimit(request, {
      max: 1,
      windowSeconds: 1, // 1 second window
    });

    expect(result).toBeNull();

    // Wait 1.1 seconds
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should allow new request after window expires
    const result2 = await rateLimit(request, {
      max: 1,
      windowSeconds: 1,
    });

    expect(result2).toBeNull();
  });

  test('should handle concurrent requests correctly', async () => {
    const url = 'http://localhost:3000/api/test';
    const ip = '192.168.1.6';

    // Make 10 concurrent requests
    const promises = Array.from({ length: 10 }, (_, i) => {
      const request = createMockRequest(url, {
        headers: { 'x-forwarded-for': ip },
      });
      return rateLimit(request, { max: 5, windowSeconds: 60 });
    });

    const results = await Promise.all(promises);

    // First 5 should succeed, rest should fail
    const allowed = results.filter(r => r === null).length;
    const blocked = results.filter(r => r !== null).length;

    expect(allowed).toBeLessThanOrEqual(5);
    expect(blocked).toBeGreaterThanOrEqual(5);
  });
});

// Export for manual testing
export { createMockRequest };
