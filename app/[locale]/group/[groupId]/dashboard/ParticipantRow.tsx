'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { Participant } from '@/types/shared';

export type ParticipantRowProps = {
  participant: Participant;
  isDrawn: boolean;
  isCurrentUser: boolean;
  onRemove: (participantId: string) => Promise<void>;
  getStatusBadge: (status: string) => React.ReactNode;
  removeButtonTitle: string;
};

export const ParticipantRow = memo(function ParticipantRow({
  participant,
  isDrawn,
  isCurrentUser,
  onRemove,
  getStatusBadge,
  removeButtonTitle,
}: ParticipantRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{participant.name}</TableCell>
      <TableCell>{participant.email}</TableCell>
      {isDrawn && <TableCell>{getStatusBadge(participant.assignmentEmailStatus)}</TableCell>}
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
