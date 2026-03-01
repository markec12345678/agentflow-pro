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

  const wsUrl = typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/page-builder/ws`
    : "";
  const { socket, isConnected } = useWebSocket(wsUrl);

  useEffect(() => {
    if (!isConnected || !pageId || !socket) return;

    const sock = socket as unknown as { emit: (ev: string, data?: unknown) => void; on: (ev: string, cb: (d: unknown) => void) => void };
    // Join page-specific room
    sock.emit('join-page', { pageId });

    // Listen for sync events
    sock.on('page-updated', (data: unknown) => {
      const d = data as PageBuilderSync;
      if (d.pageId === pageId) {
        setLastSync(new Date().toISOString());
        setSyncStatus('synced');
      }
    });

    sock.on('user-joined', (userId: unknown) => {
      setConnectedUsers(prev => [...prev, userId as string]);
    });

    sock.on('user-left', (userId: unknown) => {
      setConnectedUsers(prev => prev.filter(id => id !== userId));
    });

    sock.on('sync-error', (error: unknown) => {
      setSyncStatus('error');
      console.error('Page sync error:', error);
    });

    return () => {
      sock.emit('leave-page');
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
      (socket as unknown as { emit: (ev: string, data?: unknown) => void })?.emit('page-updated', {
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
