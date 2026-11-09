import type { KeyboardEvent, RefObject } from "react";
import { useAutoGrow } from "../../../hooks/useAutoGrow";

/** Tall enough for about eight lines; after that the box scrolls instead of pushing the chat out of view. */
export const COMPOSER_MAX_HEIGHT = 192;

/**
 * The reply box on a computer. It grows with what is written. Enter sends; Shift+Enter starts a new line. An Enter that only
 * confirms a word in an input method (Hindi, Gujarati, Chinese, Japanese) is not "send".
 */
export function ComposerBox({
  value,
  onChange,
  onSend,
  inputRef,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  label: string;
  placeholder: string;
}) {
  useAutoGrow(inputRef, value, COMPOSER_MAX_HEIGHT);
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    // Safari reports the Enter that ends a composition with isComposing already false, but with key code 229
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    onSend();
  };
  return (
    <textarea
      ref={inputRef as RefObject<HTMLTextAreaElement>}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      aria-label={label}
      placeholder={placeholder}
      className="block w-full resize-none bg-transparent px-2 py-[10px] text-[15px] leading-5 min-h-[40px] focus:outline-none"
    />
  );
}
