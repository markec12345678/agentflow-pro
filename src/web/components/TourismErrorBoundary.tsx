"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export function TourismErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorInfo: null,
  });

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setErrorState({
        hasError: true,
        error: error.error,
        errorInfo: null,
      });
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  const handleRetry = () => {
    setErrorState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (errorState.hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {fallback || (
            <>
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ups! Nekaj je šlo narobe
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Prišlo je do napake pri nalaganju strani. Poskusite znova ali se vrnite nazaj.
              </p>
              
              {errorState.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-left">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                    Napaka:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                    {errorState.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Poskusi znova
                </button>
                <button
                  onClick={handleGoBack}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Nazaj
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Če se napaka ponavlja, kontaktirajte podporo:
                </p>
                <a
                  href="mailto:support@agentflow.pro"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  support@agentflow.pro
                </a>
              </div>

              <Link
                href="/dashboard/tourism"
                className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Nazaj na Tourism Hub
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// API Error Handler Hook
export function useApiError() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    errorMessage = "Prišlo je do napake"
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage;
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { error, isLoading, handleApiCall, clearError, setError };
}

// Loading State Component
export function LoadingState({ message = "Nalaganje..." }: { message?: string }) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {(actionLabel || actionHref) && (
        <div>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              {actionLabel || "Začni"}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              {actionLabel || "Začni"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
