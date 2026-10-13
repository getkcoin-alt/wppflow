import { describe, it, expect } from "vitest";
import { reconcileMessages } from "../utils/messages";
import type { ChatMessage } from "../types";
const msg = (overrides: Partial<ChatMessage>): ChatMessage => ({
  id: "m",
  chatId: "thread",
  sender: "agent",
  text: "Hi",
  type: "text",
  timestamp: "2026-01-01",
  status: "sending",
  ack: 0,
  ...overrides,
});
describe("Production message reconciliation", () => {
  it("replaces optimistic IDs by idempotency key", () => {
    const result = reconcileMessages(
      [msg({ id: "optimistic", idempotencyKey: "key" })],
      [msg({ id: "saved", idempotencyKey: "key", ack: 1, status: "sent" })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("saved");
  });
  it("collapses optimistic plus early provider echo after confirmation", () => {
    const result = reconcileMessages(
      [
        msg({ id: "optimistic", idempotencyKey: "key" }),
        msg({
          id: "echo",
          providerMessageId: "provider",
          ack: 3,
          status: "read",
        }),
      ],
      [
        msg({
          id: "saved",
          providerMessageId: "provider",
          idempotencyKey: "key",
          ack: 1,
          status: "sent",
        }),
      ],
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "saved", ack: 3, status: "read" });
  });
  it("rejects stale ACK regressions and sorts tied epochs deterministically", () => {
    const result = reconcileMessages(
      [msg({ id: "z", ack: 3, status: "read" })],
      [msg({ id: "z", ack: 1, status: "sent" }), msg({ id: "a" })],
    );
    expect(result.map((m) => m.id)).toEqual(["a", "z"]);
    expect(result[1].status).toBe("read");
  });
});
