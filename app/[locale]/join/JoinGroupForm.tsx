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

const joinGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type JoinGroupFormData = z.infer<typeof joinGroupSchema>;

type JoinGroupFormProps = {
  locale: string;
  inviteId: string;
  groupName: string;
  groupDate: string;
  groupPlace: string;
  groupBudget: string;
};

export const JoinGroupForm = React.memo(
  ({ locale, inviteId, groupName, groupDate, groupPlace, groupBudget }: JoinGroupFormProps) => {
    const t = useTranslations('groups');
    const tAuth = useTranslations('auth');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<JoinGroupFormData>({
      resolver: zodResolver(joinGroupSchema),
    });

    const onSubmit = useCallback(
      async (data: JoinGroupFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
          const response = await fetch('/api/group/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              inviteId,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to join group');
          }

          // Redirect to verify page with email
          router.push(`/${locale}/verify?email=${encodeURIComponent(data.email)}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : tCommon('error'));
        } finally {
          setIsSubmitting(false);
        }
      },
      [locale, inviteId, router, tCommon]
    );

    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">🎁 {t('join')}</CardTitle>
          <CardDescription>You&apos;ve been invited to join a Secret Santa group!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Group Info */}
          <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">{groupName}</h3>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>📅 Date: {groupDate}</p>
              <p>📍 Location: {groupPlace}</p>
              <p>💰 Budget: {groupBudget}</p>
            </div>
          </div>

          {/* Join Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tAuth('name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{tAuth('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('join')}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
);

JoinGroupForm.displayName = 'JoinGroupForm';
