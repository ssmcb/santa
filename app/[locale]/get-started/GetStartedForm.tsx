'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCSRF } from '@/lib/hooks/useCSRF';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

type GetStartedFormProps = {
  locale: string;
};

export const GetStartedForm = React.memo(({ locale }: GetStartedFormProps) => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { token: csrfToken } = useCSRF();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'name'>('email');
  const [emailValue, setEmailValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = React.useCallback(
    async (data: FormData) => {
      setIsSubmitting(true);
      setError(null);

      if (!csrfToken) {
        setError('CSRF token not available');
        setIsSubmitting(false);
        return;
      }

      try {
        if (step === 'email') {
          // Check if user exists with this email
          const checkResponse = await fetch(
            `/api/check-email?email=${encodeURIComponent(data.email)}`
          );
          const checkResult = await checkResponse.json();

          if (checkResult.exists && !checkResult.hasName) {
            // User exists but has no name, ask for it
            setEmailValue(data.email);
            setValue('email', data.email);
            setStep('name');
            setIsSubmitting(false);
            return;
          }

          // Either new user or existing user with name - proceed with signup/login
          const response = await fetch('/api/admin-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ email: data.email, name: '' }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to process request');
          }

          // Redirect to verify page with email
          router.push(`/${locale}/verify?email=${encodeURIComponent(data.email)}`);
        } else {
          // step === 'name'
          if (!data.name || data.name.trim().length === 0) {
            setError('Name is required');
            setIsSubmitting(false);
            return;
          }

          const response = await fetch('/api/admin-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to create account');
          }

          // Redirect to verify page with email
          router.push(`/${locale}/verify?email=${encodeURIComponent(data.email)}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon('error'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [csrfToken, step, locale, router, tCommon, setValue]
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Gift className="w-7 h-7" />
          {t('getStarted')}
        </CardTitle>
        <CardDescription>{t('getStartedDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 'name' && (
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
                disabled={isSubmitting}
                autoFocus
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              disabled={isSubmitting || step === 'name'}
              value={step === 'name' ? emailValue : undefined}
              autoFocus={step === 'email'}
              readOnly={step === 'name'}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            {step === 'name' && <p className="text-xs text-zinc-500">{t('emailEditNote')}</p>}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            {step === 'name' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('email')}
                disabled={isSubmitting}
              >
                {tCommon('cancel')}
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : tCommon('continue')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

GetStartedForm.displayName = 'GetStartedForm';
