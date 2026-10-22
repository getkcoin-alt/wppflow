import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import {
  getTenantUsers,
  createTenantUser,
  updateTenantUser,
  deleteTenantUser,
  getStoredTenantId,
} from "../../services/api";
import { safeAvatarFallback } from "../../utils/avatar";
import { Notice, Pill } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  agent: "Agent",
};

export function UserManagement({
  canChangeRoles = false,
}: {
  canChangeRoles?: boolean;
}) {
  const qc = useQueryClient(),
    tenant = getStoredTenantId();
  const { data, error, isPending } = useQuery({
    queryKey: ["members", tenant],
    queryFn: () => getTenantUsers(),
  });
  const [notice, setNotice] = useState(""),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setFailure("");
    try {
      const r = await fn();
      await qc.invalidateQueries({ queryKey: ["members", tenant] });
      return r;
    } catch (e: any) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-5">
      {(failure || error) && (
        <Notice tone="error">{failure || error?.message}</Notice>
      )}
      {notice && (
        <div className="card p-5 break-all">
          {notice.startsWith("http") ? (
            <>
              <p className="text-[14.5px] text-fg">
                Email is unavailable. Share this single-use setup link securely.
                It expires in 24 hours.
              </p>
              <a className="text-gold text-[14px] underline" href={notice}>
                {notice}
              </a>
            </>
          ) : (
            <p className="text-[14.5px] text-fg">
              {notice} The link expires in 24 hours.
            </p>
          )}
        </div>
      )}

      <form
        className="card p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          void run(() =>
            createTenantUser({
              name: f.get("name"),
              email: f.get("email"),
              role: f.get("role"),
            }),
          ).then((r) => {
            if (r) {
              setNotice(
                r.emailSent
                  ? "Invitation emailed to " + f.get("email") + "."
                  : r.activationLink,
              );
              form.reset();
            }
          });
        }}
      >
        <h2 className="text-[18px] font-semibold">Invite a teammate</h2>
        <p className="text-[14px] text-fg-2 mt-1 mb-4">
          They get an email with a link to set their password, then connect
          their own WhatsApp number.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_1.3fr_auto_auto]">
          <input
            aria-label="Name"
            name="name"
            required
            placeholder="Name"
            className={inputCls}
          />
          <input
            aria-label="Email"
            name="email"
            type="email"
            required
            placeholder="Email"
            className={inputCls}
          />
          <select aria-label="Role" name="role" className={inputCls}>
            <option value="agent">Agent</option>
            <option value="admin">Administrator</option>
          </select>
          <button disabled={busy} className={`${btn("primary")} !h-12`}>
            <Send className="w-4 h-4" /> Create invitation
          </button>
        </div>
      </form>

      <div className="card overflow-hidden !rounded-3xl">
        {isPending && (
          <div className="p-6 space-y-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        )}
        <ul className="divide-y divide-line">
          {data?.users.map((u: any) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 sm:px-6 py-4"
            >
              <img
                src={safeAvatarFallback(u.name)}
                alt=""
                className="h-11 w-11 rounded-full shrink-0"
              />
              <div className="min-w-0 flex-1 basis-44">
                <div className="text-[15.5px] font-medium text-fg truncate">
                  {u.name}
                </div>
                <div className="text-[13.5px] text-fg-2 truncate">
                  {u.email}
                </div>
              </div>
              <div className="sm:w-44">
                {canChangeRoles && u.membershipRole !== "owner" ? (
                  <select
                    aria-label={"Role for " + u.name}
                    disabled={busy}
                    value={u.membershipRole}
                    className="h-10 rounded-full bg-surface-2 px-4 text-[14px] text-fg outline-none"
                    onChange={(e) =>
                      void run(() =>
                        updateTenantUser(u.id, { role: e.target.value }),
                      )
                    }
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Administrator</option>
                  </select>
                ) : (
                  <Pill
                    tone={u.membershipRole === "owner" ? "gold" : "neutral"}
                  >
                    {ROLE_LABEL[u.membershipRole] || u.membershipRole}
                  </Pill>
                )}
              </div>
              <div className="sm:w-28">
                <Pill tone={u.status === "active" ? "ok" : "warn"} dot>
                  {u.status}
                </Pill>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                {u.membershipRole !== "owner" && (
                  <>
                    <button
                      disabled={busy}
                      className={btn("ghost", "sm")}
                      onClick={() =>
                        void run(() =>
                          updateTenantUser(u.id, {
                            status:
                              u.status === "active" ? "suspended" : "active",
                          }),
                        )
                      }
                    >
                      {u.status === "active" ? "Suspend" : "Restore"}
                    </button>
                    <button
                      disabled={busy}
                      className={`${btn("ghost", "sm")} !text-danger`}
                      onClick={() => {
                        if (confirm("Remove this member from the workspace?"))
                          void run(() => deleteTenantUser(u.id));
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
