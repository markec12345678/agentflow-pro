import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PhotoAnalysis from '@/components/tourism/PhotoAnalysis';

export default async function PhotoAnalysisPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const propertyId = session.user.activePropertyId;
  
  if (!propertyId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ni aktivne nastanitve</h1>
          <p className="text-gray-600">Prosim izberite nastanitev za analizo fotografij</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PhotoAnalysis propertyId={propertyId} />
    </div>
  );
}
