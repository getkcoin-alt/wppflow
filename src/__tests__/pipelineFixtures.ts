import type { Board, Lead, PipelineSettings, PipelineStage } from "../services/api";

export const STAGES: PipelineStage[] = [
  { id: "s1", name: "New", kind: "open", position: 0 },
  { id: "s2", name: "Contacted", kind: "open", position: 1 },
  { id: "s3", name: "Qualified", kind: "open", position: 2 },
  { id: "s4", name: "Won", kind: "won", position: 3 },
  { id: "s5", name: "Lost", kind: "lost", position: 4 },
];
export const TEAM = [
  { id: 1, name: "Olivia Owner" },
  { id: 2, name: "Sam Agent" },
];

export const lead = (over: Partial<Lead> = {}): Lead => {
  const stage = STAGES.find((s) => s.id === (over.stageId || "s1"))!;
  return {
    id: "l1",
    title: "2BR Marina",
    contactId: "c1",
    contactName: "Aisha Khan",
    phone: "971500000001",
    email: "",
    tags: [],
    sessionName: "sam-line",
    conversationId: "chat-1",
    stageId: stage.id,
    stageName: stage.name,
    stageKind: stage.kind,
    status: stage.kind,
    value: 1400000,
    source: "chat",
    ownerUserId: 2,
    ownerName: "Sam Agent",
    lostReason: "",
    expectedClose: null,
    stageChangedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    closedAt: null,
    createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    lastMessage: { text: "Can we view it on Saturday?", fromMe: false, at: null },
    unread: 0,
    openTasks: 0,
    nextTask: null,
    ...over,
  };
};

export const board = (leads: Lead[] = [lead(), lead({ id: "l2", contactName: "Bilal", title: "", value: 0, stageId: "s2", ownerUserId: null, ownerName: "" })]): Board => ({
  pipeline: { id: "p", name: "Sales", preset: "general" },
  currency: "AED",
  stages: STAGES.map((s) => {
    const mine = leads.filter((l) => l.stageId === s.id);
    return { ...s, count: mine.length, value: mine.reduce((n, l) => n + l.value, 0), leads: mine };
  }),
  totals: { open: leads.filter((l) => l.status === "open").length, openValue: leads.filter((l) => l.status === "open").reduce((n, l) => n + l.value, 0), won: 0 },
  perColumn: 30,
});

export const settings = (over: Partial<PipelineSettings> = {}): PipelineSettings => ({
  pipeline: { id: "p", name: "Sales", preset: "general" },
  currency: "AED",
  stages: STAGES.map((s) => ({ ...s, leads: s.id === "s1" ? 1 : 0 })),
  presets: [
    { id: "general", name: "General sales", stages: ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] },
    { id: "real_estate", name: "Real estate", stages: ["New enquiry", "Contacted", "Viewing booked", "Offer made", "Negotiation", "Deal closed", "Lost"] },
  ],
  autoCreate: { exists: false, enabled: false },
  ...over,
});

export const task = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  leadId: "l1",
  title: "Send the brochure",
  dueAt: new Date(Date.now() - 3_600_000).toISOString(),
  assignedUserId: 2,
  assignedName: "Sam Agent",
  done: false,
  doneAt: null,
  leadTitle: "2BR Marina",
  contactName: "Aisha Khan",
  stageName: "New",
  conversationId: "chat-1",
  ...over,
});
