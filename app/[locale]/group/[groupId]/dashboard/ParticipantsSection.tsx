'use client';

import React, { useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { ParticipantRow } from './ParticipantRow';
import { Group, Participant } from '@/types/shared';

export type ParticipantsSectionProps = {
  locale: string;
  group: Group;
  participants: Participant[];
  isOwner: boolean;
  currentParticipant: {
    id: string;
    name: string;
    email: string;
    recipientId: string | null;
  };
  onRemoveParticipant: (participantId: string) => Promise<void>;
  onRunLottery: () => void;
  onVoidLottery: () => void;
  isRunningLottery: boolean;
  isVoidingLottery: boolean;
};

export const ParticipantsSection = memo(function ParticipantsSection({
  group,
  participants,
  currentParticipant,
  onRemoveParticipant,
  onRunLottery,
  onVoidLottery,
  isRunningLottery,
  isVoidingLottery,
}: ParticipantsSectionProps) {
  const t = useTranslations('groups');
  const tParticipants = useTranslations('participants');
  const tLottery = useTranslations('lottery');
  const tCommon = useTranslations('common');

  const getStatusBadge = useCallback(
    (status: string) => {
      const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        delivered: 'default',
        sent: 'secondary',
        bounced: 'destructive',
        failed: 'destructive',
        pending: 'outline',
      };

      return (
        <Badge variant={variants[status] || 'outline'}>
          {tParticipants(status as 'delivered' | 'sent' | 'bounced' | 'failed' | 'pending')}
        </Badge>
      );
    },
    [tParticipants]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>
              {t('participants')} ({participants.length})
            </CardTitle>
            <CardDescription>{t('manageParticipants')}</CardDescription>
          </div>
          {!group.isDrawn && participants.length >= 3 && (
            <Button onClick={onRunLottery} disabled={isRunningLottery} className="w-full md:w-auto">
              {isRunningLottery ? tCommon('loading') : t('runLottery')}
            </Button>
          )}
          {group.isDrawn && (
            <Button
              onClick={onVoidLottery}
              disabled={isVoidingLottery}
              variant="destructive"
              className="w-full md:w-auto"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {isVoidingLottery ? tCommon('loading') : tLottery('voidLottery')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tParticipants('name')}</TableHead>
                  <TableHead>{tParticipants('email')}</TableHead>
                  {group.isDrawn && <TableHead>{tParticipants('emailDeliveryStatus')}</TableHead>}
                  {!group.isDrawn && <TableHead className="w-20"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    isDrawn={group.isDrawn}
                    isCurrentUser={participant.email === currentParticipant.email}
                    onRemove={onRemoveParticipant}
                    getStatusBadge={getStatusBadge}
                    removeButtonTitle={t('removeParticipant')}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {participants.length < 3 && (
          <p className="text-sm text-zinc-500 mt-4">{t('minParticipants')}</p>
        )}
      </CardContent>
    </Card>
  );
});

ParticipantsSection.displayName = 'ParticipantsSection';
