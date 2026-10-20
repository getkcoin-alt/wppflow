import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCompanies,
  createCompany,
  updateCompany,
  resendOwnerCredentials,
} from "../../services/api";

interface Company {
  id: string;
  name: string;
  status: "active" | "suspended";
  sessionsLimit: number;
  staffCount: number;
  sessionsCount: number;
  connectedSessions: number;
  createdAt: string;
  owner: { name: string; email: string; activated: boolean } | null;
}

export function PlatformAdmin({
  adminName,
  onLogout,
}: {
  adminName: string;
  onLogout: () => void;
}) {
  const qc = useQueryClient();
  const { data, error, isPending } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: listCompanies,
  });
  const [notice, setNotice] = useState(""),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<any>, success?: (r: any) => string) => {
    setBusy(true);
    setFailure("");
    setNotice("");
    try {
      const r = await fn();
      setNotice(success ? success(r) : r?.message || "");
      await qc.invalidateQueries({ queryKey: ["companies"] });
      return r;
    } catch (e: any) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#0c1317] text-[#e9edef]">
      <header className="flex items-center justify-between bg-[#111b21] border-b border-[#2a3942] px-5 py-3">
        <div>
          <span className="font-extrabold text-lg">WppFlow</span>
          <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            Platform admin
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">{adminName}</span>
          <button onClick={onLogout} className="underline">
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <h1 className="text-xl font-bold">Companies</h1>
        {(failure || error) && (
          <p role="alert" className="p-3 rounded-lg bg-rose-950 text-rose-200">
            {failure || (error as Error).message}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="p-3 rounded-lg bg-emerald-950 text-emerald-200"
          >
            {notice}
          </p>
        )}
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 bg-[#111b21] rounded-xl p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = new FormData(form);
            void run(() =>
              createCompany({
                companyName: String(f.get("companyName")),
                ownerName: String(f.get("ownerName")),
                ownerEmail: String(f.get("ownerEmail")),
                sessionsLimit: Number(f.get("sessionsLimit")),
              }),
            ).then((r) => r && form.reset());
          }}
        >
          <input
            aria-label="Company name"
            name="companyName"
            required
            placeholder="Company name"
            className="bg-[#202c33] p-2 rounded"
          />
          <input
            aria-label="Owner name"
            name="ownerName"
            required
            placeholder="Owner name"
            className="bg-[#202c33] p-2 rounded"
          />
          <input
            aria-label="Owner email"
            name="ownerEmail"
            type="email"
            required
            placeholder="Owner Gmail / email"
            className="bg-[#202c33] p-2 rounded"
          />
          <input
            aria-label="WhatsApp session limit"
            name="sessionsLimit"
            type="number"
            min={1}
            max={500}
            defaultValue={5}
            required
            className="bg-[#202c33] p-2 rounded"
          />
          <button
            disabled={busy}
            className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded font-semibold disabled:opacity-50"
          >
            Add company &amp; email credentials
          </button>
        </form>
        <div className="bg-[#111b21] rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {[
                  "Company",
                  "Owner",
                  "Staff",
                  "WhatsApp (connected / total / limit)",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="text-left p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr>
                  <td className="p-3" colSpan={6}>
                    Loading companies…
                  </td>
                </tr>
              )}
              {data?.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={6}>
                    No companies yet. Add the first one above.
                  </td>
                </tr>
              )}
              {data?.map((c) => (
                <tr key={c.id} className="border-t border-[#2a3942]">
                  <td className="p-3">{c.name}</td>
                  <td>
                    {c.owner ? `${c.owner.name} (${c.owner.email})` : "—"}
                    {c.owner && !c.owner.activated ? (
                      <span className="ml-2 text-amber-300">
                        awaiting first login
                      </span>
                    ) : null}
                  </td>
                  <td>{c.staffCount}</td>
                  <td>
                    {c.connectedSessions} / {c.sessionsCount} /{" "}
                    {c.sessionsLimit}
                  </td>
                  <td>{c.status}</td>
                  <td>
                    <button
                      disabled={busy}
                      className="text-emerald-400 p-2"
                      onClick={() =>
                        void run(
                          () =>
                            updateCompany(c.id, {
                              status:
                                c.status === "active" ? "suspended" : "active",
                            }),
                          () =>
                            `${c.name} is now ${c.status === "active" ? "suspended" : "active"}.`,
                        )
                      }
                    >
                      {c.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
                    <button
                      disabled={busy}
                      className="text-emerald-400 p-2"
                      onClick={() => {
                        const v = window.prompt(
                          "WhatsApp session limit",
                          String(c.sessionsLimit),
                        );
                        if (v)
                          void run(
                            () =>
                              updateCompany(c.id, { sessionsLimit: Number(v) }),
                            () => "Session limit updated.",
                          );
                      }}
                    >
                      Set limit
                    </button>
                    {c.owner && !c.owner.activated && (
                      <button
                        disabled={busy}
                        className="text-emerald-400 p-2"
                        onClick={() =>
                          void run(() => resendOwnerCredentials(c.id))
                        }
                      >
                        Resend credentials
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
