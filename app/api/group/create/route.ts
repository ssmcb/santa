import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { getSession } from '@/lib/session';
import { validateCSRF } from '@/lib/middleware/csrf';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  place: z.string().min(1),
  budget: z.string().min(1),
  ownerEmail: z.string().email(),
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
    const { name, date, place, budget, ownerEmail } = createGroupSchema.parse(body);

    await connectDB();

    // Verify the participant exists and matches the session
    const participant = await Participant.findById(session.participantId);
    if (!participant || participant.email !== ownerEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate unique invite ID
    const inviteId = nanoid(16);

    // Parse date and store at noon UTC to avoid timezone issues with date-only values
    const [year, month, day] = date.split('-').map(Number);
    const eventDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    // Create the group
    const group = await Group.create({
      name,
      budget,
      date: eventDate,
      place,
      owner_email: ownerEmail.toLowerCase(),
      participants: [participant._id],
      invite_id: inviteId,
      is_drawn: false,
      invitations_sent: [],
    });

    // Update participant's group_id
    participant.group_id = group._id;
    await participant.save();

    return NextResponse.json({
      success: true,
      groupId: group._id.toString(),
      inviteId: group.invite_id,
    });
  } catch (error) {
    console.error('Create group error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
