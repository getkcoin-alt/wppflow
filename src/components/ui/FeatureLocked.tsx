import { Lock } from "lucide-react";
import { EmptyState, Page } from "./Page";
import { btn } from "./styles";

// Shown where a screen belongs to a plan the company isn't on, instead of a screen that fails.
export function FeatureLocked({
  feature,
  plan,
  needs,
}: {
  feature: string;
  plan: string;
  /** The plan that includes it */
  needs: string;
}) {
  return (
    <Page>
      <EmptyState
        icon={<Lock className="w-6 h-6" />}
        title={`${feature} is part of the ${needs} plan`}
        body={`Your company is on the ${plan} plan. Ask the Scriwo team to move you to ${needs} or above, and ${feature.toLowerCase()} will switch on straight away.`}
        action={
          <a
            href="https://www.scriwo.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className={btn("secondary")}
          >
            See the plans
          </a>
        }
      />
    </Page>
  );
}
