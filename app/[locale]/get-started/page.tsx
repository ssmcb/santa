import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { AdminUser } from '@/lib/db/models/AdminUser';
import { GetStartedForm } from './GetStartedForm';

type GetStartedPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GetStartedPage({ params }: GetStartedPageProps) {
  const { locale } = await params;

  // Check if admin user already exists
  await connectDB();
  const adminUser = await AdminUser.findOne({ is_registered: true });

  if (adminUser) {
    // Redirect to login/home if admin already exists
    redirect(`/${locale}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <GetStartedForm locale={locale} />
    </div>
  );
}
