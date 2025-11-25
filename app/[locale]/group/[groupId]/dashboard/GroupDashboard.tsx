'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from '@/components/Breadcrumbs';

type Group = {
  id: string;
  name: string;
  date: string;
  place: string;
  budget: string;
  inviteId: string;
  isDrawn: boolean;
  invitationsSent: Array<{ email: string; sentAt: string }>;
};

type Participant = {
  id: string;
  name: string;
  email: string;
  recipientId: string | null;
  assignmentEmailStatus: string;
};

type GroupDashboardProps = {
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
};

export const GroupDashboard = React.memo(
  ({ locale, group, participants, isOwner, currentParticipant }: GroupDashboardProps) => {
    const t = useTranslations('groups');
    const tParticipants = useTranslations('participants');
    const tLottery = useTranslations('lottery');
    const tCommon = useTranslations('common');
    const router = useRouter();

    const [inviteEmail, setInviteEmail] = useState('');
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [isRunningLottery, setIsRunningLottery] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/${locale}/join?inviteId=${group.inviteId}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Join my Secret Santa group! ${inviteLink}`)}`;

    const myRecipient = useMemo(() => {
      if (!currentParticipant.recipientId) return null;
      return participants.find((p) => p.id === currentParticipant.recipientId);
    }, [currentParticipant.recipientId, participants]);

    const handleCopyLink = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setSuccess(t('linkCopied'));
        setTimeout(() => setSuccess(null), 3000);
      } catch {
        setError(t('linkCopyFailed'));
      }
    }, [inviteLink, t]);

    const handleSendInvite = useCallback(async () => {
      if (!inviteEmail) return;

      setIsSendingInvite(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/group/send-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: group.id,
            recipientEmail: inviteEmail,
            locale,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send invitation');
        }

        setSuccess(t('invitationSentSuccess'));
        setInviteEmail('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setIsSendingInvite(false);
      }
    }, [inviteEmail, group.id, locale, router, t, tCommon]);

    const handleRunLottery = useCallback(async () => {
      setIsRunningLottery(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/lottery/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: group.id, locale }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to run lottery');
        }

        setSuccess(tLottery('lotteryComplete'));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setIsRunningLottery(false);
      }
    }, [group.id, locale, router, tLottery, tCommon]);

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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: tCommon('dashboard'), href: `/${locale}/dashboard` },
              { label: group.name },
            ]}
          />

          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl mb-4">🎅 {group.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                  <div className="text-2xl">📅</div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                      {tCommon('date')}
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(group.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                  <div className="text-2xl">📍</div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                      {tCommon('location')}
                    </p>
                    <p className="text-sm font-medium">{group.place}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                  <div className="text-2xl">💰</div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                      {tCommon('budget')}
                    </p>
                    <p className="text-sm font-medium">{group.budget}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show assignment if lottery has been drawn and user is not owner viewing */}
          {group.isDrawn && myRecipient && (
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle>{tLottery('yourSecretSanta')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">🎁 {myRecipient.name}</p>
              </CardContent>
            </Card>
          )}

          {/* Owner-only features */}
          {isOwner && (
            <>
              {/* Invitation Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('inviteLink')}</CardTitle>
                  <CardDescription>{t('shareInviteLink')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="font-mono text-sm" />
                    <Button onClick={handleCopyLink}>{t('copyLink')}</Button>
                    <Button variant="outline" asChild>
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        {t('shareWhatsApp')}
                      </a>
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">{t('sendInvitation')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="friend@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isSendingInvite}
                      />
                      <Button onClick={handleSendInvite} disabled={isSendingInvite || !inviteEmail}>
                        {isSendingInvite ? tCommon('loading') : t('sendInvitation')}
                      </Button>
                    </div>
                  </div>

                  {/* Invitations sent list */}
                  {group.invitationsSent.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">{t('invitationsSent')}</h4>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                        {group.invitationsSent.map((inv, idx) => (
                          <div key={idx}>
                            {inv.email} - {new Date(inv.sentAt).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participants Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {t('participants')} ({participants.length})
                      </CardTitle>
                      <CardDescription>{t('manageParticipants')}</CardDescription>
                    </div>
                    {!group.isDrawn && participants.length >= 3 && (
                      <Button onClick={handleRunLottery} disabled={isRunningLottery}>
                        {isRunningLottery ? tCommon('loading') : t('runLottery')}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tParticipants('name')}</TableHead>
                        <TableHead>{tParticipants('email')}</TableHead>
                        {group.isDrawn && (
                          <TableHead>{tParticipants('emailDeliveryStatus')}</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.name}</TableCell>
                          <TableCell>{participant.email}</TableCell>
                          {group.isDrawn && (
                            <TableCell>
                              {getStatusBadge(participant.assignmentEmailStatus)}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {participants.length < 3 && (
                    <p className="text-sm text-zinc-500 mt-4">{t('minParticipants')}</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

GroupDashboard.displayName = 'GroupDashboard';
