import createMiddleware from 'next-intl/middleware';

import { locales } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

export const config = {
  matcher: ['/', '/(en|pt|es)/:path*'],
};
