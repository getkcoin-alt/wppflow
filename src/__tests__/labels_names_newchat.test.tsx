import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  fetchContacts: vi.fn(),
  addContact: vi.fn(),
  patchContact: vi.fn(),
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  removeContact: vi.fn(),
  bulkCreateLeads: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  getStoredTenantId: () => "t1",
  fetchLabels: vi.fn(),
  createLabel: vi.fn(),
  updateLabel: vi.fn(),
  deleteLabel: vi.fn(),
  applyLabels: vi.fn(),
  lookupNumber: vi.fn(),
  startChat: vi.fn(),
  getContacts: vi.fn(),
  createGroup: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { Contacts } from "../components/user/Contacts";
import { NewChatSheet } from "../components/user/NewChatSheet";
import { Inbox } from "../components/user/Inbox";
import { LabelChip } from "../components/labels/LabelChip";
import type { ChatThread, WhatsAppSession } from "../types";

const VIP = { id: "l1", name: "VIP", color: "red" as const, contacts: 2 };
const COLD = { id: "l2", name: "Cold", color: "blue" as const, contacts: 1 };
const people = [
  { id: "c1", name: "Aisha Khan", phone: "971500000001", email: "", labels: [VIP, COLD], optIn: true, whatsappName: "Aisha", nameEdited: true },
  { id: "c2", name: "Bilal", phone: "971500000002", email: "", labels: [], optIn: false },
];
const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  api.fetchContacts.mockResolvedValue({ contacts: people, nextCursor: null });
  api.getContacts.mockResolvedValue({ status: "success", contacts: people });
  api.fetchLabels.mockResolvedValue([VIP, COLD]);
});
afterEach(cleanup);

describe("labels", () => {
  it("shows each contact's labels as coloured chips with their names", async () => {
    wrap(<Contacts onSelectChat={() => {}} />);
    await screen.findByText("Aisha Khan");
    const row = within(screen.getByText("Aisha Khan").closest("li") as HTMLElement);
    expect(row.getByText("VIP")).toBeDefined();
    expect(row.getByText("Cold")).toBeDefined();
    expect(document.querySelector("[data-label='VIP']")?.className).toContain("red");
  });

  it("asks the server for contacts with any, or all, of the chosen labels, or with none", async () => {
    wrap(<Contacts onSelectChat={() => {}} />);
    await screen.findByText("Aisha Khan");
    const bar = within(screen.getByRole("group", { name: "Filter by label" }));
    fireEvent.click(bar.getByRole("button", { name: "VIP" }));
    await waitFor(() => expect(api.fetchContacts).toHaveBeenLastCalledWith({ search: "", label: "l1" }));
    fireEvent.click(bar.getByRole("button", { name: "Cold" }));
    await waitFor(() => expect(api.fetchContacts).toHaveBeenLastCalledWith({ search: "", label: "l1,l2", labelMode: "any" }));
    fireEvent.click(bar.getByRole("button", { name: "All of these" }));
    await waitFor(() => expect(api.fetchContacts).toHaveBeenLastCalledWith({ search: "", label: "l1,l2", labelMode: "all" }));
    fireEvent.click(bar.getByRole("button", { name: "No label" }));
    await waitFor(() => expect(api.fetchContacts).toHaveBeenLastCalledWith({ search: "", label: "none" }));
    fireEvent.click(bar.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(api.fetchContacts).toHaveBeenLastCalledWith({ search: "" }));
  });

  it("labels several selected contacts at once, and unlabels them", async () => {
    api.applyLabels.mockResolvedValue({ updated: 2 });
    wrap(<Contacts onSelectChat={() => {}} />);
    await screen.findByText("Aisha Khan");
    fireEvent.click(screen.getByLabelText("Select Aisha Khan"));
    fireEvent.click(screen.getByLabelText("Select Bilal"));
    expect(screen.getByText("2 selected")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Add a label to the selected contacts"), { target: { value: "l2" } });
    await waitFor(() => expect(api.applyLabels).toHaveBeenCalledWith({ contactIds: ["c1", "c2"], add: ["l2"] }));
    expect(await screen.findByText("2 contacts updated.")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Remove a label from the selected contacts"), { target: { value: "l1" } });
    await waitFor(() => expect(api.applyLabels).toHaveBeenLastCalledWith({ contactIds: ["c1", "c2"], remove: ["l1"] }));
  });

  it("lets a manager make, rename, recolour and delete labels; staff do not get the button", async () => {
    api.createLabel.mockResolvedValue({ id: "l3", name: "Wholesale", color: "green" });
    api.updateLabel.mockResolvedValue({});
    api.deleteLabel.mockResolvedValue({});
    const { unmount } = wrap(<Contacts onSelectChat={() => {}} canManageLabels />);
    await screen.findByText("Aisha Khan");
    fireEvent.click(screen.getByRole("button", { name: /Labels/ }));
    const d = within(await screen.findByRole("dialog", { name: "Labels" }));
    fireEvent.change(d.getByLabelText("New label name"), { target: { value: "Wholesale" } });
    fireEvent.click(d.getByRole("button", { name: "Add label" }));
    await waitFor(() => expect(api.createLabel).toHaveBeenCalledWith("Wholesale", "blue"));

    fireEvent.change(d.getByLabelText("Name of VIP"), { target: { value: "Gold" } });
    const row = within(d.getByRole("listitem", { name: "VIP" }));
    fireEvent.click(row.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.updateLabel).toHaveBeenCalledWith("l1", { name: "Gold" }));
    fireEvent.click(within(d.getByRole("group", { name: "VIP colour" })).getByRole("button", { name: "green" }));
    await waitFor(() => expect(api.updateLabel).toHaveBeenCalledWith("l1", { color: "green" }));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(d.getByRole("button", { name: "Delete Cold" }));
    await waitFor(() => expect(api.deleteLabel).toHaveBeenCalledWith("l2"));
    unmount();
    wrap(<Contacts onSelectChat={() => {}} />);
    await screen.findByText("Aisha Khan");
    expect(screen.queryByRole("button", { name: /^Labels$/ })).toBeNull();
  });

  it("shows the server's reason when a label cannot be made", async () => {
    api.createLabel.mockRejectedValue(new Error('There is already a label called "VIP"'));
    wrap(<Contacts onSelectChat={() => {}} canManageLabels />);
    await screen.findByText("Aisha Khan");
    fireEvent.click(screen.getByRole("button", { name: /Labels/ }));
    const d = within(await screen.findByRole("dialog", { name: "Labels" }));
    fireEvent.change(d.getByLabelText("New label name"), { target: { value: "vip" } });
    fireEvent.click(d.getByRole("button", { name: "Add label" }));
    expect(await d.findByText(/already a label called "VIP"/)).toBeDefined();
  });

  it("chip names are always written, never colour alone", () => {
    render(<LabelChip label={{ name: "Hot lead", color: "orange" }} />);
    expect(screen.getByText("Hot lead")).toBeDefined();
  });
});

describe("contact names and numbers", () => {
  it("saves the labels picked in the form with the contact, and shows the WhatsApp name beside the typed one", async () => {
    api.patchContact.mockResolvedValue({ contact: people[0] });
    wrap(<Contacts onSelectChat={() => {}} />);
    await screen.findByText("Aisha Khan");
    fireEvent.click(within(screen.getByText("Aisha Khan").closest("li") as HTMLElement).getByRole("button", { name: "Edit" }));
    const d = within(await screen.findByRole("dialog", { name: "Edit contact" }));
    expect(d.getByText(/WhatsApp shows “Aisha”/)).toBeDefined();
    fireEvent.click(d.getByRole("button", { name: "Use that name" }));
    expect((d.getByLabelText("Name") as HTMLInputElement).value).toBe("Aisha");
    fireEvent.click(d.getByRole("button", { name: /^Remove VIP$/ }));
    fireEvent.click(d.getByRole("button", { name: "Save contact" }));
    await waitFor(() => expect(api.patchContact).toHaveBeenCalledWith("c1", { name: "Aisha", email: "", labelIds: ["l2"], optIn: true }));
  });

  it("points at the existing contact when a number is already saved", async () => {
    const dup = Object.assign(new Error('+971500000002 is already saved as "Bilal"'), { status: 409, data: { contactId: "c2" } });
    api.addContact.mockRejectedValue(dup);
    api.apiGet.mockResolvedValue({ contact: people[1] });
    wrap(<Contacts onSelectChat={() => {}} />);
    await screen.findByText("Aisha Khan");
    fireEvent.click(screen.getByRole("button", { name: /New contact/ }));
    const d = within(await screen.findByRole("dialog", { name: "New contact" }));
    fireEvent.change(d.getByLabelText("Name"), { target: { value: "Someone" } });
    fireEvent.change(d.getByLabelText(/^Phone/), { target: { value: "+971 50 000 0002" } });
    fireEvent.click(d.getByRole("button", { name: "Save contact" }));
    expect(await d.findByText(/already saved as "Bilal"/)).toBeDefined();
    fireEvent.click(d.getByRole("button", { name: "Open that contact" }));
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith("/api/contacts/c2"));
    expect(await screen.findByRole("dialog", { name: "Edit contact" })).toBeDefined();
  });

  it("says how many import rows were skipped and why", async () => {
    api.apiPost.mockResolvedValue({ imported: 2, skippedCount: 1, skipped: [{ name: "Local", phone: "0501234567", reason: "Enter the number with its country code" }] });
    wrap(<Contacts onSelectChat={() => {}} />);
    await screen.findByText("Aisha Khan");
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const file = new File(["name,phone\nA,971500000009\nB,971500000010\nLocal,0501234567\n"], "c.csv", { type: "text/csv" });
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);
    expect(await screen.findByText(/2 contact rows imported\. 1 skipped \(Local: Enter the number with its country code\)/)).toBeDefined();
  });

  it("starts the chat from the row with the contact's details", async () => {
    const onSelectChat = vi.fn();
    wrap(<Contacts onSelectChat={onSelectChat} />);
    await screen.findByText("Bilal");
    fireEvent.click(within(screen.getByText("Bilal").closest("li") as HTMLElement).getByRole("button", { name: "Message" }));
    expect(onSelectChat).toHaveBeenCalledWith({ contactId: "c2", name: "Bilal", phone: "971500000002", optIn: false });
  });
});

const line = (over: Partial<WhatsAppSession>): WhatsAppSession => ({
  id: "s", sessionKey: "line-1", displayName: "Line", phone: "971500000100", status: "CONNECTED", battery: 1, isCharging: false, antiBanHealth: 1, warmupDay: 1, proxyIp: "", messagesSentToday: 0, messagesLimitToday: 1, lastActive: "", wppVersion: "", channel: "sales", ownerUserId: 1, ownerName: "Olivia Owner", ...over,
});

describe("New chat", () => {
  const open = (props: Partial<React.ComponentProps<typeof NewChatSheet>> = {}) => {
    const onStarted = vi.fn();
    wrap(<NewChatSheet open sessions={[line({}), line({ sessionKey: "line-2", ownerName: "Sam Agent", ownerUserId: 2, phone: "971500000200" })]} currentUserId={1} onClose={() => {}} onStarted={onStarted} {...props} />);
    return onStarted;
  };

  it("checks the number as it is typed and refuses a half number", async () => {
    api.lookupNumber.mockResolvedValue({ valid: false, message: "Enter the number with its country code, for example +971 50 123 4567" });
    open();
    const dialog = within(screen.getByRole("dialog", { name: "New chat" }));
    fireEvent.change(dialog.getByLabelText("WhatsApp number"), { target: { value: "0501234567" } });
    expect((await dialog.findByRole("alert")).textContent).toContain("country code");
    expect((dialog.getByRole("button", { name: "Start chat" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("starts a chat with a new number from the chosen WhatsApp number, with a name and a permission warning", async () => {
    api.lookupNumber.mockResolvedValue({ valid: true, phone: "971500000005", display: "+971500000005", contact: null });
    api.startChat.mockResolvedValue({ conversation: { id: "conv9" }, contactCreated: true, optedIn: null });
    const onStarted = open();
    const dialog = within(screen.getByRole("dialog", { name: "New chat" }));
    fireEvent.change(dialog.getByLabelText("Send from"), { target: { value: "line-2" } });
    fireEvent.change(dialog.getByLabelText("WhatsApp number"), { target: { value: "+971 50 000 0005" } });
    expect(await dialog.findByText(/is new\. It will be saved as a contact/)).toBeDefined();
    expect(dialog.getByTestId("consent-warning").textContent).toContain("has not agreed");
    fireEvent.change(dialog.getByLabelText("Name"), { target: { value: "Mariam" } });
    fireEvent.click(dialog.getByRole("button", { name: "Start chat" }));
    await waitFor(() => expect(api.startChat).toHaveBeenCalledWith({ phone: "+971 50 000 0005", sessionName: "line-2", name: "Mariam" }));
    await waitFor(() => expect(onStarted).toHaveBeenCalledWith(expect.objectContaining({ contactCreated: true })));
  });

  it("recognises a saved contact and does not warn when they have agreed", async () => {
    api.lookupNumber.mockResolvedValue({ valid: true, phone: "971500000001", display: "+971500000001", contact: { id: "c1", name: "Aisha Khan", optIn: true, labels: [] } });
    open();
    const dialog = within(screen.getByRole("dialog", { name: "New chat" }));
    fireEvent.change(dialog.getByLabelText("WhatsApp number"), { target: { value: "971500000001" } });
    expect(await dialog.findByText("Aisha Khan")).toBeDefined();
    expect(dialog.queryByTestId("consent-warning")).toBeNull();
    expect(dialog.queryByLabelText("Name")).toBeNull();
  });

  it("opens a saved contact's chat on a chosen number, with the number fixed", async () => {
    api.startChat.mockResolvedValue({ conversation: { id: "conv1" }, contactCreated: false, optedIn: false });
    const onStarted = open({ person: { contactId: "c2", name: "Bilal", phone: "971500000002", optIn: false } });
    const dialog = within(screen.getByRole("dialog", { name: "New chat" }));
    expect((dialog.getByLabelText("WhatsApp number") as HTMLInputElement).readOnly).toBe(true);
    expect(api.lookupNumber).not.toHaveBeenCalled();
    expect(dialog.getByTestId("consent-warning")).toBeDefined();
    fireEvent.click(dialog.getByRole("button", { name: "Start chat" }));
    await waitFor(() => expect(api.startChat).toHaveBeenCalledWith({ contactId: "c2", sessionName: "line-1" }));
    await waitFor(() => expect(onStarted).toHaveBeenCalled());
  });

  it("shows why a chat could not be started", async () => {
    api.lookupNumber.mockResolvedValue({ valid: true, phone: "971500000404", display: "+971500000404", contact: null });
    api.startChat.mockRejectedValue(new Error("+971500000404 is not on WhatsApp. Check the number and the country code."));
    open();
    const dialog = within(screen.getByRole("dialog", { name: "New chat" }));
    fireEvent.change(dialog.getByLabelText("WhatsApp number"), { target: { value: "+971500000404" } });
    await dialog.findByText(/is new/);
    fireEvent.click(dialog.getByRole("button", { name: "Start chat" }));
    expect(await dialog.findByText(/is not on WhatsApp/)).toBeDefined();
  });

  it("says so when none of the numbers is connected", () => {
    open({ sessions: [line({ status: "DISCONNECTED" })] });
    expect(screen.getByText(/None of your WhatsApp numbers is connected/)).toBeDefined();
    expect((screen.getByRole("button", { name: "Start chat" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("switches to New group mode and creates a WhatsApp group with participants", async () => {
    api.createGroup.mockResolvedValue({
      status: "success",
      conversation: { id: "conv_grp_1", contactName: "Founders Circle", isGroup: true, groupMembersCount: 2 },
      groupId: "120363000000@g.us",
    });
    const onStarted = open();
    fireEvent.click(screen.getByRole("button", { name: "New group" }));
    const dialog = within(screen.getByRole("dialog", { name: "New group" }));
    fireEvent.change(dialog.getByLabelText("Group subject"), { target: { value: "Founders Circle" } });

    // Pick contact Aisha Khan from list
    await dialog.findByText("Aisha Khan");
    fireEvent.click(dialog.getByText("Aisha Khan"));

    expect(dialog.getByText("1 selected")).toBeDefined();
    fireEvent.click(dialog.getByRole("button", { name: "Create group" }));

    await waitFor(() =>
      expect(api.createGroup).toHaveBeenCalledWith({
        sessionName: "line-1",
        title: "Founders Circle",
        participants: ["971500000001"],
      }),
    );
    await waitFor(() =>
      expect(onStarted).toHaveBeenCalledWith(
        expect.objectContaining({ conversation: expect.objectContaining({ isGroup: true }) }),
      ),
    );
  });
});

describe("the Inbox", () => {
  const chat = (over: Partial<ChatThread> = {}): ChatThread => ({
    id: "conv_1", contactId: "cont_1", contactName: "Aisha Khan", phone: "971500000001", avatar: "", unreadCount: 0, isGroup: false, channel: "line-1", assignedTo: "", tags: [],
    labels: [VIP, COLD, { id: "l3", name: "Event", color: "teal" }, { id: "l4", name: "Wholesale", color: "green" }],
    lastMessage: { text: "hello", timestamp: "10:30 AM", status: "delivered", fromMe: false }, ...over,
  });
  const contact = { id: "cont_1", name: "Aisha Khan", whatsappName: "Aisha", phone: "971500000001", email: "", avatar: "", labels: [VIP], tags: ["VIP"], storeConnected: false, notes: [], orders: [] };
  const show = (extra: Partial<React.ComponentProps<typeof Inbox>> = {}) => {
    // the details panel is open by default on a wide screen
    Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
    return wrap(
      <Inbox
        chats={[chat()]} messages={{}} contacts={{ cont_1: contact }} cannedReplies={[]} sessions={[line({})]} selectedChatId="conv_1"
        onSendMessage={vi.fn()} onSendAttachment={vi.fn()} onAssignAgent={vi.fn()} onToggleResolve={vi.fn()} onOpenChat={vi.fn()} onSyncInbox={vi.fn()}
        {...extra}
      />,
    );
  };

  it("shows a chat's labels in the list, three at most, with how many more", () => {
    show();
    const labelsOfRow = within(screen.getByLabelText("Labels"));
    expect(labelsOfRow.getByText("VIP")).toBeDefined();
    expect(labelsOfRow.getByText("Event")).toBeDefined();
    expect(labelsOfRow.queryByText("Wholesale")).toBeNull();
    expect(labelsOfRow.getByText("+1")).toBeDefined();
  });

  it("opens New chat from the header", () => {
    const onNewChat = vi.fn();
    show({ onNewChat });
    fireEvent.click(screen.getByRole("button", { name: "New chat" }));
    expect(onNewChat).toHaveBeenCalled();
  });

  it("asks for chats by label, assignee and recent activity together", async () => {
    const onFilterChange = vi.fn();
    show({ onFilterChange, labels: [VIP, COLD] });
    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    const panel = within(screen.getByRole("group", { name: "Chat filters" }));
    fireEvent.click(panel.getByRole("button", { name: "VIP" }));
    fireEvent.click(panel.getByRole("button", { name: "Cold" }));
    fireEvent.click(panel.getByRole("button", { name: "All of these" }));
    fireEvent.click(panel.getByRole("button", { name: "Assigned to me" }));
    fireEvent.click(panel.getByRole("button", { name: "7 days" }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "", { labels: ["l1", "l2"], labelMode: "all", assigned: "me", activeDays: "7", waiting: "", team: "" }));
    expect(screen.getByRole("button", { name: /Filters/ }).textContent).toContain("3");
    fireEvent.click(panel.getByRole("button", { name: "Clear all filters" }));
    await waitFor(() => expect(onFilterChange).toHaveBeenLastCalledWith("", "all", "", { labels: [], labelMode: "any", assigned: "", activeDays: "", waiting: "", team: "" }));
  });

  it("renames the contact from the details panel and can hand the name back to WhatsApp's", async () => {
    const onRenameContact = vi.fn().mockResolvedValue(undefined);
    show({ onRenameContact });
    fireEvent.click(screen.getByRole("button", { name: "Edit name" }));
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Aisha K (Dubai)" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await waitFor(() => expect(onRenameContact).toHaveBeenCalledWith("cont_1", { name: "Aisha K (Dubai)" }));
    expect(screen.getByText(/WhatsApp shows “Aisha”/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Use that name" }));
    await waitFor(() => expect(onRenameContact).toHaveBeenLastCalledWith("cont_1", { resetName: true }));
  });

  it("shows the server's reason when a rename is refused", async () => {
    show({ onRenameContact: vi.fn().mockRejectedValue(new Error("Name is required (maximum 255 characters)")) });
    fireEvent.click(screen.getByRole("button", { name: "Edit name" }));
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(await screen.findByText(/Name is required/)).toBeDefined();
  });

  it("changes the contact's labels from the details panel", async () => {
    const onSetContactLabels = vi.fn().mockResolvedValue(undefined);
    show({ onSetContactLabels });
    fireEvent.click(screen.getByRole("button", { name: /^Remove VIP$/ }));
    await waitFor(() => expect(onSetContactLabels).toHaveBeenCalledWith("cont_1", []));
  });
});
