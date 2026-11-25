import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  SEARCH_FROM,
  choiceOf,
  filterMembers,
  mailLine,
  parseChoice,
  roleText,
} from "../components/admin/teamModel";

const api = vi.hoisted(() => ({
  getTenantUsers: vi.fn(),
  createTenantUser: vi.fn(),
  updateTenantUser: vi.fn().mockResolvedValue({ status: "success" }),
  deleteTenantUser: vi.fn(),
  resendInvitation: vi.fn(),
  cancelInvitation: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", () => api);
import { UserManagement } from "../components/admin/UserManagement";

const NOW = Date.parse("2026-10-22T12:00:00Z");
const members = [
  {
    id: "1",
    name: "Karnveer",
    email: "owner@acme.test",
    status: "active",
    membershipRole: "owner",
    category: "general",
    canRename: true,
  },
  {
    id: "2",
    name: "Karnveer",
    email: "laxman@scriza.in",
    status: "active",
    membershipRole: "agent",
    category: "sales",
    canRename: true,
  },
  {
    id: "3",
    name: "Shared Sam",
    email: "sam@acme.test",
    status: "active",
    membershipRole: "agent",
    category: "support",
    canRename: false,
  },
];
const invitations = [
  {
    id: "i1",
    name: "Meera",
    email: "meera@acme.test",
    role: "agent",
    category: "billing",
    expired: false,
    mail: { status: "failed", error: "domain is not verified" },
  },
  {
    id: "i2",
    name: "Ravi",
    email: "ravi@acme.test",
    role: "agent",
    category: "general",
    expired: false,
    mail: {
      status: "sent",
      sentAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  },
];

const view = (canChangeRoles = true) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <UserManagement canChangeRoles={canChangeRoles} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  Object.values(api).forEach(
    (f) =>
      typeof f === "function" && "mockClear" in f && (f as any).mockClear(),
  );
  api.getTenantUsers.mockResolvedValue({ users: members, invitations });
});

describe("team model", () => {
  it("round-trips the single role dropdown", () => {
    expect(choiceOf("admin", "sales")).toBe("admin");
    expect(choiceOf("agent", "sales")).toBe("agent:sales");
    expect(parseChoice("admin")).toEqual({
      role: "admin",
      category: "general",
    });
    expect(parseChoice("agent:billing")).toEqual({
      role: "agent",
      category: "billing",
    });
    expect(roleText("agent", "support")).toBe("Agent · Support");
    expect(roleText("owner")).toBe("Owner");
  });

  it("says in one sentence what happened to an invitation email", () => {
    expect(
      mailLine({ status: "failed", error: "domain is not verified" }, false)
        .text,
    ).toBe("Email not delivered: domain is not verified");
    expect(
      mailLine({ status: "failed", error: "domain is not verified" }, false)
        .tone,
    ).toBe("danger");
    expect(
      mailLine(
        { status: "sent", sentAt: new Date(NOW - 5 * 60000).toISOString() },
        false,
        NOW,
      ).text,
    ).toBe("Email sent 5m ago");
    expect(
      mailLine(
        { status: "sent", sentAt: new Date(NOW).toISOString() },
        true,
        NOW,
      ).tone,
    ).toBe("warn");
    expect(mailLine({ status: "not_configured" }, false).text).toMatch(
      /share the link/,
    );
    expect(mailLine({ status: "unknown" }, false).text).toBe(
      "Email status unknown",
    );
  });
});

describe("Team screen", () => {
  it("offers categories inside the role dropdown, with Administrator only for owners", async () => {
    const { unmount } = view(true);
    const select = (await screen.findByLabelText("Role")) as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Administrator",
        "Agent · General",
        "Agent · Sales",
        "Agent · Support",
        "Agent · Billing",
        "Agent · Operations",
        "Agent · Marketing",
      ]),
    );
    unmount();
    view(false);
    const limited = (await screen.findByLabelText("Role")) as HTMLSelectElement;
    expect(
      Array.from(limited.options).some(
        (o) => o.textContent === "Administrator",
      ),
    ).toBe(false);
  });

  it("renames a teammate from the list", async () => {
    view();
    fireEvent.click((await screen.findAllByLabelText("Rename Karnveer"))[1]);
    const input = screen.getByLabelText("Name for laxman@scriza.in");
    fireEvent.change(input, { target: { value: "  Laxman Singh " } });
    fireEvent.click(screen.getByLabelText("Save name"));
    await waitFor(() =>
      expect(api.updateTenantUser).toHaveBeenCalledWith("2", {
        name: "Laxman Singh",
      }),
    );
  });

  it("hides rename for people who belong to other workspaces", async () => {
    view();
    await screen.findByText("Shared Sam");
    expect(screen.queryByLabelText("Rename Shared Sam")).toBeNull();
  });

  it("shows whether each invitation email was delivered and lets you resend or cancel", async () => {
    api.resendInvitation.mockResolvedValue({ emailSent: true });
    view();
    expect(
      await screen.findByText(/Email not delivered: domain is not verified/),
    ).toBeTruthy();
    expect(screen.getByText("Email sent 5m ago")).toBeTruthy();
    expect(screen.getByText(/2 pending · 1 email failed/)).toBeTruthy();
    const row = screen
      .getByText("meera@acme.test")
      .closest("li") as HTMLElement;
    fireEvent.click(within(row).getByText("Send new link"));
    await waitFor(() =>
      expect(api.resendInvitation).toHaveBeenCalledWith("i1"),
    );
    expect(
      await screen.findByText(
        /A new invitation was emailed to meera@acme.test/,
      ),
    ).toBeTruthy();
  });

  it("asks before removing a teammate, by name, inside the row, and removes only after yes", async () => {
    api.deleteTenantUser.mockResolvedValue({ status: "success" });
    view();
    fireEvent.click(await screen.findByRole("button", { name: "Remove Shared Sam" }));
    expect(api.deleteTenantUser).not.toHaveBeenCalled();
    const row = screen.getByText("sam@acme.test").closest("li") as HTMLElement;
    expect(within(row).getByRole("alertdialog", { name: "Remove Shared Sam?" })).toBeTruthy();
    expect(within(row).getByText("Remove Shared Sam from the workspace?")).toBeTruthy();
    fireEvent.click(within(row).getByRole("button", { name: "Keep" }));
    expect(api.deleteTenantUser).not.toHaveBeenCalled();
    expect(within(row).getByRole("button", { name: "Remove Shared Sam" })).toBeTruthy();
    fireEvent.click(within(row).getByRole("button", { name: "Remove Shared Sam" }));
    fireEvent.click(within(row).getByRole("button", { name: "Yes, remove" }));
    await waitFor(() => expect(api.deleteTenantUser).toHaveBeenCalledWith("3"));
  });

  it("asks before cancelling an invitation, and cancels only after yes", async () => {
    api.cancelInvitation.mockResolvedValue({ status: "success" });
    view();
    const row = (await screen.findByText("meera@acme.test")).closest("li") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Cancel the invitation for meera@acme.test" }));
    expect(api.cancelInvitation).not.toHaveBeenCalled();
    expect(within(row).getByText("The link will stop working.")).toBeTruthy();
    fireEvent.click(within(row).getByRole("button", { name: "Keep it" }));
    expect(api.cancelInvitation).not.toHaveBeenCalled();
    fireEvent.click(within(row).getByRole("button", { name: "Cancel the invitation for meera@acme.test" }));
    fireEvent.click(within(row).getByRole("button", { name: "Yes, cancel it" }));
    await waitFor(() => expect(api.cancelInvitation).toHaveBeenCalledWith("i1"));
  });

  it("finds people by any word of their name, email or role, in any order and case", () => {
    const team = [
      { name: "Amar Singh", email: "amar@scriza.in", membershipRole: "agent", category: "sales" },
      { name: "Anshu", email: "anshu@scriza.in", membershipRole: "agent", category: "operations" },
      { name: "Laxman", email: "laxman@scriza.in", membershipRole: "owner", category: "general" },
    ];
    expect(filterMembers(team, "").length).toBe(3);
    expect(filterMembers(team, "   ").length).toBe(3);
    expect(filterMembers(team, "AMAR").map((m) => m.name)).toEqual(["Amar Singh"]);
    expect(filterMembers(team, "singh amar").map((m) => m.name)).toEqual(["Amar Singh"]);
    expect(filterMembers(team, "operations").map((m) => m.name)).toEqual(["Anshu"]);
    expect(filterMembers(team, "owner").map((m) => m.name)).toEqual(["Laxman"]);
    expect(filterMembers(team, "scriza.in").length).toBe(3);
    expect(filterMembers(team, "amar anshu")).toEqual([]);
  });

  it("a small team has no search box; a larger one can be searched, and the search can be cleared", async () => {
    view();
    await screen.findByText("sam@acme.test");
    expect(SEARCH_FROM).toBeGreaterThan(members.length);
    expect(screen.queryByLabelText("Search people")).toBeNull();
    cleanup();
    const many = Array.from({ length: SEARCH_FROM + 1 }, (_, i) => ({
      id: String(100 + i),
      name: `Person ${i}`,
      email: `p${i}@acme.test`,
      status: "active",
      membershipRole: "agent",
      category: i === 2 ? "billing" : "sales",
      canRename: false,
    }));
    api.getTenantUsers.mockResolvedValue({ users: many, invitations: [] });
    view();
    const box = await screen.findByLabelText("Search people");
    expect(screen.getByText(`${many.length} people`)).toBeTruthy();
    fireEvent.change(box, { target: { value: "billing" } });
    expect(screen.getByText("Person 2")).toBeTruthy();
    expect(screen.queryByText("Person 3")).toBeNull();
    expect(screen.getByText(`1 of ${many.length}`)).toBeTruthy();
    fireEvent.change(box, { target: { value: "nobody here" } });
    expect(screen.getByText(/No one matches “nobody here”/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear the search" }));
    expect((box as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Person 3")).toBeTruthy();
  });

  it("changes a teammate's category from their role dropdown", async () => {
    view();
    const select = await screen.findByLabelText("Role for Karnveer");
    fireEvent.change(select, { target: { value: "agent:billing" } });
    await waitFor(() =>
      expect(api.updateTenantUser).toHaveBeenCalledWith("2", {
        role: "agent",
        category: "billing",
      }),
    );
  });

  it("sends the chosen role and category when inviting", async () => {
    api.createTenantUser.mockResolvedValue({ emailSent: true });
    view();
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Neha" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "neha@acme.test" },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "agent:support" },
    });
    fireEvent.click(screen.getByText("Create invitation"));
    await waitFor(() =>
      expect(api.createTenantUser).toHaveBeenCalledWith({
        name: "Neha",
        email: "neha@acme.test",
        role: "agent",
        category: "support",
      }),
    );
    expect(
      await screen.findByText(/Invitation emailed to neha@acme.test/),
    ).toBeTruthy();
  });
});
