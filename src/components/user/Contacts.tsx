import { useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchContacts,
  addContact,
  patchContact,
  apiPost,
  removeContact,
  getStoredTenantId,
  bulkCreateLeads,
} from "../../services/api";
import { parseContactsCsv, contactsCsv } from "../../utils/csv";
import { Download, Funnel, Plus, Search, Upload, Users } from "lucide-react";
import { NewLeadSheet } from "../pipeline/NewLeadSheet";
import { usePipelineSettings } from "../pipeline/usePipelineSettings";
import { safeAvatarFallback } from "../../utils/avatar";
import { EmptyState, Field, Notice, Page, PageHeader, Pill } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import { Sheet } from "../ui/Sheet";
export function Contacts({
  onSelectChat,
  pipeline,
}: {
  onSelectChat: (id: string) => void;
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
    [picked, setPicked] = useState<Set<string>>(new Set());
  const pipelineSettings = usePipelineSettings(Boolean(pipeline));
  const stages = (pipelineSettings.data?.stages || []).map(({ id, name, kind, position }) => ({ id, name, kind, position }));
  const query = useInfiniteQuery({
    queryKey: ["contacts", tenant, search],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchContacts({ search, ...(pageParam ? { cursor: pageParam } : {}) }),
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name")),
      phone: String(f.get("phone")),
      email: String(f.get("email")),
      tags: String(f.get("tags"))
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      optIn: f.get("consent") === "on",
    };
    void run(async () => {
      if (editing) await patchContact(editing.id, data);
      else {
        const saved = await addContact(data);
        await patchContact(saved.contact.id, { optIn: data.optIn });
      }
      setOpen(false);
    });
  };
  return (
    <Page>
      <PageHeader
        eyebrow="People"
        title="Contacts"
        subtitle="Everyone you talk to, with tags and recorded permission for broadcasts."
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
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className={btn("primary")}
            >
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
            let imported = 0;
            try {
              for (let i = 0; i < parsed.length; i += 200) {
                const result = await apiPost("/api/contacts/import", {
                  rows: parsed.slice(i, i + 200),
                });
                imported += result.imported;
              }
            } catch (error: any) {
              throw new Error(
                `${imported} rows imported before the error: ${error.message}`,
              );
            }
            setNotice(`${imported} contact rows imported.`);
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
          {(["name", "phone", "email", "tags"] as const).map((name) => (
            <Field
              key={name}
              label={
                name === "tags" ? "Tags" : name[0].toUpperCase() + name.slice(1)
              }
              hint={
                name === "tags"
                  ? "Separate with commas, for example VIP, Lead"
                  : undefined
              }
            >
              <input
                name={name}
                readOnly={name === "phone" && Boolean(editing)}
                required={name === "name" || name === "phone"}
                type={name === "email" ? "email" : "text"}
                defaultValue={
                  name === "tags"
                    ? editing?.tags?.join(", ")
                    : editing?.[name] || ""
                }
                className={`${inputCls} ${name === "phone" && editing ? "opacity-60" : ""}`}
              />
            </Field>
          ))}
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

      <div className="relative mb-4">
        <Search className="w-[18px] h-[18px] text-fg-3 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          aria-label="Search contacts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email"
          className={`${inputCls} pl-11`}
        />
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
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-4 hover:bg-surface-2/50 transition lg:grid lg:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_130px_auto]"
            >
              {pipeline?.isManager && (
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
                {c.tags.map((t: string) => (
                  <Pill key={t}>{t}</Pill>
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
                  onClick={() => onSelectChat(c.id)}
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
                  onClick={() => {
                    setEditing(c);
                    setOpen(true);
                  }}
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
      {pipeline && picked.size > 0 && (
        <div className="sticky bottom-4 mt-4 mx-auto w-fit card px-5 py-3 flex items-center gap-4 shadow-card" role="status">
          <span className="text-[14px]">{picked.size} selected</span>
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
