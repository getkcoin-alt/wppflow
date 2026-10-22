import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import React, { useState } from "react";
import { RiwoButton, RiwoTray, TranslateMessage } from "../components/user/Riwo";
import { useRiwo } from "../hooks/useRiwo";
import type { AiClient } from "../services/ai";

const fakeClient = (over: Partial<AiClient> = {}) => {
  const client: AiClient = {
    suggestReply: vi.fn().mockResolvedValue({ text: "Yes, it's available. Shall we book a viewing?" }),
    summarize: vi.fn().mockResolvedValue({
      text: "Wants: a 2 bedroom\nStatus: viewing offered",
      sections: [
        { label: "Wants", text: "a 2 bedroom in Marina" },
        { label: "Status", text: "Sam offered a viewing" },
      ],
    }),
    improve: vi.fn().mockResolvedValue({ text: "Hello, how can I help you today?" }),
    translate: vi.fn().mockResolvedValue({ text: "مرحبا" }),
    ...over,
  };
  return client;
};

// The composer's pieces wired together the way the inbox does it.
function Harness({ client, chatId = "chat-1", startDraft = "", onSaveNote = vi.fn(), locked = false, canManage = false }: any) {
  const [draft, setDraft] = useState(startDraft);
  const riwo = useRiwo({ chatId, draft, client });
  return (
    <div>
      <input aria-label="draft" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <RiwoButton riwo={riwo} locked={locked} />
      <RiwoTray riwo={riwo} onUse={setDraft} onSaveNote={onSaveNote} canManage={canManage} />
    </div>
  );
}
const open = () => fireEvent.click(screen.getByRole("button", { name: "Ask Riwo" }));
const menu = () => within(screen.getByRole("dialog", { name: "Ask Riwo" }));

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("Riwo in the composer", () => {
  it("says up front that a person reads everything before it is sent", () => {
    render(<Harness client={fakeClient()} />);
    open();
    expect(screen.getByText(/You read and edit it before anything is sent/)).toBeDefined();
  });

  it("suggests a reply in the chosen tone, and puts it in the draft only when told to", async () => {
    const client = fakeClient();
    render(<Harness client={client} />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "Professional" }));
    expect(screen.getByRole("status").textContent).toContain("Riwo is writing a reply");
    expect(await screen.findByText("Yes, it's available. Shall we book a viewing?")).toBeDefined();
    expect(client.suggestReply).toHaveBeenCalledWith("chat-1", "professional");
    expect(screen.getByText(/Written by AI\. Check it before you send\./)).toBeDefined();
    expect(screen.getByText("Suggested reply · Professional")).toBeDefined();
    expect((screen.getByLabelText("draft") as HTMLInputElement).value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Use this" }));
    expect((screen.getByLabelText("draft") as HTMLInputElement).value).toBe("Yes, it's available. Shall we book a viewing?");
  });

  it("offers to replace a draft that is already there", async () => {
    render(<Harness client={fakeClient()} startDraft="hello" />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "Friendly" }));
    expect(await screen.findByRole("button", { name: "Replace my draft" })).toBeDefined();
  });

  it("improving and translating need a draft, and use exactly what is typed", async () => {
    const client = fakeClient();
    render(<Harness client={client} />);
    open();
    expect((menu().getByRole("button", { name: "Shorter" }) as HTMLButtonElement).disabled).toBe(true);
    expect((menu().getByRole("button", { name: /Translate/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(menu().getByText(/Type a message first/)).toBeDefined();
    cleanup();

    render(<Harness client={client} startDraft="hello how can i halp" />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "More formal" }));
    expect(await screen.findByText("Hello, how can I help you today?")).toBeDefined();
    expect(client.improve).toHaveBeenCalledWith("hello how can i halp", "formal");

    open();
    fireEvent.change(menu().getByLabelText("Translate your draft into"), { target: { value: "Arabic" } });
    fireEvent.click(menu().getByRole("button", { name: /Translate/ }));
    expect(await screen.findByText("مرحبا")).toBeDefined();
    expect(client.translate).toHaveBeenCalledWith("hello how can i halp", "Arabic");
    expect(screen.getByText("Translated into Arabic")).toBeDefined();
    expect(window.localStorage.getItem("scriwo_translate_to")).toBe("Arabic");
  });

  it("summarizes the chat into labelled lines that can be saved as a team note", async () => {
    const onSaveNote = vi.fn();
    render(<Harness client={fakeClient()} onSaveNote={onSaveNote} />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "Summarize this chat" }));
    expect(await screen.findByText("a 2 bedroom in Marina")).toBeDefined();
    expect(screen.getByText("Wants")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Save as team note/ }));
    expect(onSaveNote).toHaveBeenCalledWith("Wants: a 2 bedroom\nStatus: viewing offered");
    expect(screen.queryByRole("button", { name: "Use this" })).toBeNull();
  });

  it("explains a failure in the server's words and lets the person try again", async () => {
    const suggestReply = vi
      .fn()
      .mockRejectedValueOnce(new Error("Your team has used today's 300 AI requests."))
      .mockResolvedValue({ text: "Second time lucky." });
    render(<Harness client={fakeClient({ suggestReply })} />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "Friendly" }));
    expect((await screen.findByRole("alert")).textContent).toContain("used today's 300 AI requests");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Second time lucky.")).toBeDefined();
    expect(suggestReply).toHaveBeenCalledTimes(2);
  });

  it("owners and admins are told where to see why it failed; agents aren't", async () => {
    const fails = () => fakeClient({ suggestReply: vi.fn().mockRejectedValue(new Error("Riwo couldn't finish that. Please try again in a moment.")) });
    const agent = render(<Harness client={fails()} />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "Friendly" }));
    await screen.findByRole("alert");
    expect(screen.queryByText(/Run a test/)).toBeNull();
    agent.unmount();
    render(<Harness client={fails()} canManage />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "Friendly" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/open Team, then System, and press .Run a test. under Riwo/);
  });

  it("an answer for one chat never shows in another, and a dismissed answer never comes back", async () => {
    let finish: (v: { text: string }) => void = () => {};
    const slow = new Promise<{ text: string }>((resolve) => (finish = resolve));
    const client = fakeClient({ suggestReply: vi.fn().mockReturnValue(slow) });
    const { rerender } = render(<Harness client={client} chatId="chat-1" />);
    open();
    fireEvent.click(menu().getByRole("button", { name: "Friendly" }));
    rerender(<Harness client={client} chatId="chat-2" />);
    expect(screen.queryByRole("status")).toBeNull();
    finish({ text: "Answer for chat one" });
    await waitFor(() => expect(client.suggestReply).toHaveBeenCalled());
    expect(screen.queryByText("Answer for chat one")).toBeNull();
    rerender(<Harness client={client} chatId="chat-1" />);
    expect(await screen.findByText("Answer for chat one")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Answer for chat one")).toBeNull();
  });

  it("closes with Escape", () => {
    render(<Harness client={fakeClient()} />);
    open();
    expect(screen.getByRole("dialog", { name: "Ask Riwo" })).toBeDefined();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a plan without Riwo sees why it is missing, not a broken button", () => {
    render(<Harness client={fakeClient()} locked />);
    expect(screen.queryByRole("button", { name: "Ask Riwo" })).toBeNull();
    expect(screen.getByText("Riwo · Growth plan").closest("[title]")?.getAttribute("title") ?? "").toMatch(/Growth plan and above/);
  });
});

describe("translating a customer's message", () => {
  it("translates into the remembered language and can hide the result", async () => {
    window.localStorage.setItem("scriwo_translate_to", "Hindi");
    const client = fakeClient({ translate: vi.fn().mockResolvedValue({ text: "Is the flat available?" }) });
    render(<TranslateMessage text="क्या फ्लैट उपलब्ध है?" client={client} />);
    expect((screen.getByLabelText("Translate into") as HTMLSelectElement).value).toBe("Hindi");
    fireEvent.change(screen.getByLabelText("Translate into"), { target: { value: "English" } });
    fireEvent.click(screen.getByRole("button", { name: /Translate to/ }));
    expect(await screen.findByText("Is the flat available?")).toBeDefined();
    expect(client.translate).toHaveBeenCalledWith("क्या फ्लैट उपलब्ध है?", "English");
    expect(screen.getByText(/Translated into English by Riwo/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByText("Is the flat available?")).toBeNull();
  });

  it("shows why a translation failed", async () => {
    const client = fakeClient({ translate: vi.fn().mockRejectedValue(new Error("Riwo is busy right now.")) });
    render(<TranslateMessage text="مرحبا" client={client} />);
    fireEvent.click(screen.getByRole("button", { name: /Translate to/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Riwo is busy right now.");
  });
});
