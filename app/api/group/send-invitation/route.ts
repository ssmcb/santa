import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email/ses';
import { z } from 'zod';

const sendInvitationSchema = z.object({
  groupId: z.string(),
  recipientEmail: z.string().email(),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.participantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, recipientEmail, locale: requestLocale } = sendInvitationSchema.parse(body);

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
        { error: 'Only the group owner can send invitations' },
        { status: 403 }
      );
    }

    // Check if invitation was already sent to this email
    const alreadySent = group.invitations_sent.some(
      (inv) => inv.email.toLowerCase() === recipientEmail.toLowerCase()
    );

    if (alreadySent) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 400 });
    }

    // Use locale from request body, fallback to Accept-Language header
    const locale = requestLocale || (request.headers.get('accept-language')?.startsWith('pt') ? 'pt' : 'en');

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/${locale}/join?inviteId=${group.invite_id}`;

    const isPortuguese = locale === 'pt';

    const subject = isPortuguese
      ? `Você foi convidado para ${group.name}!`
      : `You're invited to ${group.name}!`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎅 Secret Santa</h1>
            </div>
            <div class="content">
              <h2>${isPortuguese ? 'Você foi convidado!' : "You're Invited!"}</h2>
              <p>
                ${isPortuguese ? 'Você foi convidado para participar de:' : "You've been invited to join:"}
              </p>
              <div class="info">
                <h3>${group.name}</h3>
                <p>📅 ${isPortuguese ? 'Data:' : 'Date:'} ${group.date.toLocaleDateString()}</p>
                <p>📍 ${isPortuguese ? 'Local:' : 'Location:'} ${group.place}</p>
                <p>💰 ${isPortuguese ? 'Orçamento:' : 'Budget:'} ${group.budget}</p>
              </div>
              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">
                  ${isPortuguese ? 'Entrar no Grupo' : 'Join Group'}
                </a>
              </p>
            </div>
            <div class="footer">
              <p>${isPortuguese ? '© 2025 Secret Santa. Todos os direitos reservados.' : '© 2025 Secret Santa. All rights reserved.'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
${isPortuguese ? 'Você foi convidado!' : "You're Invited!"}

${isPortuguese ? 'Você foi convidado para participar de:' : "You've been invited to join:"}

${group.name}

📅 ${isPortuguese ? 'Data:' : 'Date:'} ${group.date.toLocaleDateString()}
📍 ${isPortuguese ? 'Local:' : 'Location:'} ${group.place}
💰 ${isPortuguese ? 'Orçamento:' : 'Budget:'} ${group.budget}

${isPortuguese ? 'Clique no link para entrar:' : 'Click the link to join:'} ${inviteLink}
    `;

    // Send invitation email
    await sendEmail({
      to: recipientEmail,
      subject,
      htmlBody,
      textBody,
    });

    // Add to invitations_sent array
    group.invitations_sent.push({
      email: recipientEmail.toLowerCase(),
      sent_at: new Date(),
    });
    await group.save();

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Send invitation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
