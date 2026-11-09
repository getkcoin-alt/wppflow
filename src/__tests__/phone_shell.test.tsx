import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { TabBar, thirdTab } from "../components/layout/TabBar";
import type { NavItem } from "../components/layout/navigation";
import { PageHeader } from "../components/ui/Page";
import { resetBackStack } from "../hooks/useBackClose";

function media(on: (q: string) => boolean) {
  window.matchMedia = ((q: string) => ({ matches: on(q), media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
}
beforeEach(() => {
  resetBackStack();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  delete (window as { matchMedia?: unknown }).matchMedia;
  document.documentElement.style.removeProperty("--tabbar-h");
});

describe("the fourth place on the phone bar is chosen once per company", () => {
  const pipelineLocked = (i: NavItem) => i.key === "pipeline";
  it("is the industry solution when the company has one", () => {
    expect(thirdTab(["real_estate"]).key).toBe("realestate");
    expect(thirdTab(["real_estate"], () => false).key).toBe("realestate");
  });
  it("is the pipeline when the plan includes it", () => {
    expect(thirdTab([]).key).toBe("pipeline");
    expect(thirdTab([], () => false).key).toBe("pipeline");
  });
  it("is Contacts when the plan has no pipeline", () => {
    expect(thirdTab([], pipelineLocked).key).toBe("contacts");
  });
});

describe("the phone tab bar", () => {
  const bar = (over: Partial<Parameters<typeof TabBar>[0]> = {}) =>
    render(<TabBar view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager {...over} />);
  const nav = () => screen.getByRole("navigation", { name: "Main" });
  const labels = () => within(nav()).getAllByRole("button").map((b) => b.textContent?.replace(/\d+\+?$/, "") || b.getAttribute("aria-label"));

  it("has four places that do not move: Today, Inbox, one more, Menu", () => {
    bar();
    expect(labels()).toEqual(["Today", "Inbox", "Pipeline", "Menu"]);
    cleanup();
    bar({ isLocked: (i) => i.key === "pipeline" });
    expect(labels()).toEqual(["Today", "Inbox", "Contacts", "Menu"]);
    cleanup();
    bar({ solutions: ["real_estate"] });
    expect(labels()).toEqual(["Today", "Inbox", "Real estate", "Menu"]);
  });

  it("is the same for everyone in the company, whatever their role", () => {
    bar({ manager: false });
    expect(labels()).toEqual(["Today", "Inbox", "Pipeline", "Menu"]);
  });

  it("marks where you are and counts the chats waiting on Inbox", () => {
    bar({ unreadChats: 3 });
    const inbox = within(nav()).getByRole("button", { name: /Inbox/ });
    expect(inbox.getAttribute("aria-current")).toBe("page");
    expect(within(inbox).getByText("3")).toBeDefined();
    expect(within(nav()).getByRole("button", { name: /Today/ }).getAttribute("aria-current")).toBeNull();
    cleanup();
    bar({ unreadChats: 140 });
    expect(within(nav()).getByText("99+")).toBeDefined();
  });

  it("goes to a place when it is tapped", () => {
    const onNavigate = vi.fn();
    bar({ onNavigate });
    fireEvent.click(within(nav()).getByRole("button", { name: /Today/ }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ key: "dashboard" }));
  });

  it("steps aside, and gives its height back, while a chat is open or the keyboard is up", () => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 64 });
    try {
      const { rerender } = bar();
      expect(document.documentElement.style.getPropertyValue("--tabbar-h")).toBe("64px");
      expect(nav().getAttribute("aria-hidden")).toBeNull();
      rerender(<TabBar view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager hidden />);
      expect(document.documentElement.style.getPropertyValue("--tabbar-h")).toBe("0px");
      const away = screen.getByRole("navigation", { hidden: true });
      expect(away.getAttribute("aria-hidden")).toBe("true");
      expect(away.hasAttribute("inert")).toBe(true);
    } finally {
      delete (HTMLElement.prototype as { offsetHeight?: unknown }).offsetHeight;
    }
  });
});

describe("the Menu", () => {
  const open = (over: Partial<Parameters<typeof TabBar>[0]> = {}) => {
    const utils = render(<TabBar view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager {...over} />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    return { ...utils, sheet: within(screen.getByRole("dialog", { name: "Menu" })) };
  };
  const names = (sheet: ReturnType<typeof within>) =>
    sheet
      .getAllByRole("button")
      .map((b: HTMLElement) => b.textContent)
      .filter(Boolean);

  it("lists what the bar does not, work first and the company's own after", () => {
    const { sheet } = open();
    const all = names(sheet);
    expect(all).toEqual(expect.arrayContaining(["Contacts", "Numbers", "Broadcasts", "Automations", "Reports", "Team", "Developers"]));
    expect(all).not.toContain("Pipeline"); // it is a tab
    expect(all).not.toContain("Today");
    expect(all).not.toContain("Inbox");
    expect(all.indexOf("Contacts")).toBeLessThan(all.indexOf("Team"));
  });

  it("keeps the manager-only places from people who are not managers", () => {
    const { sheet } = open({ manager: false });
    const all = names(sheet);
    for (const hidden of ["Broadcasts", "Automations", "Reports", "Team"]) expect(all).not.toContain(hidden);
    expect(all).toEqual(expect.arrayContaining(["Contacts", "Numbers", "Developers"]));
  });

  it("goes to a place and puts itself away", () => {
    const onNavigate = vi.fn();
    open({ onNavigate });
    fireEvent.click(within(screen.getByRole("dialog", { name: "Menu" })).getByRole("button", { name: /Reports/ }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ key: "reports" }));
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });

  it("opens the search and puts itself away", () => {
    const onSearch = vi.fn();
    const { sheet } = open({ onSearch });
    fireEvent.click(sheet.getByRole("button", { name: /Search or jump to/ }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });

  it("brings back the places visited last, so a habit is one tap", () => {
    localStorage.setItem("scriwo_recent_places", JSON.stringify(["reports", "contacts", "sessions", "campaigns"]));
    const onNavigate = vi.fn();
    const { sheet } = open({ onNavigate });
    const recent = within(sheet.getByLabelText("Recent"));
    expect(recent.getAllByRole("button").map((b) => b.textContent)).toEqual(["Reports", "Contacts", "Numbers"]);
    fireEvent.click(recent.getByRole("button", { name: "Contacts" }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ key: "contacts" }));
  });

  it("remembers a place when you visit it, and does not list the place you are on", () => {
    const { rerender } = render(<TabBar view="user" tab="reports" onNavigate={() => {}} unreadChats={0} manager />);
    rerender(<TabBar view="user" tab="contacts" onNavigate={() => {}} unreadChats={0} manager />);
    expect(JSON.parse(localStorage.getItem("scriwo_recent_places") || "[]").slice(0, 2)).toEqual(["contacts", "reports"]);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const recent = within(within(screen.getByRole("dialog", { name: "Menu" })).getByLabelText("Recent"));
    expect(recent.getAllByRole("button").map((b) => b.textContent)).toEqual(["Reports"]);
  });

  it("shows no Recent row until there is something to show", () => {
    const { sheet } = open();
    expect(sheet.queryByLabelText("Recent")).toBeNull();
  });

  it("marks what the plan does not include, and the item still opens", () => {
    const onNavigate = vi.fn();
    const { sheet } = open({ onNavigate, isLocked: (i) => Boolean(i.needs) && i.needs?.feature !== "broadcasts" });
    expect(sheet.getByTestId("locked-automations")).toBeDefined();
    expect(sheet.queryByTestId("locked-developers"), "Free OTP is open to every plan").toBeNull();
    expect(sheet.queryByTestId("locked-campaigns")).toBeNull();
    fireEvent.click(sheet.getByRole("button", { name: /Automations/ }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ key: "automations" }));
  });

  it("holds the account behind one row: who is signed in, and what the app puts there", () => {
    const { sheet } = open({ account: { name: "Karnveer", company: "Acme Homes", panel: <button>Sign out</button> } });
    expect(sheet.getByText("Karnveer")).toBeDefined();
    expect(sheet.getByText("Acme Homes")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    fireEvent.click(sheet.getByRole("button", { name: /Karnveer/ }));
    expect(within(screen.getByRole("dialog", { name: "Account" })).getByRole("button", { name: "Sign out" })).toBeDefined();
  });

  it("has no account row where the app gives none", () => {
    const { sheet } = open();
    expect(sheet.queryByText("Account")).toBeNull();
  });
});

describe("a screen header", () => {
  const header = () => (
    <PageHeader
      eyebrow="CRM"
      title="Contacts"
      subtitle="Everyone you have talked to, in one place."
      actions={
        <>
          <button>Import</button>
          <button>Export</button>
        </>
      }
      phone={{
        primary: <button>Add</button>,
        more: [
          { key: "import", label: "Import contacts", onSelect: vi.fn() },
          { key: "export", label: "Export contacts", onSelect: vi.fn() },
        ],
      }}
    />
  );

  it("is exactly what it was on a big screen", () => {
    render(header());
    expect(screen.getByText("CRM")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "Contacts" })).toBeDefined();
    expect(screen.getByText("Everyone you have talked to, in one place.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Import" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Export" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  });

  it("is a title, one main action and a ⋯ on a phone, with the description and the eyebrow gone", () => {
    media((q) => q.includes("max-width"));
    render(header());
    expect(screen.getByRole("heading", { level: 1, name: "Contacts" })).toBeDefined();
    expect(screen.queryByText("CRM")).toBeNull();
    expect(screen.queryByText("Everyone you have talked to, in one place.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
    expect(screen.getByRole("button", { name: "Add" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const sheet = within(screen.getByRole("dialog", { name: "Contacts" }));
    expect(sheet.getAllByRole("button").map((b) => b.textContent)).toEqual(expect.arrayContaining(["Import contacts", "Export contacts"]));
  });

  it("keeps a screen's own actions in one row that scrolls, where it has no phone version", () => {
    media((q) => q.includes("max-width"));
    const { container } = render(
      <PageHeader title="Numbers" subtitle="long description" actions={<button>Add number</button>} />,
    );
    expect(screen.queryByText("long description")).toBeNull();
    const row = container.querySelector(".chip-row");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByRole("button", { name: "Add number" })).toBeDefined();
  });
});
