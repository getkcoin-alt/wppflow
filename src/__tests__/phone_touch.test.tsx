import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import { useBackClose, resetBackStack } from "../hooks/useBackClose";
import { Swipeable, settle, followFinger, fullSwipeAt, SWIPE } from "../components/mobile/Swipeable";
import { useLongPress } from "../hooks/useLongPress";
import { usePullToRefresh, PULL_TO_REFRESH } from "../hooks/usePullToRefresh";
import { ToastProvider, useToast } from "../components/mobile/Toasts";
import { ActionSheet } from "../components/mobile/ActionSheet";
import { Sheet } from "../components/ui/Sheet";
import { useIsPhone, useIsSheet } from "../hooks/useMedia";
import { useRef, useState } from "react";
import { useTyping } from "../hooks/useTyping";

// jsdom has no matchMedia: every phone variant is off until a test turns it on.
function media(on: (q: string) => boolean) {
  window.matchMedia = ((q: string) => ({ matches: on(q), media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
}
const phone = () => media((q) => q.includes("max-width"));
afterEach(() => {
  cleanup();
  delete (window as { matchMedia?: unknown }).matchMedia;
  vi.useRealTimers();
});

describe("screen kind", () => {
  function Probe() {
    return (
      <p>
        {String(useIsPhone())}/{String(useIsSheet())}
      </p>
    );
  }
  it("is a desktop where there is no matchMedia, so every phone variant is opt-in", () => {
    render(<Probe />);
    expect(screen.getByText("false/false")).toBeDefined();
  });
  it("reads the width queries", () => {
    media((q) => q === "(max-width: 1023px)");
    render(<Probe />);
    expect(screen.getByText("true/false")).toBeDefined();
  });
});

describe("Back closes the top overlay instead of leaving the app", () => {
  function Overlay({ open, onClose }: { open: boolean; onClose: () => void }) {
    useBackClose(open, onClose);
    return null;
  }
  beforeEach(() => {
    resetBackStack();
    window.history.replaceState(null, "");
  });
  const settled = () => new Promise((r) => setTimeout(r, 30));

  it("adds one history entry while open, and Back closes it", async () => {
    const onClose = vi.fn();
    const before = window.history.length;
    render(<Overlay open onClose={onClose} />);
    expect(window.history.length).toBe(before + 1);
    expect(window.history.state?.scriwoOverlay).toBeDefined();
    window.history.back();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("takes its entry out again when it is closed some other way, so Back does not later do nothing", async () => {
    const { rerender } = render(<Overlay open onClose={() => {}} />);
    expect(window.history.state?.scriwoOverlay).toBeDefined();
    rerender(<Overlay open={false} onClose={() => {}} />);
    await waitFor(() => expect(window.history.state?.scriwoOverlay).toBeUndefined());
  });

  it("closes only the top one when two are open", async () => {
    const under = vi.fn();
    const over = vi.fn();
    render(
      <>
        <Overlay open onClose={under} />
        <Overlay open onClose={over} />
      </>,
    );
    window.history.back();
    await waitFor(() => expect(over).toHaveBeenCalledTimes(1));
    expect(under).not.toHaveBeenCalled();
    window.history.back();
    await waitFor(() => expect(under).toHaveBeenCalledTimes(1));
  });

  it("hands over cleanly when one overlay closes as another opens (an action sheet opening a form)", async () => {
    const a = vi.fn();
    const b = vi.fn();
    const { rerender } = render(
      <>
        <Overlay open onClose={a} />
        <Overlay open={false} onClose={b} />
      </>,
    );
    rerender(
      <>
        <Overlay open={false} onClose={a} />
        <Overlay open onClose={b} />
      </>,
    );
    await settled();
    expect(window.history.state?.scriwoOverlay).toBeDefined();
    window.history.back();
    await waitFor(() => expect(b).toHaveBeenCalledTimes(1));
    expect(a).not.toHaveBeenCalled();
  });

  it("keeps the app's own history state when it adds its entry", () => {
    window.history.replaceState({ keep: 1 }, "");
    render(<Overlay open onClose={() => {}} />);
    expect(window.history.state.keep).toBe(1);
  });
});

describe("swiping a row", () => {
  it("knows what letting go does", () => {
    const reveal = SWIPE.actionWidth * 2;
    expect(settle(-10, 0, reveal, 390)).toBe("close");
    expect(settle(-(reveal * SWIPE.openShare + 1), 0, reveal, 390)).toBe("open");
    expect(settle(-30, -0.8, reveal, 390)).toBe("open"); // a flick from a short pull
    expect(settle(-30, 0.8, reveal, 390)).toBe("close"); // flicked back the other way
    expect(settle(-(fullSwipeAt(390, reveal) + 1), 0, reveal, 390)).toBe("full");
    expect(settle(100, 0, 0, 390)).toBe("close"); // nothing on that side
  });
  it("goes all the way at about half the row, and always further than the tray", () => {
    expect(fullSwipeAt(390, 152)).toBeCloseTo(243.2);
    expect(fullSwipeAt(390, 76)).toBe(195);
  });
  it("follows the finger, a little heavier past the tray, and never leaves the row", () => {
    expect(followFinger(-40, 76, 390)).toBe(-40);
    expect(followFinger(-176, 76, 390)).toBeCloseTo(-(76 + 100 * 0.85));
    expect(followFinger(5000, 76, 390)).toBeCloseTo(390 * 0.92);
  });

  const trigger = vi.fn();
  const done = { key: "done", label: "Done", tone: "ok" as const, onTrigger: trigger };
  const mine = { key: "mine", label: "Mine", tone: "brand" as const, onTrigger: vi.fn() };
  beforeEach(() => {
    trigger.mockClear();
    mine.onTrigger.mockClear();
  });
  const row = () => screen.getByText("Rashid").parentElement as HTMLElement;
  const drag = (el: HTMLElement, from: number, to: number, y = 40, steps = 4) => {
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: "touch", clientX: from, clientY: y });
    for (let i = 1; i <= steps; i++) fireEvent.pointerMove(el, { pointerId: 1, pointerType: "touch", clientX: from + ((to - from) * i) / steps, clientY: y });
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "touch", clientX: to, clientY: y });
  };
  const view = (enabled = true) =>
    render(
      <Swipeable enabled={enabled} leading={[mine]} trailing={[done]}>
        <button>Rashid</button>
      </Swipeable>,
    );

  it("is just the row where it is turned off (a desktop)", () => {
    const { container } = view(false);
    expect(container.querySelector("[style*='touch-action']")).toBeNull();
    expect(screen.queryByText("Done")).toBeNull();
  });

  it("opens the actions when pulled far enough and a tap on one runs it and closes the row", () => {
    view();
    const el = row();
    drag(el, 300, 220);
    expect(el.style.transform).toBe(`translateX(-${SWIPE.actionWidth}px)`);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(trigger).toHaveBeenCalledTimes(1);
    expect(el.style.transform).toBe("");
  });

  it("springs back when pulled only a little", () => {
    view();
    const el = row();
    drag(el, 300, 285);
    expect(el.style.transform).toBe("");
    expect(trigger).not.toHaveBeenCalled();
  });

  it("does the first action at once on a full swipe, either way", () => {
    view();
    drag(row(), 330, 90);
    expect(trigger).toHaveBeenCalledTimes(1);
    drag(row(), 20, 300);
    expect(mine.onTrigger).toHaveBeenCalledTimes(1);
  });

  it("leaves vertical movement to the page", () => {
    view();
    const el = row();
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: "touch", clientX: 300, clientY: 40 });
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: "touch", clientX: 296, clientY: 90 });
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: "touch", clientX: 200, clientY: 120 });
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "touch", clientX: 200, clientY: 120 });
    expect(el.style.transform).toBe("");
    expect(trigger).not.toHaveBeenCalled();
  });

  it("ignores a mouse, and a drag that ends on it is not a tap on what it holds", () => {
    const onTap = vi.fn();
    render(
      <Swipeable leading={[mine]} trailing={[done]}>
        <button onClick={onTap}>Rashid</button>
      </Swipeable>,
    );
    const el = screen.getByText("Rashid").parentElement as HTMLElement;
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: "mouse", clientX: 300, clientY: 40 });
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: "mouse", clientX: 100, clientY: 40 });
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "mouse", clientX: 100, clientY: 40 });
    expect(el.style.transform).toBe("");
    fireEvent.click(screen.getByText("Rashid"));
    expect(onTap).toHaveBeenCalledTimes(1);
    drag(el, 300, 220);
    fireEvent.click(screen.getByText("Rashid")); // the finger lifting after a swipe
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("a tap on an open row only puts it away, and touching elsewhere does too", () => {
    const onTap = vi.fn();
    render(
      <>
        <p>elsewhere</p>
        <Swipeable trailing={[done]}>
          <button onClick={onTap}>Rashid</button>
        </Swipeable>
      </>,
    );
    const el = screen.getByText("Rashid").parentElement as HTMLElement;
    const tap = () => {
      fireEvent.pointerDown(el, { pointerId: 3, pointerType: "touch", clientX: 100, clientY: 40 });
      fireEvent.pointerUp(el, { pointerId: 3, pointerType: "touch", clientX: 100, clientY: 40 });
      fireEvent.click(screen.getByText("Rashid"));
    };
    drag(el, 300, 220);
    expect(el.style.transform).not.toBe("");
    tap();
    expect(onTap).not.toHaveBeenCalled();
    expect(el.style.transform).toBe("");
    drag(el, 300, 220);
    fireEvent.pointerDown(screen.getByText("elsewhere"), { pointerId: 2, pointerType: "touch" });
    expect(el.style.transform).toBe("");
  });

  it("opens one row at a time", () => {
    render(
      <>
        <Swipeable trailing={[done]}>
          <button>first</button>
        </Swipeable>
        <Swipeable trailing={[done]}>
          <button>second</button>
        </Swipeable>
      </>,
    );
    const a = screen.getByText("first").parentElement as HTMLElement;
    const b = screen.getByText("second").parentElement as HTMLElement;
    drag(a, 300, 220);
    expect(a.style.transform).not.toBe("");
    drag(b, 300, 220);
    expect(a.style.transform).toBe("");
    expect(b.style.transform).not.toBe("");
  });
});

describe("long-press", () => {
  function Target({ onLong, ...opts }: { onLong: () => void; ms?: number }) {
    const press = useLongPress(onLong, opts);
    return (
      <button {...press} onClick={() => (window as { __tap?: () => void }).__tap?.()}>
        hold me
      </button>
    );
  }
  const down = (el: HTMLElement, x = 10, y = 10) => fireEvent.pointerDown(el, { pointerId: 1, pointerType: "touch", clientX: x, clientY: y });

  it("fires after the hold, and the tap that ends it is not a tap", () => {
    vi.useFakeTimers();
    const onLong = vi.fn();
    const tap = vi.fn();
    (window as { __tap?: () => void }).__tap = tap;
    render(<Target onLong={onLong} />);
    const el = screen.getByText("hold me");
    down(el);
    act(() => void vi.advanceTimersByTime(449));
    expect(onLong).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(2));
    expect(onLong).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "touch" });
    fireEvent.click(el);
    expect(tap).not.toHaveBeenCalled();
    fireEvent.click(el); // the next tap is a tap again
    expect(tap).toHaveBeenCalledTimes(1);
  });

  it("is cancelled by lifting early or moving the finger (a scroll)", () => {
    vi.useFakeTimers();
    const onLong = vi.fn();
    render(<Target onLong={onLong} />);
    const el = screen.getByText("hold me");
    down(el);
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "touch" });
    act(() => void vi.advanceTimersByTime(600));
    down(el);
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: "touch", clientX: 10, clientY: 40 });
    act(() => void vi.advanceTimersByTime(600));
    expect(onLong).not.toHaveBeenCalled();
  });

  it("also answers the context-menu gesture, for Android and the keyboard", () => {
    const onLong = vi.fn();
    render(<Target onLong={onLong} />);
    fireEvent.contextMenu(screen.getByText("hold me"));
    expect(onLong).toHaveBeenCalledTimes(1);
  });

  it("does nothing when turned off, or for a mouse", () => {
    vi.useFakeTimers();
    const onLong = vi.fn();
    const { rerender } = render(<Target onLong={onLong} />);
    fireEvent.pointerDown(screen.getByText("hold me"), { pointerId: 1, pointerType: "mouse", clientX: 1, clientY: 1 });
    act(() => void vi.advanceTimersByTime(600));
    expect(onLong).not.toHaveBeenCalled();
    function Off() {
      const press = useLongPress(onLong, { enabled: false });
      return <button {...press}>off</button>;
    }
    rerender(<Off />);
    fireEvent.contextMenu(screen.getByText("off"));
    expect(onLong).not.toHaveBeenCalled();
  });
});

describe("pull to refresh", () => {
  function Scroller({ onRefresh, enabled = true }: { onRefresh: () => Promise<unknown> | void; enabled?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const { pull, refreshing } = usePullToRefresh(ref, onRefresh, enabled);
    return (
      <div ref={ref} data-testid="list">
        <span data-testid="pull">{Math.round(pull)}</span>
        <span data-testid="state">{refreshing ? "refreshing" : "idle"}</span>
      </div>
    );
  }
  const touch = (el: Element, type: string, y: number, cancelable = true) => {
    const e = new Event(type, { bubbles: true, cancelable });
    Object.assign(e, { touches: type === "touchend" ? [] : [{ clientY: y }] });
    act(() => void el.dispatchEvent(e));
    return e;
  };

  it("refreshes when pulled past the line from the top, then settles", async () => {
    let finish: () => void = () => {};
    const onRefresh = vi.fn(() => new Promise<void>((r) => (finish = r)));
    render(<Scroller onRefresh={onRefresh} />);
    const list = screen.getByTestId("list");
    touch(list, "touchstart", 100);
    const move = touch(list, "touchmove", 100 + (PULL_TO_REFRESH.trigger / PULL_TO_REFRESH.resistance) + 10);
    expect(move.defaultPrevented).toBe(true); // the page itself must not pull
    touch(list, "touchend", 0);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("refreshing"));
    expect(screen.getByTestId("pull").textContent).toBe(String(PULL_TO_REFRESH.rest));
    await act(async () => finish());
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("idle"));
    expect(screen.getByTestId("pull").textContent).toBe("0");
  });

  it("does nothing for a short pull, when scrolled down, or when turned off", () => {
    const onRefresh = vi.fn();
    const { rerender } = render(<Scroller onRefresh={onRefresh} />);
    const list = screen.getByTestId("list");
    touch(list, "touchstart", 100);
    touch(list, "touchmove", 130);
    touch(list, "touchend", 0);
    expect(onRefresh).not.toHaveBeenCalled();
    list.scrollTop = 40;
    touch(list, "touchstart", 100);
    const move = touch(list, "touchmove", 300);
    touch(list, "touchend", 0);
    expect(move.defaultPrevented).toBe(false);
    expect(onRefresh).not.toHaveBeenCalled();
    list.scrollTop = 0;
    rerender(<Scroller onRefresh={onRefresh} enabled={false} />);
    touch(list, "touchstart", 100);
    touch(list, "touchmove", 300);
    touch(list, "touchend", 0);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});

describe("toasts", () => {
  function Button({ undo }: { undo: () => void }) {
    const toast = useToast();
    return <button onClick={() => toast.show({ text: "Marked done", actionLabel: "Undo", onAction: undo })}>go</button>;
  }
  it("says what happened, offers Undo once, and goes away by itself", () => {
    vi.useFakeTimers();
    const undo = vi.fn();
    render(
      <ToastProvider>
        <Button undo={undo} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    expect(screen.getByRole("status").textContent).toContain("Marked done");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByText("go"));
    act(() => void vi.advanceTimersByTime(6000));
    expect(screen.queryByRole("status")).toBeNull();
    expect(undo).toHaveBeenCalledTimes(1);
  });
  it("shows one at a time: a new one replaces the old", () => {
    function Two() {
      const toast = useToast();
      return (
        <>
          <button onClick={() => toast.show({ text: "First" })}>a</button>
          <button onClick={() => toast.show({ text: "Second" })}>b</button>
        </>
      );
    }
    render(
      <ToastProvider>
        <Two />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("b"));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toContain("Second");
  });
  it("does nothing, and does not fail, without a provider", () => {
    render(<Button undo={() => {}} />);
    fireEvent.click(screen.getByText("go"));
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("the action sheet", () => {
  it("closes first and then runs the choice, and marks the destructive one", () => {
    const order: string[] = [];
    render(
      <ActionSheet
        open
        onClose={() => order.push("close")}
        title="Rashid"
        actions={[
          { key: "a", label: "Assign to me", onSelect: () => order.push("assign") },
          { key: "d", label: "Delete", tone: "danger", onSelect: () => order.push("delete") },
        ]}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Rashid" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete" }).className).toContain("text-danger");
    fireEvent.click(screen.getByRole("button", { name: "Assign to me" }));
    expect(order).toEqual(["close", "assign"]);
  });
});

describe("a sheet on a phone", () => {
  const handle = () => screen.getByRole("dialog").firstElementChild as HTMLElement;
  const pull = (el: HTMLElement, to: number, ms: number) => {
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: "touch", clientY: 100 });
    act(() => void vi.advanceTimersByTime(ms));
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: "touch", clientY: to });
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "touch", clientY: to });
  };
  beforeEach(() => {
    phone();
    resetBackStack();
    vi.useFakeTimers();
  });
  const open = (onClose: () => void) => render(<Sheet open onClose={onClose} title="Details">body</Sheet>);

  it("goes when pulled down far enough", () => {
    const onClose = vi.fn();
    open(onClose);
    pull(handle(), 260, 400);
    act(() => void vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("goes when flicked down, even a short way", () => {
    const onClose = vi.fn();
    open(onClose);
    pull(handle(), 150, 40);
    act(() => void vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("comes back when pulled a little and let go slowly", () => {
    const onClose = vi.fn();
    open(onClose);
    pull(handle(), 150, 900);
    act(() => void vi.advanceTimersByTime(300));
    expect(onClose).not.toHaveBeenCalled();
    expect((screen.getByRole("dialog") as HTMLElement).style.transform).toBe("");
  });
  it("treats a touch on its Close button as a tap, not the start of a pull", () => {
    const onClose = vi.fn();
    open(onClose);
    const x = screen.getAllByRole("button", { name: "Close" }).find((b) => handle().contains(b))!;
    fireEvent.pointerDown(x, { pointerId: 1, pointerType: "touch", clientY: 100 });
    fireEvent.pointerMove(handle(), { pointerId: 1, pointerType: "touch", clientY: 400 });
    fireEvent.pointerUp(handle(), { pointerId: 1, pointerType: "touch", clientY: 400 });
    act(() => void vi.advanceTimersByTime(300));
    expect(onClose).not.toHaveBeenCalled();
  });
  it("opens in its place again, and can be pulled away again, after it was pulled away", () => {
    function Holder() {
      const [shown, setShown] = useState(true);
      return (
        <>
          <button onClick={() => setShown(true)}>open it</button>
          <Sheet open={shown} onClose={() => setShown(false)} title="Details">
            body
          </Sheet>
        </>
      );
    }
    render(<Holder />);
    pull(handle(), 300, 300);
    act(() => void vi.advanceTimersByTime(300));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByText("open it"));
    expect((screen.getByRole("dialog") as HTMLElement).style.transform).toBe("");
    pull(handle(), 300, 300);
    act(() => void vi.advanceTimersByTime(300));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("closes with Escape and keeps the page behind it still while it is open", () => {
    const onClose = vi.fn();
    const { unmount } = open(onClose);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
  it("is a plain dialog, with nothing to pull and no history entry, on a big screen", () => {
    delete (window as { matchMedia?: unknown }).matchMedia;
    const before = window.history.length;
    open(() => {});
    expect(window.history.length).toBe(before);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("knowing the keyboard is up", () => {
  function Probe() {
    return <p data-testid="typing">{String(useTyping())}</p>;
  }
  const typing = () => screen.getByTestId("typing").textContent;
  const later = () => act(() => new Promise<void>((r) => setTimeout(r, 10)));

  it("is true while a text field has the focus, and not for buttons or checkboxes", async () => {
    render(
      <>
        <Probe />
        <input aria-label="name" />
        <input type="checkbox" aria-label="agree" />
        <textarea aria-label="note" />
        <button>go</button>
      </>,
    );
    expect(typing()).toBe("false");
    act(() => screen.getByLabelText("name").focus());
    expect(typing()).toBe("true");
    act(() => screen.getByLabelText("name").blur());
    await later();
    expect(typing()).toBe("false");
    act(() => screen.getByLabelText("agree").focus());
    expect(typing()).toBe("false");
    act(() => screen.getByLabelText("note").focus());
    expect(typing()).toBe("true");
    act(() => screen.getByText("go").focus());
    await later();
    expect(typing()).toBe("false");
  });

  it("does not flash off when the focus moves from one field to the next", async () => {
    render(
      <>
        <Probe />
        <input aria-label="first" />
        <input aria-label="second" />
      </>,
    );
    act(() => screen.getByLabelText("first").focus());
    const seen: string[] = [];
    const watch = new MutationObserver(() => seen.push(typing() || ""));
    watch.observe(screen.getByTestId("typing"), { childList: true, characterData: true, subtree: true });
    act(() => screen.getByLabelText("second").focus());
    await later();
    watch.disconnect();
    expect(seen).not.toContain("false");
    expect(typing()).toBe("true");
  });

  it("lets go when the focused field is taken out of the page (the sign-in form after signing in)", async () => {
    function Screen() {
      const [form, setForm] = useState(true);
      return (
        <>
          <Probe />
          {form ? <input aria-label="password" /> : <p>signed in</p>}
          <button onClick={() => setForm(false)}>done</button>
        </>
      );
    }
    render(<Screen />);
    act(() => screen.getByLabelText("password").focus());
    expect(typing()).toBe("true");
    // the form goes away without a blur
    await act(async () => {
      fireEvent.click(screen.getByText("done"));
    });
    await later();
    expect(screen.getByText("signed in")).toBeDefined();
    expect(typing()).toBe("false");
  });

  it("ignores a field that cannot be typed into", () => {
    render(
      <>
        <Probe />
        <input aria-label="locked" readOnly />
        <input aria-label="off" disabled />
      </>,
    );
    act(() => screen.getByLabelText("locked").focus());
    expect(typing()).toBe("false");
  });
});
