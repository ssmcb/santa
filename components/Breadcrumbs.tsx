'use client';

import { Fragment, memo } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export const Breadcrumbs = memo(({ items }: BreadcrumbsProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={index}>
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-zinc-900 dark:text-zinc-50' : ''}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
});

Breadcrumbs.displayName = 'Breadcrumbs';
