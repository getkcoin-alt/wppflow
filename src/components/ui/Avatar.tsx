import { useState } from "react";
import { safeAvatarFallback } from "../../utils/avatar";
import { assetUrl } from "../../utils/backendBase";

/**
 * A person's or group's picture, or their initials when there is none. The picture is loaded only when it scrolls into view,
 * and if it cannot be loaded (the person has none, or WhatsApp could not be asked) the initials take its place, once, with no
 * flicker or retry loop.
 */
export function Avatar({
  src,
  name,
  isGroup = false,
  className,
}: {
  src?: string;
  name: string;
  isGroup?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState("");
  const picture = src && failed !== src ? assetUrl(src) : "";
  return (
    <img
      src={picture || safeAvatarFallback(name, isGroup)}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => picture && setFailed(src || "")}
    />
  );
}
