'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  date: z.string().min(1, 'Event date is required'),
  place: z.string().min(1, 'Event location is required'),
  budget: z.string().min(1, 'Gift budget is required'),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

type CreateGroupFormProps = {
  locale: string;
  ownerEmail: string;
};

export const CreateGroupForm = React.memo(({ locale, ownerEmail }: CreateGroupFormProps) => {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
  });

  const onSubmit = useCallback(
    async (data: CreateGroupFormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/group/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            ownerEmail,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create group');
        }

        // Redirect to group dashboard
        router.push(`/${locale}/group/${result.groupId}/dashboard`);
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [locale, ownerEmail, router, tCommon]
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">🎅 {t('create')}</CardTitle>
        <CardDescription>Set up your Secret Santa event details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input
              id="name"
              type="text"
              placeholder="Family Christmas 2025"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{t('date')}</Label>
            <Input id="date" type="date" {...register('date')} disabled={isSubmitting} />
            {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="place">{t('place')}</Label>
            <Input
              id="place"
              type="text"
              placeholder="Grandma's house"
              {...register('place')}
              disabled={isSubmitting}
            />
            {errors.place && <p className="text-sm text-red-600">{errors.place.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">{t('budget')}</Label>
            <Input
              id="budget"
              type="text"
              placeholder="$50"
              {...register('budget')}
              disabled={isSubmitting}
            />
            {errors.budget && <p className="text-sm text-red-600">{errors.budget.message}</p>}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? tCommon('loading') : t('create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});

CreateGroupForm.displayName = 'CreateGroupForm';
