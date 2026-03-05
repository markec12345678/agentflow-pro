import { useState, useEffect, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  data: unknown;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  send: (type: string, data: unknown) => void;
  disconnect: () => void;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        setSocket(ws);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message:', message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        console.log('WebSocket disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setSocket(null);
      };

      return ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
    }
  }, [socket]);

  const send = useCallback((type: string, data: unknown) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    }
  }, [socket]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!isConnected && url) {
      const reconnect = () => {
        connect();
      };

      // Try to reconnect immediately
      reconnect();
      
      // Set up periodic reconnection attempts
      reconnectTimeoutRef.current = setInterval(() => {
        if (!isConnected) {
          console.log('Attempting to reconnect...');
          reconnect();
        }
      }, 5000); // Try to reconnect every 5 seconds

      return () => {
        if (reconnectTimeoutRef.current) {
          clearInterval(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearInterval(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      disconnect();
    };
  }, [isConnected, url, connect, disconnect]);

  return {
    socket,
    isConnected,
    send,
    disconnect,
  };
}
