import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronUp, Globe2, Loader2, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";
import {
  addKnowledgeSource,
  fetchKnowledge,
  refreshKnowledgeSource,
  removeKnowledgeSource,
  saveKnowledgeNotes,
  type KnowledgeSource,
  type KnowledgeStatus,
} from "../../services/api";
import { Notice, Pill } from "../ui/Page";
import { btn, inputCls, textareaCls } from "../ui/styles";
import { timeAgo } from "../../utils/timeAgo";

const KEY = ["knowledge"];

/** One line for the closed card: "2 websites · up to date · your notes added" */
export function knowledgeSummary(data: KnowledgeStatus): string {
  const n = data.sources.length;
  const reading = data.sources.some((x) => x.status === "queued" || x.status === "reading");
  const failed = data.sources.filter((x) => x.status === "failed").length;
  const state = reading ? "Riwo is reading" : failed ? `${failed} could not be read` : "up to date";
  return [`${n} ${n === 1 ? "website" : "websites"}`, state, data.notes?.trim() ? "your notes added" : ""].filter(Boolean).join(" · ");
}

function SourceRow({ source, busy, onRefresh, onRemove }: { source: KnowledgeSource; busy: boolean; onRefresh: () => void; onRemove: () => void }) {
  const working = source.status === "queued" || source.status === "reading";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-surface-2 px-4 py-3" data-testid={`source-${source.id}`}>
      <Globe2 className="w-4 h-4 text-fg-3 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium truncate">{source.url.replace(/^https?:\/\//, "")}</p>
        <p className="text-[12.5px] text-fg-3">
          {working
            ? "Riwo is reading this website…"
            : source.status === "failed"
              ? source.error || "It could not be read."
              : `${source.pages} ${source.pages === 1 ? "page" : "pages"} · read ${source.lastReadAt ? timeAgo(source.lastReadAt) : "just now"}${source.lastChangedAt ? ` · changed ${timeAgo(source.lastChangedAt)}` : ""}`}
        </p>
      </div>
      {working ? (
        <Pill tone="info">
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> Reading
        </Pill>
      ) : source.status === "failed" ? (
        <Pill tone="danger">Couldn't read</Pill>
      ) : (
        <Pill tone="ok">Up to date</Pill>
      )}
      <button type="button" className={btn("secondary", "sm")} disabled={working || busy} onClick={onRefresh} aria-label={`Refresh ${source.url}`}>
        <RefreshCw className="w-3.5 h-3.5" aria-hidden /> Refresh
      </button>
      <button type="button" className="h-8 w-8 grid place-items-center rounded-full text-fg-3 hover:text-danger hover:bg-surface-3" disabled={busy} onClick={onRemove} aria-label={`Remove ${source.url}`}>
        <Trash2 className="w-4 h-4" aria-hidden />
      </button>
    </li>
  );
}

/**
 * The company's knowledge base: the websites Riwo reads, and the owner's own notes. Riwo answers customers from this. A company
 * with many products points Riwo at its site once; Refresh reads it again when the website changes (and it is read again by
 * itself every day).
 */
export function KnowledgeCard() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: KEY,
    queryFn: fetchKnowledge,
    // while a site is being read, look again every few seconds
    refetchInterval: (query) => ((query.state.data as KnowledgeStatus | undefined)?.sources.some((s) => s.status === "queued" || s.status === "reading") ? 3000 : false),
  });
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState("");
  // null: not chosen yet. A company that has websites sees one calm line; a company with none sees the whole card to start with.
  const [open, setOpen] = useState<boolean | null>(null);
  const set = (data: KnowledgeStatus) => qc.setQueryData(KEY, data);
  const fail = (e: any) => setError(e.message || "That didn't work. Please try again.");
  const add = useMutation({ mutationFn: (u: string) => addKnowledgeSource(u), onSuccess: (d) => (set(d), setUrl(""), setOpen(true)), onError: fail });
  const refresh = useMutation({ mutationFn: (id: string) => refreshKnowledgeSource(id), onSuccess: set, onError: fail });
  const remove = useMutation({ mutationFn: (id: string) => removeKnowledgeSource(id), onSuccess: set, onError: fail });
  const saveNotes = useMutation({ mutationFn: (text: string) => saveKnowledgeNotes(text), onSuccess: (d) => (set(d), setNotes(null)), onError: fail });
  const data = q.data;
  const busy = add.isPending || refresh.isPending || remove.isPending;
  const noteText = notes ?? data?.notes ?? "";
  const hasSources = Boolean(data && data.sources.length > 0);
  const expanded = open ?? (data ? !hasSources : false);

  if (!expanded)
    return (
      <section className="card px-5 py-4 mb-8" aria-labelledby="knowledge-title">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="h-10 w-10 shrink-0 grid place-items-center rounded-2xl bg-surface-2 text-fg-2">
            <BookOpen className="w-5 h-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-[12rem]">
            <h2 id="knowledge-title" className="text-[16px] font-semibold">
              Knowledge base
            </h2>
            <p className="text-[13.5px] text-fg-2">{data ? knowledgeSummary(data) : q.error ? "Could not be loaded." : "Loading…"}</p>
          </div>
          {data && data.sources.some((x) => x.status === "failed") && <Pill tone="danger">Needs a look</Pill>}
          <button type="button" className={btn("secondary", "sm")} aria-expanded={false} onClick={() => setOpen(true)}>
            <Settings2 className="w-4 h-4" aria-hidden /> Manage
          </button>
        </div>
      </section>
    );

  return (
    <section className="card p-6 mb-8" aria-labelledby="knowledge-title">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-surface-2 text-fg-2">
          <BookOpen className="w-5 h-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="knowledge-title" className="text-[17px] font-semibold">
            Knowledge base
          </h2>
          <p className="text-[14px] text-fg-2 mt-1 max-w-2xl">
            Give Riwo your website and it learns every product, service and page, so it can talk to customers like someone who works for you. Read it again with Refresh whenever your website changes. It also reads again by itself every day.
          </p>
        </div>
        {hasSources && (
          <button type="button" className={btn("ghost", "sm")} aria-expanded onClick={() => setOpen(false)}>
            <ChevronUp className="w-4 h-4" aria-hidden /> Hide
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {q.error && (
        <div className="mt-4">
          <Notice tone="error">{(q.error as Error).message}</Notice>
        </div>
      )}

      {data && data.sources.length > 0 && (
        <ul className="mt-5 space-y-2" aria-label="Websites Riwo reads">
          {data.sources.map((s) => (
            <SourceRow key={s.id} source={s} busy={busy} onRefresh={() => refresh.mutate(s.id)} onRemove={() => remove.mutate(s.id)} />
          ))}
        </ul>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (url.trim()) add.mutate(url.trim());
        }}
      >
        <input aria-label="Website address" inputMode="url" value={url} maxLength={200} placeholder="www.yourcompany.com" onChange={(e) => setUrl(e.target.value)} className={inputCls} />
        <button type="submit" className={btn("primary")} disabled={add.isPending || !url.trim()}>
          {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
          Add website
        </button>
      </form>

      {data && (data.overview || data.products.length > 0) && (
        <div className="mt-6 rounded-2xl ring-1 ring-line p-4" aria-label="What Riwo has learned">
          <p className="text-[13px] font-medium text-fg-2 mb-1">What Riwo has learned{data.writtenByRiwo ? "" : " (from the page titles; Riwo will write a better summary when it is available)"}</p>
          {data.overview && <p className="text-[14px] text-fg-2 leading-relaxed">{data.overview}</p>}
          {data.products.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Products and services found">
              {data.products.map((p) => (
                <li key={p.name} title={p.summary} className="rounded-full bg-surface-2 ring-1 ring-line px-3 h-8 inline-flex items-center text-[13px]">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6">
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2 ml-1">Your own notes for Riwo</span>
          <textarea
            aria-label="Notes for Riwo"
            rows={3}
            maxLength={4000}
            value={noteText}
            placeholder="Things your website doesn't say: opening hours, how demos work, what you never do…"
            onChange={(e) => setNotes(e.target.value)}
            className={`${textareaCls} mt-1.5`}
          />
        </label>
        {notes !== null && notes !== (data?.notes ?? "") && (
          <button type="button" className={`${btn("secondary", "sm")} mt-2`} disabled={saveNotes.isPending} onClick={() => saveNotes.mutate(noteText)}>
            {saveNotes.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
            Save notes
          </button>
        )}
      </div>
    </section>
  );
}
