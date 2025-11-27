import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { getSession } from '@/lib/session';
import { z } from 'zod';

const updateGroupSchema = z.object({
  groupId: z.string(),
  name: z.string().min(1, 'Group name is required'),
  date: z.string().min(1, 'Event date is required'),
  place: z.string().min(1, 'Event location is required'),
  budget: z.string().min(1, 'Gift budget is required'),
});

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.participantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, name, date, place, budget } = updateGroupSchema.parse(body);

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
        { error: 'Only the group owner can update the group' },
        { status: 403 }
      );
    }

    // Update the group
    group.name = name;
    // Store date at noon UTC to avoid timezone issues with date-only values
    const [year, month, day] = date.split('-').map(Number);
    group.date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    group.place = place;
    group.budget = budget;
    await group.save();

    return NextResponse.json({
      success: true,
      message: 'Group updated successfully',
    });
  } catch (error) {
    console.error('Update group error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
