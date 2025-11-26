'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/en';
import { Button } from '@/components/ui/button';

dayjs.extend(localizedFormat);
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  MapPin,
  DollarSign,
  Gift,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Save,
  X,
  RotateCcw,
} from 'lucide-react';

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
    const [isVoidingLottery, setIsVoidingLottery] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showInvitationsSent, setShowInvitationsSent] = useState(false);
    const [isEditingGroup, setIsEditingGroup] = useState(false);
    const [isSavingGroup, setIsSavingGroup] = useState(false);
    const [showRunLotteryDialog, setShowRunLotteryDialog] = useState(false);
    const [showVoidLotteryDialog, setShowVoidLotteryDialog] = useState(false);

    // Helper to format date for input (YYYY-MM-DD)
    const formatDateForInput = useCallback((dateString: string) => {
      return dayjs(dateString).format('YYYY-MM-DD');
    }, []);

    // Helper to format date for display (localized)
    const formatDateForDisplay = useCallback(
      (dateString: string) => {
        const localeName = locale === 'pt' ? 'pt-br' : 'en';
        return dayjs(dateString).locale(localeName).format('L');
      },
      [locale]
    );

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
      setShowRunLotteryDialog(false);

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

    const handleVoidLottery = useCallback(async () => {
      setIsVoidingLottery(true);
      setError(null);
      setSuccess(null);
      setShowVoidLotteryDialog(false);

      try {
        const response = await fetch('/api/lottery/void', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    }, [group.id, router, tLottery, tCommon]);

    const handleSaveGroup = useCallback(async () => {
      setIsSavingGroup(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/group/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
    }, [group.id, editedGroup, router, t, tCommon]);

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

        try {
          const response = await fetch('/api/group/remove-participant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
      [group.id, router, t, tCommon]
    );

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
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                  <Gift className="w-6 h-6 md:w-8 md:h-8" />
                  {isEditingGroup ? (
                    <Input
                      value={editedGroup.name}
                      onChange={(e) => setEditedGroup({ ...editedGroup, name: e.target.value })}
                      className="text-2xl md:text-3xl font-bold h-auto py-1"
                      disabled={isSavingGroup}
                    />
                  ) : (
                    group.name
                  )}
                </CardTitle>
                {isOwner && !isEditingGroup && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingGroup(true)}
                    className="w-full md:w-auto"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    {t('edit')}
                  </Button>
                )}
                {isOwner && isEditingGroup && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSavingGroup}
                      className="flex-1 md:flex-none"
                    >
                      <X className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">{tCommon('cancel')}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveGroup}
                      disabled={isSavingGroup}
                      className="flex-1 md:flex-none"
                    >
                      <Save className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">
                        {isSavingGroup ? tCommon('loading') : tCommon('save')}
                      </span>
                      <span className="md:hidden">{isSavingGroup ? '...' : 'Save'}</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingGroup ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editDate">{tCommon('date')}</Label>
                    <Input
                      id="editDate"
                      type="date"
                      value={editedGroup.date}
                      onChange={(e) => setEditedGroup({ ...editedGroup, date: e.target.value })}
                      disabled={isSavingGroup}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPlace">{tCommon('location')}</Label>
                    <Input
                      id="editPlace"
                      value={editedGroup.place}
                      onChange={(e) => setEditedGroup({ ...editedGroup, place: e.target.value })}
                      disabled={isSavingGroup}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editBudget">{tCommon('budget')}</Label>
                    <Input
                      id="editBudget"
                      value={editedGroup.budget}
                      onChange={(e) => setEditedGroup({ ...editedGroup, budget: e.target.value })}
                      disabled={isSavingGroup}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <Calendar className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                        {tCommon('date')}
                      </p>
                      <p className="text-sm font-medium">{formatDateForDisplay(group.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <MapPin className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                        {tCommon('location')}
                      </p>
                      <p className="text-sm font-medium">{group.place}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <DollarSign className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                        {tCommon('budget')}
                      </p>
                      <p className="text-sm font-medium">{group.budget}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Show assignment if lottery has been drawn and user is not owner viewing */}
          {group.isDrawn && myRecipient && (
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle>{tLottery('yourSecretSanta')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Gift className="w-8 h-8" />
                  {myRecipient.name}
                </p>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInvitationsSent(!showInvitationsSent)}
                        className="flex items-center gap-2 p-0 h-auto font-semibold text-sm hover:bg-transparent"
                      >
                        {showInvitationsSent ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        {t('invitationsSent')} ({group.invitationsSent.length})
                      </Button>
                      {showInvitationsSent && (
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mt-2">
                          {group.invitationsSent.map((inv, idx) => {
                            const localeName = locale === 'pt' ? 'pt-br' : 'en';
                            const formattedDate = dayjs(inv.sentAt)
                              .locale(localeName)
                              .format('L LT');
                            return (
                              <div key={idx}>
                                {inv.email} - {formattedDate}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participants Section */}
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
                      <Button
                        onClick={() => setShowRunLotteryDialog(true)}
                        disabled={isRunningLottery}
                        className="w-full md:w-auto"
                      >
                        {isRunningLottery ? tCommon('loading') : t('runLottery')}
                      </Button>
                    )}
                    {group.isDrawn && (
                      <Button
                        onClick={() => setShowVoidLotteryDialog(true)}
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
                            {group.isDrawn && (
                              <TableHead>{tParticipants('emailDeliveryStatus')}</TableHead>
                            )}
                            {!group.isDrawn && <TableHead className="w-20"></TableHead>}
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
                              {!group.isDrawn && (
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveParticipant(participant.id)}
                                    disabled={participant.email === currentParticipant.email}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                    title={
                                      participant.email === currentParticipant.email
                                        ? 'Cannot remove yourself'
                                        : t('removeParticipant')
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
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

        {/* Run Lottery Confirmation Dialog */}
        <Dialog open={showRunLotteryDialog} onOpenChange={setShowRunLotteryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tLottery('confirmRunTitle')}</DialogTitle>
              <DialogDescription>{tLottery('confirmRunDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRunLotteryDialog(false)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleRunLottery} disabled={isRunningLottery}>
                {isRunningLottery ? tCommon('loading') : tCommon('continue')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Void Lottery Confirmation Dialog */}
        <Dialog open={showVoidLotteryDialog} onOpenChange={setShowVoidLotteryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tLottery('confirmVoidTitle')}</DialogTitle>
              <DialogDescription>{tLottery('confirmVoidDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVoidLotteryDialog(false)}>
                {tCommon('cancel')}
              </Button>
              <Button variant="destructive" onClick={handleVoidLottery} disabled={isVoidingLottery}>
                {isVoidingLottery ? tCommon('loading') : tCommon('continue')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

GroupDashboard.displayName = 'GroupDashboard';
