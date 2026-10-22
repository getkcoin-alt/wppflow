import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  choiceOf,
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
