import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { getSession } from '@/lib/session';
import { z } from 'zod';

const removeParticipantSchema = z.object({
  groupId: z.string(),
  participantId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.participantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, participantId } = removeParticipantSchema.parse(body);

    await connectDB();

    // Get the participant making the request
    const requester = await Participant.findById(session.participantId);
    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is the group owner
    if (requester.email !== group.owner_email) {
      return NextResponse.json(
        { error: 'Only the group owner can remove participants' },
        { status: 403 }
      );
    }

    // Check if lottery has already been drawn
    if (group.is_drawn) {
      return NextResponse.json(
        { error: 'Cannot remove participants after lottery has been drawn' },
        { status: 400 }
      );
    }

    // Get the participant to remove
    const participantToRemove = await Participant.findById(participantId);
    if (!participantToRemove) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Check if participant belongs to this group
    if (participantToRemove.group_id?.toString() !== groupId) {
      return NextResponse.json(
        { error: 'Participant does not belong to this group' },
        { status: 400 }
      );
    }

    // Check if trying to remove the owner
    if (participantToRemove.email === group.owner_email) {
      return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 400 });
    }

    // Delete the participant
    await Participant.findByIdAndDelete(participantId);

    return NextResponse.json({
      success: true,
      message: 'Participant removed successfully',
    });
  } catch (error) {
    console.error('Remove participant error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
  }
}
