import { Lock } from "lucide-react";
import { EmptyState, Page } from "./Page";
import { btn } from "./styles";

// Shown where a screen belongs to a plan the company isn't on, or is switched off because the payment is late,
// instead of a screen that fails.
export function FeatureLocked({
  feature,
  plan,
  needs,
  lapsed = false,
  onOpenPlan,
}: {
  feature: string;
  plan: string;
  /** The plan that includes it */
  needs: string;
  /** The plan includes it, but the payment is more than the grace period late */
  lapsed?: boolean;
  /** Takes an owner to the plan and billing screen */
  onOpenPlan?: () => void;
}) {
  return (
    <Page>
      <EmptyState
        icon={<Lock className="w-6 h-6" />}
        title={lapsed ? `${feature} is off until the payment is received` : `${feature} is part of the ${needs} plan`}
        body={
          lapsed
            ? `Payment for your ${plan} plan is overdue, so ${feature.toLowerCase()} is switched off. Nothing has been deleted: pay the invoice or message the Scriwo team and it comes back at once.`
            : `Your company is on the ${plan} plan. Choose ${needs} or above and ${feature.toLowerCase()} will switch on straight away.`
        }
        action={
          onOpenPlan ? (
            <button type="button" onClick={onOpenPlan} className={btn("secondary")}>
              {lapsed ? "Pay now" : "See the plans"}
            </button>
          ) : (
            <a href="https://www.scriwo.com/pricing" target="_blank" rel="noopener noreferrer" className={btn("secondary")}>
              See the plans
            </a>
          )
        }
      />
    </Page>
  );
}
