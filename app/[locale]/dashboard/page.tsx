import { redirect } from 'next/navigation';
import { getAuthenticatedParticipant } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import { Group } from '@/lib/db/models/Group';
import { DashboardContent } from './DashboardContent';

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const participant = await getAuthenticatedParticipant(locale);

  await connectDB();

  // Check if participant has a group
  if (participant.group_id) {
    // Redirect to group dashboard
    redirect(`/${locale}/group/${participant.group_id}/dashboard`);
  }

  // Check if participant is the admin (owner)
  const ownedGroups = await Group.find({ owner_email: participant.email });

  if (ownedGroups.length > 0) {
    // Redirect to the first owned group
    redirect(`/${locale}/group/${ownedGroups[0]._id}/dashboard`);
  }

  // No group yet, show create group option
  return <DashboardContent locale={locale} participantName={participant.name} />;
}
