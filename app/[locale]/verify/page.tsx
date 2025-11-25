import { VerifyForm } from './VerifyForm';

type VerifyPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; code?: string }>;
};

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { locale } = await params;
  const { email, code } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <VerifyForm locale={locale} initialEmail={email} initialCode={code} />
    </div>
  );
}
