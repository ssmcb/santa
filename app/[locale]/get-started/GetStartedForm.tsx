'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const getStartedSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type GetStartedFormData = z.infer<typeof getStartedSchema>;

type GetStartedFormProps = {
  locale: string;
};

export const GetStartedForm = React.memo(({ locale }: GetStartedFormProps) => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GetStartedFormData>({
    resolver: zodResolver(getStartedSchema),
  });

  const onSubmit = React.useCallback(
    async (data: GetStartedFormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/admin-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create account');
        }

        // Redirect to verify page with email
        router.push(`/${locale}/verify?email=${encodeURIComponent(data.email)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [locale, router, tCommon]
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">🎅 {t('getStarted')}</CardTitle>
        <CardDescription>{t('getStartedDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
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
            <Label htmlFor="email">{t('email')}</Label>
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
            {isSubmitting ? tCommon('loading') : tCommon('continue')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});

GetStartedForm.displayName = 'GetStartedForm';
