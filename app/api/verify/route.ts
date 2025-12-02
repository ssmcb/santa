import { NextRequest, NextResponse } from 'next/server';

import { Participant } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';
import { validateCSRF } from '@/lib/middleware/csrf';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { getSession } from '@/lib/session';
import { isCodeExpired } from '@/lib/utils/verification';

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    // Rate limit: 10 verification attempts per IP per 15 minutes
    const ipRateLimitError = await rateLimit(request, {
      max: 10,
      windowSeconds: 15 * 60,
    });
    if (ipRateLimitError) return ipRateLimitError;

    const { email, code } = await request.json();

    // Rate limit: 5 verification attempts per email per 15 minutes
    const emailRateLimitError = await rateLimit(request, {
      max: 5,
      windowSeconds: 15 * 60,
      keyGenerator: async () => (email ? `email:${email.toLowerCase()}` : null),
    });
    if (emailRateLimitError) return emailRateLimitError;

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    await connectDB();

    // Find participant with matching email and verification code
    const participant = await Participant.findOne({
      email: email.toLowerCase(),
      verification_code: code,
    });

    if (!participant) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Check if code has expired
    if (isCodeExpired(participant.code_expires_at)) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Clear verification code and expiration
    participant.verification_code = null;
    participant.code_expires_at = null;
    await participant.save();

    // Create session
    const session = await getSession();
    session.participantId = participant._id.toString();
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      participantId: participant._id.toString(),
      groupId: participant.group_id?.toString() || null,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
