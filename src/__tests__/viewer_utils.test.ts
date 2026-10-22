import { describe, it, expect } from "vitest";
import {
  NO_ZOOM,
  clampZoom,
  fitWithin,
  galleryItems,
  swipeIntent,
  zoomAt,
} from "../utils/viewer";
import type { ChatMessage } from "../types";

const msg = (over: Partial<ChatMessage>): ChatMessage =>
  ({
    id: "m",
    chatId: "c",
    sender: "customer",
    text: "",
    type: "image",
    timestamp: "2026-10-22T10:00:00Z",
    status: "delivered",
    mediaState: "ready",
    mediaUrl: "https://s/dl",
    ...over,
  }) as ChatMessage;

describe("the photos and videos a chat can step through", () => {
  const messages = [
    msg({ id: "a", openUrl: "https://s/a?inline", thumbUrl: "https://s/a.preview", width: 800, height: 600, text: "📷 Photo" }),
    msg({ id: "b", type: "document", fileName: "Quote.pdf" }),
    msg({ id: "c", type: "video", text: "Site walk-through", sender: "agent", agentName: "Sam" }),
    msg({ id: "d", type: "sticker" }),
    msg({ id: "e", mediaState: "not_saved", mediaUrl: undefined }),
    msg({ id: "f", type: "gif" }),
    msg({ id: "g", type: "audio" }),
  ];
  const items = galleryItems(messages, "Priya");

  it("keeps saved photos, GIFs and videos in order, and nothing else", () => {
    expect(items.map((i) => i.id)).toEqual(["a", "c", "f"]);
    expect(items.map((i) => i.kind)).toEqual(["image", "video", "image"]);
  });

  it("opens the in-browser address and downloads from the other", () => {
    expect(items[0].src).toBe("https://s/a?inline");
    expect(items[0].download).toBe("https://s/dl");
    expect(items[1].src).toBe("https://s/dl"); // no separate address: falls back to the download one
    expect(items[0].thumb).toBe("https://s/a.preview");
    expect([items[0].width, items[0].height]).toEqual([800, 600]);
  });

  it("names who sent it and keeps a real caption but not WhatsApp's placeholder", () => {
    expect(items[0].from).toBe("Priya");
    expect(items[1].from).toBe("Sam");
    expect(items[0].caption).toBe("");
    expect(items[1].caption).toBe("Site walk-through");
  });
});

describe("photo size in the chat", () => {
  it("keeps proportions inside the box and never enlarges", () => {
    expect(fitWithin(4000, 3000, 320, 300)).toEqual({ width: 320, height: 240 });
    expect(fitWithin(1000, 3000, 320, 300)).toEqual({ width: 100, height: 300 });
    expect(fitWithin(100, 50, 320, 300)).toEqual({ width: 100, height: 50 });
  });
});

describe("zoom", () => {
  const photo = { width: 800, height: 600 };
  const stage = { width: 800, height: 600 };

  it("stays between 1x and 6x, and a photo at 1x is always centred", () => {
    expect(clampZoom({ scale: 9, x: 0, y: 0 }, photo, stage).scale).toBe(6);
    expect(clampZoom({ scale: 0.2, x: 50, y: 50 }, photo, stage)).toEqual(NO_ZOOM);
  });

  it("can be dragged only as far as the photo's edge", () => {
    // At 2x the photo is 1600 x 1200 in an 800 x 600 stage: 400 and 300 of slack each way.
    expect(clampZoom({ scale: 2, x: 999, y: -999 }, photo, stage)).toEqual({ scale: 2, x: 400, y: -300 });
  });

  it("a photo narrower than the stage doesn't slide sideways until it outgrows it", () => {
    const narrow = { width: 300, height: 600 };
    expect(clampZoom({ scale: 2, x: 200, y: 0 }, narrow, stage).x).toBe(0);
    expect(clampZoom({ scale: 4, x: 900, y: 0 }, narrow, stage).x).toBe(200);
  });

  it("zooms around the point under the finger, keeping it where it was", () => {
    const point = { x: 200, y: 100 };
    const next = zoomAt(NO_ZOOM, 2, point, photo, stage);
    expect(next).toEqual({ scale: 2, x: -200, y: -100 });
    // The spot of the photo under the finger is the same before and after.
    const before = (point.x - NO_ZOOM.x) / NO_ZOOM.scale;
    const after = (point.x - next.x) / next.scale;
    expect(after).toBe(before);
  });

  it("zooming back out returns to the start", () => {
    const zoomed = zoomAt(NO_ZOOM, 3, { x: 150, y: -80 }, photo, stage);
    expect(zoomAt(zoomed, 1 / 3, { x: 150, y: -80 }, photo, stage)).toEqual(NO_ZOOM);
  });
});

describe("swiping", () => {
  it("a sideways swipe moves to the next or previous photo", () => {
    expect(swipeIntent(-120, 10, 1)).toBe("next");
    expect(swipeIntent(120, -10, 1)).toBe("previous");
  });
  it("a long swipe down closes the viewer", () => {
    expect(swipeIntent(10, 180, 1)).toBe("close");
    expect(swipeIntent(10, -180, 1)).toBe("close");
  });
  it("short or diagonal movements do nothing", () => {
    expect(swipeIntent(30, 5, 1)).toBeNull();
    expect(swipeIntent(100, 100, 1)).toBeNull();
  });
  it("a zoomed photo pans instead of navigating", () => {
    expect(swipeIntent(-200, 0, 2)).toBeNull();
    expect(swipeIntent(0, 300, 2)).toBeNull();
  });
});
