import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface PageBuilderSync {
  pageId: string;
  lastModified: string;
  isEditing: boolean;
}

export function usePageBuilderSync(pageId: string) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !pageId) return;

    // Join page-specific room
    socket.emit('join-page', { pageId });

    // Listen for sync events
    socket.on('page-updated', (data: PageBuilderSync) => {
      if (data.pageId === pageId) {
        setLastSync(new Date().toISOString());
        setSyncStatus('synced');
      }
    });

    socket.on('user-joined', (userId: string) => {
      setConnectedUsers(prev => [...prev, userId]);
    });

    socket.on('user-left', (userId: string) => {
      setConnectedUsers(prev => prev.filter(id => id !== userId));
    });

    socket.on('sync-error', (error: string) => {
      setSyncStatus('error');
      console.error('Page sync error:', error);
    });

    return () => {
      socket.emit('leave-page');
    };
  }, [isConnected, socket, pageId]);

  const syncPage = useCallback(async () => {
    if (!pageId) return;
    
    setSyncStatus('syncing');
    
    try {
      const response = await fetch(`/api/page-builder/sync/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      setLastSync(new Date().toISOString());
      setSyncStatus('synced');
      
      // Broadcast to other users
      socket.emit('page-updated', {
        pageId,
        lastModified: result.lastModified,
        isEditing: false,
      });
    } catch (error) {
      setSyncStatus('error');
      console.error('Sync error:', error);
    }
  }, [pageId, socket]);

  return {
    syncStatus,
    lastSync,
    connectedUsers,
    syncPage,
  };
}
