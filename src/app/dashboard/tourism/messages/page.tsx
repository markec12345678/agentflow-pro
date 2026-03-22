import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import InternalMessaging from '@/components/messaging/InternalMessaging';

export default async function MessagingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interna Sporočila</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Komunikacija z ekipami in sodelavci
        </p>
      </div>
      <InternalMessaging userId={session.user.id} />
    </div>
  );
}
