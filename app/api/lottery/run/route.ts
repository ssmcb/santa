import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Group } from '@/lib/db/models/Group';
import { Participant, ParticipantDocument } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';
import { sendEmail } from '@/lib/email';
import { getAssignmentEmailTemplate } from '@/lib/email/templates';
import { validateCSRF } from '@/lib/middleware/csrf';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { getSession } from '@/lib/session';
import { runSecretSantaLottery, validateLotteryAssignments } from '@/lib/utils/lottery';

const runLotterySchema = z.object({
  groupId: z.string(),
  locale: z.string().optional(),
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

    // Rate limit: 3 lottery runs per group per hour
    const rateLimitError = await rateLimit(request, {
      max: 3,
      windowSeconds: 60 * 60,
      keyGenerator: async () =>
        body.groupId ? `group:${body.groupId}:lottery` : null,
    });
    if (rateLimitError) return rateLimitError;

    const { groupId, locale: requestLocale } = runLotterySchema.parse(body);

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
        { error: 'Only the group owner can run the lottery' },
        { status: 403 }
      );
    }

    // Check if lottery has already been drawn
    if (group.is_drawn) {
      return NextResponse.json(
        { error: 'Lottery has already been run for this group' },
        { status: 400 }
      );
    }

    // Get all participants
    const participants = await Participant.find({ group_id: groupId });

    // Validate minimum participants
    if (participants.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 participants are required to run the lottery' },
        { status: 400 }
      );
    }

    // Run the lottery algorithm
    const assignments = runSecretSantaLottery(
      participants.map((p) => ({
        id: p._id.toString(),
        name: p.name,
      }))
    );

    // Validate assignments
    if (
      !validateLotteryAssignments(
        participants.map((p) => ({ id: p._id.toString(), name: p.name })),
        assignments
      )
    ) {
      throw new Error('Invalid lottery assignments generated');
    }

    // Update all participants with their assignments
    const updatePromises: Promise<ParticipantDocument | null>[] = [];

    for (const [giverId, recipientId] of assignments) {
      updatePromises.push(
        Participant.findByIdAndUpdate(giverId, {
          recipient_id: recipientId,
          assignment_email_status: 'sent',
          assignment_email_sent_at: new Date(),
        })
      );
    }

    await Promise.all(updatePromises);

    // Mark the group as drawn
    group.is_drawn = true;
    await group.save();

    // Use locale from request body, fallback to Accept-Language header
    const locale =
      requestLocale || (request.headers.get('accept-language')?.startsWith('pt') ? 'pt' : 'en');

    // Send assignment emails to all participants
    const emailPromises: Promise<
      { success: boolean; messageId?: string } | ParticipantDocument | null
    >[] = [];

    for (const [giverId, recipientId] of assignments) {
      const giver = participants.find((p) => p._id.toString() === giverId);
      const recipient = participants.find((p) => p._id.toString() === recipientId);

      if (giver && recipient) {
        const emailTemplate = getAssignmentEmailTemplate({
          participantName: giver.name,
          recipientName: recipient.name,
          groupName: group.name,
          groupDate: group.date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US'),
          groupPlace: group.place,
          groupBudget: group.budget,
          locale,
        });

        emailPromises.push(
          sendEmail({
            to: giver.email,
            subject: emailTemplate.subject,
            htmlBody: emailTemplate.htmlBody,
            textBody: emailTemplate.textBody,
          }).catch((error) => {
            console.error(`Failed to send email to ${giver.email}:`, error);
            // Update status to failed
            return Participant.findByIdAndUpdate(giverId, {
              assignment_email_status: 'failed',
            });
          })
        );
      }
    }

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: 'Lottery completed and emails sent',
      participantsCount: participants.length,
    });
  } catch (error) {
    console.error('Lottery error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run lottery' },
      { status: 500 }
    );
  }
}
