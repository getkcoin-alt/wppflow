import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTenantUsers,
  createTenantUser,
  updateTenantUser,
  deleteTenantUser,
  getStoredTenantId,
} from "../../services/api";
export function UserManagement({
  canChangeRoles = false,
}: {
  canChangeRoles?: boolean;
}) {
  const qc = useQueryClient(),
    tenant = getStoredTenantId();
  const { data, error } = useQuery({
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
      <h1 className="text-xl font-bold">Workspace Team</h1>
      {(failure || error) && (
        <p role="alert" className="text-rose-300">
          {failure || error?.message}
        </p>
      )}
      {notice && (
        <div className="p-4 bg-[#202c33] rounded-xl break-all">
          {notice.startsWith("http") ? (
            <>
              <p>
                Email is unavailable. Share this single-use setup link securely.
                It expires in 24 hours.
              </p>
              <a className="text-emerald-400" href={notice}>
                {notice}
              </a>
            </>
          ) : (
            <p>{notice} The link expires in 24 hours.</p>
          )}
        </div>
      )}
      <form
        className="flex flex-wrap gap-3 bg-[#111b21] rounded-xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run(() =>
            createTenantUser({
              name: f.get("name"),
              email: f.get("email"),
              role: f.get("role"),
            }),
          ).then((r) => {
            if (r)
              setNotice(
                r.emailSent
                  ? "Invitation emailed to " + f.get("email") + "."
                  : r.activationLink,
              );
          });
        }}
      >
        <input
          aria-label="Name"
          name="name"
          required
          placeholder="Name"
          className="bg-[#202c33] p-2 rounded"
        />
        <input
          aria-label="Email"
          name="email"
          type="email"
          required
          placeholder="Email"
          className="bg-[#202c33] p-2 rounded"
        />
        <select
          aria-label="Role"
          name="role"
          className="bg-[#202c33] p-2 rounded"
        >
          <option value="agent">Agent</option>
          <option value="admin">Administrator</option>
        </select>
        <button disabled={busy} className="bg-emerald-600 p-2 rounded">
          Create invitation
        </button>
      </form>
      <div className="bg-[#111b21] rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["Name", "Email", "Role", "Membership", "Actions"].map((h) => (
                <th key={h} className="text-left p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u: any) => (
              <tr key={u.id} className="border-t border-[#2a3942]">
                <td className="p-3">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {canChangeRoles && u.membershipRole !== "owner" ? (
                    <select
                      aria-label={"Role for " + u.name}
                      disabled={busy}
                      value={u.membershipRole}
                      className="bg-[#202c33] p-2 rounded"
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
                    u.membershipRole
                  )}
                </td>
                <td>{u.status}</td>
                <td>
                  {u.membershipRole !== "owner" && (
                    <>
                      <button
                        disabled={busy}
                        className="text-emerald-400 p-2"
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
                        className="text-rose-300 p-2"
                        onClick={() => {
                          if (confirm("Remove this member from the workspace?"))
                            void run(() => deleteTenantUser(u.id));
                        }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
