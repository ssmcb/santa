'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type LotteryDialogsProps = {
  showRunDialog: boolean;
  showVoidDialog: boolean;
  isRunning: boolean;
  isVoiding: boolean;
  onRunConfirm: () => void;
  onVoidConfirm: () => void;
  onRunCancel: () => void;
  onVoidCancel: () => void;
};

export const LotteryDialogs = memo(function LotteryDialogs({
  showRunDialog,
  showVoidDialog,
  isRunning,
  isVoiding,
  onRunConfirm,
  onVoidConfirm,
  onRunCancel,
  onVoidCancel,
}: LotteryDialogsProps) {
  const tLottery = useTranslations('lottery');
  const tCommon = useTranslations('common');
  return (
    <>
      {/* Run Lottery Confirmation Dialog */}
      <Dialog open={showRunDialog} onOpenChange={onRunCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLottery('confirmRunTitle')}</DialogTitle>
            <DialogDescription>{tLottery('confirmRunDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onRunCancel}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={onRunConfirm} disabled={isRunning}>
              {isRunning ? tCommon('loading') : tCommon('continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Lottery Confirmation Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={onVoidCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLottery('confirmVoidTitle')}</DialogTitle>
            <DialogDescription>{tLottery('confirmVoidDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onVoidCancel}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={onVoidConfirm} disabled={isVoiding}>
              {isVoiding ? tCommon('loading') : tCommon('continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

LotteryDialogs.displayName = 'LotteryDialogs';
