import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Candy } from 'lucide-react';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations('auth');
  const tCommon = await getTranslations('common');

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-8 text-center p-8">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <Candy className="w-10 h-10" />
          {tCommon('appTitle')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
          {tCommon('homeDescription')}
        </p>
        <Link href={`/${locale}/get-started`}>
          <Button size="lg">{t('getStarted')}</Button>
        </Link>
      </div>
    </div>
  );
}
