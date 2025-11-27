'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Trash2, Mail } from 'lucide-react';
import { Participant } from '@/types/shared';

export type ParticipantRowProps = {
  participant: Participant;
  isDrawn: boolean;
  isCurrentUser: boolean;
  onRemove: (participantId: string) => Promise<void>;
  onResendEmail?: (participantId: string) => Promise<void>;
  getStatusBadge: (status: string) => React.ReactNode;
  removeButtonTitle: string;
};

export const ParticipantRow = memo(function ParticipantRow({
  participant,
  isDrawn,
  isCurrentUser,
  onRemove,
  onResendEmail,
  getStatusBadge,
  removeButtonTitle,
}: ParticipantRowProps) {
  const t = useTranslations('participants');
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!onResendEmail) return;

    setIsResending(true);
    try {
      await onResendEmail(participant.id);
    } finally {
      setIsResending(false);
    }
  };

  // Show resend button for failed, bounced, or pending statuses
  const canResendEmail =
    isDrawn &&
    onResendEmail &&
    ['pending', 'bounced', 'failed'].includes(participant.assignmentEmailStatus);

  return (
    <TableRow>
      <TableCell className="font-medium">{participant.name}</TableCell>
      <TableCell>{participant.email}</TableCell>
      {isDrawn && (
        <TableCell>
          <div className="flex items-center gap-2">
            {getStatusBadge(participant.assignmentEmailStatus)}
            {canResendEmail && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                title={t('resendEmail')}
              >
                <Mail className="w-4 h-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
      {!isDrawn && (
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(participant.id)}
            disabled={isCurrentUser}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            title={isCurrentUser ? 'Cannot remove yourself' : removeButtonTitle}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
});

ParticipantRow.displayName = 'ParticipantRow';
