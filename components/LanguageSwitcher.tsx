'use client';

import React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'pt', label: 'PT', flag: '🇧🇷' },
] as const;

export const LanguageSwitcher = React.memo(() => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = params.locale as string;

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) return;

    // Replace the locale in the pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);

    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }

    router.push(newPathname);
  };

  return (
    <div className="flex gap-1">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLocale === lang.code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => switchLanguage(lang.code)}
          className="gap-1"
        >
          <span>{lang.flag}</span>
          <span className="text-xs">{lang.label}</span>
        </Button>
      ))}
    </div>
  );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
