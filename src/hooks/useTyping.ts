import { useEffect, useState } from "react";

// True while a text field has the focus, which on a phone means the keyboard is up. The tab bar steps aside then: nothing that
// belongs to another screen should sit on top of the keyboard.
const NOT_TEXT = ["checkbox", "radio", "button", "submit", "reset", "range", "file", "color", "image", "hidden"];
const isField = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node || typeof node.tagName !== "string") return false;
  if (node.isContentEditable) return true;
  if (node.tagName === "TEXTAREA") return !(node as HTMLTextAreaElement).readOnly && !(node as HTMLTextAreaElement).disabled;
  if (node.tagName !== "INPUT") return false;
  const input = node as HTMLInputElement;
  return !NOT_TEXT.includes(input.type) && !input.readOnly && !input.disabled;
};

export function useTyping(): boolean {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    let field: HTMLElement | null = null;
    let watcher: MutationObserver | null = null;
    let later: number | undefined;
    const set = (el: HTMLElement | null) => {
      field = el;
      setTyping(Boolean(el));
      watcher?.disconnect();
      watcher = null;
      // A field that is taken out of the page while it has the focus (the sign-in form after signing in) never says it lost it.
      if (el && typeof MutationObserver !== "undefined") {
        watcher = new MutationObserver(() => {
          if (field && !field.isConnected) set(null);
        });
        watcher.observe(document.body, { childList: true, subtree: true });
      }
    };
    const on = (e: FocusEvent) => {
      window.clearTimeout(later);
      set(isField(e.target) ? (e.target as HTMLElement) : null);
    };
    // moving from one field to the next is a blur and a focus in quick succession: the bar must not flash in between
    const off = () => {
      window.clearTimeout(later);
      later = window.setTimeout(() => {
        if (!isField(document.activeElement)) set(null);
      }, 0);
    };
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", off);
      window.clearTimeout(later);
      watcher?.disconnect();
    };
  }, []);
  return typing;
}
