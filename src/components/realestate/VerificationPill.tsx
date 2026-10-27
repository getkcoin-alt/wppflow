import { Pill } from "../ui/Page";
import type { ReProperty } from "../../services/realEstate";

export function VerificationPill({
  p,
}: {
  p: Pick<ReProperty, "verification" | "verifiedDaysAgo">;
}) {
  if (p.verification === "fresh")
    return (
      <Pill tone="ok">
        {p.verifiedDaysAgo === 0
          ? "Checked today"
          : `Checked ${p.verifiedDaysAgo}d ago`}
      </Pill>
    );
  if (p.verification === "stale")
    return <Pill tone="warn">Check again · {p.verifiedDaysAgo}d ago</Pill>;
  return <Pill tone="danger">Never checked</Pill>;
}
