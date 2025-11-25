'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Candy } from 'lucide-react';

type NavigationProps = {
  isLoggedIn: boolean;
};

export const Navigation = React.memo(({ isLoggedIn }: NavigationProps) => {
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Candy className="w-7 h-7 text-zinc-900 dark:text-zinc-50" />
            <span className="font-bold text-xl text-zinc-900 dark:text-zinc-50">Secret Santa</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {isLoggedIn ? (
              <>
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="ghost" size="sm">
                    {t('dashboard')}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? t('loading') : tAuth('signOut')}
                </Button>
              </>
            ) : (
              <Link href={`/${locale}/get-started`}>
                <Button size="sm">{tAuth('getStarted')}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';
