"use client";

import { useRouter } from "next/navigation";
import { logger } from '@/infrastructure/observability/logger';
import { useSession } from "next-auth/react";
import { AIConciergeChat } from "@/components/onboarding/AIConciergeChat";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleComplete = (data: any) => {
    logger.info('Onboarding complete:', data);
    // Redirect to dashboard with success message
    router.push('/dashboard?onboarding=complete');
  };

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nalaganje...</p>
        </div>
      </div>
    );
  }

  // Get userId from session
  const userId = session?.user?.id || session?.user?.email || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <AIConciergeChat
          userId={userId}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
