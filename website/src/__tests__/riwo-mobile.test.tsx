// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RewoVisitorBot } from "@/components/RewoVisitorBot";

let host: HTMLDivElement;
let root: Root;
let viewport: EventTarget & { width: number; height: number; offsetTop: number; offsetLeft: number };
let scrollMessages: ReturnType<typeof vi.fn>;
let scrollPage: ReturnType<typeof vi.spyOn>;
let scrollIntoView: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  viewport = Object.assign(new EventTarget(), { width: 320, height: 568, offsetTop: 0, offsetLeft: 0 });
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ matches: query.includes("max-width") ? viewport.width < 640 : viewport.width >= 640 })));
  scrollMessages = vi.fn();
  scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollMessages });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  scrollPage = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  document.body.style.overflow = "auto";
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<RewoVisitorBot />));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.style.overflow = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function openChat() {
  const button = host.querySelector<HTMLButtonElement>('[aria-label="Open Riwo AI Concierge"]')!;
  act(() => {
    button.focus();
    button.click();
  });
}

describe("Riwo on a phone", () => {
  it("opens within the visible viewport without focusing the phone keyboard or scrolling the page", () => {
    openChat();
    const frame = host.querySelector<HTMLElement>(".rewo-viewport")!;
    expect(frame.style.width).toBe("320px");
    expect(frame.style.height).toBe("568px");
    expect(document.activeElement).toBe(host.querySelector('[role="dialog"]'));
    expect(document.body.style.overflow).toBe("hidden");
    expect(scrollMessages).toHaveBeenCalled();
    expect(scrollPage).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("follows keyboard resize, browser panning and device rotation", () => {
    openChat();
    const frame = host.querySelector<HTMLElement>(".rewo-viewport")!;
    act(() => {
      Object.assign(viewport, { height: 260, offsetTop: 18 });
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(frame.style.height).toBe("260px");
    expect(frame.style.top).toBe("18px");
    expect(frame.dataset.compact).toBe("true");
    act(() => {
      Object.assign(viewport, { width: 844, height: 390, offsetTop: 0, offsetLeft: 24 });
      viewport.dispatchEvent(new Event("scroll"));
    });
    expect(frame.style.width).toBe("844px");
    expect(frame.style.left).toBe("24px");
    act(() => {
      Object.assign(viewport, { width: 390, height: 844, offsetLeft: 0 });
      window.dispatchEvent(new Event("resize"));
    });
    expect(frame.style.height).toBe("844px");
    expect(frame.dataset.compact).toBeUndefined();
  });

  it("restores background scrolling and the launcher when closed", () => {
    openChat();
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Close"]')!.click());
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
    expect(host.querySelector('[aria-label="Open Riwo AI Concierge"]')).not.toBeNull();
    expect(document.activeElement).toBe(host.querySelector('[aria-label="Open Riwo AI Concierge"]'));
  });
});
