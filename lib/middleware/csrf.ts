import { NextRequest, NextResponse } from 'next/server';

import { validateCSRFToken } from '@/lib/csrf';
import { getSession } from '@/lib/session';

/**
 * CSRF Protection Middleware
 *
 * Validates CSRF tokens on all state-changing requests (POST, PUT, DELETE, PATCH).
 * The token should be sent in the X-CSRF-Token header.
 *
 * Usage in API routes:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfError = await validateCSRF(request);
 *   if (csrfError) return csrfError;
 *
 *   // ... rest of your handler
 * }
 * ```
 */
export async function validateCSRF(request: NextRequest): Promise<NextResponse | null> {
  // Only validate CSRF on state-changing methods
  const method = request.method;
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null; // No validation needed for GET, HEAD, OPTIONS
  }

  // Skip CSRF validation for webhook endpoints (they use their own auth)
  if (request.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return null;
  }

  try {
    const session = await getSession();
    const requestToken = request.headers.get('x-csrf-token');

    if (!validateCSRFToken(session.csrfToken, requestToken || undefined)) {
      return NextResponse.json(
        {
          error: 'Invalid CSRF token',
          code: 'CSRF_VALIDATION_FAILED',
        },
        { status: 403 }
      );
    }

    return null; // Validation passed
  } catch (error) {
    console.error('CSRF validation error:', error);
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        code: 'CSRF_VALIDATION_ERROR',
      },
      { status: 500 }
    );
  }
}
