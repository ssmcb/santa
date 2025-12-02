'use client';

import { memo, useCallback } from 'react';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import { Calendar, MapPin, DollarSign, Gift, Pencil, Save, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import 'dayjs/locale/pt-br';
import 'dayjs/locale/en';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Group } from '@/types/shared';

dayjs.extend(localizedFormat);
dayjs.extend(utc);

type EditedGroup = {
  name: string;
  date: string;
  place: string;
  budget: string;
};

type GroupHeaderProps = {
  group: Group;
  isOwner: boolean;
  isEditingGroup: boolean;
  isSavingGroup: boolean;
  editedGroup: EditedGroup;
  onEditedGroupChange: (editedGroup: EditedGroup) => void;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveGroup: () => void;
};

export const GroupHeader = memo(function GroupHeader({
  group,
  isOwner,
  isEditingGroup,
  isSavingGroup,
  editedGroup,
  onEditedGroupChange,
  onEditClick,
  onCancelEdit,
  onSaveGroup,
}: GroupHeaderProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { name, date, place, budget } = group;

  const formatDateForDisplay = useCallback(
    (dateString: string) => {
      const localeName = locale === 'pt' ? 'pt-br' : 'en';
      return dayjs.utc(dateString).locale(localeName).format('L');
    },
    [locale]
  );
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
            <Gift className="w-6 h-6 md:w-8 md:h-8" />
            {isEditingGroup ? (
              <Input
                value={editedGroup.name}
                onChange={(e) => onEditedGroupChange({ ...editedGroup, name: e.target.value })}
                className="text-2xl md:text-3xl font-bold h-auto py-1"
                disabled={isSavingGroup}
              />
            ) : (
              name
            )}
          </CardTitle>
          {isOwner && !isEditingGroup && (
            <Button variant="outline" size="sm" onClick={onEditClick} className="w-full md:w-auto">
              <Pencil className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
          )}
          {isOwner && isEditingGroup && (
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
                disabled={isSavingGroup}
                className="flex-1 md:flex-none"
              >
                <X className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{tCommon('cancel')}</span>
              </Button>
              <Button
                size="sm"
                onClick={onSaveGroup}
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
                onChange={(e) => onEditedGroupChange({ ...editedGroup, date: e.target.value })}
                disabled={isSavingGroup}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPlace">{tCommon('location')}</Label>
              <Input
                id="editPlace"
                value={editedGroup.place}
                onChange={(e) => onEditedGroupChange({ ...editedGroup, place: e.target.value })}
                disabled={isSavingGroup}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBudget">{tCommon('budget')}</Label>
              <Input
                id="editBudget"
                value={editedGroup.budget}
                onChange={(e) => onEditedGroupChange({ ...editedGroup, budget: e.target.value })}
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
                <p className="text-sm font-medium">{formatDateForDisplay(date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <MapPin className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                  {tCommon('location')}
                </p>
                <p className="text-sm font-medium">{place}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                  {tCommon('budget')}
                </p>
                <p className="text-sm font-medium">{budget}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

GroupHeader.displayName = 'GroupHeader';
