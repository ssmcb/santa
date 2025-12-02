import { NextResponse } from 'next/server';

import { generateCSRFToken } from '@/lib/csrf';
import { getSession } from '@/lib/session';

/**
 * GET /api/csrf/token
 *
 * Returns a CSRF token for the current session.
 * If no token exists, generates a new one and stores it in the session.
 *
 * This endpoint should be called by the client before making any state-changing requests.
 */
export async function GET() {
  try {
    const session = await getSession();

    // Generate token if it doesn't exist
    if (!session.csrfToken) {
      session.csrfToken = generateCSRFToken();
      await session.save();
    }

    return NextResponse.json({
      token: session.csrfToken,
    });
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return NextResponse.json({ error: 'Failed to get CSRF token' }, { status: 500 });
  }
}
