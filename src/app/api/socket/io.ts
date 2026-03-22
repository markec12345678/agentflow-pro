/**
 * Next.js API route for Socket.IO initialization
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { socketManager } from '@/lib/websocket/socket-server';

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket?.server?.io) {
    console.log('🔌 Socket.io already initialized');
    res.end();
    return;
  }

  console.log('🔌 Initializing Socket.io server...');
  
  const httpServer = res.socket?.server as any;
  socketManager.initialize(httpServer);
  
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
