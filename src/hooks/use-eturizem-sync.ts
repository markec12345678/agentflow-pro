import { useState, useCallback } from 'react';
import { logger } from '@/infrastructure/observability/logger';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  syncId: string;
  type: string;
  status: string;
  duration: number;
  totalProperties: number;
  syncedProperties: number;
  failedProperties: number;
  errors: string[];
}

function getSessionToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('next-auth.session-token='))
    ?.split('=')[1];
}

export function useEturizemSync() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const triggerSync = useCallback(async (propertyIds?: string[]) => {
    setLoading(true);

    try {
      const sessionToken = getSessionToken();
      const response = await fetch('/api/v1/integration/eturizem/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          type: 'manual',
          propertyIds
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setLastSync(result.data);
        toast.success(`Sync completed: ${result.data.syncedProperties}/${result.data.totalProperties} properties synced`);
      } else {
        toast.error(result.error?.message || 'Sync failed');
      }
      
      return result;
    } catch (error) {
      logger.error('Sync error:', error);
      toast.error('Failed to trigger sync');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSyncStatus = useCallback(async () => {
    try {
      const sessionToken = getSessionToken();
      const response = await fetch('/api/v1/integration/eturizem/status', {
        headers: {
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
        },
      });
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
    } catch (error) {
      logger.error('Status check error:', error);
    }
  }, []);

  return {
    triggerSync,
    checkSyncStatus,
    loading,
    lastSync,
  };
}
