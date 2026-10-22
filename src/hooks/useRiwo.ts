import { useCallback, useRef, useState } from "react";
import type { AiStyle, AiSummary, AiTone } from "../services/api";
import { realAiClient, type AiClient } from "../services/ai";

// The assistant's state for one composer: what was asked, what came back, and what went wrong.
// Riwo writes a first draft for a person to read, change and send; nothing goes to a customer by itself.

export type Request =
  | { kind: "reply"; tone: AiTone }
  | { kind: "improve"; style: AiStyle }
  | { kind: "translate"; target: string }
  | { kind: "summary" };
export type Outcome =
  | { chatId: string; request: Request; text: string; summary?: AiSummary }
  | null;

export interface Riwo {
  busy: Request | null;
  outcome: Outcome;
  error: string;
  hasDraft: boolean;
  run: (request: Request) => void;
  retry: () => void;
  dismiss: () => void;
}

export function useRiwo({
  chatId,
  draft,
  client = realAiClient,
}: {
  chatId: string | null;
  draft: string;
  client?: AiClient;
}): Riwo {
  // Everything is remembered with the chat it belongs to, so switching chats hides it without any reset.
  const [busy, setBusy] = useState<{ chatId: string; request: Request } | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState<{ chatId: string; message: string; request: Request } | null>(null);
  const latest = useRef(0);
  const last = useRef<Request | null>(null);

  const run = useCallback(
    (request: Request) => {
      if (!chatId) return;
      const ticket = ++latest.current;
      last.current = request;
      setBusy({ chatId, request });
      setError(null);
      const call = (): Promise<{ text: string; summary?: AiSummary }> => {
        switch (request.kind) {
          case "reply":
            return client.suggestReply(chatId, request.tone);
          case "summary":
            return client.summarize(chatId).then((s) => ({ text: s.text, summary: s }));
          case "improve":
            return client.improve(draft, request.style);
          case "translate":
            return client.translate(draft, request.target);
        }
      };
      call()
        .then((result) => {
          if (ticket !== latest.current) return;
          setOutcome({ chatId, request, text: result.text, summary: result.summary });
        })
        .catch((e: Error) => {
          if (ticket !== latest.current) return;
          setError({ chatId, request, message: e?.message || "Riwo couldn't finish that. Please try again." });
        })
        .finally(() => {
          if (ticket === latest.current) setBusy(null);
        });
    },
    [chatId, client, draft],
  );

  return {
    busy: busy && busy.chatId === chatId ? busy.request : null,
    outcome: outcome && outcome.chatId === chatId ? outcome : null,
    error: error && error.chatId === chatId ? error.message : "",
    hasDraft: draft.trim().length > 0,
    run,
    retry: () => last.current && run(last.current),
    dismiss: () => {
      latest.current++;
      setBusy(null);
      setOutcome(null);
      setError(null);
    },
  };
}
