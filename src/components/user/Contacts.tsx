import { useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchContacts,
  addContact,
  patchContact,
  apiPost,
  apiGet,
  removeContact,
  getStoredTenantId,
  bulkCreateLeads,
  applyLabels,
  type Label,
} from "../../services/api";
import { LabelChip } from "../labels/LabelChip";
import { LabelFilter } from "../labels/LabelFilter";
import { LabelManager } from "../labels/LabelManager";
import { LabelPicker } from "../labels/LabelPicker";
import { useLabels } from "../labels/useLabels";
import type { NewChatPerson } from "./NewChatSheet";
import { parseContactsCsv, contactsCsv } from "../../utils/csv";
import { Download, Funnel, Plus, Search, Tag, Upload, Users } from "lucide-react";
import { NewLeadSheet } from "../pipeline/NewLeadSheet";
import { usePipelineSettings } from "../pipeline/usePipelineSettings";
import { safeAvatarFallback } from "../../utils/avatar";
import { EmptyState, Field, Notice, Page, PageHeader, Pill } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import { Sheet } from "../ui/Sheet";
export function Contacts({
  onSelectChat,
  pipeline,
  canManageLabels = false,
}: {
  onSelectChat: (person: NewChatPerson) => void;
  /** Owners and administrators can rename, recolour and delete the company's labels */
  canManageLabels?: boolean;
  /** Set when the company's plan has the sales pipeline: adds the "Add to pipeline" actions */
  pipeline?: { teammates: { id: number; name: string }[]; isManager: boolean; aiAvailable: boolean };
}) {
  const tenant = getStoredTenantId(),
    qc = useQueryClient(),
    file = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(""),
    [editing, setEditing] = useState<any | null>(null),
    [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [leadFor, setLeadFor] = useState<any | null>(null),
    [picked, setPicked] = useState<Set<string>>(new Set()),
    [labelFilter, setLabelFilter] = useState<string[]>([]),
    [labelMode, setLabelMode] = useState<"any" | "all">("any"),
    [managing, setManaging] = useState(false),
    [formLabels, setFormLabels] = useState<Label[]>([]),
    [formName, setFormName] = useState(""),
    [duplicate, setDuplicate] = useState<{ id: string; message: string } | null>(null);
  const labels = useLabels();
  const pipelineSettings = usePipelineSettings(Boolean(pipeline));
  const stages = (pipelineSettings.data?.stages || []).map(({ id, name, kind, position }) => ({ id, name, kind, position }));
  const query = useInfiniteQuery({
    queryKey: ["contacts", tenant, search, labelFilter, labelMode],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchContacts({
        search,
        ...(labelFilter.length ? { label: labelFilter.join(","), ...(labelFilter.length > 1 ? { labelMode } : {}) } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (p) => p.nextCursor || undefined,
  });
  const rows = query.data?.pages.flatMap((p) => p.contacts) || [];
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["contacts", tenant] });
      await qc.invalidateQueries({ queryKey: ["contact", tenant] });
      await qc.invalidateQueries({ queryKey: ["conversations", tenant] });
      await qc.invalidateQueries({ queryKey: ["labels", tenant] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const openForm = (contact: any | null) => {
    setEditing(contact);
    setFormLabels(contact?.labels ?? []);
    setFormName(contact?.name ?? "");
    setDuplicate(null);
    setOpen(true);
  };
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      name: formName.trim(),
      phone: String(f.get("phone")),
      email: String(f.get("email")),
      labelIds: formLabels.map((l) => l.id),
      optIn: f.get("consent") === "on",
    };
    setDuplicate(null);
    void run(async () => {
      if (editing) await patchContact(editing.id, { name: data.name, email: data.email, labelIds: data.labelIds, optIn: data.optIn });
      else {
        try {
          const saved = await addContact({ name: data.name, phone: data.phone, email: data.email, labelIds: data.labelIds });
          await patchContact(saved.contact.id, { optIn: data.optIn });
        } catch (err: any) {
          // the number is already saved: offer the existing contact instead of a second one
          if (err.status === 409 && err.data?.contactId) {
            setDuplicate({ id: err.data.contactId, message: err.message });
            return;
          }
          throw err;
        }
      }
      setOpen(false);
    });
  };
  // The picker hands back label ids; the form keeps the labels themselves (including one made a moment ago).
  const pickLabels = (ids: string[]) => {
    const known: Label[] = qc.getQueryData(["labels", tenant]) ?? labels.data ?? [];
    setFormLabels(ids.map((id) => known.find((l) => l.id === id) ?? formLabels.find((l) => l.id === id)).filter(Boolean) as Label[]);
  };
  const bulk = (change: { add?: string[]; remove?: string[] }) =>
    run(async () => {
      const r = await applyLabels({ contactIds: [...picked], ...change });
      setNotice(`${r.updated} ${r.updated === 1 ? "contact" : "contacts"} updated.`);
    });
  return (
    <Page>
      <PageHeader
        eyebrow="People"
        title="Contacts"
        subtitle="Everyone you talk to, with labels and recorded permission for broadcasts."
        actions={
          <>
            <button
              disabled={busy}
              onClick={() => file.current?.click()}
              className={btn("secondary")}
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button
              disabled={busy}
              className={btn("secondary")}
              onClick={() =>
                void run(async () => {
                  const all: any[] = [];
                  let cursor: string | null = null;
                  do {
                    const page = await fetchContacts(cursor ? { cursor } : {});
                    all.push(...page.contacts);
                    cursor = page.nextCursor;
                  } while (cursor);
                  const url = URL.createObjectURL(
                    new Blob([contactsCsv(all)], { type: "text/csv" }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "contacts.csv";
                  link.click();
                  URL.revokeObjectURL(url);
                })
              }
            >
              <Download className="w-4 h-4" /> Export contacts
            </button>
            {canManageLabels && (
              <button disabled={busy} className={btn("secondary")} onClick={() => setManaging(true)}>
                <Tag className="w-4 h-4" /> Labels
              </button>
            )}
            <button onClick={() => openForm(null)} className={btn("primary")}>
              <Plus className="w-4 h-4" /> New contact
            </button>
          </>
        }
      />
      <input
        ref={file}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (!selected) return;
          void run(async () => {
            if (selected.size > 2 * 1024 * 1024)
              throw new Error("CSV must be 2 MB or smaller");
            const parsed = parseContactsCsv(await selected.text());
            let imported = 0,
              skipped = 0,
              why = "";
            try {
              for (let i = 0; i < parsed.length; i += 200) {
                const result = await apiPost("/api/contacts/import", {
                  rows: parsed.slice(i, i + 200),
                });
                imported += result.imported;
                skipped += result.skippedCount || 0;
                why ||= result.skipped?.[0] ? `${result.skipped[0].name || result.skipped[0].phone}: ${result.skipped[0].reason}` : "";
              }
            } catch (error: any) {
              throw new Error(
                `${imported} rows imported before the error: ${error.message}`,
              );
            }
            setNotice(`${imported} contact rows imported.${skipped ? ` ${skipped} skipped (${why}).` : ""}`);
          });
          e.target.value = "";
        }}
      />
      <div className="space-y-3 mb-5">
        {(error || query.error) && (
          <Notice tone="error">{error || query.error?.message}</Notice>
        )}
        {notice && <Notice tone="success">{notice}</Notice>}
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit contact" : "New contact"}
        subtitle={
          editing
            ? "The phone number stays linked to its conversation history. Create a new contact for a different number."
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              className={btn("ghost")}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              form="contact-form"
              disabled={busy}
              className={btn("primary")}
            >
              Save contact
            </button>
          </>
        }
      >
        <form
          id="contact-form"
          key={editing?.id || "new"}
          className="space-y-4"
          onSubmit={save}
        >
          <Field
            label="Name"
            hint={
              editing?.whatsappName && editing.whatsappName !== formName ? (
                <>
                  WhatsApp shows “{editing.whatsappName}”.{" "}
                  <button type="button" className="underline" onClick={() => setFormName(editing.whatsappName)}>
                    Use that name
                  </button>
                </>
              ) : undefined
            }
          >
            <input name="name" required maxLength={255} value={formName} onChange={(e) => setFormName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Phone" hint={editing ? undefined : "With the country code, for example +971 50 123 4567"}>
            <input
              name="phone"
              readOnly={Boolean(editing)}
              required
              type="tel"
              defaultValue={editing?.phone || ""}
              className={`${inputCls} ${editing ? "opacity-60" : ""}`}
            />
          </Field>
          <Field label="Email">
            <input name="email" type="email" defaultValue={editing?.email || ""} className={inputCls} />
          </Field>
          <Field label="Labels">
            <LabelPicker value={formLabels} onChange={pickLabels} />
          </Field>
          {duplicate && (
            <Notice tone="error">
              {duplicate.message}.{" "}
              <button
                type="button"
                className="underline font-medium"
                onClick={() =>
                  void run(async () => {
                    const found = await apiGet(`/api/contacts/${duplicate.id}`);
                    openForm(found.contact);
                  })
                }
              >
                Open that contact
              </button>
            </Notice>
          )}
          <label className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4 cursor-pointer">
            <input
              type="checkbox"
              name="consent"
              defaultChecked={Boolean(editing?.optIn)}
              className="mt-0.5 h-5 w-5 accent-[rgb(var(--c-brand-solid))]"
            />
            <span className="text-[14.5px] text-fg">
              Permission to receive broadcasts has been recorded
            </span>
          </label>
        </form>
      </Sheet>

      <div className="relative mb-3">
        <Search className="w-[18px] h-[18px] text-fg-3 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          aria-label="Search contacts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email"
          className={`${inputCls} pl-11`}
        />
      </div>

      <div className="mb-4">
        <LabelFilter labels={labels.data ?? []} value={labelFilter} mode={labelMode} onChange={setLabelFilter} onMode={setLabelMode} allowNone />
      </div>

      {query.isPending ? (
        <div className="space-y-2" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-[72px] !rounded-2xl" />
          ))}
          <span className="sr-only">Loading contacts…</span>
        </div>
      ) : !rows.length ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No contacts match"
          body={
            search
              ? "Try a different name, number or email."
              : "Add your first contact or import a CSV."
          }
        />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden !rounded-3xl">
          {rows.map((c: any) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-4 hover:bg-surface-2/50 transition lg:grid lg:grid-cols-[auto_auto_minmax(0,1.6fr)_minmax(0,1.2fr)_130px_auto]"
            >
              {(
                <input
                  type="checkbox"
                  aria-label={`Select ${c.name}`}
                  checked={picked.has(c.id)}
                  onChange={(e) =>
                    setPicked((p) => {
                      const next = new Set(p);
                      if (e.target.checked) next.add(c.id);
                      else next.delete(c.id);
                      return next;
                    })
                  }
                  className="h-4 w-4 accent-brand-solid"
                />
              )}
              <img
                src={safeAvatarFallback(c.name)}
                alt=""
                className="h-11 w-11 rounded-full shrink-0"
              />
              <div className="min-w-0 flex-1 basis-48 lg:basis-auto">
                <div className="text-[15.5px] font-medium text-fg truncate">
                  {c.name}
                </div>
                <div className="text-[13.5px] text-fg-2 truncate">
                  {c.phone}
                  {c.email ? ` · ${c.email}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(c.labels ?? []).map((l: Label) => (
                  <LabelChip key={l.id} label={l} />
                ))}
              </div>
              <div>
                {c.optIn ? (
                  <Pill tone="ok" dot>
                    Opted in
                  </Pill>
                ) : (
                  <Pill>No permission</Pill>
                )}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  className={btn("ghost", "sm")}
                  onClick={() => onSelectChat({ contactId: c.id, name: c.name, phone: c.phone, optIn: Boolean(c.optIn) })}
                >
                  Message
                </button>
                {pipeline && (
                  <button className={btn("ghost", "sm")} onClick={() => setLeadFor(c)} aria-label={`Add ${c.name} to the pipeline`}>
                    <Funnel className="w-4 h-4" /> Pipeline
                  </button>
                )}
                <button
                  className={btn("ghost", "sm")}
                  onClick={() => openForm(c)}
                >
                  Edit
                </button>
                <button
                  className={`${btn("ghost", "sm")} !text-danger`}
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Delete this contact? Conversation history will be retained.",
                      )
                    )
                      void run(async () => {
                        await removeContact(c.id);
                      });
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {picked.size > 0 && (
        <div className="sticky bottom-4 mt-4 mx-auto w-fit max-w-full card px-5 py-3 flex flex-wrap items-center gap-3 shadow-card" role="status">
          <span className="text-[14px]">{picked.size} selected</span>
          {(labels.data?.length ?? 0) > 0 && (
            <>
              <select
                aria-label="Add a label to the selected contacts"
                value=""
                disabled={busy}
                onChange={(e) => e.target.value && void bulk({ add: [e.target.value] })}
                className="h-9 rounded-xl bg-surface-2 px-3 text-[13.5px]"
              >
                <option value="">Add label…</option>
                {labels.data!.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Remove a label from the selected contacts"
                value=""
                disabled={busy}
                onChange={(e) => e.target.value && void bulk({ remove: [e.target.value] })}
                className="h-9 rounded-xl bg-surface-2 px-3 text-[13.5px]"
              >
                <option value="">Remove label…</option>
                {labels.data!.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </>
          )}
          {pipeline?.isManager && (
            <button
              className={btn("primary", "sm")}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await bulkCreateLeads([...picked]);
                  setPicked(new Set());
                  setNotice(`${r.created} added to the pipeline${r.skipped ? `. ${r.skipped} already had a lead.` : "."}`);
                })
              }
            >
              <Funnel className="w-4 h-4" /> Add to pipeline
            </button>
          )}
          <button className={btn("ghost", "sm")} onClick={() => setPicked(new Set())}>
            Clear
          </button>
        </div>
      )}
      {query.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            className={btn("secondary")}
            onClick={() => void query.fetchNextPage()}
          >
            Load more contacts
          </button>
        </div>
      )}
      {canManageLabels && <LabelManager open={managing} onClose={() => setManaging(false)} />}
      {pipeline && (
        <NewLeadSheet
          open={!!leadFor}
          contact={leadFor ? { id: leadFor.id, name: leadFor.name, phone: leadFor.phone } : undefined}
          stages={stages}
          teammates={pipeline.teammates}
          aiAvailable={false}
          onClose={() => setLeadFor(null)}
          onCreated={(lead, existing) => {
            setLeadFor(null);
            setNotice(existing ? `${lead.contactName} already has an open lead.` : `${lead.contactName} is in your pipeline.`);
          }}
        />
      )}
    </Page>
  );
}
