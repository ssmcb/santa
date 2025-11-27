import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Participant } from '@/lib/db/models/Participant';

/**
 * GET /api/check-email
 *
 * Checks if an email exists in the database and whether the user has a name.
 * Used by the get-started flow to determine if we need to ask for a name.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const participant = await Participant.findOne({
      email: email.toLowerCase(),
    });

    if (!participant) {
      return NextResponse.json({
        exists: false,
        hasName: false,
      });
    }

    return NextResponse.json({
      exists: true,
      hasName: !!participant.name && participant.name.trim().length > 0,
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
  }
}
