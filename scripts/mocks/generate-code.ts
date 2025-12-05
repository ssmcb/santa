/**
 * Generate a verification code for a mock participant
 * Run with: npx tsx scripts/generate-code.ts sarah.johnson@example.com
 */

import 'dotenv/config';
import { connectDB } from '../../lib/db/mongodb';
import { Participant } from '../../lib/db/models/Participant';

async function generateCode() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx scripts/mocks/generate-code.ts <email>');
    process.exit(1);
  }

  try {
    console.log(`🔌 Connecting to database...`);
    await connectDB();

    console.log(`🔍 Finding participant: ${email}`);
    const participant = await Participant.findOne({ email: email.toLowerCase() });

    if (!participant) {
      console.error(`❌ Participant not found: ${email}`);
      process.exit(1);
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update participant with verification code
    participant.verification_code = code;
    participant.code_expires_at = expiresAt;
    participant.code_sent_at = new Date();
    await participant.save();

    console.log('\n✅ Verification code generated!\n');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Code: ${code}`);
    console.log(`⏰ Expires: ${expiresAt.toLocaleString()}`);
    console.log(
      `\n🔗 Verify at: http://localhost:3011/en/verify?email=${encodeURIComponent(email)}`
    );
    console.log(`\nEnter the code: ${code}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateCode();
