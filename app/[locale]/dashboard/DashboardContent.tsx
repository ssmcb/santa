'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardContentProps = {
  locale: string;
  participantName: string;
};

export const DashboardContent = React.memo(({ locale, participantName }: DashboardContentProps) => {
  const t = useTranslations('groups');

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome, {participantName}! 🎅</CardTitle>
          <CardDescription>
            You're all set! Now you can create your first Secret Santa group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Get Started</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Create a Secret Santa group, invite participants, and let the magic happen!
            </p>
            <Link href={`/${locale}/group/create`}>
              <Button size="lg">{t('create')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';
