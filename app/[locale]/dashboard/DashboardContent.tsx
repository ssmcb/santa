'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Welcome, {participantName}! 🎅
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                {groups.length === 0
                  ? t('createFirstGroup')
                  : t('youHaveGroups', {
                      count: groups.length,
                      groups: groups.length > 1 ? t('groupPlural') : t('group'),
                    })}
              </p>
            </div>
            <Link href={`/${locale}/group/create`}>
              <Button size="lg">{t('create')}</Button>
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
                          <span>📍</span>
                          <span>{group.place}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <span>💰</span>
                          <span>{group.budget}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <span>👥</span>
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
                <div className="text-6xl">🎁</div>
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
      </div>
    );
  }
);

DashboardContent.displayName = 'DashboardContent';
