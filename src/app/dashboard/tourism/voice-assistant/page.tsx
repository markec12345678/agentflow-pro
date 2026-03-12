import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import VoiceAssistant from '@/components/tourism/VoiceAssistant';

export default async function VoiceAssistantPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const propertyId = session.user.activePropertyId || undefined;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Glasovni Asistent</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Govorite z AI asistentom za pomoč pri gostih in rezervacijah
        </p>
      </div>
      <VoiceAssistant propertyId={propertyId} />
    </div>
  );
}
