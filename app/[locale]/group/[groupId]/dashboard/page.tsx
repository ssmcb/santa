import { redirect } from 'next/navigation';

import { getAuthenticatedParticipant } from '@/lib/auth';
import { Group } from '@/lib/db/models/Group';
import { Participant } from '@/lib/db/models/Participant';
import { connectDB } from '@/lib/db/mongodb';

import { GroupDashboard } from './GroupDashboard';

type GroupDashboardPageProps = {
  params: Promise<{ locale: string; groupId: string }>;
};

export default async function GroupDashboardPage({ params }: GroupDashboardPageProps) {
  const { locale, groupId } = await params;
  const participant = await getAuthenticatedParticipant(locale);

  await connectDB();

  // Fetch the group
  const group = await Group.findById(groupId).populate('participants');
  if (!group) {
    redirect(`/${locale}/dashboard`);
  }

  // Check if user is the owner
  const isOwner = participant.email === group.owner_email;

  // Fetch all participants with their details
  const participants = await Participant.find({ group_id: groupId });

  return (
    <GroupDashboard
      locale={locale}
      group={{
        id: group._id.toString(),
        name: group.name,
        date: group.date.toISOString(),
        place: group.place,
        budget: group.budget,
        inviteId: group.invite_id,
        isDrawn: group.is_drawn,
        invitationsSent: group.invitations_sent.map((inv) => {
          // Handle legacy field name for backwards compatibility
          const sentAtDate = inv.sentAt || (inv as { sent_at?: Date }).sent_at;
          return {
            email: inv.email,
            sentAt: sentAtDate?.toISOString() || new Date().toISOString(),
          };
        }),
      }}
      participants={participants.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        email: p.email,
        recipientId: p.recipient_id?.toString() || null,
        assignmentEmailStatus: p.assignment_email_status,
      }))}
      isOwner={isOwner}
      currentParticipant={{
        id: participant._id.toString(),
        name: participant.name,
        email: participant.email,
        recipientId: participant.recipient_id?.toString() || null,
      }}
    />
  );
}
