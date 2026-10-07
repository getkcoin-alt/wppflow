import { io, Socket } from 'socket.io-client';
import { getBaseBackendUrl, getStoredToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = (import.meta as any).env?.VITE_BACKEND_URL || 'https://srv1628639.hstgr.cloud';
    socket = io(url, {
      transports: ['websocket', 'polling'],
      auth: { token: getStoredToken() },
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
