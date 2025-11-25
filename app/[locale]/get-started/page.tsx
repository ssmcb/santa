import { GetStartedForm } from './GetStartedForm';

type GetStartedPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GetStartedPage({ params }: GetStartedPageProps) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <GetStartedForm locale={locale} />
    </div>
  );
}
