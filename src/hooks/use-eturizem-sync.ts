import { useState, useCallback } from 'react';
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

export function useEturizemSync() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const triggerSync = useCallback(async (propertyIds?: string[]) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/integrations/eturizem/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      console.error('Sync error:', error);
      toast.error('Failed to trigger sync');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/eturizem/status');
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  }, []);

  return {
    triggerSync,
    checkSyncStatus,
    loading,
    lastSync,
  };
}
