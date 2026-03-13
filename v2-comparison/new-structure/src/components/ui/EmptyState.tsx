/**
 * Empty State Component
 * 
 * Display when no data exists.
 */

import Link from 'next/link';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {description}
        </p>
      )}
      {action && (
        <Link href={action.href}>
          <Button>{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
