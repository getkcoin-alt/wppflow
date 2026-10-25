import type { PlanChoice } from "../../services/api";
import type { Subscription } from "../../utils/subscription";

export interface Company {
  id: string;
  name: string;
  /** The plan's name, or the original "Workspace" for companies from before plans */
  plan: string;
  planId: PlanChoice["id"] | null;
  status: "active" | "suspended";
  sessionsLimit: number;
  staffCount: number;
  sessionsCount: number;
  connectedSessions: number;
  /** The AI assistant as part of the subscription: what the company may use and has used */
  ai?: {
    included: boolean;
    enabled: boolean;
    dailyLimit: number;
    customLimit: boolean;
    usedToday: number;
    requestsThisMonth: number;
    tokensThisMonth: number;
  };
  /** Where the company stands on what it pays for: the period, the renewal date, what happens next */
  subscription?: Subscription;
  createdAt: string;
  owner: { name: string; email: string; activated: boolean } | null;
}
