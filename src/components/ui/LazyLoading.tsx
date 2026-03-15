/**
 * Lazy Loading Utility Components
 * 
 * Dynamic imports with loading states for better performance
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Loading component
function LoadingFallback({ className = "min-h-screen flex items-center justify-center" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Error boundary component
function LoadError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Failed to load component
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Lazy load with error boundary and suspense
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    ssr?: boolean;
    loadingClassName?: string;
  } = {}
) {
  const { ssr = true, loadingClassName = "min-h-screen flex items-center justify-center" } = options;
  
  const LazyComponent = dynamic(
    () => importFunc,
    {
      ssr,
      loading: () => <LoadingFallback className={loadingClassName} />,
    }
  );
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingFallback className={loadingClassName} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Preload utility
export function preloadComponent(importFunc: () => Promise<any>) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFunc();
    });
  }
}

// Prefetch utility
export function prefetchComponent(importFunc: () => Promise<any>) {
  if (typeof window !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection.saveData === false || connection.effectiveType !== 'slow-2g') {
      importFunc();
    }
  }
}

export { LoadingFallback, LoadError };
