import { useState } from "react";
import { Globe2, Loader2, Undo2 } from "lucide-react";
import { aboutFromWebsite } from "../../services/api";
import { Field } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";

/**
 * "Your website": the company types its address and Riwo reads the public pages and writes the "about" text (and, for the
 * sales assistant, questions to ask). The text lands in the box below for the person to read and edit; nothing is saved here.
 */
export function WebsiteReader({
  website,
  onWebsite,
  onDraft,
  onUndo,
  canUndo,
}: {
  website: string;
  onWebsite: (value: string) => void;
  /** The draft: the text for the "about" box and, if Riwo suggested any, questions */
  onDraft: (draft: { about: string; questions: string[] }) => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const read = async () => {
    if (!website.trim()) return setError("Enter your website address first.");
    setBusy(true);
    setError("");
    setNote("");
    try {
      const out = await aboutFromWebsite(website.trim());
      onWebsite(out.url);
      onDraft({ about: out.about, questions: out.questions });
      setNote(
        out.usedAi
          ? `Riwo read ${out.pages} ${out.pages === 1 ? "page" : "pages"} of your website and wrote this. Check it and change anything that isn't right.`
          : `We copied the opening words of your website. Riwo isn't available to rewrite them right now, so tidy them up below.`,
      );
    } catch (e: any) {
      setError(e.message || "We couldn't read that website.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl ring-1 ring-line p-4 space-y-3">
      <Field label="Your website" hint="Riwo reads your public pages and writes what it may say about your business, so you don't have to. You can edit it before saving.">
        <div className="flex gap-2">
          <input
            aria-label="Your website"
            value={website}
            maxLength={200}
            inputMode="url"
            placeholder="www.yourcompany.com"
            onChange={(e) => onWebsite(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void read();
              }
            }}
            className={inputCls}
          />
          <button type="button" className={btn("secondary")} disabled={busy} onClick={() => void read()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Globe2 className="w-4 h-4" aria-hidden />}
            {busy ? "Reading…" : "Read my website"}
          </button>
        </div>
      </Field>
      {error && (
        <p role="alert" className="text-[13.5px] text-danger">
          {error}
        </p>
      )}
      {note && (
        <p role="status" className="text-[13.5px] text-fg-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {note}
          {canUndo && (
            <button type="button" onClick={onUndo} className="inline-flex items-center gap-1 text-[13px] font-medium text-fg hover:underline">
              <Undo2 className="w-3.5 h-3.5" aria-hidden /> Undo
            </button>
          )}
        </p>
      )}
    </div>
  );
}
