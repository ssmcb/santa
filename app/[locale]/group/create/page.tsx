import { getAuthenticatedParticipant } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { CreateGroupForm } from './CreateGroupForm';
import { Breadcrumbs } from '@/components/Breadcrumbs';

type CreateGroupPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CreateGroupPage({ params }: CreateGroupPageProps) {
  const { locale } = await params;
  const participant = await getAuthenticatedParticipant(locale);
  const tCommon = await getTranslations('common');
  const t = await getTranslations('groups');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: tCommon('dashboard'), href: `/${locale}/dashboard` },
            { label: t('create') },
          ]}
        />
        <div className="flex items-center justify-center">
          <CreateGroupForm locale={locale} ownerEmail={participant.email} />
        </div>
      </div>
    </div>
  );
}
