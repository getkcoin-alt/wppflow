import { useEffect, useRef } from "react";

/**
 * A company that has the real-estate layer opens on its own property dashboard when someone signs in, once per visit, whatever
 * address they used (app.scriwo.com or homes.scriwo.com). Companies without it open on the general home, as always. It draws
 * nothing, and people can go anywhere else from there.
 */
export function VerticalOpener({ solutions, open }: { solutions: string[]; open: (tab: "realestate") => void }) {
  const done = useRef(false);
  const ready = solutions.includes("real_estate");
  useEffect(() => {
    if (ready && !done.current) {
      done.current = true;
      open("realestate");
    }
  }, [ready, open]);
  return null;
}
