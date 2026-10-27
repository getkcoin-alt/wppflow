import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Notice, Pill } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn } from "../ui/styles";
import {
  listCompanySolutions,
  setCompanySolution,
  type PlanChoice,
} from "../../services/api";
import type { Company } from "./types";

const NEEDS: Record<string, string> = { leads: "the sales pipeline" };

// The industry solutions one company has. Everything is off until the platform admin switches it on here, and switching
// one off hides it without deleting anything the company entered. The company is told either way.
export function SolutionsSheet({
  company,
  plans,
  onClose,
}: {
  company: Company | null;
  plans: PlanChoice[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["company-solutions", company?.id],
    queryFn: () => listCompanySolutions(company!.id),
    enabled: !!company,
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const plan = plans.find((p) => p.id === company?.planId);
  const lacks = (feature: string) =>
    plan ? !plan.features.find((f) => f.key === feature)?.included : false;

  const toggle = async (key: string, name: string, enabled: boolean) => {
    if (!company) return;
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const r = await setCompanySolution(company.id, key, enabled);
      qc.setQueryData(["company-solutions", company.id], r.solutions);
      await qc.invalidateQueries({ queryKey: ["companies"] });
      setNotice(
        r.changed
          ? `${name} is now ${enabled ? "on" : "off"} for ${company.name}. Their managers have been told.`
          : `${name} was already ${enabled ? "on" : "off"}.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  return (
    <Sheet
      open={!!company}
      onClose={onClose}
      title="Industry solutions"
      subtitle={company ? `${company.name} · ${company.plan}` : ""}
      footer={
        <button type="button" className={btn("primary")} onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-[13.5px] text-fg-2">
          Scriwo Core is for every company. A solution adds screens and tools
          for one industry, and only appears for a company you switch it on for.
        </p>
        {q.isPending && (
          <Loader2
            className="w-5 h-5 animate-spin text-fg-3"
            aria-label="Loading"
          />
        )}
        {q.error && <Notice tone="error">{(q.error as Error).message}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
        <ul className="space-y-3">
          {(q.data || []).map((s) => (
            <li key={s.key} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[15px]">{s.name}</p>
                  <p className="text-[13px] text-fg-2">{s.summary}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={s.enabled}
                  aria-label={`${s.name} for ${company?.name}`}
                  disabled={busy === s.key}
                  onClick={() => void toggle(s.key, s.name, !s.enabled)}
                  className={`shrink-0 h-8 w-14 rounded-full p-1 transition ${s.enabled ? "bg-brand-solid" : "bg-surface-3"}`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white shadow transition ${s.enabled ? "translate-x-6" : ""}`}
                  />
                </button>
              </div>
              <p className="text-[12.5px] text-fg-3">
                Built on {s.requires.map((r) => NEEDS[r] || r).join(", ")}.{" "}
                {s.requires.some(lacks) && (
                  <Pill tone="warn">
                    Their plan doesn’t include{" "}
                    {s.requires
                      .filter(lacks)
                      .map((r) => NEEDS[r] || r)
                      .join(", ")}
                    , so it won’t open until it does.
                  </Pill>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
