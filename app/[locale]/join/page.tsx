import { redirect } from 'next/navigation';

import { Group } from '@/lib/db/models/Group';
import { connectDB } from '@/lib/db/mongodb';

import { JoinGroupForm } from './JoinGroupForm';

type JoinPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ inviteId?: string }>;
};

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { locale } = await params;
  const { inviteId } = await searchParams;

  if (!inviteId) {
    redirect(`/${locale}`);
  }

  await connectDB();

  // Fetch the group by invite_id
  const group = await Group.findOne({ invite_id: inviteId });

  if (!group) {
    redirect(`/${locale}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <JoinGroupForm
        locale={locale}
        inviteId={inviteId}
        groupName={group.name}
        groupDate={group.date.toLocaleDateString()}
        groupPlace={group.place}
        groupBudget={group.budget}
      />
    </div>
  );
}
