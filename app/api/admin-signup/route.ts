import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Participant } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';
import { sendEmail } from '@/lib/email';
import { getVerificationEmailTemplate } from '@/lib/email/templates';
import { validateCSRF } from '@/lib/middleware/csrf';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { generateVerificationCode, getCodeExpiration } from '@/lib/utils/verification';

const signupSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    // Rate limit: 5 signups per IP per 15 minutes
    const ipRateLimitError = await rateLimit(request, {
      max: 5,
      windowSeconds: 15 * 60,
    });
    if (ipRateLimitError) return ipRateLimitError;

    const body = await request.json();
    const { name, email } = signupSchema.parse(body);

    // Rate limit: 3 signups per email per day
    const emailRateLimitError = await rateLimit(request, {
      max: 3,
      windowSeconds: 24 * 60 * 60,
      keyGenerator: async () => `email:${email.toLowerCase()}`,
    });
    if (emailRateLimitError) return emailRateLimitError;

    await connectDB();

    // Check if user with this email already exists
    const existingParticipant = await Participant.findOne({
      email: email.toLowerCase(),
      group_id: null,
    });

    if (existingParticipant) {
      // User exists, regenerate and resend verification code
      const verificationCode = generateVerificationCode();
      const codeExpiresAt = getCodeExpiration();
      const codeSentAt = new Date();

      // Update name if provided
      if (name && name.trim().length > 0) {
        existingParticipant.name = name;
      }

      existingParticipant.verification_code = verificationCode;
      existingParticipant.code_expires_at = codeExpiresAt;
      existingParticipant.code_sent_at = codeSentAt;
      await existingParticipant.save();

      // Get locale from Accept-Language header or default to 'en'
      const locale = request.headers.get('accept-language')?.startsWith('pt') ? 'pt' : 'en';

      // Get app URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationUrl = `${appUrl}/${locale}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

      // Send verification email
      const emailTemplate = getVerificationEmailTemplate({
        name: existingParticipant.name || email.split('@')[0],
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

    // Create a participant record (no group yet - they'll create one after verification)
    const newParticipant = await Participant.create({
      group_id: null,
      name: name && name.trim().length > 0 ? name : email.split('@')[0],
      email: email.toLowerCase(),
      verification_code: verificationCode,
      code_expires_at: codeExpiresAt,
      code_sent_at: codeSentAt,
    });

    // Get locale from Accept-Language header or default to 'en'
    const locale = request.headers.get('accept-language')?.startsWith('pt') ? 'pt' : 'en';

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/${locale}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    // Send verification email
    const emailTemplate = getVerificationEmailTemplate({
      name: newParticipant.name || email.split('@')[0],
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
    console.error('Admin signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
