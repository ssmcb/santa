import { getAuthenticatedParticipant } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { DashboardContent } from './DashboardContent';

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const participant = await getAuthenticatedParticipant(locale);

  await connectDB();

  // Find all groups where the user is the owner
  const ownedGroups = await Group.find({ owner_email: participant.email });

  // Find all groups where the user is a participant
  const participantRecords = await Participant.find({
    email: participant.email,
    group_id: { $ne: null },
  });

  const participantGroupIds = participantRecords.map((p) => p.group_id);
  const participatingGroups = await Group.find({
    _id: { $in: participantGroupIds },
    owner_email: { $ne: participant.email }, // Exclude owned groups
  });

  const allGroups = [
    ...ownedGroups.map((g) => ({
      id: g._id.toString(),
      name: g.name,
      date: g.date.toISOString(),
      place: g.place,
      budget: g.budget,
      isOwner: true,
      isDrawn: g.is_drawn,
      participantCount: 0, // Will be populated
    })),
    ...participatingGroups.map((g) => ({
      id: g._id.toString(),
      name: g.name,
      date: g.date.toISOString(),
      place: g.place,
      budget: g.budget,
      isOwner: false,
      isDrawn: g.is_drawn,
      participantCount: 0, // Will be populated
    })),
  ];

  // Get participant counts for each group
  for (const group of allGroups) {
    const count = await Participant.countDocuments({ group_id: group.id });
    group.participantCount = count;
  }

  return <DashboardContent locale={locale} participantName={participant.name} groups={allGroups} />;
}
