import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import React from "react";
import { CommandPalette, type Command } from "../components/layout/CommandPalette";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const mk = (id: string, label: string, hint?: string): Command => ({ id, label, hint, run: vi.fn() });
let commands: Command[];
beforeEach(() => {
  commands = [mk("go-inbox", "Go to Inbox"), mk("go-campaigns", "Go to Broadcasts", "send to many people"), mk("connect", "Connect a WhatsApp number")];
});
const open = (extra: Partial<React.ComponentProps<typeof CommandPalette>> = {}) => {
  const onClose = vi.fn();
  render(<CommandPalette open onClose={onClose} commands={commands} {...extra} />);
  return { onClose, box: screen.getByRole("textbox", { name: "Search commands" }) };
};

describe("the search and command bar", () => {
  it("filters the commands as you type, and runs the one you choose", () => {
    const { onClose, box } = open();
    fireEvent.change(box, { target: { value: "broad" } });
    expect(screen.queryByText("Go to Inbox")).toBeNull();
    fireEvent.click(screen.getByText("Go to Broadcasts"));
    expect(onClose).toHaveBeenCalled();
    expect(commands[1].run).toHaveBeenCalled();
  });

  it("finds chats and messages once typing pauses, and opens the one you pick", async () => {
    vi.useFakeTimers();
    const onFindChats = vi.fn().mockResolvedValue([{ id: "c1", title: "Asha Rao", subtitle: "+919810011122" }, { id: "c2", title: "83752348860497@lid", subtitle: "the villa on Friday" }]);
    const onOpenChat = vi.fn();
    const { box } = open({ onFindChats, onOpenChat });
    fireEvent.change(box, { target: { value: "v" } });
    fireEvent.change(box, { target: { value: "villa" } });
    expect(onFindChats).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(onFindChats).toHaveBeenCalledTimes(1);
    expect(onFindChats).toHaveBeenCalledWith("villa");
    expect(screen.getByText("Chats")).toBeDefined();
    expect(screen.getByText("Unknown contact"), "a hidden id is never shown").toBeDefined();
    expect(document.body.textContent).not.toContain("@lid");
    fireEvent.click(screen.getByText("Asha Rao"));
    expect(onOpenChat).toHaveBeenCalledWith("c1");
  });

  it("offers Ask Riwo for words, runs the command Riwo picks, and says so when nothing fits", async () => {
    const onAsk = vi.fn().mockResolvedValueOnce("go-campaigns").mockResolvedValueOnce(null);
    const { onClose, box } = open({ onAsk });
    expect(screen.queryByText(/Ask Riwo:/)).toBeNull();
    fireEvent.change(box, { target: { value: "message all my VIP customers" } });
    fireEvent.click(screen.getByText(/Ask Riwo: “message all my VIP customers”/));
    await waitFor(() => expect(commands[1].run).toHaveBeenCalled());
    expect(onAsk).toHaveBeenCalledWith("message all my VIP customers", commands);
    expect(onClose).toHaveBeenCalled();
    fireEvent.change(box, { target: { value: "what is the weather" } });
    fireEvent.click(screen.getByText(/Ask Riwo: “what is the weather”/));
    expect(await screen.findByText("Riwo couldn't match that to anything. Try other words.")).toBeDefined();
  });

  it("Enter on the Ask row works from the keyboard, and a failure is said in words", async () => {
    const onAsk = vi.fn().mockRejectedValue(new Error("Riwo is busy right now. Please try again in a moment."));
    const { box } = open({ onAsk });
    fireEvent.change(box, { target: { value: "zzzz nothing matches this" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(await screen.findByText(/Riwo is busy right now/)).toBeDefined();
  });

  it("without Riwo there is no Ask row, and the placeholder does not promise it", () => {
    const { box } = open();
    expect(box.getAttribute("placeholder")).toBe("Go to, or do anything…");
    fireEvent.change(box, { target: { value: "anything at all" } });
    expect(screen.queryByText(/Ask Riwo/)).toBeNull();
    expect(screen.getByText("Nothing matches “anything at all”.")).toBeDefined();
  });

  it("only mounts while open", () => {
    const { unmount } = render(<CommandPalette open={false} onClose={() => {}} commands={commands} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
  });
});
