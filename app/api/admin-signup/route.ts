import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { AdminUser } from '@/lib/db/models/AdminUser';
import { Participant } from '@/lib/db/models/Participant';
import { generateVerificationCode, getCodeExpiration } from '@/lib/utils/verification';
import { sendEmail } from '@/lib/email/ses';
import { getVerificationEmailTemplate } from '@/lib/email/templates';
import { z } from 'zod';

const adminSignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = adminSignupSchema.parse(body);

    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await AdminUser.findOne({ is_registered: true });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = getCodeExpiration();
    const codeSentAt = new Date();

    // Create admin user
    const adminUser = await AdminUser.create({
      email: email.toLowerCase(),
      name,
      is_registered: true,
    });

    // Create a participant record for the admin (for verification)
    await Participant.create({
      group_id: null, // Will be set when they create their first group
      name,
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
    console.error('Admin signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
