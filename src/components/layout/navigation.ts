import {
  Bot,
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
  | "automations";
export type AdminSubTab = "users" | "cluster" | "audit";
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
  },
  {
    key: "campaigns",
    label: "Broadcasts",
    icon: Megaphone,
    view: "user",
    tab: "campaigns",
    manager: true,
  },
  {
    key: "automations",
    label: "Automations",
    icon: Bot,
    view: "user",
    tab: "automations",
    manager: true,
  },
  {
    key: "dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    view: "user",
    tab: "dashboard",
  },
];
export const NAV_SECONDARY: NavItem[] = [
  { key: "team", label: "Team", icon: Users2, view: "admin", manager: true },
  { key: "developers", label: "Developers", icon: Code2, view: "developer" },
];

export const ADMIN_TABS: { key: AdminSubTab; label: string }[] = [
  { key: "users", label: "People" },
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

export const isActive = (item: NavItem, view: View, tab: UserSubTab) =>
  item.view === view && (item.view !== "user" || item.tab === tab);
