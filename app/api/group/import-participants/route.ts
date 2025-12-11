import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';
import { validateCSRF } from '@/lib/middleware/csrf';
import { getSession } from '@/lib/session';

const importParticipantsSchema = z.object({
  groupId: z.string(),
  participants: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        email: z.string().email(),
      })
    )
    .min(1)
    .max(200),
});

export async function POST(request: NextRequest) {
  try {
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    const session = await getSession();
    if (!session.isLoggedIn || !session.participantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, participants } = importParticipantsSchema.parse(body);

    await connectDB();

    const requester = await Participant.findById(session.participantId);
    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (requester.email !== group.owner_email) {
      return NextResponse.json(
        { error: 'Only the group owner can import participants' },
        { status: 403 }
      );
    }

    if (group.is_drawn) {
      return NextResponse.json(
        { error: 'Cannot import participants after lottery has been drawn' },
        { status: 400 }
      );
    }

    const normalizedParticipants = participants.map((participant) => ({
      name: participant.name.trim(),
      email: participant.email.toLowerCase(),
    }));

    const uniqueParticipants: typeof normalizedParticipants = [];
    const seenEmails = new Set<string>();

    for (const participant of normalizedParticipants) {
      if (!seenEmails.has(participant.email)) {
        seenEmails.add(participant.email);
        uniqueParticipants.push(participant);
      }
    }

    const existingParticipants = await Participant.find({
      group_id: groupId,
      email: { $in: Array.from(seenEmails) },
    });

    const existingEmails = new Set(existingParticipants.map((p) => p.email));
    const participantsToCreate = uniqueParticipants.filter(
      (participant) => !existingEmails.has(participant.email)
    );

    if (participantsToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        addedCount: 0,
        skippedExisting: existingEmails.size,
      });
    }

    const createdParticipants = await Participant.insertMany(
      participantsToCreate.map((participant) => ({
        group_id: groupId,
        name: participant.name,
        email: participant.email,
        verification_code: null,
        code_expires_at: null,
        code_sent_at: null,
      }))
    );

    await Group.findByIdAndUpdate(groupId, {
      $push: { participants: { $each: createdParticipants.map((p) => p._id) } },
    });

    return NextResponse.json({
      success: true,
      addedCount: createdParticipants.length,
      skippedExisting: existingEmails.size,
    });
  } catch (error) {
    console.error('Import participants error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to import participants' },
      { status: 500 }
    );
  }
}
