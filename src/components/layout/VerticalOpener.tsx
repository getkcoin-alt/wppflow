import { useEffect, useRef } from "react";
import { currentVertical, type VerticalCopy } from "../../utils/vertical";

/**
 * On an industry's own address (homes.scriwo.com) a company that has that industry opens on its screen, once per visit, so the
 * first thing an agency sees is its property hub and not the general home. It draws nothing.
 */
export function VerticalOpener({ solutions, open }: { solutions: string[]; open: (tab: VerticalCopy["homeTab"]) => void }) {
  const done = useRef(false);
  const vertical = currentVertical();
  const ready = Boolean(vertical && solutions.includes("real_estate"));
  useEffect(() => {
    if (ready && vertical && !done.current) {
      done.current = true;
      open(vertical.homeTab);
    }
  }, [ready, vertical, open]);
  return null;
}
