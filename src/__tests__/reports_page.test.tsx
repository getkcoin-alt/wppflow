import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  fetchTeamResponse: vi.fn(),
  fetchAgentEpisodes: vi.fn(),
  exportTeamResponse: vi.fn(),
  exportAgentEpisodes: vi.fn(),
  fetchDailyReport: vi.fn(),
  fetchDailyChats: vi.fn(),
  fetchReportSettings: vi.fn(),
  saveReportSettings: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { Reports } from "../components/reports/Reports";
import { formatDuration } from "../utils/duration";
import type { WhatsAppSession } from "../types";

const agent = (over = {}) => ({ rank: 1, userId: 2, name: "Sam", team: "sales", answered: 8, enoughData: true, medianSeconds: 320, p90Seconds: 1800, meanSeconds: 500, withinSlaPercent: 100, chatsHandled: 8, repliesSent: 9, slaMinutes: 30, ...over });
const REPORT = {
  range: { from: "2026-09-26", to: "2026-10-25" },
  timeNote: "Times are wall-clock: a message sent at night counts until someone answers in the morning.",
  minSample: 5,
  settings: { slaMinutes: 30, taskEscalationHours: 24, dailyInApp: true, dailyEmail: false, teams: {} },
  teams: ["sales", "support"],
  totals: { answered: 11, enoughData: true, medianSeconds: 240, p90Seconds: 1800, meanSeconds: 400, withinSlaPercent: 91, waiting: 2 },
  agents: [agent(), agent({ rank: null, userId: 3, name: "Tina", team: "support", answered: 3, enoughData: false, medianSeconds: null, p90Seconds: null, meanSeconds: null, withinSlaPercent: null })],
  waiting: [{ conversationId: "c9", contact: "Asha Khan", session: "line-sam", assignedTo: "Sam", since: "2026-10-25T08:00:00Z", waitingSeconds: 7200 }],
  daily: [{ date: "2026-10-24", answered: 6, enoughData: true, medianSeconds: 300, p90Seconds: 900, meanSeconds: 400 }, { date: "2026-10-25", answered: 2, enoughData: false, medianSeconds: null, p90Seconds: null, meanSeconds: null }],
};
const sessions = [{ sessionKey: "line-sam", displayName: "Sam", phone: "971500000001", ownerName: "Sam", ownerUserId: 2 }, { sessionKey: "line-tina", displayName: "Tina", phone: "971500000002", ownerName: "Tina", ownerUserId: 3 }] as unknown as WhatsAppSession[];
const wrap = (props: Partial<React.ComponentProps<typeof Reports>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Reports sessions={sessions} currentUserId={1} onOpenChat={vi.fn()} {...props} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.fetchTeamResponse.mockResolvedValue(REPORT);
});
afterEach(cleanup);

describe("durations", () => {
  it("are said the way people say them", () => {
    expect(formatDuration(null)).toBe("No data yet");
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(320)).toBe("5 min");
    expect(formatDuration(5400)).toBe("1.5 h");
    expect(formatDuration(7 * 3600)).toBe("7.0 h");
    expect(formatDuration(30 * 3600)).toBe("1.3 days");
  });
});

describe("Reports", () => {
  it("shows the totals, the leaderboard and what is waiting, and says times are wall-clock", async () => {
    wrap();
    expect(await screen.findByText("Chats answered")).toBeDefined();
    expect(screen.getByText("11")).toBeDefined();
    expect(screen.getAllByText("4 min").length).toBeGreaterThan(0);
    expect(screen.getByText("91%")).toBeDefined();
    expect(screen.getByText(/wall-clock/)).toBeDefined();
    const board = within(screen.getByRole("region", { name: "Leaderboard" }));
    const sam = within(board.getByText("Sam").closest("tr") as HTMLElement);
    expect(sam.getByText("5 min")).toBeDefined();
    expect(sam.getByText("100%")).toBeDefined();
    const tina = within(board.getByText("Tina").closest("tr") as HTMLElement);
    expect(tina.getByText("Not enough data")).toBeDefined();
    expect(tina.getByText("3")).toBeDefined();
    const waiting = within(screen.getByRole("region", { name: "Waiting for a reply" }));
    expect(waiting.getByText("Asha Khan")).toBeDefined();
    expect(waiting.getByText(/Waiting 2\.0 h/)).toBeDefined();
  });

  it("opens a waiting chat", async () => {
    const onOpenChat = vi.fn();
    wrap({ onOpenChat });
    fireEvent.click(await screen.findByRole("button", { name: "Open the chat with Asha Khan" }));
    expect(onOpenChat).toHaveBeenCalledWith("c9");
  });

  it("asks for the dates, team and number that were picked", async () => {
    wrap();
    await screen.findByText("Chats answered");
    expect(api.fetchTeamResponse).toHaveBeenLastCalledWith(expect.objectContaining({ from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }));
    fireEvent.change(screen.getByLabelText("Team"), { target: { value: "support" } });
    await waitFor(() => expect(api.fetchTeamResponse).toHaveBeenLastCalledWith(expect.objectContaining({ team: "support" })));
    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "line-tina" } });
    await waitFor(() => expect(api.fetchTeamResponse).toHaveBeenLastCalledWith(expect.objectContaining({ team: "support", sessionName: "line-tina" })));
    fireEvent.click(screen.getByRole("tab", { name: "7 days" }));
    await waitFor(() => {
      const last = api.fetchTeamResponse.mock.calls.at(-1)![0];
      expect((Date.parse(last.to) - Date.parse(last.from)) / 86400000).toBe(6);
    });
    fireEvent.click(screen.getByRole("tab", { name: "Pick dates" }));
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-10-05" } });
    await waitFor(() => expect(api.fetchTeamResponse).toHaveBeenLastCalledWith(expect.objectContaining({ from: "2026-10-01", to: "2026-10-05" })));
  });

  it("exports the leaderboard, and says when the export fails", async () => {
    api.exportTeamResponse.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("The file could not be downloaded. Please try again."));
    wrap();
    const board = within(await screen.findByRole("region", { name: "Leaderboard" }));
    fireEvent.click(board.getByRole("button", { name: /Export CSV/ }));
    await waitFor(() => expect(api.exportTeamResponse).toHaveBeenCalledWith(expect.objectContaining({ from: expect.any(String) })));
    fireEvent.click(board.getByRole("button", { name: /Export CSV/ }));
    expect(await board.findByText(/could not be downloaded/)).toBeDefined();
  });

  it("shows the chats behind a person's numbers, and opens one", async () => {
    api.fetchAgentEpisodes.mockResolvedValue([{ conversationId: "c1", contact: "Asha Khan", session: "line-sam", asked: "x", replied: "y", seconds: 120 }]);
    const onOpenChat = vi.fn();
    wrap({ onOpenChat });
    fireEvent.click(await screen.findByRole("button", { name: "Show the chats behind Sam's numbers" }));
    const d = within(await screen.findByRole("dialog", { name: /Sam: the chats behind the numbers/ }));
    expect(await d.findByText("Asha Khan")).toBeDefined();
    expect(d.getByText("2 min")).toBeDefined();
    expect(api.fetchAgentEpisodes).toHaveBeenCalledWith(expect.objectContaining({ userId: 2 }));
    fireEvent.click(d.getByRole("button", { name: "Open" }));
    expect(onOpenChat).toHaveBeenCalledWith("c1");
  });

  it("says plainly when nobody answered anything", async () => {
    api.fetchTeamResponse.mockResolvedValue({ ...REPORT, agents: [], waiting: [], daily: [], totals: { ...REPORT.totals, answered: 0, enoughData: false, medianSeconds: null, p90Seconds: null, withinSlaPercent: null, waiting: 0 } });
    wrap();
    expect(await screen.findByText(/Nobody on the team answered a chat in these dates/)).toBeDefined();
    expect(screen.getByText(/No open chat is waiting/)).toBeDefined();
  });

  it("shows the day by day trend", async () => {
    wrap();
    const days = within(await screen.findByRole("region", { name: "Day by day" }));
    expect(days.getByText("24 Oct")).toBeDefined();
    expect(days.getByText(/6 answered/)).toBeDefined();
  });

  it("shows the owner's daily report by number, team and person, with the chats behind each", async () => {
    api.fetchDailyReport.mockResolvedValue({
      date: "2026-10-24", newChats: 6, received: 40, replied: 38, answered: 14, medianSeconds: 240, withinSlaPercent: 90, waitingNow: 2, topAgent: { name: "Sam", answered: 8 },
      numbers: [{ session: "line-sam", label: "Sam", team: "sales", newChats: 6, chatsActive: 20, received: 30, replied: 28 }],
      teams: [{ team: "sales", answered: 8, repliesSent: 9, people: 1 }],
      agents: [agent()],
    });
    api.fetchDailyChats.mockResolvedValue([{ id: "c1", contact: "Asha Khan", session: "line-sam", assignedTo: "", received: 3, replied: 2, repliedBy: "Sam", lastAt: "2026-10-24T10:00:00Z" }]);
    wrap();
    fireEvent.click(await screen.findByRole("tab", { name: "Daily report" }));
    expect(await screen.findByText("New chats")).toBeDefined();
    expect(screen.getByText(/Most chats answered:/)).toBeDefined();
    const numbers = within(screen.getByRole("region", { name: "By WhatsApp number" }));
    expect(numbers.getByText("6 new")).toBeDefined();
    fireEvent.click(numbers.getByRole("button", { name: "Show the chats on Sam" }));
    const d = within(await screen.findByRole("dialog", { name: /Sam: chats on/ }));
    expect(await d.findByText("Asha Khan")).toBeDefined();
    expect(api.fetchDailyChats).toHaveBeenLastCalledWith(expect.objectContaining({ sessionName: "line-sam" }));
    fireEvent.click(d.getAllByRole("button", { name: "Close" })[1]);
    fireEvent.click(within(screen.getByRole("region", { name: "By team" })).getByRole("button", { name: "Show the sales team's chats" }));
    await waitFor(() => expect(api.fetchDailyChats).toHaveBeenLastCalledWith(expect.objectContaining({ team: "sales" })));
  });

  it("saves the reply target, a team's own target and the morning summary choices", async () => {
    api.fetchReportSettings.mockResolvedValue({ slaMinutes: 30, taskEscalationHours: 24, dailyInApp: true, dailyEmail: false, teams: { support: 5 } });
    api.saveReportSettings.mockResolvedValue({});
    wrap();
    fireEvent.click(await screen.findByRole("tab", { name: "Settings" }));
    const form = within(await screen.findByRole("form", { name: "Report settings" }));
    expect((form.getByLabelText("support team target in minutes") as HTMLInputElement).value).toBe("5");
    fireEvent.change(form.getByLabelText("Reply target in minutes"), { target: { value: "15" } });
    fireEvent.change(form.getByLabelText("support team target in minutes"), { target: { value: "" } });
    fireEvent.change(form.getByLabelText("sales team target in minutes"), { target: { value: "10" } });
    fireEvent.click(form.getByLabelText(/Also email the owner/));
    expect((form.getByLabelText("Escalate overdue follow-ups after hours") as HTMLInputElement).value).toBe("24");
    fireEvent.change(form.getByLabelText("Escalate overdue follow-ups after hours"), { target: { value: "48" } });
    fireEvent.click(form.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(api.saveReportSettings).toHaveBeenCalledWith({ slaMinutes: 15, taskEscalationHours: 48, dailyInApp: true, dailyEmail: true, teams: { sales: 10 } }));
    expect(await form.findByText("Saved.")).toBeDefined();
  });

  it("shows why settings could not be saved", async () => {
    api.fetchReportSettings.mockResolvedValue({ slaMinutes: 30, taskEscalationHours: 24, dailyInApp: true, dailyEmail: false, teams: {} });
    api.saveReportSettings.mockRejectedValue(new Error("The reply target must be a whole number of minutes from 1 to 10080"));
    wrap();
    fireEvent.click(await screen.findByRole("tab", { name: "Settings" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save settings" }));
    expect(await screen.findByText(/whole number of minutes/)).toBeDefined();
  });
});
