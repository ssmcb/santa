import { NextRequest, NextResponse } from 'next/server';

import { Participant } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';
import { sendEmail } from '@/lib/email';
import { getVerificationEmailTemplate } from '@/lib/email/templates';
import { validateCSRF } from '@/lib/middleware/csrf';
import { rateLimit } from '@/lib/middleware/rateLimit';
import {
  generateVerificationCode,
  getCodeExpiration,
  canResendCode,
  getRemainingCooldown,
} from '@/lib/utils/verification';

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfError = await validateCSRF(request);
    if (csrfError) return csrfError;

    // Rate limit: 5 resend attempts per IP per 15 minutes
    const ipRateLimitError = await rateLimit(request, {
      max: 5,
      windowSeconds: 15 * 60,
    });
    if (ipRateLimitError) return ipRateLimitError;

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    // Find participant by email
    const participant = await Participant.findOne({
      email: email.toLowerCase(),
    });

    if (!participant) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Check cooldown period
    if (!canResendCode(participant.code_sent_at)) {
      const remainingSeconds = getRemainingCooldown(participant.code_sent_at);
      return NextResponse.json(
        {
          error: 'Please wait before requesting a new code',
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = getCodeExpiration();
    const codeSentAt = new Date();

    // Update participant
    participant.verification_code = verificationCode;
    participant.code_expires_at = codeExpiresAt;
    participant.code_sent_at = codeSentAt;
    await participant.save();

    // Get locale from Accept-Language header or default to 'en'
    const locale = request.headers.get('accept-language')?.startsWith('pt') ? 'pt' : 'en';

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/${locale}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    // Send verification email
    const emailTemplate = getVerificationEmailTemplate({
      name: participant.name,
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
      message: 'Verification code sent',
    });
  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json({ error: 'Failed to resend code' }, { status: 500 });
  }
}
