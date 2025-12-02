import { NextRequest, NextResponse } from 'next/server';

import { validateCSRF } from '@/lib/middleware/csrf';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    const session = await getSession();
    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}
