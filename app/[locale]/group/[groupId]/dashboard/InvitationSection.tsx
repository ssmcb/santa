'use client';

import { memo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/en';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { InvitationSent } from '@/types/shared';

dayjs.extend(localizedFormat);

type InvitationSectionProps = {
  inviteLink: string;
  whatsappLink: string;
  invitationsSent: InvitationSent[];
  onCopyLink: () => void;
  onSendInvite: (email: string) => Promise<void>;
};

export const InvitationSection = memo(function InvitationSection({
  inviteLink,
  whatsappLink,
  invitationsSent,
  onCopyLink,
  onSendInvite,
}: InvitationSectionProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [showInvitationsSent, setShowInvitationsSent] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteEmail) return;

    setIsSendingInvite(true);
    try {
      await onSendInvite(inviteEmail);
      setInviteEmail('');
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inviteLink')}</CardTitle>
        <CardDescription>{t('shareInviteLink')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={inviteLink} readOnly className="font-mono text-sm" />
          <Button onClick={onCopyLink}>{t('copyLink')}</Button>
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
        {invitationsSent.length > 0 && (
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
              {t('invitationsSent')} ({invitationsSent.length})
            </Button>
            {showInvitationsSent && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mt-2">
                {invitationsSent.map((inv, idx) => {
                  const localeName = locale === 'pt' ? 'pt-br' : 'en';
                  const formattedDate = dayjs(inv.sentAt).locale(localeName).format('L LT');
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
  );
});

InvitationSection.displayName = 'InvitationSection';
