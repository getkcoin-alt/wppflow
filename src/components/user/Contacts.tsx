import { useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchContacts,
  addContact,
  patchContact,
  apiPost,
  removeContact,
  getStoredTenantId,
} from "../../services/api";
import { parseContactsCsv, contactsCsv } from "../../utils/csv";
export function Contacts({
  onSelectChat,
}: {
  onSelectChat: (id: string) => void;
}) {
  const tenant = getStoredTenantId(),
    qc = useQueryClient(),
    file = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(""),
    [editing, setEditing] = useState<any | null>(null),
    [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
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
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Contacts & Segments</h1>
          <p className="text-sm text-slate-400 mt-2">
            Workspace contacts, tags and recorded campaign permissions. Store
            integration is not connected.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="bg-emerald-600 p-2 rounded"
          >
            New contact
          </button>
          <button disabled={busy} onClick={() => file.current?.click()}>
            Import CSV
          </button>
          <button
            disabled={busy}
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
            Export contacts
          </button>
        </div>
      </header>
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
      {(error || query.error) && (
        <p role="alert" className="text-rose-300">
          {error || query.error?.message}
        </p>
      )}
      {notice && (
        <p role="status" className="text-emerald-300">
          {notice}
        </p>
      )}
      {open && (
        <form
          key={editing?.id || "new"}
          className="bg-[#111b21] p-5 rounded-xl space-y-3"
          onSubmit={(e) => {
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
          }}
        >
          {(["name", "phone", "email", "tags"] as const).map((name) => (
            <label key={name} className="block capitalize">
              {name}
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
                className="block bg-[#202c33] p-2 rounded w-full"
              />
            </label>
          ))}
          <label className="block">
            <input
              type="checkbox"
              name="consent"
              defaultChecked={Boolean(editing?.optIn)}
            />{" "}
            Permission to receive campaigns has been recorded
          </label>
          {editing && (
            <p className="text-xs text-slate-400">
              Phone identity is retained with its conversation history. Create a
              new contact for a different number.
            </p>
          )}
          <button disabled={busy} className="bg-emerald-600 p-2 rounded">
            Save contact
          </button>
          <button type="button" className="ml-4" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </form>
      )}
      <input
        aria-label="Search contacts"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search all contacts by name, phone or email"
        className="bg-[#202c33] p-3 rounded-xl w-full"
      />
      <div className="bg-[#111b21] rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {[
                "Contact",
                "Phone",
                "Tags",
                "Campaign permission",
                "Actions",
              ].map((h) => (
                <th key={h} className="p-3 text-left text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c: any) => (
              <tr key={c.id} className="border-t border-[#2a3942]">
                <td className="p-3">
                  {c.name}
                  <span className="block text-xs text-slate-400">
                    {c.email}
                  </span>
                </td>
                <td>{c.phone}</td>
                <td>{c.tags.join(", ")}</td>
                <td>{c.optIn ? "Recorded opt-in" : "Not recorded"}</td>
                <td>
                  <button
                    className="text-emerald-400 p-2"
                    onClick={() => onSelectChat(c.id)}
                  >
                    Message
                  </button>
                  <button
                    className="p-2"
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-rose-300 p-2"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {query.isPending && <p className="p-4">Loading contacts…</p>}
        {!query.isPending && !rows.length && (
          <p className="p-4 text-slate-400">No contacts match.</p>
        )}
        {query.hasNextPage && (
          <button
            className="p-4 text-emerald-400"
            onClick={() => void query.fetchNextPage()}
          >
            Load more contacts
          </button>
        )}
      </div>
    </section>
  );
}
