import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Participant } from '@/lib/db/models/Participant';
import { getSession } from '@/lib/session';
import { isCodeExpired } from '@/lib/utils/verification';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find participant with matching email and verification code
    const participant = await Participant.findOne({
      email: email.toLowerCase(),
      verification_code: code,
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (isCodeExpired(participant.code_expires_at)) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
