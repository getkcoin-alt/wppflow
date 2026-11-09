import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  getCompanyDeletion: vi.fn(),
  deleteCompany: vi.fn(),
  listDeletedCompanies: vi.fn(),
  listCompanies: vi.fn(),
  listPlans: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { DeleteCompanySheet } from "../components/platform/DeleteCompanySheet";
import { PlatformAdmin } from "../components/platform/PlatformAdmin";
import type { CompanyDeletion, CompanyDeleted } from "../services/api";
import type { Company } from "../components/platform/types";

const company = (over: Partial<Company> = {}): Company => ({
  id: "t1",
  name: "Acme Retail",
  plan: "Starter",
  planId: "starter",
  status: "active",
  sessionsLimit: 3,
  staffCount: 2,
  sessionsCount: 2,
  connectedSessions: 1,
  createdAt: "2026-10-01",
  owner: { name: "Olivia", email: "olivia@acme.test", activated: true },
  ...over,
});
const counts = (over: Partial<CompanyDeletion["counts"]> = {}): CompanyDeletion["counts"] => ({ people: 3, numbers: 2, connectedNumbers: 1, contacts: 120, conversations: 40, messages: 5000, files: 12, campaigns: 0, automations: 2, leads: 0, ...over });
const preview = (over: Partial<CompanyDeletion> = {}): CompanyDeletion => ({
  company: { id: "t1", name: "Acme Retail", plan: "Starter", status: "active", createdAt: "2026-10-01", owner: { name: "Olivia", email: "olivia@acme.test" } },
  counts: counts(),
  blockers: [],
  canDelete: true,
  ...over,
});
const gone = (over: Partial<CompanyDeleted> = {}): CompanyDeleted => ({ deleted: { id: "t1", name: "Acme Retail" }, removed: counts(), peopleRemoved: 2, numbersNotUnlinked: [], ...over });

const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const sheet = (props: Partial<React.ComponentProps<typeof DeleteCompanySheet>> = {}) => wrap(<DeleteCompanySheet company={company()} onClose={vi.fn()} onDeleted={vi.fn()} {...props} />);
const nameBox = () => screen.getByLabelText("Type the company's name to confirm") as HTMLInputElement;
const deleteButton = () => screen.getByRole("button", { name: /Delete company/ }) as HTMLButtonElement;

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.getCompanyDeletion.mockResolvedValue(preview());
  api.listDeletedCompanies.mockResolvedValue([]);
});
afterEach(cleanup);

describe("deleting a company, in the platform console", () => {
  it("shows what will go before anything is asked, and the button waits", async () => {
    sheet();
    expect(screen.getByRole("heading", { name: "Delete Acme Retail?" })).toBeDefined();
    const list = await screen.findByRole("list", { name: "What will be deleted" });
    const lines = within(list).getAllByRole("listitem").map((li) => li.textContent);
    expect(lines).toEqual([
      "3 people and their sign-ins",
      "2 WhatsApp numbers, 1 connected now: they are logged out of the phone",
      "120 contacts",
      "40 conversations with 5,000 messages",
      "12 photos and files in storage",
      "2 automations",
    ]);
    expect(screen.getByText(/Owner: Olivia, olivia@acme.test/)).toBeDefined();
    expect(screen.getByText(/cannot be brought back/)).toBeDefined();
    expect(screen.getByText(/no message, contact or file/)).toBeDefined();
    expect(deleteButton().disabled).toBe(true);
    expect(api.getCompanyDeletion).toHaveBeenCalledWith("t1");
    expect(api.deleteCompany).not.toHaveBeenCalled();
  });

  it("lists only what the company really has", async () => {
    api.getCompanyDeletion.mockResolvedValue(preview({ counts: counts({ people: 1, numbers: 0, connectedNumbers: 0, contacts: 0, conversations: 0, messages: 0, files: 0, automations: 0 }) }));
    sheet();
    const list = await screen.findByRole("list", { name: "What will be deleted" });
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["1 person and their sign-ins"]);
  });

  it("the button waits for the name to be typed exactly; capitals and spaces do not matter", async () => {
    sheet();
    await screen.findByRole("list", { name: "What will be deleted" });
    for (const wrong of ["", "Acme", "Acme Retail Ltd", "someone else"]) {
      fireEvent.change(nameBox(), { target: { value: wrong } });
      expect(deleteButton().disabled, `"${wrong}"`).toBe(true);
    }
    fireEvent.change(nameBox(), { target: { value: "  acme RETAIL " } });
    expect(deleteButton().disabled).toBe(false);
  });

  it("deletes with the name that was typed, then reports what went", async () => {
    const onDeleted = vi.fn();
    api.deleteCompany.mockResolvedValue(gone());
    sheet({ onDeleted });
    await screen.findByRole("list", { name: "What will be deleted" });
    fireEvent.change(nameBox(), { target: { value: "Acme Retail" } });
    fireEvent.click(deleteButton());
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(api.deleteCompany).toHaveBeenCalledWith("t1", "Acme Retail");
    expect(onDeleted.mock.calls[0][0].deleted.name).toBe("Acme Retail");
  });

  it("Enter in the box deletes only when the name is right", async () => {
    api.deleteCompany.mockResolvedValue(gone());
    sheet();
    await screen.findByRole("list", { name: "What will be deleted" });
    fireEvent.change(nameBox(), { target: { value: "Acme" } });
    fireEvent.keyDown(nameBox(), { key: "Enter" });
    expect(api.deleteCompany).not.toHaveBeenCalled();
    fireEvent.change(nameBox(), { target: { value: "Acme Retail" } });
    fireEvent.keyDown(nameBox(), { key: "Enter" });
    await waitFor(() => expect(api.deleteCompany).toHaveBeenCalledTimes(1));
  });

  it("a company that must be kept says why, and offers no way to delete it", async () => {
    api.getCompanyDeletion.mockResolvedValue(preview({ canDelete: false, blockers: ["It has 2 online payments, 1 invoice on record. Billing records have to be kept, so this company can be suspended but not deleted."] }));
    sheet();
    expect(await screen.findByText("Acme Retail cannot be deleted.")).toBeDefined();
    expect(screen.getByText(/Billing records have to be kept/)).toBeDefined();
    expect(screen.queryByLabelText("Type the company's name to confirm")).toBeNull();
    expect(screen.queryByRole("button", { name: /Delete company/ })).toBeNull();
    // the sheet's own close button, and the one at the foot that says "Close" instead of "Cancel" because there is nothing to cancel
    expect(screen.getAllByRole("button", { name: "Close" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("the platform's own company is refused in the same way", async () => {
    api.getCompanyDeletion.mockResolvedValue(preview({ canDelete: false, blockers: ["This is the company that runs the platform, or the platform administrator is in it. It cannot be deleted."] }));
    sheet({ company: company({ id: "tenant_scriza", name: "Scriza" }) });
    expect(await screen.findByText(/runs the platform/)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Delete company/ })).toBeNull();
  });

  it("shows why when the server refuses, and stays open and ready to try again", async () => {
    api.deleteCompany.mockRejectedValue(new Error("The files of Acme Retail could not be removed from storage (storage is down). Nothing else was deleted. Try again."));
    const onDeleted = vi.fn();
    sheet({ onDeleted });
    await screen.findByRole("list", { name: "What will be deleted" });
    fireEvent.change(nameBox(), { target: { value: "Acme Retail" } });
    fireEvent.click(deleteButton());
    expect((await screen.findByText(/could not be removed from storage/)).textContent).toContain("Nothing else was deleted");
    expect(onDeleted).not.toHaveBeenCalled();
    await waitFor(() => expect(deleteButton().disabled).toBe(false));
  });

  it("says when it cannot look at the company at all, and offers nothing to press", async () => {
    api.getCompanyDeletion.mockRejectedValue(new Error("Company not found"));
    sheet();
    expect(await screen.findByText("Company not found")).toBeDefined();
    expect(screen.queryByLabelText("Type the company's name to confirm")).toBeNull();
    expect((screen.getByRole("button", { name: /Delete company/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("looks again every time it is opened, because what a company has (a payment, say) changes", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = (c: Company | null) => (
      <QueryClientProvider client={qc}>
        <DeleteCompanySheet key={c?.id ?? "closed"} company={c} onClose={vi.fn()} onDeleted={vi.fn()} />
      </QueryClientProvider>
    );
    const { rerender } = render(view(company()));
    await screen.findByRole("list", { name: "What will be deleted" });
    rerender(view(null));
    await waitFor(() => expect(screen.queryByRole("list", { name: "What will be deleted" })).toBeNull());
    api.getCompanyDeletion.mockResolvedValue(preview({ canDelete: false, blockers: ["It has 1 online payment on record. Billing records have to be kept, so this company can be suspended but not deleted."] }));
    rerender(view(company()));
    expect(await screen.findByText("Acme Retail cannot be deleted.")).toBeDefined();
    expect(api.getCompanyDeletion).toHaveBeenCalledTimes(2);
  });

  it("is not there when no company is chosen", () => {
    wrap(<DeleteCompanySheet company={null} onClose={vi.fn()} onDeleted={vi.fn()} />);
    expect(screen.queryByRole("heading", { name: /Delete/ })).toBeNull();
    expect(api.getCompanyDeletion).not.toHaveBeenCalled();
  });
});

describe("the company list in the platform console", () => {
  const PLANS = [{ id: "starter", name: "Starter", numbers: 3, seats: null, features: [], aiDaily: null }];
  const screenOf = () => wrap(<PlatformAdmin adminName="Root" onLogout={() => {}} />);
  const two = [company(), company({ id: "t2", name: "Beta Foods", owner: { name: "Bilal", email: "bilal@beta.test", activated: true } })];

  it("gives every company a Delete option that opens the sheet for that company only", async () => {
    api.listCompanies.mockResolvedValue(two);
    api.listPlans.mockResolvedValue(PLANS);
    screenOf();
    fireEvent.click(await screen.findByRole("button", { name: "Delete Beta Foods" }));
    expect(await screen.findByRole("heading", { name: "Delete Beta Foods?" })).toBeDefined();
    expect(api.getCompanyDeletion).toHaveBeenCalledWith("t2");
    expect(api.getCompanyDeletion).not.toHaveBeenCalledWith("t1");
  });

  it("after deleting, says what went, and the list is asked for again", async () => {
    api.listCompanies.mockResolvedValueOnce(two).mockResolvedValue([two[1]]);
    api.listPlans.mockResolvedValue(PLANS);
    api.deleteCompany.mockResolvedValue(gone({ removed: counts({ people: 3, contacts: 120, messages: 5000, files: 12 }) }));
    screenOf();
    fireEvent.click(await screen.findByRole("button", { name: "Delete Acme Retail" }));
    await screen.findByRole("list", { name: "What will be deleted" });
    fireEvent.change(nameBox(), { target: { value: "Acme Retail" } });
    fireEvent.click(deleteButton());
    expect(await screen.findByText(/Acme Retail was deleted: 3 people, 120 contacts, 5,000 messages, 12 files\./)).toBeDefined();
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Acme Retail" })).toBeNull());
    expect(screen.getByRole("heading", { name: "Beta Foods" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Delete Acme Retail?" })).toBeNull();
    expect(api.listDeletedCompanies.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("says which numbers could not be unlinked from their phones", async () => {
    api.listCompanies.mockResolvedValue([company()]);
    api.listPlans.mockResolvedValue(PLANS);
    api.deleteCompany.mockResolvedValue(gone({ numbersNotUnlinked: ["main-line", "sales"] }));
    screenOf();
    fireEvent.click(await screen.findByRole("button", { name: "Delete Acme Retail" }));
    await screen.findByRole("list", { name: "What will be deleted" });
    fireEvent.change(nameBox(), { target: { value: "Acme Retail" } });
    fireEvent.click(deleteButton());
    expect((await screen.findByText(/could not be unlinked from their phones/)).textContent).toContain("Linked devices in WhatsApp: main-line, sales.");
  });

  it("lists the companies that were deleted, who deleted them and when, without their data", async () => {
    api.listCompanies.mockResolvedValue([company()]);
    api.listPlans.mockResolvedValue(PLANS);
    api.listDeletedCompanies.mockResolvedValue([
      { id: 7, companyId: "t9", name: "ZZ Check 3 (delete me)", plan: "Free", owner: { name: "Check", email: "check@example.com" }, createdAt: "2026-11-01T00:00:00Z", counts: { people: 1, contacts: 3, messages: 2, files: 0 }, deletedBy: "root@scriwo.test", deletedAt: "2026-11-09T06:00:00Z" },
    ]);
    screenOf();
    const summary = await screen.findByText("Deleted companies (1)");
    fireEvent.click(summary);
    const list = screen.getByRole("list", { name: "Deleted companies" });
    expect(list.textContent).toContain("ZZ Check 3 (delete me)");
    expect(list.textContent).toContain("Check, check@example.com");
    expect(list.textContent).toContain("by root@scriwo.test");
    expect(list.textContent).toContain("It had 1 people · 3 contacts · 2 messages.");
  });

  it("shows no list of deleted companies when there are none", async () => {
    api.listCompanies.mockResolvedValue([company()]);
    api.listPlans.mockResolvedValue(PLANS);
    screenOf();
    await screen.findByRole("button", { name: "Delete Acme Retail" });
    expect(screen.queryByText(/Deleted companies/)).toBeNull();
  });
});
