import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { TEAM, lead, settings } from "./pipelineFixtures";

const api = vi.hoisted(() => ({
  fetchContacts: vi.fn(),
  addContact: vi.fn(),
  patchContact: vi.fn(),
  apiPost: vi.fn(),
  removeContact: vi.fn(),
  bulkCreateLeads: vi.fn(),
  createLead: vi.fn(),
  addLeadTask: vi.fn(),
  aiLeadSuggestion: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", () => api);
import { Contacts } from "../components/user/Contacts";

const people = [
  { id: "c1", name: "Aisha Khan", phone: "971500000001", email: "", tags: ["vip"], optIn: true },
  { id: "c2", name: "Bilal", phone: "971500000002", email: "", tags: [], optIn: false },
];
const wrap = (pipeline?: Parameters<typeof Contacts>[0]["pipeline"]) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Contacts onSelectChat={() => {}} pipeline={pipeline} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  api.fetchContacts.mockResolvedValue({ contacts: people, nextCursor: null });
  api.fetchPipelineSettings.mockResolvedValue(settings());
});
afterEach(cleanup);

describe("Contacts and the pipeline", () => {
  it("has no pipeline actions on a plan without the pipeline", async () => {
    wrap(undefined);
    await screen.findByText("Aisha Khan");
    expect(screen.queryByRole("button", { name: /to the pipeline/ })).toBeNull();
    expect(screen.queryByLabelText("Select Aisha Khan")).toBeNull();
  });

  it("adds one contact to the pipeline from their row", async () => {
    api.createLead.mockResolvedValue({ lead: lead({ contactName: "Bilal" }), existing: false });
    wrap({ teammates: TEAM, isManager: false, aiAvailable: false });
    await screen.findByText("Bilal");
    expect(screen.queryByLabelText("Select Bilal")).toBeNull(); // staff pick one at a time
    fireEvent.click(screen.getByRole("button", { name: "Add Bilal to the pipeline" }));
    const d = within(await screen.findByRole("dialog", { name: "Add to pipeline" }));
    expect(d.getAllByText("Bilal").length).toBeGreaterThan(0);
    fireEvent.click(d.getByRole("button", { name: "Add lead" }));
    await waitFor(() => expect(api.createLead).toHaveBeenCalledWith(expect.objectContaining({ contactId: "c2" })));
    expect(await screen.findByText("Bilal is in your pipeline.")).toBeDefined();
  });

  it("lets a manager pick several contacts and add them together", async () => {
    api.bulkCreateLeads.mockResolvedValue({ created: 1, skipped: 1 });
    wrap({ teammates: TEAM, isManager: true, aiAvailable: false });
    await screen.findByText("Aisha Khan");
    expect(screen.queryByText(/selected/)).toBeNull();
    fireEvent.click(screen.getByLabelText("Select Aisha Khan"));
    fireEvent.click(screen.getByLabelText("Select Bilal"));
    expect(screen.getByText("2 selected")).toBeDefined();
    fireEvent.click(within(screen.getByRole("status")).getByRole("button", { name: "Add to pipeline" }));
    await waitFor(() => expect(api.bulkCreateLeads).toHaveBeenCalledWith(["c1", "c2"]));
    expect(await screen.findByText("1 added to the pipeline. 1 already had a lead.")).toBeDefined();
    expect(screen.queryByText(/selected/)).toBeNull();
  });

  it("clears a selection", async () => {
    wrap({ teammates: TEAM, isManager: true, aiAvailable: false });
    await screen.findByText("Aisha Khan");
    fireEvent.click(screen.getByLabelText("Select Bilal"));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText(/selected/)).toBeNull();
  });
});
