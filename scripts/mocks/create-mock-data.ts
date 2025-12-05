/**
 * Script to create mock Secret Santa group data for screenshots and demos
 *
 * Prerequisites:
 * 1. Configure MONGODB_URI in .env or .env.local
 * 2. Make sure your MongoDB instance is running
 *
 * Run with: npx tsx scripts/create-mock-data.ts
 */

import 'dotenv/config';
import { nanoid } from 'nanoid';
import { connectDB } from '../../lib/db/mongodb';
import { Group } from '../../lib/db/models/Group';
import { Participant } from '../../lib/db/models/Participant';
import { runSecretSantaLottery } from '../../lib/utils/lottery';

// Mock participants data
const mockParticipants = [
  { name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
  { name: 'Michael Chen', email: 'michael.chen@example.com' },
  { name: 'Emily Rodriguez', email: 'emily.rodriguez@example.com' },
  { name: 'David Kim', email: 'david.kim@example.com' },
  { name: 'Jessica Martinez', email: 'jessica.martinez@example.com' },
  { name: 'Robert Taylor', email: 'robert.taylor@example.com' },
  { name: 'John Doe', email: 'john.doe@example.com' },
  { name: 'Jane Doe', email: 'jane.doe@example.com' },
  { name: 'Jim Beam', email: 'jim.beam@example.com' },
  { name: 'Jill Johnson', email: 'jill.johnson@example.com' },
  { name: 'Jack Smith', email: 'jack.smith@example.com' },
  { name: 'Jill Smith', email: 'jill.smith@example.com' },
  { name: 'Jill Smith', email: 'jill.smith@example.com' },
];

async function createMockGroup() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();

    // Clean up any existing mock data
    console.log('🧹 Cleaning up existing mock data...');
    const existingGroup = await Group.findOne({ owner_email: mockParticipants[0].email });
    if (existingGroup) {
      await Participant.deleteMany({ group_id: existingGroup._id });
      await Group.deleteOne({ _id: existingGroup._id });
      console.log('✅ Cleaned up existing mock data');
    }

    // Create group
    console.log('🎅 Creating Secret Santa group...');
    const group = await Group.create({
      name: 'Office Christmas Party 2024',
      budget: '$30',
      date: new Date('2024-12-20'),
      place: 'Downtown Office - Conference Room A',
      owner_email: mockParticipants[0].email,
      participants: [],
      invite_id: nanoid(10),
      is_drawn: false,
      invitations_sent: [],
    });

    console.log(`✅ Created group: ${group.name} (ID: ${group._id})`);

    // Create participants
    console.log('👥 Creating participants...');
    const participantDocs = [];

    for (const mockParticipant of mockParticipants) {
      const participant = await Participant.create({
        group_id: group._id,
        name: mockParticipant.name,
        email: mockParticipant.email,
        recipient_id: null,
        verification_code: null,
        code_expires_at: null,
        code_sent_at: null,
        assignment_email_status: 'pending',
        assignment_email_sent_at: null,
      });

      participantDocs.push(participant);
      console.log(`  ✓ ${participant.name} (${participant.email})`);
    }

    // Add participants to group
    group.participants = participantDocs.map((p) => p._id);
    await group.save();

    // Run lottery
    console.log('🎁 Running Secret Santa lottery...');
    const lotteryParticipants = participantDocs.map((p) => ({
      id: p._id.toString(),
      name: p.name,
    }));

    const assignments = runSecretSantaLottery(lotteryParticipants);

    // Update participants with assignments
    for (const [giverId, recipientId] of assignments.entries()) {
      await Participant.findByIdAndUpdate(giverId, {
        recipient_id: recipientId,
        assignment_email_status: 'delivered',
        assignment_email_sent_at: new Date(),
      });

      const giver = participantDocs.find((p) => p._id.toString() === giverId);
      const recipient = participantDocs.find((p) => p._id.toString() === recipientId);
      console.log(`  ✓ ${giver?.name} → ${recipient?.name}`);
    }

    // Mark group as drawn
    group.is_drawn = true;
    await group.save();

    console.log('\n🎉 Mock data created successfully!\n');
    console.log('📋 Group Details:');
    console.log(`   Name: ${group.name}`);
    console.log(`   Date: ${group.date.toLocaleDateString()}`);
    console.log(`   Budget: ${group.budget}`);
    console.log(`   Place: ${group.place}`);
    console.log(`   Invite ID: ${group.invite_id}`);
    console.log(`   Owner: ${group.owner_email}`);
    console.log(`   Participants: ${group.participants.length}`);
    console.log(`   Lottery Status: ${group.is_drawn ? 'Completed ✓' : 'Pending'}`);
    console.log('\n📸 Ready for screenshots!');
    console.log(`\n🔗 Invitation link: http://localhost:3011/en/join/${group.invite_id}`);
    console.log(`🔗 Owner dashboard: Sign in with ${mockParticipants[0].email}`);
    console.log(`🔗 Participant view: Sign in with any other email above\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating mock data:', error);
    process.exit(1);
  }
}

createMockGroup();
