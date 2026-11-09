import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { COMPOSER_MAX_HEIGHT, ComposerBox } from "../components/user/inbox/ComposerBox";

// jsdom does no layout, so a box is given the height its lines would have: 20px a line and 20px of padding
const LINE = 20;
const PAD = 20;
let descriptor: PropertyDescriptor | undefined;
beforeEach(() => {
  descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "scrollHeight");
  Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLTextAreaElement) {
      return this.value.split("\n").length * LINE + PAD;
    },
  });
});
afterEach(() => {
  cleanup();
  if (descriptor) Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", descriptor);
  else delete (HTMLTextAreaElement.prototype as unknown as Record<string, unknown>).scrollHeight;
});

function Harness({ onSend, start = "" }: { onSend: () => void; start?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(start);
  return <ComposerBox inputRef={ref} value={value} onChange={setValue} onSend={onSend} label="Write a message" placeholder="Write a message" />;
}
const box = () => screen.getByLabelText("Write a message") as HTMLTextAreaElement;

describe("the reply box on a computer", () => {
  it("is a box for several lines, not a single line that cuts the text off", () => {
    render(<Harness onSend={vi.fn()} />);
    expect(box().tagName).toBe("TEXTAREA");
  });

  it("Enter sends, and the browser is told not to add a line", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} start="hello" />);
    expect(fireEvent.keyDown(box(), { key: "Enter", code: "Enter" })).toBe(false);
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("Shift+Enter starts a new line and sends nothing", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} start="hello" />);
    // not prevented, so the browser does what it does in any text box: it adds the line
    expect(fireEvent.keyDown(box(), { key: "Enter", code: "Enter", shiftKey: true })).toBe(true);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("an Enter that only confirms a word in an input method (Hindi, Chinese, Japanese) does not send", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} start="नमस्ते" />);
    expect(fireEvent.keyDown(box(), { key: "Enter", code: "Enter", isComposing: true })).toBe(true);
    // Safari ends a composition with a key code of 229 and isComposing already false
    expect(fireEvent.keyDown(box(), { key: "Enter", code: "Enter", keyCode: 229 })).toBe(true);
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box(), { key: "Enter", code: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("other keys are left alone", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    expect(fireEvent.keyDown(box(), { key: "a", code: "KeyA" })).toBe(true);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("grows with the lines written, then stops growing and scrolls", () => {
    render(<Harness onSend={vi.fn()} />);
    expect(box().style.height).toBe("");
    fireEvent.change(box(), { target: { value: "one line" } });
    expect(box().style.height).toBe(`${LINE + PAD}px`);
    fireEvent.change(box(), { target: { value: "1\n2\n3" } });
    expect(box().style.height).toBe(`${3 * LINE + PAD}px`);
    fireEvent.change(box(), { target: { value: Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n") } });
    expect(box().style.height).toBe(`${COMPOSER_MAX_HEIGHT}px`);
  });

  it("goes back to one row when what was written is cleared (after sending)", () => {
    render(<Harness onSend={vi.fn()} start={"a\nb\nc\nd"} />);
    expect(box().style.height).toBe(`${4 * LINE + PAD}px`);
    fireEvent.change(box(), { target: { value: "" } });
    expect(box().style.height).toBe("");
  });

  it("is already the right height when it appears with a draft in it", () => {
    render(<Harness onSend={vi.fn()} start={"a\nb\nc"} />);
    expect(box().style.height).toBe(`${3 * LINE + PAD}px`);
  });
});
