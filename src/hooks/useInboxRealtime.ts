import { useEffect, useRef, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";
import { fetchConversationChanges } from "../services/api";
import {
  applyConversationChanges,
  patchMessageStatus,
  upsertConversation,
  upsertMessage,
} from "../services/realtimeCache";

export type SyncState = { phase: string; done: number; total: number } | null;

// Push for speed, pull for certainty:
//  - events carry their data and are applied to the caches directly (no refetching);
//  - after any gap (reconnect, sleeping laptop, a deploy) one small "what changed since"
//    request repairs whatever was missed, with a slow safety poll as the last net.
export function useInboxRealtime({
  enabled,
  qc,
  tenant,
  selected,
}: {
  enabled: boolean;
  qc: QueryClient;
  tenant: string | null;
  selected: string | null;
}) {
  const [sync, setSync] = useState<SyncState>(null);
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    let cursor = new Date(Date.now() - 30000).toISOString();
    let inflight = false;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;

    const invalidate = (...keys: string[]) =>
      keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k, tenant] }));

    const catchUp = async () => {
      if (inflight) return;
      inflight = true;
      try {
        const res = await fetchConversationChanges(cursor);
        if (res.hasMore) {
          invalidate("conversations"); // too much changed: reload the list once
        } else {
          const ids = applyConversationChanges(qc, tenant, res.conversations);
          if (selectedRef.current && ids.has(selectedRef.current))
            void qc.invalidateQueries({
              queryKey: ["messages", tenant, selectedRef.current],
            });
        }
        cursor = res.serverTime;
      } catch {
        // offline or expired session: the next trigger tries again
      } finally {
        inflight = false;
      }
    };

    const onMessage = (p: any) => {
      if (p?.conversationId && p.message)
        upsertMessage(qc, tenant, p.conversationId, p.message);
      if (p?.conversation) upsertConversation(qc, tenant, p.conversation);
      else invalidate("conversations");
    };
    const onConversation = (p: any) => {
      if (p?.conversation) upsertConversation(qc, tenant, p.conversation);
      else invalidate("conversations");
    };
    const onReceipt = (p: any) => {
      if (p?.conversationId)
        patchMessageStatus(qc, tenant, p.conversationId, p);
      else invalidate("messages");
    };
    const onSession = () => invalidate("sessions");
    const onSynced = () => void catchUp();
    const onProgress = (p: any) => {
      clearTimeout(clearTimer);
      if (p.phase === "done" || p.phase === "failed") {
        setSync(
          p.phase === "failed" ? { phase: "failed", done: 0, total: 0 } : null,
        );
        void catchUp();
        if (p.phase === "failed")
          clearTimer = setTimeout(() => setSync(null), 6000);
        return;
      }
      setSync({ phase: p.phase, done: p.done || 0, total: p.total || 0 });
    };
    const onContacts = () => {
      invalidate("contacts");
      invalidate("contact");
    };
    const onCampaign = () => invalidate("campaigns");
    const onWake = () => {
      if (document.visibilityState === "visible") void catchUp();
    };

    const handlers: Record<string, (p: any) => void> = {
      connect: () => void catchUp(),
      "message:received": onMessage,
      "message:created": onMessage,
      "message:updated": onReceipt,
      "message:ack": onReceipt,
      "conversation:updated": onConversation,
      "conversation:read": onConversation,
      "conversations:synced": onSynced,
      "inbox:synced": onSynced,
      "sync:progress": onProgress,
      "session:status": onSession,
      "session:qr": onSession,
      "contact:changed": onContacts,
      "campaign:status": onCampaign,
      "campaign:progress": onCampaign,
    };
    for (const [event, fn] of Object.entries(handlers)) socket.on(event, fn);
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);
    const poll = setInterval(onWake, 60000);

    return () => {
      for (const [event, fn] of Object.entries(handlers)) socket.off(event, fn);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("online", onWake);
      clearInterval(poll);
      clearTimeout(clearTimer);
    };
  }, [enabled, qc, tenant]);

  return sync;
}
