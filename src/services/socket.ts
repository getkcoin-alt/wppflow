import { io, Socket } from 'socket.io-client';
import { getBaseBackendUrl, getStoredToken, getStoredTenantId } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const rawUrl = getBaseBackendUrl();
    const url = rawUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    socket = io(url, {
      transports: ['websocket', 'polling'],
      auth: { 
        token: getStoredToken(),
        tenantId: getStoredTenantId()
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('⚡ WppFlow socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WppFlow socket disconnected');
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
