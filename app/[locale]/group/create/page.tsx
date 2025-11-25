import { getAuthenticatedParticipant } from '@/lib/auth';
import { CreateGroupForm } from './CreateGroupForm';

type CreateGroupPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CreateGroupPage({ params }: CreateGroupPageProps) {
  const { locale } = await params;
  const participant = await getAuthenticatedParticipant(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <CreateGroupForm locale={locale} ownerEmail={participant.email} />
    </div>
  );
}
