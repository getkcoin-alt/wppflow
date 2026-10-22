import { useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Mic,
  Play,
  Video as VideoIcon,
} from "lucide-react";
import type { ChatMessage } from "../../types";
import { fitWithin } from "../../utils/viewer";

// The most space a photo takes in the chat. Its own proportions are kept inside this box.
const PHOTO_BOX = { width: 320, height: 300 };

const LABEL: Record<string, string> = {
  image: "Photo",
  sticker: "Sticker",
  gif: "GIF",
  video: "Video",
  audio: "Voice message",
  document: "File",
};
const LOAD_VERB: Record<string, string> = {
  image: "Load photo",
  sticker: "Load sticker",
  gif: "Load GIF",
  video: "Load video",
  audio: "Load voice message",
  document: "Load file",
};
const PLACEHOLDER_TEXT = new Set([
  "📷 Photo",
  "🎥 Video",
  "🎥 GIF",
  "🎵 Voice message",
  "📄 Document",
  "Sticker",
]);

const Icon = ({ type }: { type: string }) =>
  type === "video" ? (
    <VideoIcon className="w-5 h-5" />
  ) : type === "audio" ? (
    <Mic className="w-5 h-5" />
  ) : type === "document" ? (
    <FileText className="w-5 h-5" />
  ) : (
    <ImageIcon className="w-5 h-5" />
  );

// One message's file: shown when it is saved, otherwise a card that loads it from WhatsApp on request.
export function MediaBlock({
  msg,
  onLoad,
  onOpen,
  onBroken,
}: {
  msg: ChatMessage;
  onLoad?: (messageId: string) => Promise<void>;
  /** Opens this photo or video in the viewer */
  onOpen: (messageId: string) => void;
  /** A photo's address stopped working: ask for fresh ones */
  onBroken?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const type = String(msg.type);
  const caption = msg.text && !PLACEHOLDER_TEXT.has(msg.text) ? msg.text : "";
  const load = async () => {
    if (!onLoad) return;
    setLoading(true);
    setError("");
    try {
      await onLoad(msg.id);
    } catch (e: any) {
      setError(e?.message || "Couldn't load this file.");
    } finally {
      setLoading(false);
    }
  };

  let body;
  if (msg.mediaUrl) {
    if (type === "sticker")
      body = (
        <button
          type="button"
          aria-label="View sticker"
          className="block max-w-[160px]"
          onClick={() => onOpen(msg.id)}
        >
          <img
            src={msg.mediaUrl}
            alt={msg.fileName || "Sticker"}
            loading="lazy"
            decoding="async"
            onError={onBroken}
            className="w-full rounded-xl object-contain"
          />
        </button>
      );
    else if (type === "image" || type === "gif") {
      // With the photo's size known, its space is reserved up front so the chat doesn't jump as photos arrive.
      const box =
        msg.width && msg.height
          ? fitWithin(msg.width, msg.height, PHOTO_BOX.width, PHOTO_BOX.height)
          : null;
      body = (
        <button
          type="button"
          aria-label={`View ${LABEL[type].toLowerCase()}`}
          className="relative group block overflow-hidden rounded-xl bg-black/10 dark:bg-white/5 max-w-full"
          style={box ? { width: box.width, aspectRatio: `${box.width} / ${box.height}` } : { maxWidth: PHOTO_BOX.width }}
          onClick={() => onOpen(msg.id)}
        >
          <img
            src={msg.thumbUrl || msg.mediaUrl}
            alt={msg.fileName || LABEL[type]}
            loading="lazy"
            decoding="async"
            onError={onBroken}
            width={box?.width}
            height={box?.height}
            className={`w-full rounded-xl ${box ? "h-full object-cover" : "max-h-72 object-cover"}`}
          />
          <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
          </span>
        </button>
      );
    } else if (type === "video")
      body = (
        <button
          type="button"
          aria-label="Play video"
          className="relative group block overflow-hidden rounded-xl bg-black w-[min(100%,320px)] aspect-video"
          onClick={() => onOpen(msg.id)}
        >
          {/* The first frame stands in for a poster. */}
          <video
            src={`${msg.mediaUrl}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            onError={onBroken}
            className="h-full w-full object-cover pointer-events-none"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/25 group-hover:bg-black/35 transition-colors">
            <span className="h-12 w-12 rounded-full bg-black/60 grid place-items-center">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </span>
          </span>
        </button>
      );
    else if (type === "audio")
      body = (
        <audio
          controls
          preload="none"
          src={msg.mediaUrl}
          aria-label="Voice message"
          className="max-w-full"
        />
      );
    else
      body = (
        <div className="flex items-center gap-3 rounded-2xl bg-black/10 dark:bg-white/5 p-3 min-w-[220px]">
          <span className="h-11 w-11 shrink-0 rounded-xl bg-surface grid place-items-center text-danger">
            <FileText className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium text-fg truncate">
              {msg.fileName || "File"}
            </div>
            <div className="text-[12px] text-fg-3 num">
              {msg.fileSize || ""}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium">
              {msg.openUrl && (
                <a
                  href={msg.openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-gold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
              )}
              <a
                href={msg.mediaUrl}
                download={msg.fileName || undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-gold hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        </div>
      );
  } else {
    const state = msg.mediaState;
    body = (
      <div className="flex items-center gap-3 rounded-2xl bg-black/10 dark:bg-white/5 p-3 min-w-[220px]">
        <span className="h-11 w-11 shrink-0 rounded-xl bg-surface grid place-items-center text-fg-2">
          <Icon type={type} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium text-fg truncate">
            {msg.fileName || LABEL[type] || "File"}
          </div>
          {state === "not_saved" && onLoad ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void load()}
              className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold hover:underline disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading
                ? "Loading…"
                : error
                  ? "Try again"
                  : LOAD_VERB[type] || "Load file"}
            </button>
          ) : (
            <div className="text-[12.5px] text-fg-3">
              {state === "storage_off"
                ? "Media storage isn't set up yet."
                : "This file isn't available."}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-1 text-[12.5px] text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {body}
      {caption && (
        <p className="leading-relaxed whitespace-pre-wrap pt-0.5">{caption}</p>
      )}
    </div>
  );
}
