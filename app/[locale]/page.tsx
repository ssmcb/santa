import { Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/session';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations('auth');
  const tCommon = await getTranslations('common');

  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-8 text-center pb-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <Gift className="w-10 h-10" />
          {tCommon('appTitle')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
          {tCommon('homeDescription')}
        </p>
        <div className="w-full max-w-2xl rounded-lg overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800">
          <Image
            src="/images/secret-santa-mock-image.png"
            alt="Secret Santa App Dashboard"
            width={700}
            height={455}
            className="w-full h-auto"
            priority
          />
        </div>
        <Link href={session.isLoggedIn ? `/${locale}/dashboard` : `/${locale}/get-started`}>
          <Button size="lg">{session.isLoggedIn ? tCommon('dashboard') : t('getStarted')}</Button>
        </Link>
      </div>
      <footer className="absolute bottom-4 text-center text-xs text-zinc-500 dark:text-zinc-600">
        Built with ❤️ by the community.{' '}
        <a
          href="https://buymeacoffee.com/smapps"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors"
        >
          Support this project
        </a>
      </footer>
    </div>
  );
}
