import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OwnerPortalDashboard from '@/components/owner/OwnerPortalDashboard';

export default async function OwnerPortalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Get or create owner profile
  let owner = await prisma.owner.findUnique({
    where: { userId: session.user.id },
  });

  if (!owner) {
    // Create owner profile if doesn't exist
    owner = await prisma.owner.create({
      data: {
        userId: session.user.id,
        name: session.user.name || 'Owner',
        email: session.user.email || '',
      },
    });
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <OwnerPortalDashboard ownerId={owner.id} />
    </div>
  );
}
