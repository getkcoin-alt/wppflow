import { io, Socket } from "socket.io-client";
import {
  getSocketBackendUrl,
  getStoredToken,
  getStoredTenantId,
  refreshSession,
} from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = getSocketBackendUrl();
    socket = io(url, {
      transports: ["websocket", "polling"],
      auth: (callback) =>
        callback({ token: getStoredToken(), tenantId: getStoredTenantId() }),
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("⚡ Scriwo socket connected to backend:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Scriwo socket disconnected:", reason);
      if (reason === "io server disconnect")
        refreshSession()
          .then((session) => {
            if (session) socket?.connect();
          })
          .catch(() => disconnectSocket());
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Scriwo socket connection error:", err.message);
    });
  }
  return socket;
}

export function resetSocket(newTenantId?: string): Socket {
  disconnectSocket();
  if (newTenantId) {
    try {
      localStorage.setItem("wppflow_tenant_id", newTenantId);
    } catch {}
  }
  return getSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
