import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Sheet } from "../ui/Sheet";
import { Field, Notice } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import { deleteCompany, getCompanyDeletion, type CompanyDeleted, type CompanyDeletion } from "../../services/api";
import type { Company } from "./types";

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** What goes, in the platform admin's words. Only what the company really has is listed. */
function whatGoes(c: CompanyDeletion["counts"]): string[] {
  const lines = [plural(c.people, "person", "people") + " and their sign-ins"];
  if (c.numbers) lines.push(`${plural(c.numbers, "WhatsApp number")}${c.connectedNumbers ? `, ${c.connectedNumbers} connected now: they are logged out of the phone` : ""}`);
  if (c.contacts) lines.push(plural(c.contacts, "contact"));
  if (c.conversations || c.messages) lines.push(`${plural(c.conversations, "conversation")} with ${plural(c.messages, "message")}`);
  if (c.files) lines.push(`${plural(c.files, "photo and file", "photos and files")} in storage`);
  if (c.campaigns) lines.push(plural(c.campaigns, "broadcast"));
  if (c.automations) lines.push(plural(c.automations, "automation"));
  if (c.leads) lines.push(plural(c.leads, "lead"));
  return lines;
}

const sameName = (typed: string, name: string) => typed.trim() !== "" && typed.trim().toLowerCase() === name.trim().toLowerCase();

/**
 * Deleting a company for good. It shows what would go before anything is asked, says plainly when a company may not be deleted
 * (the platform's own, or one with billing records), and asks for the company's name to be typed. The server checks all of it again.
 * Give it a `key` of the company's id, so what was typed for one company is never there for the next.
 */
export function DeleteCompanySheet({ company, onClose, onDeleted }: { company: Company | null; onClose: () => void; onDeleted: (done: CompanyDeleted) => void }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = company?.id;
  const look = useQuery({
    queryKey: ["company-deletion", id],
    queryFn: () => getCompanyDeletion(id!),
    enabled: Boolean(id),
    // what it has can change between two looks, so it is always asked again
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const preview = look.data;
  const ready = Boolean(preview?.canDelete) && sameName(typed, company?.name ?? "") && !busy;
  const submit = async () => {
    if (!company || !ready) return;
    setBusy(true);
    setError("");
    try {
      onDeleted(await deleteCompany(company.id, typed));
    } catch (e: any) {
      setError(e?.message || "It could not be deleted.");
      setBusy(false);
    }
  };
  return (
    <Sheet
      open={Boolean(company)}
      onClose={busy ? () => {} : onClose}
      title={company ? `Delete ${company.name}?` : "Delete company"}
      subtitle="This cannot be undone."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={busy} className={btn("ghost")} onClick={onClose}>
            {preview && !preview.canDelete ? "Close" : "Cancel"}
          </button>
          {(!preview || preview.canDelete) && (
            <button type="button" disabled={!ready} className={btn("danger")} onClick={() => void submit()}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Delete company
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {look.isPending && <p className="text-[14px] text-fg-2" role="status">Checking what {company?.name} has…</p>}
        {look.error && <Notice tone="error">{(look.error as Error).message}</Notice>}
        {preview && (
          <>
            {preview.company.owner && (
              <p className="text-[14px] text-fg-2">
                Owner: {preview.company.owner.name}, {preview.company.owner.email}. Plan: {preview.company.plan}.
              </p>
            )}
            {!preview.canDelete ? (
              <Notice tone="warn">
                <span className="block font-medium">{preview.company.name} cannot be deleted.</span>
                {preview.blockers.map((b) => (
                  <span key={b} className="block mt-1">{b}</span>
                ))}
              </Notice>
            ) : (
              <>
                <div>
                  <p className="text-[14px] font-medium text-fg">What will be deleted:</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-[14px] text-fg-2" aria-label="What will be deleted">
                    {whatGoes(preview.counts).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <Notice tone="error">
                  All of it goes for good and cannot be brought back. A short record stays in the platform log: the name, the owner, the plan and these numbers, but no message, contact or file.
                </Notice>
                <Field label={`To confirm, type the company's name: ${preview.company.name}`}>
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Type the company's name to confirm"
                    placeholder={preview.company.name}
                    className={inputCls}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submit();
                      }
                    }}
                  />
                </Field>
              </>
            )}
          </>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Sheet>
  );
}
