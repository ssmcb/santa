'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const verifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

type VerifyFormProps = {
  locale: string;
  initialEmail?: string;
  initialCode?: string;
};

export const VerifyForm = React.memo(({ locale, initialEmail, initialCode }: VerifyFormProps) => {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: initialEmail || '',
      code: initialCode || '',
    },
  });

  const email = watch('email');

  // Auto-submit if code is provided in URL
  useEffect(() => {
    if (initialEmail && initialCode && initialCode.length === 6) {
      handleSubmit(onSubmit)();
    }
  }, [initialEmail, initialCode]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const onSubmit = useCallback(
    async (data: VerifyFormData) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Verification failed');
        }

        setSuccess(tCommon('success'));

        // Redirect to appropriate dashboard
        if (result.groupId) {
          router.push(`/${locale}/group/${result.groupId}/dashboard`);
        } else {
          router.push(`/${locale}/dashboard`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('invalidCode'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [locale, router, t, tCommon]
  );

  const handleResendCode = useCallback(async () => {
    if (cooldownSeconds > 0 || !email) return;

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.remainingSeconds) {
          setCooldownSeconds(result.remainingSeconds);
        }
        throw new Error(result.error || 'Failed to resend code');
      }

      setSuccess(t('emailSent'));
      setCooldownSeconds(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsResending(false);
    }
  }, [email, cooldownSeconds, t, tCommon]);

  const resendButtonText = useMemo(() => {
    if (cooldownSeconds > 0) {
      return t('resendIn', { seconds: cooldownSeconds });
    }
    return t('resendCode');
  }, [cooldownSeconds, t]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">📧 {t('verify')}</CardTitle>
        <CardDescription>
          Enter the verification code sent to your email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
            <p className="text-xs text-zinc-500">
              You can edit your email if it was entered incorrectly
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">{t('verificationCode')}</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              maxLength={6}
              {...register('code')}
              disabled={isSubmitting}
              className="text-center text-2xl tracking-widest font-mono"
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

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

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('verify')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              disabled={isResending || cooldownSeconds > 0 || !email}
            >
              {isResending ? tCommon('loading') : resendButtonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

VerifyForm.displayName = 'VerifyForm';
