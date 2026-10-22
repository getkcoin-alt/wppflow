import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { MediaViewer } from "../components/user/MediaViewer";
import type { GalleryItem } from "../utils/viewer";

const item = (id: string, over: Partial<GalleryItem> = {}): GalleryItem => ({
  id,
  kind: "image",
  src: `https://s/${id}?inline`,
  thumb: `https://s/${id}.preview`,
  download: `https://s/${id}?dl`,
  name: `${id}.jpg`,
  from: "Priya",
  at: "22 Oct 2026, 10:00",
  caption: "",
  ...over,
});
const three = [item("a"), item("b", { caption: "Front gate" }), item("c")];

const show = (props: Partial<React.ComponentProps<typeof MediaViewer>> = {}) => {
  const handlers = { onChange: vi.fn(), onClose: vi.fn(), onLoadOlder: vi.fn(), onExpired: vi.fn() };
  const view = render(<MediaViewer items={three} currentId="b" {...handlers} {...props} />);
  return { ...handlers, ...view };
};
const photo = () => screen.getByRole("dialog").querySelector("img[data-zoom]") as HTMLImageElement;

afterEach(cleanup);

describe("the photo viewer", () => {
  it("is a labelled dialog that says where you are in the chat", () => {
    show();
    expect(screen.getByRole("dialog", { name: "Photo viewer" })).toBeDefined();
    expect(screen.getByText("2 / 3")).toBeDefined();
    expect(screen.getByText("Priya")).toBeDefined();
    expect(screen.getByText("Front gate")).toBeDefined();
  });

  it("shows the small version first, so the photo appears at once", () => {
    show();
    expect(photo().getAttribute("src")).toBe("https://s/b.preview");
  });

  it("moves with the arrow keys and the buttons", () => {
    const { onChange } = show();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("c");
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("a");
    fireEvent.click(screen.getByLabelText("Next"));
    expect(onChange).toHaveBeenLastCalledWith("c");
    fireEvent.click(screen.getByLabelText("Previous"));
    expect(onChange).toHaveBeenLastCalledWith("a");
    fireEvent.click(screen.getByLabelText("Show photo 3"));
    expect(onChange).toHaveBeenLastCalledWith("c");
  });

  it("stops at the ends instead of wrapping around", () => {
    const first = show({ currentId: "a" });
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(first.onChange).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Previous") as HTMLButtonElement).disabled).toBe(true);
    first.unmount();
    const last = show({ currentId: "c" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(last.onChange).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Next") as HTMLButtonElement).disabled).toBe(true);
  });

  it("closes with Esc and the close button", () => {
    const { onClose } = show();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("Close viewer"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("opens the file in a new tab or saves it", () => {
    show();
    const open = screen.getByLabelText("Open in a new tab") as HTMLAnchorElement;
    expect(open.getAttribute("href")).toBe("https://s/b?inline");
    expect(open.getAttribute("target")).toBe("_blank");
    expect(open.getAttribute("rel")).toContain("noopener");
    const save = screen.getByLabelText("Download") as HTMLAnchorElement;
    expect(save.getAttribute("href")).toBe("https://s/b?dl");
    expect(save.getAttribute("download")).toBe("b.jpg");
  });

  it("zooms with the buttons and keys, and resets", () => {
    show();
    expect(photo().getAttribute("data-zoom")).toBe("1.00");
    fireEvent.click(screen.getByLabelText("Zoom in"));
    expect(photo().getAttribute("data-zoom")).toBe("1.50");
    fireEvent.keyDown(document, { key: "+" });
    expect(photo().getAttribute("data-zoom")).toBe("2.25");
    fireEvent.click(screen.getByLabelText("Zoom out"));
    expect(photo().getAttribute("data-zoom")).toBe("1.50");
    fireEvent.click(screen.getByLabelText("Reset zoom"));
    expect(photo().getAttribute("data-zoom")).toBe("1.00");
    fireEvent.keyDown(document, { key: "=" });
    fireEvent.keyDown(document, { key: "0" });
    expect(photo().getAttribute("data-zoom")).toBe("1.00");
  });

  it("zooms with the mouse wheel", () => {
    show();
    fireEvent.wheel(screen.getByTestId("viewer-stage"), { deltaY: -400 });
    expect(Number(photo().getAttribute("data-zoom"))).toBeGreaterThan(1.5);
    fireEvent.wheel(screen.getByTestId("viewer-stage"), { deltaY: 4000 });
    expect(photo().getAttribute("data-zoom")).toBe("1.00");
  });

  it("starts each photo unzoomed", () => {
    const { rerender, ...handlers } = show();
    fireEvent.click(screen.getByLabelText("Zoom in"));
    rerender(<MediaViewer items={three} currentId="c" onChange={handlers.onChange} onClose={handlers.onClose} />);
    expect(photo().getAttribute("data-zoom")).toBe("1.00");
  });

  it("plays a video, with no zoom controls", () => {
    show({ items: [item("a"), item("v", { kind: "video", thumb: undefined })], currentId: "v" });
    const video = screen.getByRole("dialog").querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("src")).toBe("https://s/v?inline");
    expect(video.hasAttribute("controls")).toBe(true);
    expect(screen.queryByLabelText("Zoom in")).toBeNull();
  });

  it("brings in earlier photos when you reach the oldest loaded one", () => {
    const { onLoadOlder, onChange } = show({ currentId: "a", hasOlder: true });
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 / 3+")).toBeDefined();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onChange).not.toHaveBeenCalled();
    expect(onLoadOlder).toHaveBeenCalledTimes(2);
  });

  it("does not ask for earlier photos when there are none", () => {
    const { onLoadOlder } = show({ currentId: "a", hasOlder: false });
    expect(onLoadOlder).not.toHaveBeenCalled();
  });

  it("offers a way back if the photo's link has expired", () => {
    const { onExpired } = show({ items: [item("a", { thumb: undefined })], currentId: "a" });
    fireEvent.error(photo());
    expect(screen.getByRole("alert").textContent).toContain("couldn't be opened");
    fireEvent.click(screen.getByText("Try again"));
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("closes itself if its photo disappears, and hands focus back", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { rerender, onClose, unmount } = show();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    rerender(<MediaViewer items={[item("z")]} currentId="gone" onChange={vi.fn()} onClose={onClose} />);
    expect(onClose).toHaveBeenCalled();
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("keeps the page from scrolling behind it", () => {
    const { unmount } = show();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  describe("touch gestures", () => {
    const stage = () => screen.getByTestId("viewer-stage");
    // A 1000 x 600 stage showing a 1000 x 500 photo.
    const sized = () => {
      stage().getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 1000, height: 600, right: 1000, bottom: 600, x: 0, y: 0, toJSON() {} }) as DOMRect;
      Object.defineProperty(photo(), "naturalWidth", { value: 2000, configurable: true });
      Object.defineProperty(photo(), "naturalHeight", { value: 1000, configurable: true });
    };
    const finger = (id: number, from: [number, number], to: [number, number], type = "touch") => {
      fireEvent.pointerDown(stage(), { pointerId: id, pointerType: type, clientX: from[0], clientY: from[1] });
      fireEvent.pointerMove(stage(), { pointerId: id, pointerType: type, clientX: to[0], clientY: to[1] });
      fireEvent.pointerUp(stage(), { pointerId: id, pointerType: type, clientX: to[0], clientY: to[1] });
    };

    it("swiping left shows the next photo, swiping right the previous", () => {
      const { onChange } = show();
      sized();
      finger(1, [600, 300], [400, 300]);
      expect(onChange).toHaveBeenLastCalledWith("c");
      finger(2, [400, 300], [650, 310]);
      expect(onChange).toHaveBeenLastCalledWith("a");
    });

    it("swiping down closes it", () => {
      const { onClose } = show();
      sized();
      finger(1, [500, 200], [510, 420]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("a small movement is a tap, not a swipe", () => {
      const { onChange, onClose } = show();
      sized();
      finger(1, [500, 300], [503, 302]);
      expect(onChange).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("tapping the dark space beside the photo closes it, tapping the photo does not", () => {
      const { onClose } = show();
      sized();
      finger(1, [500, 300], [500, 300]); // on the photo (drawn 50 to 550 tall in the 600 high stage)
      expect(onClose).not.toHaveBeenCalled();
      finger(2, [500, 40], [500, 40]); // above the photo
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("double-tapping zooms in, and again zooms out", () => {
      show();
      sized();
      finger(1, [500, 300], [500, 300]);
      finger(2, [500, 300], [500, 300]);
      expect(Number(photo().getAttribute("data-zoom"))).toBeGreaterThan(2);
      finger(3, [500, 300], [500, 300]);
      finger(4, [500, 300], [500, 300]);
      expect(photo().getAttribute("data-zoom")).toBe("1.00");
    });

    it("a zoomed photo is dragged around instead of swiping to the next one", () => {
      const { onChange } = show();
      sized();
      fireEvent.click(screen.getByLabelText("Zoom in"));
      finger(1, [600, 300], [400, 300]);
      expect(onChange).not.toHaveBeenCalled();
      expect(photo().style.transform).toContain("translate(-200px");
    });

    it("pinching with two fingers zooms", () => {
      show();
      sized();
      fireEvent.pointerDown(stage(), { pointerId: 1, pointerType: "touch", clientX: 450, clientY: 300 });
      fireEvent.pointerDown(stage(), { pointerId: 2, pointerType: "touch", clientX: 550, clientY: 300 });
      fireEvent.pointerMove(stage(), { pointerId: 2, pointerType: "touch", clientX: 750, clientY: 300 });
      expect(Number(photo().getAttribute("data-zoom"))).toBeCloseTo(3, 1);
      fireEvent.pointerUp(stage(), { pointerId: 2, pointerType: "touch", clientX: 750, clientY: 300 });
      fireEvent.pointerUp(stage(), { pointerId: 1, pointerType: "touch", clientX: 450, clientY: 300 });
    });
  });
});
