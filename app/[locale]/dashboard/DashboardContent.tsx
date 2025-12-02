'use client';

import React from 'react';
import { MapPin, DollarSign, Users, Gift } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Group = {
  id: string;
  name: string;
  date: string;
  place: string;
  budget: string;
  isOwner: boolean;
  isDrawn: boolean;
  participantCount: number;
};

type DashboardContentProps = {
  locale: string;
  participantName: string;
  groups: Group[];
};

export const DashboardContent = React.memo(
  ({ locale, participantName, groups }: DashboardContentProps) => {
    const t = useTranslations('groups');

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 pb-16">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Gift className="w-6 h-6 md:w-8 md:h-8" />
                Welcome, {participantName}!
              </h1>
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 mt-1">
                {groups.length === 0
                  ? t('createFirstGroup')
                  : t('youHaveGroups', {
                      count: groups.length,
                      groups: groups.length > 1 ? t('groupPlural') : t('group'),
                    })}
              </p>
            </div>
            <Link href={`/${locale}/group/create`} className="w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto">
                {t('create')}
              </Button>
            </Link>
          </div>

          {/* Groups Grid */}
          {groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const groupDate = new Date(group.date);
                return (
                  <Link key={group.id} href={`/${locale}/group/${group.id}/dashboard`}>
                    <Card className="hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-xl">{group.name}</CardTitle>
                          <div className="flex gap-1">
                            {group.isOwner && (
                              <Badge variant="default" className="text-xs">
                                {t('owner')}
                              </Badge>
                            )}
                            {group.isDrawn && (
                              <Badge variant="secondary" className="text-xs">
                                {t('drawn')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription>
                          {groupDate.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <MapPin className="w-4 h-4" />
                          <span>{group.place}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <DollarSign className="w-4 h-4" />
                          <span>{group.budget}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Users className="w-4 h-4" />
                          <span>
                            {group.participantCount}{' '}
                            {group.participantCount === 1
                              ? t('participant')
                              : t('participantPlural')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <Gift className="w-16 h-16 text-zinc-400 dark:text-zinc-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('create')}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t('createGroupCTA')}</p>
                  <Link href={`/${locale}/group/create`}>
                    <Button size="lg">{t('create')}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-3">
          <div className="max-w-6xl mx-auto px-4 text-center text-xs text-zinc-500 dark:text-zinc-600">
            Built with ❤️ by the community.{' '}
            <a
              href="https://buymeacoffee.com/smapps"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors"
            >
              Support this project
            </a>
          </div>
        </footer>
      </div>
    );
  }
);

DashboardContent.displayName = 'DashboardContent';
