import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { fetchSupportAccess, getStoredTenantId } from "../../services/api";
import { Notice } from "../ui/Page";
import { SupportHistory } from "../platform/PlatformConsole";

// Every time someone from Scriwo looked at this company's account: when, why and what they saw. Owners and
// administrators can read it; there is nothing to switch on.
export function SupportAccessCard() {
  const q = useQuery({ queryKey: ["support-access", getStoredTenantId()], queryFn: fetchSupportAccess });
  return (
    <section aria-label="Scriwo support access" className="card p-6 mt-8">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-surface-2 text-fg-2">
          <ShieldCheck className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold">Scriwo support access</h2>
          <p className="mt-1 mb-4 text-[14px] text-fg-2 max-w-2xl">
            Scriwo staff cannot read your chats, contacts or files. To help with a problem they can open a short support session that shows your team list, the health of your numbers and your account activity. You are told when one opens, and it is listed here.
          </p>
          {q.error ? <Notice tone="error">{(q.error as Error).message}</Notice> : <SupportHistory sessions={q.data ?? []} empty="Nobody from Scriwo has looked at this account." />}
        </div>
      </div>
    </section>
  );
}
