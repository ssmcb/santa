'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/en';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ParticipantsSection } from './ParticipantsSection';
import { GroupHeader } from './GroupHeader';
import { MyAssignmentCard } from './MyAssignmentCard';
import { InvitationSection } from './InvitationSection';
import { LotteryDialogs } from './LotteryDialogs';
import { Group, Participant } from '@/types/shared';
import { useCSRF } from '@/lib/hooks/useCSRF';

dayjs.extend(localizedFormat);
dayjs.extend(utc);

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

export const GroupDashboard = memo(
  ({ locale, group, participants, isOwner, currentParticipant }: GroupDashboardProps) => {
    const t = useTranslations('groups');
    const tLottery = useTranslations('lottery');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { token: csrfToken } = useCSRF();

    const [isRunningLottery, setIsRunningLottery] = useState(false);
    const [isVoidingLottery, setIsVoidingLottery] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditingGroup, setIsEditingGroup] = useState(false);
    const [isSavingGroup, setIsSavingGroup] = useState(false);
    const [showRunLotteryDialog, setShowRunLotteryDialog] = useState(false);
    const [showVoidLotteryDialog, setShowVoidLotteryDialog] = useState(false);

    // Helper to format date for input (YYYY-MM-DD)
    // Use UTC to avoid timezone shifts
    const formatDateForInput = useCallback((dateString: string) => {
      return dayjs.utc(dateString).format('YYYY-MM-DD');
    }, []);

    const [editedGroup, setEditedGroup] = useState({
      name: group.name,
      date: formatDateForInput(group.date),
      place: group.place,
      budget: group.budget,
    });

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

    const handleSendInvite = useCallback(
      async (email: string) => {
        setError(null);
        setSuccess(null);

        if (!csrfToken) {
          setError('CSRF token not available');
          throw new Error('CSRF token not available');
        }

        try {
          const response = await fetch('/api/group/send-invitation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
              groupId: group.id,
              recipientEmail: email,
              locale,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to send invitation');
          }

          setSuccess(t('invitationSentSuccess'));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : tCommon('error'));
          throw err;
        }
      },
      [csrfToken, group.id, locale, router, t, tCommon]
    );

    const handleRunLottery = useCallback(async () => {
      setIsRunningLottery(true);
      setError(null);
      setSuccess(null);
      setShowRunLotteryDialog(false);

      if (!csrfToken) {
        setError('CSRF token not available');
        setIsRunningLottery(false);
        return;
      }

      try {
        const response = await fetch('/api/lottery/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
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
    }, [csrfToken, group.id, locale, router, tLottery, tCommon]);

    const handleVoidLottery = useCallback(async () => {
      setIsVoidingLottery(true);
      setError(null);
      setSuccess(null);
      setShowVoidLotteryDialog(false);

      if (!csrfToken) {
        setError('CSRF token not available');
        setIsVoidingLottery(false);
        return;
      }

      try {
        const response = await fetch('/api/lottery/void', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ groupId: group.id }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to void lottery');
        }

        setSuccess(tLottery('lotteryVoidedSuccess'));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setIsVoidingLottery(false);
      }
    }, [csrfToken, group.id, router, tLottery, tCommon]);

    const handleSaveGroup = useCallback(async () => {
      setIsSavingGroup(true);
      setError(null);
      setSuccess(null);

      if (!csrfToken) {
        setError('CSRF token not available');
        setIsSavingGroup(false);
        return;
      }

      try {
        const response = await fetch('/api/group/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            groupId: group.id,
            ...editedGroup,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update group');
        }

        setSuccess(t('groupUpdatedSuccess'));
        setIsEditingGroup(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setIsSavingGroup(false);
      }
    }, [csrfToken, group.id, editedGroup, router, t, tCommon]);

    const handleCancelEdit = useCallback(() => {
      setEditedGroup({
        name: group.name,
        date: formatDateForInput(group.date),
        place: group.place,
        budget: group.budget,
      });
      setIsEditingGroup(false);
    }, [group, formatDateForInput]);

    const handleRemoveParticipant = useCallback(
      async (participantId: string) => {
        if (!confirm(t('confirmRemoveParticipant'))) return;

        setError(null);
        setSuccess(null);

        if (!csrfToken) {
          setError('CSRF token not available');
          return;
        }

        try {
          const response = await fetch('/api/group/remove-participant', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
              groupId: group.id,
              participantId,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to remove participant');
          }

          setSuccess(t('participantRemovedSuccess'));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : tCommon('error'));
        }
      },
      [csrfToken, group.id, router, t, tCommon]
    );

    const handleResendEmail = useCallback(
      async (participantId: string) => {
        setError(null);
        setSuccess(null);

        if (!csrfToken) {
          setError('CSRF token not available');
          return;
        }

        try {
          const response = await fetch('/api/lottery/resend-assignment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
              groupId: group.id,
              participantId,
              locale,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to resend email');
          }

          setSuccess(t('emailResentSuccess'));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : tCommon('error'));
        }
      },
      [csrfToken, group.id, locale, router, t, tCommon]
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
          <GroupHeader
            group={group}
            isOwner={isOwner}
            isEditingGroup={isEditingGroup}
            isSavingGroup={isSavingGroup}
            editedGroup={editedGroup}
            onEditedGroupChange={setEditedGroup}
            onEditClick={() => setIsEditingGroup(true)}
            onCancelEdit={handleCancelEdit}
            onSaveGroup={handleSaveGroup}
          />

          {/* Show assignment if lottery has been drawn and user is not owner viewing */}
          {group.isDrawn && myRecipient && (
            <MyAssignmentCard recipient={myRecipient} title={tLottery('yourSecretSanta')} />
          )}

          {/* Owner-only features */}
          {isOwner && (
            <>
              {/* Invitation Section */}
              <InvitationSection
                inviteLink={inviteLink}
                whatsappLink={whatsappLink}
                invitationsSent={group.invitationsSent}
                onCopyLink={handleCopyLink}
                onSendInvite={handleSendInvite}
              />

              {/* Participants Section */}
              <ParticipantsSection
                locale={locale}
                group={group}
                participants={participants}
                isOwner={isOwner}
                currentParticipant={currentParticipant}
                onRemoveParticipant={handleRemoveParticipant}
                onResendEmail={handleResendEmail}
                onRunLottery={() => setShowRunLotteryDialog(true)}
                onVoidLottery={() => setShowVoidLotteryDialog(true)}
                isRunningLottery={isRunningLottery}
                isVoidingLottery={isVoidingLottery}
              />
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

        {/* Lottery Dialogs */}
        <LotteryDialogs
          showRunDialog={showRunLotteryDialog}
          showVoidDialog={showVoidLotteryDialog}
          isRunning={isRunningLottery}
          isVoiding={isVoidingLottery}
          onRunConfirm={handleRunLottery}
          onVoidConfirm={handleVoidLottery}
          onRunCancel={() => setShowRunLotteryDialog(false)}
          onVoidCancel={() => setShowVoidLotteryDialog(false)}
        />
      </div>
    );
  }
);

GroupDashboard.displayName = 'GroupDashboard';
