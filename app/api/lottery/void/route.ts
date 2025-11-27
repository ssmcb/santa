import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { getSession } from '@/lib/session';
import { validateCSRF } from '@/lib/middleware/csrf';
import { z } from 'zod';

const voidLotterySchema = z.object({
  groupId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.participantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId } = voidLotterySchema.parse(body);

    await connectDB();

    // Get the participant making the request
    const participant = await Participant.findById(session.participantId);
    if (!participant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is the group owner
    if (participant.email !== group.owner_email) {
      return NextResponse.json(
        { error: 'Only the group owner can void the lottery' },
        { status: 403 }
      );
    }

    // Check if lottery has been drawn
    if (!group.is_drawn) {
      return NextResponse.json(
        { error: 'No lottery to void - lottery has not been run yet' },
        { status: 400 }
      );
    }

    // Reset all participants' assignments
    await Participant.updateMany(
      { group_id: groupId },
      {
        $set: {
          recipient_id: null,
          assignment_email_status: 'pending',
          assignment_email_sent_at: null,
        },
      }
    );

    // Mark the group as not drawn
    group.is_drawn = false;
    await group.save();

    return NextResponse.json({
      success: true,
      message: 'Lottery has been voided successfully',
    });
  } catch (error) {
    console.error('Void lottery error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to void lottery' },
      { status: 500 }
    );
  }
}
