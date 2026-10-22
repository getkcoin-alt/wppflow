import type { ChatMessage } from "../types";

/** One photo or video in the viewer. */
export interface GalleryItem {
  id: string;
  kind: "image" | "video";
  /** Full-size file, opened in the browser */
  src: string;
  /** Small version for the strip and as a stand-in while the full photo arrives */
  thumb?: string;
  /** Saves the file */
  download: string;
  name: string;
  from: string;
  at: string;
  caption: string;
  width?: number;
  height?: number;
}

const PLACEHOLDERS = new Set(["📷 Photo", "🎥 Video", "🎥 GIF"]);
const KINDS: Record<string, GalleryItem["kind"]> = {
  image: "image",
  gif: "image",
  video: "video",
};

const whenOf = (m: ChatMessage) => {
  const date = m.timestampEpoch
    ? new Date(m.timestampEpoch * 1000)
    : new Date(m.timestamp);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

/** Every saved photo and video in the chat, oldest first. Stickers, files and unsaved media are left out. */
export function galleryItems(
  messages: ChatMessage[],
  customerName: string,
): GalleryItem[] {
  const items: GalleryItem[] = [];
  for (const m of messages) {
    const kind = KINDS[String(m.type)];
    const src = m.openUrl || m.mediaUrl;
    if (!kind || !src || !m.mediaUrl) continue;
    items.push({
      id: m.id,
      kind,
      src,
      thumb: m.thumbUrl,
      download: m.mediaUrl,
      name: m.fileName || (kind === "video" ? "Video" : "Photo"),
      from: m.sender === "customer" ? customerName : m.agentName || "You",
      at: whenOf(m),
      caption: m.text && !PLACEHOLDERS.has(m.text) ? m.text : "",
      width: m.width,
      height: m.height,
    });
  }
  return items;
}

/** The size a photo takes in the chat: its own proportions, within a box. */
export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export interface Zoom {
  scale: number;
  x: number;
  y: number;
}
export const MIN_SCALE = 1;
export const MAX_SCALE = 6;
export const NO_ZOOM: Zoom = { scale: 1, x: 0, y: 0 };

const between = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/**
 * Keeps a zoomed photo from being dragged off the screen. `photo` is its size at scale 1 and `stage`
 * the space it is shown in; a photo smaller than the stage at this scale stays centred.
 */
export function clampZoom(
  zoom: Zoom,
  photo: { width: number; height: number },
  stage: { width: number; height: number },
): Zoom {
  const scale = between(zoom.scale, MIN_SCALE, MAX_SCALE);
  const slackX = Math.max(0, (photo.width * scale - stage.width) / 2);
  const slackY = Math.max(0, (photo.height * scale - stage.height) / 2);
  return {
    scale,
    x: scale === 1 ? 0 : between(zoom.x, -slackX, slackX),
    y: scale === 1 ? 0 : between(zoom.y, -slackY, slackY),
  };
}

/**
 * Zooms by `factor` so that the spot under `point` (measured from the stage's centre) stays under the
 * finger or cursor.
 */
export function zoomAt(
  zoom: Zoom,
  factor: number,
  point: { x: number; y: number },
  photo: { width: number; height: number },
  stage: { width: number; height: number },
): Zoom {
  const scale = between(zoom.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / zoom.scale;
  return clampZoom(
    {
      scale,
      x: point.x - (point.x - zoom.x) * ratio,
      y: point.y - (point.y - zoom.y) * ratio,
    },
    photo,
    stage,
  );
}

export type SwipeIntent = "next" | "previous" | "close" | null;
const SWIPE_DISTANCE = 56;
const CLOSE_DISTANCE = 96;

/** What a finished one-finger drag means. A zoomed photo pans instead, so it never navigates. */
export function swipeIntent(dx: number, dy: number, scale: number): SwipeIntent {
  if (scale > 1) return null;
  if (Math.abs(dy) > CLOSE_DISTANCE && Math.abs(dy) > Math.abs(dx) * 1.5)
    return "close";
  if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.2)
    return dx < 0 ? "next" : "previous";
  return null;
}
