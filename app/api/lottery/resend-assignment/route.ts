import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';
import { sendEmail } from '@/lib/email';
import { getAssignmentEmailTemplate } from '@/lib/email/templates';
import { validateCSRF } from '@/lib/middleware/csrf';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { getSession } from '@/lib/session';

const resendAssignmentSchema = z.object({
  groupId: z.string(),
  participantId: z.string(),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    // Rate limit: 10 resend attempts per user per hour
    const rateLimitError = await rateLimit(request, {
      max: 10,
      windowSeconds: 60 * 60,
      keyGenerator: async () => {
        const session = await getSession();
        return session.participantId ? `user:${session.participantId}:resend` : null;
      },
    });
    if (rateLimitError) return rateLimitError;

    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.participantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, participantId, locale: requestLocale } = resendAssignmentSchema.parse(body);

    await connectDB();

    // Get the participant making the request
    const requestingParticipant = await Participant.findById(session.participantId);
    if (!requestingParticipant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is the group owner
    if (requestingParticipant.email !== group.owner_email) {
      return NextResponse.json(
        { error: 'Only the group owner can resend assignment emails' },
        { status: 403 }
      );
    }

    // Check if lottery has been drawn
    if (!group.is_drawn) {
      return NextResponse.json(
        { error: 'Lottery has not been run yet for this group' },
        { status: 400 }
      );
    }

    // Get the participant to resend email to
    const participant = await Participant.findById(participantId);
    if (!participant || participant.group_id?.toString() !== groupId) {
      return NextResponse.json({ error: 'Participant not found in this group' }, { status: 404 });
    }

    // Check if participant has an assignment
    if (!participant.recipient_id) {
      return NextResponse.json(
        { error: 'Participant does not have an assignment' },
        { status: 400 }
      );
    }

    // Get the recipient
    const recipient = await Participant.findById(participant.recipient_id);
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 500 });
    }

    // Send the assignment email
    const locale = requestLocale || 'en';
    const emailTemplate = getAssignmentEmailTemplate({
      participantName: participant.name,
      recipientName: recipient.name,
      groupName: group.name,
      groupDate: group.date.toISOString(),
      groupPlace: group.place,
      groupBudget: group.budget,
      locale,
    });

    try {
      await sendEmail({
        to: participant.email,
        subject: emailTemplate.subject,
        htmlBody: emailTemplate.htmlBody,
        textBody: emailTemplate.textBody,
      });

      // Update participant's email status
      participant.assignment_email_status = 'sent';
      participant.assignment_email_sent_at = new Date();
      await participant.save();

      return NextResponse.json({
        success: true,
        message: 'Assignment email resent successfully',
      });
    } catch (emailError) {
      console.error('Failed to send assignment email:', emailError);

      // Update participant's email status to failed
      participant.assignment_email_status = 'failed';
      await participant.save();

      return NextResponse.json({ error: 'Failed to send assignment email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Resend assignment error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to resend assignment email' }, { status: 500 });
  }
}
