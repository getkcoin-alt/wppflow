import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Play,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  NO_ZOOM,
  clampZoom,
  swipeIntent,
  zoomAt,
  type GalleryItem,
  type Zoom,
} from "../../utils/viewer";

interface Props {
  items: GalleryItem[];
  currentId: string;
  onChange: (id: string) => void;
  onClose: () => void;
  /** Earlier photos exist that are not loaded yet */
  hasOlder?: boolean;
  onLoadOlder?: () => void;
  /** A photo's address stopped working: ask for fresh ones */
  onExpired?: () => void;
}

const ZOOM_STEP = 1.5;
const DOUBLE_TAP_MS = 320;
const TAP_SLOP = 8;
const button =
  "h-10 w-10 shrink-0 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-35 disabled:hover:bg-white/10 transition-colors";

// Full-screen viewer for the photos and videos of one chat: arrow keys or swipes to move, pinch, wheel
// or double-tap to zoom, Esc to close.
export function MediaViewer({
  items,
  currentId,
  onChange,
  onClose,
  hasOlder = false,
  onLoadOlder,
  onExpired,
}: Props) {
  const index = items.findIndex((i) => i.id === currentId);
  const item = items[index];
  const [zoom, setZoom] = useState<Zoom>(NO_ZOOM);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [touching, setTouching] = useState(false);
  const [shown, setShown] = useState({ id: "", src: "" });
  const [failedSrc, setFailedSrc] = useState("");
  // The number of photos loaded when earlier ones were last requested: while it still matches, they are on their way.
  const [askedOlderAt, setAskedOlderAt] = useState(-1);
  const [seenId, setSeenId] = useState(currentId);
  // Each photo starts unzoomed and centred.
  if (seenId !== currentId) {
    setSeenId(currentId);
    setZoom(NO_ZOOM);
    setDrag({ x: 0, y: 0 });
  }

  const dialog = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    x: number;
    y: number;
    zoom: Zoom;
    moved: boolean;
    onPhoto: boolean;
    pinch?: { distance: number; mid: { x: number; y: number } };
  } | null>(null);
  const lastTap = useRef({ at: 0, x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  const failed = Boolean(item) && failedSrc === item?.src;
  const loadingOlder = hasOlder && askedOlderAt === items.length;

  // Sizes the zoom maths needs: the space available, and how big the photo really is drawn in it.
  const measure = useCallback(() => {
    const area = stage.current?.getBoundingClientRect();
    const el = photo.current;
    const stageSize = { width: area?.width || 0, height: area?.height || 0 };
    if (!el?.naturalWidth || !stageSize.width) return { stage: stageSize, photo: stageSize };
    const ratio = el.naturalWidth / el.naturalHeight;
    const width = Math.min(stageSize.width, stageSize.height * ratio);
    return { stage: stageSize, photo: { width, height: width / ratio } };
  }, []);
  const centreOf = (clientX: number, clientY: number) => {
    const area = stage.current?.getBoundingClientRect();
    return {
      x: clientX - (area ? area.left + area.width / 2 : 0),
      y: clientY - (area ? area.top + area.height / 2 : 0),
    };
  };
  const zoomBy = useCallback(
    (factor: number, point = { x: 0, y: 0 }) => {
      const sizes = measure();
      setZoom((z) => zoomAt(z, factor, point, sizes.photo, sizes.stage));
    },
    [measure],
  );
  // Whether a point on the screen is on the photo itself rather than the dark space around it.
  const insidePhoto = (clientX: number, clientY: number) => {
    const sizes = measure();
    const at = centreOf(clientX, clientY);
    const z = zoomRef.current;
    return (
      Math.abs(at.x - z.x) <= (sizes.photo.width * z.scale) / 2 &&
      Math.abs(at.y - z.y) <= (sizes.photo.height * z.scale) / 2
    );
  };
  const toggleZoom = (point: { x: number; y: number }) =>
    zoomRef.current.scale > 1 ? setZoom(NO_ZOOM) : zoomBy(2.5, point);

  const go = useCallback(
    (step: number) => {
      const target = items[index + step];
      if (target) onChange(target.id);
      else if (step < 0 && hasOlder && onLoadOlder) {
        setAskedOlderAt(items.length);
        onLoadOlder();
      }
    },
    [items, index, hasOlder, onLoadOlder, onChange],
  );

  // The full photo is fetched behind its small version, and takes over when it arrives.
  useEffect(() => {
    if (!item || item.kind === "video" || !item.thumb) return;
    let current = true;
    const full = new Image();
    full.onload = () => current && setShown({ id: item.id, src: item.src });
    full.onerror = () => current && setFailedSrc(item.src);
    full.src = item.src;
    return () => {
      current = false;
    };
  }, [item?.id, item?.src, item?.thumb, item?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Neighbouring photos are fetched ahead so moving between them is instant.
  useEffect(() => {
    for (const step of [-1, 1]) {
      const next = items[index + step];
      if (next?.kind === "image") new Image().src = next.src;
    }
  }, [items, index]);

  // Near the oldest loaded photo, bring in earlier ones before the person gets there.
  useEffect(() => {
    if (hasOlder && onLoadOlder && index >= 0 && index <= 1 && askedOlderAt !== items.length) {
      setAskedOlderAt(items.length);
      onLoadOlder();
    }
  }, [index, items.length, hasOlder, onLoadOlder, askedOlderAt]);
  // If the request brings nothing, stop saying it is loading.
  useEffect(() => {
    if (!loadingOlder) return;
    const timer = setTimeout(() => setAskedOlderAt(-1), 6000);
    return () => clearTimeout(timer);
  }, [loadingOlder]);

  useEffect(() => {
    if (!item) onClose();
  }, [item, onClose]);

  // Keyboard, focus and page scrolling.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        const focusable = [
          ...(dialog.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a[href], video[controls]",
          ) || []),
        ];
        if (!focusable.length) return;
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && typing !== "VIDEO") {
        e.preventDefault();
        go(e.key === "ArrowLeft" ? -1 : 1);
      } else if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / ZOOM_STEP);
      else if (e.key === "0") setZoom(NO_ZOOM);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [go, onClose, zoomBy]);

  // The wheel must be handled natively: React attaches it as passive, which forbids preventDefault.
  useEffect(() => {
    const el = stage.current;
    if (!el || item?.kind !== "image") return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), centreOf(e.clientX, e.clientY));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [item?.kind, item?.id, zoomBy]);

  // A resized window changes how far a zoomed photo may be dragged.
  useEffect(() => {
    const onResize = () => {
      const sizes = measure();
      setZoom((z) => clampZoom(z, sizes.photo, sizes.stage));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  // Keep the strip's current photo in view.
  useEffect(() => {
    const active = strip.current?.querySelector<HTMLElement>('[aria-current="true"]');
    active?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [index]);

  if (!item) return null;
  const isImage = item.kind === "image";
  // Until the effect has run for a newly chosen photo, show its own small version, never the last photo.
  const displayed = shown.id === item.id ? shown.src : item.thumb || item.src;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isImage || (e.target as HTMLElement).closest("button, a")) return;
    stage.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setTouching(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        x: e.clientX,
        y: e.clientY,
        zoom: zoomRef.current,
        moved: true,
        onPhoto: true,
        pinch: {
          distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          mid: centreOf((a.x + b.x) / 2, (a.y + b.y) / 2),
        },
      };
    } else {
      gesture.current = {
        x: e.clientX,
        y: e.clientY,
        zoom: zoomRef.current,
        moved: false,
        onPhoto: insidePhoto(e.clientX, e.clientY),
      };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const sizes = measure();
    if (g.pinch && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      setZoom(zoomAt(g.zoom, distance / g.pinch.distance, g.pinch.mid, sizes.photo, sizes.stage));
      return;
    }
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (Math.hypot(dx, dy) > TAP_SLOP) g.moved = true;
    if (g.zoom.scale > 1)
      setZoom(clampZoom({ scale: g.zoom.scale, x: g.zoom.x + dx, y: g.zoom.y + dy }, sizes.photo, sizes.stage));
    else if (g.moved) setDrag({ x: dx, y: dy });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (!g) return;
    if (pointers.current.size > 0) {
      // One finger of a pinch lifted: carry on from the remaining one without a jump.
      const [rest] = [...pointers.current.values()];
      gesture.current = { x: rest.x, y: rest.y, zoom: zoomRef.current, moved: true, onPhoto: true };
      return;
    }
    gesture.current = null;
    setTouching(false);
    setDrag({ x: 0, y: 0 });
    if (e.type === "pointercancel") return;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (!g.moved) {
      if (!g.onPhoto) return onClose();
      if (e.pointerType !== "mouse") {
        const now = Date.now(),
          last = lastTap.current;
        if (now - last.at < DOUBLE_TAP_MS && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 40) {
          lastTap.current = { at: 0, x: 0, y: 0 };
          toggleZoom(centreOf(e.clientX, e.clientY));
        } else lastTap.current = { at: now, x: e.clientX, y: e.clientY };
      }
      return;
    }
    const intent = swipeIntent(dx, dy, g.zoom.scale);
    if (intent === "close") onClose();
    else if (intent === "next") go(1);
    else if (intent === "previous") go(-1);
  };

  const clamped = zoom;
  const fade = Math.max(0.5, 1 - Math.abs(drag.y) / 500);
  const position = `${index + 1} / ${items.length}${hasOlder ? "+" : ""}`;

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col bg-black text-white outline-none animate-fade select-none"
      style={{ opacity: fade }}
    >
      <header className="relative z-10 flex items-center gap-3 px-3 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-black/70 to-transparent">
        <button type="button" aria-label="Close viewer" onClick={onClose} className={button}>
          <X className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-medium truncate">{item.from}</div>
          <div className="text-[12.5px] text-white/65 truncate num">
            {item.at}
            {item.at ? " · " : ""}
            <span aria-live="polite">{position}</span>
            {loadingOlder && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading earlier
              </span>
            )}
          </div>
        </div>
        {isImage && (
          <>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={clamped.scale <= 1}
              onClick={() => zoomBy(1 / ZOOM_STEP)}
              className={`${button} hidden sm:grid`}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomBy(ZOOM_STEP)}
              className={`${button} hidden sm:grid`}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            {clamped.scale > 1 && (
              <button type="button" aria-label="Reset zoom" onClick={() => setZoom(NO_ZOOM)} className={button}>
                <RotateCcw className="w-[18px] h-[18px]" />
              </button>
            )}
          </>
        )}
        <a
          href={item.src}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in a new tab"
          className={button}
        >
          <ExternalLink className="w-5 h-5" />
        </a>
        <a href={item.download} download={item.name} rel="noopener noreferrer" aria-label="Download" className={button}>
          <Download className="w-5 h-5" />
        </a>
      </header>

      <div
        ref={stage}
        data-testid="viewer-stage"
        className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden"
        style={{ touchAction: "none", cursor: isImage && clamped.scale > 1 ? "grab" : "default" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (isImage && insidePhoto(e.clientX, e.clientY)) toggleZoom(centreOf(e.clientX, e.clientY));
        }}
      >
        <div
          key={item.id}
          className="w-full h-full flex items-center justify-center animate-fade"
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px)`,
            transition: touching ? "none" : "transform 160ms ease-out",
          }}
        >
          {isImage ? (
            failed ? (
              <div role="alert" className="max-w-sm text-center px-6">
                <p className="text-[15px]">This photo couldn't be opened.</p>
                <p className="mt-1 text-[13px] text-white/65">Its link may have expired.</p>
                {onExpired && (
                  <button
                    type="button"
                    onClick={() => {
                      setFailedSrc("");
                      onExpired();
                    }}
                    className="mt-4 h-10 px-5 rounded-full bg-white/15 hover:bg-white/25 text-[14px] font-medium"
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : (
              <img
                ref={photo}
                src={displayed}
                alt={item.caption || item.name}
                draggable={false}
                data-zoom={clamped.scale.toFixed(2)}
                className="w-full h-full object-contain"
                style={{
                  transform: `translate(${clamped.x}px, ${clamped.y}px) scale(${clamped.scale})`,
                  transition: touching ? "none" : "transform 140ms ease-out",
                }}
                onError={() => setFailedSrc(item.src)}
              />
            )
          ) : (
            <video
              src={item.src}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full bg-black"
              onError={() => setFailedSrc(item.src)}
            />
          )}
        </div>
        {isImage && !failed && displayed !== item.src && item.thumb && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[12px] text-white/80">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading full photo
          </span>
        )}
        {!isImage && failed && (
          <p role="alert" className="absolute bottom-6 text-[13px] text-white/75">
            This video couldn't be played.
          </p>
        )}
        <button
          type="button"
          aria-label="Previous"
          disabled={index === 0 && !hasOlder}
          onClick={() => go(-1)}
          className={`${button} absolute left-3 top-1/2 -translate-y-1/2 hidden sm:grid`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          aria-label="Next"
          disabled={index === items.length - 1}
          onClick={() => go(1)}
          className={`${button} absolute right-3 top-1/2 -translate-y-1/2 hidden sm:grid`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {item.caption && (
        <p className="relative z-10 mx-auto max-w-2xl px-5 pt-3 text-center text-[14.5px] leading-relaxed text-white/90 line-clamp-3">
          {item.caption}
        </p>
      )}

      {items.length > 1 && (
        <div
          ref={strip}
          className="relative z-10 hidden md:flex gap-2 overflow-x-auto px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] justify-start"
          aria-label="All photos and videos in this chat"
        >
          {items.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              aria-label={`Show ${entry.kind === "video" ? "video" : "photo"} ${i + 1}`}
              aria-current={entry.id === item.id}
              onClick={() => onChange(entry.id)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10 transition-[opacity,box-shadow] ${
                entry.id === item.id
                  ? "ring-2 ring-white opacity-100"
                  : "opacity-55 hover:opacity-90"
              }`}
            >
              {entry.thumb || entry.kind === "image" ? (
                <img
                  src={entry.thumb || entry.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <video src={`${entry.src}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
              )}
              {entry.kind === "video" && (
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                  <Play className="w-4 h-4 fill-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {items.length <= 1 && <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />}
    </div>,
    document.body,
  );
}
