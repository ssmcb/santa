import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';
import { sendEmail } from '@/lib/email';
import { getVerificationEmailTemplate } from '@/lib/email/templates';
import { validateCSRF } from '@/lib/middleware/csrf';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { generateVerificationCode, getCodeExpiration } from '@/lib/utils/verification';

const joinGroupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  inviteId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    // Rate limit: 5 join attempts per IP per 15 minutes
    const rateLimitError = await rateLimit(request, {
      max: 5,
      windowSeconds: 15 * 60,
    });
    if (rateLimitError) return rateLimitError;

    const body = await request.json();
    const { name, email, inviteId } = joinGroupSchema.parse(body);

    await connectDB();

    // Find the group by invite_id
    const group = await Group.findOne({ invite_id: inviteId });
    if (!group) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 404 });
    }

    // Check if participant with this email already exists in this group
    const existingParticipant = await Participant.findOne({
      group_id: group._id,
      email: email.toLowerCase(),
    });

    if (existingParticipant) {
      // If participant already exists, just resend verification code
      const verificationCode = generateVerificationCode();
      const codeExpiresAt = getCodeExpiration();
      const codeSentAt = new Date();

      existingParticipant.verification_code = verificationCode;
      existingParticipant.code_expires_at = codeExpiresAt;
      existingParticipant.code_sent_at = codeSentAt;
      await existingParticipant.save();

      // Get locale from Accept-Language header
      const locale = request.headers.get('accept-language')?.startsWith('pt') ? 'pt' : 'en';

      // Send verification email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationUrl = `${appUrl}/${locale}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

      const emailTemplate = getVerificationEmailTemplate({
        name: existingParticipant.name,
        verificationCode,
        verificationUrl,
        locale,
      });

      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        htmlBody: emailTemplate.htmlBody,
        textBody: emailTemplate.textBody,
      });

      return NextResponse.json({
        success: true,
        message: 'Verification email sent',
        email,
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = getCodeExpiration();
    const codeSentAt = new Date();

    // Create new participant
    const participant = await Participant.create({
      group_id: group._id,
      name,
      email: email.toLowerCase(),
      verification_code: verificationCode,
      code_expires_at: codeExpiresAt,
      code_sent_at: codeSentAt,
    });

    // Add participant to group's participants array
    group.participants.push(participant._id);
    await group.save();

    // Get locale from Accept-Language header
    const locale = request.headers.get('accept-language')?.startsWith('pt') ? 'pt' : 'en';

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/${locale}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    const emailTemplate = getVerificationEmailTemplate({
      name,
      verificationCode,
      verificationUrl,
      locale,
    });

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      htmlBody: emailTemplate.htmlBody,
      textBody: emailTemplate.textBody,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      email,
    });
  } catch (error) {
    console.error('Join group error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
