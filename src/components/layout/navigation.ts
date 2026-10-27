import {
  BarChart3,
  Bot,
  Building2,
  Code2,
  Contact,
  Funnel,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Smartphone,
  Users2,
  type LucideIcon,
} from "lucide-react";

export type UserSubTab =
  | "dashboard"
  | "inbox"
  | "sessions"
  | "campaigns"
  | "contacts"
  | "pipeline"
  | "automations"
  | "reports"
  | "realestate";
export type AdminSubTab = "users" | "billing" | "cluster" | "audit";
export type DevSubTab = "docs" | "webhooks" | "sdks" | "keys";
export type View = "user" | "admin" | "developer";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  view: View;
  tab?: UserSubTab;
  /** Only shown to workspace owners and admins */
  manager?: boolean;
  /** An industry solution: shown only to companies that have been given it */
  solution?: string;
  /** The plan feature this screen belongs to, and the plan that first includes it: a company without it sees the item locked */
  needs?: { feature: "leads" | "broadcasts" | "automations" | "api"; plan: string };
}

// One definition feeds the desktop dock, the phone tab bar and the command palette.
export const NAV: NavItem[] = [
  {
    key: "inbox",
    label: "Inbox",
    icon: MessageSquare,
    view: "user",
    tab: "inbox",
  },
  {
    key: "sessions",
    label: "Numbers",
    icon: Smartphone,
    view: "user",
    tab: "sessions",
  },
  {
    key: "contacts",
    label: "Contacts",
    icon: Contact,
    view: "user",
    tab: "contacts",
  },
  {
    key: "pipeline",
    label: "Pipeline",
    icon: Funnel,
    view: "user",
    tab: "pipeline",
    needs: { feature: "leads", plan: "Growth" },
  },
  {
    key: "realestate",
    label: "Real estate",
    icon: Building2,
    view: "user",
    tab: "realestate",
    solution: "real_estate",
  },
  {
    key: "campaigns",
    label: "Broadcasts",
    icon: Megaphone,
    view: "user",
    tab: "campaigns",
    manager: true,
    needs: { feature: "broadcasts", plan: "Growth" },
  },
  {
    key: "automations",
    label: "Automations",
    icon: Bot,
    view: "user",
    tab: "automations",
    manager: true,
    needs: { feature: "automations", plan: "Growth" },
  },
  {
    key: "dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    view: "user",
    tab: "dashboard",
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    view: "user",
    tab: "reports",
    manager: true,
  },
];
export const NAV_SECONDARY: NavItem[] = [
  { key: "team", label: "Team", icon: Users2, view: "admin", manager: true },
  {
    key: "developers",
    label: "Developers",
    icon: Code2,
    view: "developer",
    needs: { feature: "api", plan: "Business" },
  },
];

export const ADMIN_TABS: { key: AdminSubTab; label: string }[] = [
  { key: "users", label: "People" },
  { key: "billing", label: "Plans & Billing" },
  { key: "cluster", label: "System" },
  { key: "audit", label: "Activity" },
];
export const DEV_TABS: { key: DevSubTab; label: string; manager?: boolean }[] =
  [
    { key: "docs", label: "API tester" },
    { key: "sdks", label: "SDKs" },
    { key: "webhooks", label: "Webhooks", manager: true },
    { key: "keys", label: "API keys", manager: true },
  ];

// Whether a person gets to see an item at all: managers-only items need a manager, and a solution's items need the solution.
export const navVisible = (item: NavItem, { manager, solutions = [] }: { manager: boolean; solutions?: string[] }) =>
  (!item.manager || manager) && (!item.solution || solutions.includes(item.solution));

// The hover text on a locked item: which plan has it.
export const lockedHint = (item: NavItem) => (item.needs ? `${item.label} is part of the ${item.needs.plan} plan` : undefined);

export const isActive = (item: NavItem, view: View, tab: UserSubTab) =>
  item.view === view && (item.view !== "user" || item.tab === tab);
