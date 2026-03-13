/**
 * Error State Component
 */

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function ErrorState({ error, onRetry, title, message }: ErrorStateProps) {
  return (
    <div className="text-center py-12 px-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title || 'Napaka'}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {message || error.message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Poskusi znova
        </button>
      )}
    </div>
  );
}
