import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { META, match, matches } from "./realEstateFixtures";

const re = vi.hoisted(() => ({
  reMeta: vi.fn(),
  reProfile: vi.fn(),
  reNextActions: vi.fn(),
  reMatches: vi.fn(),
  reLeadViewings: vi.fn(),
  reSaveProfile: vi.fn(),
  reProposal: vi.fn(),
  reDraft: vi.fn(),
}));
vi.mock("../services/api", () => ({ getStoredTenantId: () => "t1" }));
vi.mock("../services/realEstate", () => re);
import { QualificationSection } from "../components/realestate/QualificationSection";

const profile = (o: Record<string, unknown> = {}) => ({
  leadId: "l1", leadType: "buyer", intent: "buy", budgetMin: null, budgetMax: 1500000, currency: "AED", communities: ["Dubai Marina"], propertyTypes: ["apartment"], bedroomsMin: 2, bedroomsMax: 3,
  timeline: "3_months", sourceDetail: "", qualificationStatus: "in_progress", disqualifiedReason: "", nextAction: "", notes: "", qualifiedAt: null, ...o,
});
const onBook = vi.fn();
const open = (props: Record<string, unknown> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <QualificationSection leadId="l1" conversationId="chat-1" currency="AED" aiAvailable onBook={onBook} {...props} />
    </QueryClientProvider>,
  );
const section = async (name: string) => within(await screen.findByLabelText(name));
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  for (const fn of Object.values(re)) fn.mockReset();
  onBook.mockReset();
  re.reMeta.mockResolvedValue(META);
  re.reProfile.mockResolvedValue({ profile: null, missing: ["lead type", "buy or rent"] });
  re.reNextActions.mockResolvedValue({ actions: [] });
  re.reMatches.mockResolvedValue({ eligible: false, reason: "Qualify this lead first.", requirements: [], total: 0, candidates: 0, leftOut: {}, freshnessDays: 14, matches: [] });
  re.reLeadViewings.mockResolvedValue({ viewings: [] });
  re.reSaveProfile.mockResolvedValue({ profile: profile(), missing: [], changed: [] });
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(cleanup);

describe("qualifying a lead", () => {
  it("collects what they are looking for and saves exactly that", async () => {
    open();
    await screen.findByLabelText("Qualification");
    change("Lead type", "buyer");
    change("Budget up to", "1500000");
    change("Areas", "Dubai Marina، JVC, Palm Jumeirah");
    fireEvent.click(screen.getByRole("button", { name: "apartment" }));
    fireEvent.click(screen.getByRole("button", { name: "villa" }));
    fireEvent.click(screen.getByRole("button", { name: "villa" }));
    change("Bedrooms from", "2");
    change("Timeline", "3_months");
    change("Where did they come from?", "Property Finder");
    fireEvent.click(screen.getByRole("button", { name: "Save qualification" }));
    await waitFor(() => expect(re.reSaveProfile).toHaveBeenCalledTimes(1));
    expect(re.reSaveProfile).toHaveBeenCalledWith("l1", {
      leadType: "buyer", budgetMin: null, budgetMax: 1500000, currency: "AED", communities: ["Dubai Marina", "JVC", "Palm Jumeirah"], propertyTypes: ["apartment"],
      bedroomsMin: 2, bedroomsMax: null, timeline: "3_months", sourceDetail: "Property Finder", qualificationStatus: "new", disqualifiedReason: "", nextAction: "", notes: "",
    });
    expect(await screen.findByText("Saved.")).toBeDefined();
  });

  it("shows what the server refuses, in its words, and keeps what was typed", async () => {
    re.reSaveProfile.mockRejectedValue(Object.assign(new Error("Before this lead can be marked qualified, add: budget, timeline."), { status: 422, data: { missing: ["budget", "timeline"] } }));
    open();
    await screen.findByLabelText("Qualification");
    change("Lead type", "buyer");
    change("Status", "qualified");
    fireEvent.click(screen.getByRole("button", { name: "Save qualification" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Before this lead can be marked qualified, add: budget, timeline.");
    expect((screen.getByLabelText("Lead type") as HTMLSelectElement).value).toBe("buyer");
  });

  it("starts from what is already known, and says what is still needed", async () => {
    re.reProfile.mockResolvedValue({ profile: profile({ timeline: null }), missing: ["timeline"] });
    open();
    await screen.findByLabelText("Qualification");
    expect((screen.getByLabelText("Budget up to") as HTMLInputElement).value).toBe("1500000");
    expect((screen.getByLabelText("Areas") as HTMLInputElement).value).toBe("Dubai Marina");
    expect(screen.getByRole("button", { name: "apartment" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/still needed: timeline/)).toBeDefined();
  });

  it("a landlord or seller is offering a property, so there is nothing to match and no budget to ask", async () => {
    open();
    await screen.findByLabelText("Qualification");
    change("Lead type", "landlord");
    expect(screen.queryByLabelText("Budget up to")).toBeNull();
    expect(screen.getByText(/is offering a property, so there is nothing to match/)).toBeDefined();
  });

  it("asks why when a lead is marked not a fit", async () => {
    open();
    await screen.findByLabelText("Qualification");
    expect(screen.queryByLabelText("Why is this not a fit?")).toBeNull();
    change("Status", "disqualified");
    change("Why is this not a fit?", "Only browsing");
    fireEvent.click(screen.getByRole("button", { name: "Save qualification" }));
    await waitFor(() => expect(re.reSaveProfile).toHaveBeenCalled());
    expect(re.reSaveProfile.mock.calls[0][1]).toMatchObject({ qualificationStatus: "disqualified", disqualifiedReason: "Only browsing" });
  });

  it("keeps Arabic text as written", async () => {
    open();
    await screen.findByLabelText("Qualification");
    change("Areas", "دبي مارينا، الخليج التجاري");
    change("Notes", "تفضل الطابق العالي");
    fireEvent.click(screen.getByRole("button", { name: "Save qualification" }));
    await waitFor(() => expect(re.reSaveProfile).toHaveBeenCalled());
    expect(re.reSaveProfile.mock.calls[0][1]).toMatchObject({ communities: ["دبي مارينا", "الخليج التجاري"], notes: "تفضل الطابق العالي" });
    expect((screen.getByLabelText("Notes") as HTMLTextAreaElement).getAttribute("dir")).toBe("auto");
  });
});

describe("Riwo's proposal", () => {
  const proposal = {
    status: "proposal", note: "Nothing is saved until you apply it.", proposal: { leadType: "buyer", budgetMax: 1500000, currency: "AED" },
    evidence: { leadType: "I want to buy", budgetMax: "My budget is up to 1.5M AED", currency: "1.5M AED" }, changes: ["leadType", "budgetMax", "currency"],
    rejected: [{ field: "communities", reason: "The quote isn't in the customer's messages" }], conflict: null, missing: ["an area or a property type", "timeline"], uncertain: ["The budget may not be firm"], summary: "",
  };

  it("shows each detail with the customer's own words, and what it left out and why", async () => {
    re.reProposal.mockResolvedValue(proposal);
    open();
    await screen.findByLabelText("Qualification");
    fireEvent.click(screen.getByRole("button", { name: "Read the chat" }));
    const p = await section("Riwo's proposal");
    expect(p.getByText("“My budget is up to 1.5M AED”")).toBeDefined();
    expect(p.getByText(/Left out: Areas \(the quote isn't in the customer's messages\)/)).toBeDefined();
    expect(p.getByText(/Riwo is unsure: The budget may not be firm/)).toBeDefined();
    expect(p.getByText(/Still missing: an area or a property type, timeline/)).toBeDefined();
    expect(p.getByText(/Nothing is saved until you press/)).toBeDefined();
  });

  it("only fills in the form: nothing is saved until a person presses save, and then it is marked as assisted", async () => {
    re.reProposal.mockResolvedValue(proposal);
    open();
    await screen.findByLabelText("Qualification");
    fireEvent.click(screen.getByRole("button", { name: "Read the chat" }));
    const p = await section("Riwo's proposal");
    fireEvent.click(p.getByLabelText("Use Currency"));
    fireEvent.click(p.getByRole("button", { name: "Fill in the form" }));
    expect((screen.getByLabelText("Budget up to") as HTMLInputElement).value).toBe("1500000");
    expect((screen.getByLabelText("Lead type") as HTMLSelectElement).value).toBe("buyer");
    expect(re.reSaveProfile).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Riwo's proposal")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save qualification" }));
    await waitFor(() => expect(re.reSaveProfile).toHaveBeenCalled());
    expect(re.reSaveProfile.mock.calls[0][1]).toMatchObject({ leadType: "buyer", budgetMax: 1500000, assisted: true });
  });

  it("says plainly when it found nothing it could back up, and when it contradicts itself", async () => {
    re.reProposal.mockResolvedValue({ ...proposal, proposal: {}, evidence: {}, changes: [], conflict: "The lowest budget is above the highest" });
    open();
    await screen.findByLabelText("Qualification");
    fireEvent.click(screen.getByRole("button", { name: "Read the chat" }));
    const p = await section("Riwo's proposal");
    expect(p.getByText(/found nothing it could back up/)).toBeDefined();
    expect(p.getByText(/contradicts itself: The lowest budget is above the highest/)).toBeDefined();
    expect(p.getByRole("button", { name: "Fill in the form" }).hasAttribute("disabled")).toBe(true);
  });

  it("shows the error when Riwo cannot answer, and is not offered at all when it is unavailable", async () => {
    re.reProposal.mockRejectedValue(new Error("Your team has used today's 300 AI requests."));
    open();
    await screen.findByLabelText("Qualification");
    fireEvent.click(screen.getByRole("button", { name: "Read the chat" }));
    expect((await screen.findByRole("alert")).textContent).toContain("used today's 300 AI requests");
    cleanup();
    open({ aiAvailable: false });
    await screen.findByLabelText("Qualification");
    expect(screen.queryByRole("button", { name: "Read the chat" })).toBeNull();
    cleanup();
    open({ conversationId: null });
    await screen.findByLabelText("Qualification");
    expect(screen.queryByRole("button", { name: "Read the chat" })).toBeNull();
  });
});

describe("matching listings", () => {
  it("says why each listing matches, warns about what to check, and never shows more than the server returned", async () => {
    re.reMatches.mockResolvedValue(
      matches({
        total: 2,
        matches: [
          match(),
          match({ property: { id: "p2", reference: "DM-OLD", price: 1050000, verification: "stale", verifiedDaysAgo: 40 }, verification: "stale", reasons: ["For sale"], warnings: ["Availability last checked 40 days ago: confirm it before sharing"] }),
        ],
      }),
    );
    open();
    const m = await section("Matching listings");
    expect(await m.findByText(/2 listings meet every requirement they stated \(budget, area\)/)).toBeDefined();
    const first = within(screen.getByTestId("match-DM-101"));
    expect(first.getByText("AED 1,400,000 is within the AED 1,500,000 budget")).toBeDefined();
    expect(first.getByText("Checked today")).toBeDefined();
    const old = within(screen.getByTestId("match-DM-OLD"));
    expect(old.getByText(/last checked 40 days ago: confirm it before sharing/)).toBeDefined();
    expect(old.getByText("Check again · 40d ago")).toBeDefined();
  });

  it("books a viewing for the listing chosen, and copies its details from the record", async () => {
    re.reMatches.mockResolvedValue(matches());
    open();
    const card = within(await screen.findByTestId("match-DM-101"));
    fireEvent.click(card.getByRole("button", { name: /Book a viewing/ }));
    expect(onBook).toHaveBeenCalledWith("p1");
    fireEvent.click(card.getByRole("button", { name: /Copy details/ }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("DM-101: 2 bed, apartment, Dubai Marina, AED 1,400,000\nhttps://listings.example.test/dm-101"));
    expect(await card.findByText("Copied")).toBeDefined();
  });

  it("explains an empty result by what left listings out, and a lead that cannot be matched by what to do", async () => {
    re.reMatches.mockResolvedValue(matches({ matches: [], total: 0, candidates: 9, leftOut: { budget: 5, bedrooms: 3, area: 1 } }));
    open();
    const m = await section("Matching listings");
    expect(await m.findByText(/None of your 9 available listings meets everything they asked for\. Left out: 5 over the budget, 3 a different number of bedrooms, 1 in a different area\./)).toBeDefined();
    cleanup();
    re.reMatches.mockResolvedValue({ eligible: false, reason: "Matching is for buyers, tenants and investors.", requirements: [], total: 0, candidates: 0, leftOut: {}, freshnessDays: 14, matches: [] });
    open();
    expect(await screen.findByText("Matching is for buyers, tenants and investors.")).toBeDefined();
  });

  it("drafts a reply that Riwo built from the listings, shown as a draft and never sent", async () => {
    re.reMatches.mockResolvedValue(matches());
    re.reDraft.mockResolvedValue({ text: "Hi Aisha! DM-101 (2 bed apartment, Dubai Marina, AED 1,400,000) https://listings.example.test/dm-101 may suit you.", references: ["DM-101"], note: "A draft for you to read and edit. Nothing has been sent." });
    open();
    await screen.findByTestId("match-DM-101");
    fireEvent.click(screen.getByRole("button", { name: /Draft a reply with these listings/ }));
    const box = (await screen.findByLabelText("Draft reply")) as HTMLTextAreaElement;
    expect(box.value).toContain("DM-101 (2 bed apartment, Dubai Marina, AED 1,400,000)");
    expect(screen.getByText(/Nothing has been sent\./)).toBeDefined();
    expect(re.reDraft).toHaveBeenCalledWith("l1", "friendly");
    fireEvent.change(box, { target: { value: "Edited by a person" } });
    fireEvent.click(screen.getByRole("button", { name: /Copy the draft/ }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Edited by a person"));
  });

  it("when a draft is refused, says why and offers the listings to share by hand", async () => {
    re.reMatches.mockResolvedValue(matches());
    re.reDraft.mockRejectedValue(Object.assign(new Error("Riwo's draft was set aside: It stated a price or figure of its own. Share the listings by hand instead."), { status: 502, data: { fallback: "DM-101: 2 bed, apartment, Dubai Marina, AED 1,400,000" } }));
    open();
    await screen.findByTestId("match-DM-101");
    fireEvent.click(screen.getByRole("button", { name: /Draft a reply/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("set aside: It stated a price or figure of its own");
    expect(await screen.findByText("DM-101: 2 bed, apartment, Dubai Marina, AED 1,400,000")).toBeDefined();
    expect(screen.queryByLabelText("Draft reply")).toBeNull();
  });

  it("will not offer a draft when no listing has been confirmed available recently", async () => {
    re.reMatches.mockResolvedValue(matches({ matches: [match({ verification: "stale", property: { verification: "stale", verifiedDaysAgo: 30 } })] }));
    open();
    await screen.findByTestId("match-DM-101");
    expect(screen.getByRole("button", { name: /Draft a reply/ }).hasAttribute("disabled")).toBe(true);
  });
});

describe("next steps and viewings", () => {
  it("lists the next steps with their reasons, and the viewings already booked", async () => {
    re.reNextActions.mockResolvedValue({ actions: [{ code: "offer_viewing", text: "Offer a viewing: DM-101", why: "1 available listing fits what they asked for, and no viewing has been booked." }] });
    re.reLeadViewings.mockResolvedValue({ viewings: [{ id: "v1", propertyReference: "DM-101", local: { text: "Thu 5 Nov 2026, 16:00" }, status: "confirmed" }] });
    open();
    const n = await section("Next steps");
    expect(n.getByText("Offer a viewing: DM-101")).toBeDefined();
    expect(n.getByText(/no viewing has been booked/)).toBeDefined();
    const v = await section("Viewings");
    expect(await v.findByText("DM-101 · Thu 5 Nov 2026, 16:00")).toBeDefined();
    expect(v.getByText("Confirmed")).toBeDefined();
    fireEvent.click(v.getByRole("button", { name: /Book/ }));
    expect(onBook).toHaveBeenCalledWith();
  });
});
