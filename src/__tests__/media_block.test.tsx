import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MediaBlock } from "../components/user/MediaBlock";
import type { ChatMessage } from "../types";

const msg = (over: Partial<ChatMessage>): ChatMessage =>
  ({
    id: "m1",
    chatId: "c1",
    sender: "customer",
    text: "",
    type: "image",
    timestamp: new Date().toISOString(),
    status: "delivered",
    ...over,
  }) as ChatMessage;

describe("files in a chat", () => {
  it("shows a saved photo and opens it larger from its viewable address", () => {
    const zoom = vi.fn();
    render(
      <MediaBlock
        msg={msg({
          mediaUrl: "https://s/photo?dl",
          openUrl: "https://s/photo?inline",
          mediaState: "ready",
          text: "📷 Photo",
        })}
        onZoom={zoom}
      />,
    );
    fireEvent.click(screen.getByLabelText("View photo"));
    expect(zoom).toHaveBeenCalledWith("https://s/photo?inline");
    expect(screen.queryByText("📷 Photo")).toBeNull();
  });

  it("offers both Open and Download for a saved PDF, and keeps its caption", () => {
    render(
      <MediaBlock
        msg={msg({
          type: "document",
          mediaUrl: "https://s/q?dl",
          openUrl: "https://s/q?inline",
          fileName: "Quote 12.pdf",
          fileSize: "240 KB",
          text: "Please review",
          mediaState: "ready",
        })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Quote 12.pdf")).toBeDefined();
    expect(screen.getByText("Open").closest("a")?.getAttribute("href")).toBe(
      "https://s/q?inline",
    );
    expect(
      screen.getByText("Download").closest("a")?.getAttribute("href"),
    ).toBe("https://s/q?dl");
    expect(screen.getByText("Please review")).toBeDefined();
  });

  it("only offers Download for a file that cannot be shown in the browser", () => {
    render(
      <MediaBlock
        msg={msg({
          type: "document",
          mediaUrl: "https://s/x?dl",
          fileName: "Prices.xlsx",
          mediaState: "ready",
        })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.queryByText("Open")).toBeNull();
    expect(screen.getByText("Download")).toBeDefined();
  });

  it("an unsaved photo can be loaded from WhatsApp, and says why when it cannot", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          "WhatsApp no longer has this file. Files expire on WhatsApp after a while.",
        ),
      )
      .mockResolvedValue(undefined);
    render(
      <MediaBlock
        msg={msg({ mediaState: "not_saved", text: "📷 Photo" })}
        onLoad={load}
        onZoom={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Load photo"));
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText(/no longer has this file/)).toBeDefined();
    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(load).toHaveBeenCalledWith("m1");
  });

  it("uses the right wording for each kind of file", () => {
    const { rerender } = render(
      <MediaBlock
        msg={msg({ type: "video", mediaState: "not_saved" })}
        onLoad={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Load video")).toBeDefined();
    rerender(
      <MediaBlock
        msg={msg({ type: "audio", mediaState: "not_saved" })}
        onLoad={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Load voice message")).toBeDefined();
    rerender(
      <MediaBlock
        msg={msg({ type: "document", mediaState: "not_saved", fileName: "" })}
        onLoad={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Load file")).toBeDefined();
  });

  it("explains when storage is off or the file cannot be loaded", () => {
    const { rerender } = render(
      <MediaBlock
        msg={msg({ mediaState: "storage_off" })}
        onLoad={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Media storage isn't set up yet.")).toBeDefined();
    expect(screen.queryByText("Load photo")).toBeNull();
    rerender(
      <MediaBlock
        msg={msg({ mediaState: "unavailable" })}
        onLoad={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("This file isn't available.")).toBeDefined();
  });
});
