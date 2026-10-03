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

import { Group } from '../../lib/db/models/Group';
import { Participant } from '../../lib/db/models/Participant';
import { connectDB } from '../../lib/db/mongodb';
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
    console.info('🔌 Connecting to database...');
    await connectDB();

    // Clean up any existing mock data
    console.info('🧹 Cleaning up existing mock data...');
    const existingGroup = await Group.findOne({ owner_email: mockParticipants[0].email });
    if (existingGroup) {
      await Participant.deleteMany({ group_id: existingGroup._id });
      await Group.deleteOne({ _id: existingGroup._id });
      console.info('✅ Cleaned up existing mock data');
    }

    // Create group
    console.info('🎅 Creating Secret Santa group...');
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

    console.info(`✅ Created group: ${group.name} (ID: ${group._id})`);

    // Create participants
    console.info('👥 Creating participants...');
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
      console.info(`  ✓ ${participant.name} (${participant.email})`);
    }

    // Add participants to group
    group.participants = participantDocs.map((p) => p._id);
    await group.save();

    // Run lottery
    console.info('🎁 Running Secret Santa lottery...');
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
      console.info(`  ✓ ${giver?.name} → ${recipient?.name}`);
    }

    // Mark group as drawn
    group.is_drawn = true;
    await group.save();

    console.info('\n🎉 Mock data created successfully!\n');
    console.info('📋 Group Details:');
    console.info(`   Name: ${group.name}`);
    console.info(`   Date: ${group.date.toLocaleDateString()}`);
    console.info(`   Budget: ${group.budget}`);
    console.info(`   Place: ${group.place}`);
    console.info(`   Invite ID: ${group.invite_id}`);
    console.info(`   Owner: ${group.owner_email}`);
    console.info(`   Participants: ${group.participants.length}`);
    console.info(`   Lottery Status: ${group.is_drawn ? 'Completed ✓' : 'Pending'}`);
    console.info('\n📸 Ready for screenshots!');
    console.info(`\n🔗 Invitation link: http://localhost:3011/en/join/${group.invite_id}`);
    console.info(`🔗 Owner dashboard: Sign in with ${mockParticipants[0].email}`);
    console.info(`🔗 Participant view: Sign in with any other email above\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating mock data:', error);
    process.exit(1);
  }
}

createMockGroup();
