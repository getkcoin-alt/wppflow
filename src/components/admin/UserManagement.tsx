import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Send, X } from "lucide-react";
import {
  getTenantUsers,
  createTenantUser,
  updateTenantUser,
  deleteTenantUser,
  resendInvitation,
  cancelInvitation,
  getStoredTenantId,
} from "../../services/api";
import { safeAvatarFallback } from "../../utils/avatar";
import { Notice, Pill } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import {
  CATEGORIES,
  choiceOf,
  mailLine,
  parseChoice,
  roleText,
  type InviteMail,
} from "./teamModel";

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  membershipRole: string;
  category: string;
  canRename: boolean;
}
interface Invitation {
  id: string;
  name: string;
  email: string;
  role: string;
  category: string;
  expired: boolean;
  mail: InviteMail;
}

const TONE_CLASS = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  neutral: "text-fg-3",
} as const;

// One dropdown for what a person is: an administrator, or an agent in a category.
function RoleSelect({
  value,
  onChange,
  allowAdmin,
  label,
  disabled,
  className = inputCls,
}: {
  value: string;
  onChange: (choice: string) => void;
  allowAdmin: boolean;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      name="role"
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {allowAdmin && <option value="admin">Administrator</option>}
      <optgroup label="Agent">
        {CATEGORIES.map((c) => (
          <option key={c.key} value={`agent:${c.key}`}>
            Agent · {c.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

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
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<string | null>(null),
    [draft, setDraft] = useState(""),
    [inviteChoice, setInviteChoice] = useState("agent:general");
  const members: Member[] = data?.users || [];
  const invitations: Invitation[] = data?.invitations || [];
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setFailure("");
    try {
      const r = await fn();
      await qc.invalidateQueries({ queryKey: ["members", tenant] });
      // The inbox's assign menu uses the same names.
      await qc.invalidateQueries({ queryKey: ["team", tenant] });
      return r;
    } catch (e: any) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  };
  const startEdit = (m: Member) => {
    setEditing(m.id);
    setDraft(m.name);
  };
  const saveName = (m: Member) => {
    const name = draft.trim();
    if (!name || name === m.name) return setEditing(null);
    void run(() => updateTenantUser(m.id, { name })).then((r) => {
      if (r) setEditing(null);
    });
  };
  const report = (r: any, who: string, verb: string) => {
    if (!r) return;
    setNotice(
      r.emailSent
        ? `${verb} ${who}.`
        : r.activationLink
          ? `Email could not be delivered${r.emailError ? ` (${r.emailError})` : ""}. Share this single-use setup link securely. It expires in 24 hours.\n${r.activationLink}`
          : "",
    );
  };

  return (
    <section className="space-y-5">
      {(failure || error) && (
        <Notice tone="error">{failure || error?.message}</Notice>
      )}
      {notice && (
        <div className="card p-5 break-all whitespace-pre-line text-[14.5px] text-fg">
          {notice.split("\n").map((line, i) =>
            line.startsWith("http") ? (
              <a key={i} className="text-gold underline block mt-1" href={line}>
                {line}
              </a>
            ) : (
              <p key={i}>{line}</p>
            ),
          )}
        </div>
      )}

      <form
        className="card p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          const { role, category } = parseChoice(inviteChoice);
          void run(() =>
            createTenantUser({
              name: f.get("name"),
              email: f.get("email"),
              role,
              category,
            }),
          ).then((r) => {
            if (r) {
              report(r, String(f.get("email")), "Invitation emailed to");
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
        <div className="grid gap-3 md:grid-cols-[1fr_1.3fr_1fr_auto]">
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
          <RoleSelect
            label="Role"
            value={inviteChoice}
            onChange={setInviteChoice}
            allowAdmin={canChangeRoles}
          />
          <button disabled={busy} className={`${btn("primary")} !h-12`}>
            <Send className="w-4 h-4" /> Create invitation
          </button>
        </div>
      </form>

      {invitations.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3 px-1">
            <h2 className="text-[16px] font-semibold">Waiting to join</h2>
            <Pill
              tone={
                invitations.some((i) => i.mail.status === "failed")
                  ? "danger"
                  : "neutral"
              }
            >
              {invitations.length} pending
              {invitations.some((i) => i.mail.status === "failed")
                ? ` · ${invitations.filter((i) => i.mail.status === "failed").length} email failed`
                : ""}
            </Pill>
          </div>
          <ul className="card divide-y divide-line overflow-hidden !rounded-3xl">
            {invitations.map((inv) => {
              const line = mailLine(inv.mail, inv.expired);
              return (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 sm:px-6 py-4"
                >
                  <img
                    src={safeAvatarFallback(inv.name)}
                    alt=""
                    className="h-11 w-11 rounded-full shrink-0 opacity-80"
                  />
                  <div className="min-w-0 flex-1 basis-52">
                    <div className="text-[15.5px] font-medium text-fg truncate">
                      {inv.name}
                    </div>
                    <div className="text-[13.5px] text-fg-2 truncate">
                      {inv.email}
                    </div>
                    <div
                      className={`mt-1 text-[13px] flex items-center gap-1.5 ${TONE_CLASS[line.tone]}`}
                      title={inv.mail.error || undefined}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span className="truncate">{line.text}</span>
                    </div>
                  </div>
                  <Pill tone="neutral">{roleText(inv.role, inv.category)}</Pill>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      disabled={busy}
                      className={btn("secondary", "sm")}
                      onClick={() =>
                        void run(() => resendInvitation(inv.id)).then((r) =>
                          report(
                            r,
                            inv.email,
                            "A new invitation was emailed to",
                          ),
                        )
                      }
                    >
                      {inv.mail.status === "sent" && !inv.expired
                        ? "Resend email"
                        : "Send new link"}
                    </button>
                    <button
                      disabled={busy}
                      className={`${btn("ghost", "sm")} !text-danger`}
                      onClick={() => {
                        if (
                          confirm(
                            "Cancel this invitation? The link will stop working.",
                          )
                        )
                          void run(() => cancelInvitation(inv.id));
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        {invitations.length > 0 && (
          <h2 className="text-[16px] font-semibold mb-3 px-1">Team</h2>
        )}
        <div className="card overflow-hidden !rounded-3xl">
          {isPending && (
            <div className="p-6 space-y-3" aria-busy>
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-14" />
              ))}
            </div>
          )}
          <ul className="divide-y divide-line">
            {members.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 sm:px-6 py-4"
              >
                <img
                  src={safeAvatarFallback(u.name)}
                  alt=""
                  className="h-11 w-11 rounded-full shrink-0"
                />
                <div className="min-w-0 flex-1 basis-52">
                  {editing === u.id ? (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveName(u);
                      }}
                    >
                      <input
                        autoFocus
                        aria-label={`Name for ${u.email}`}
                        value={draft}
                        maxLength={255}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Escape" && setEditing(null)
                        }
                        className="h-10 min-w-0 flex-1 rounded-xl bg-surface-2 px-3 text-[15px] text-fg ring-1 ring-gold/60 outline-none"
                      />
                      <button
                        type="submit"
                        aria-label="Save name"
                        disabled={busy || !draft.trim()}
                        className="h-9 w-9 grid place-items-center rounded-full bg-brand-solid text-white disabled:opacity-40"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel rename"
                        onClick={() => setEditing(null)}
                        className="h-9 w-9 grid place-items-center rounded-full bg-surface-2 text-fg-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[15.5px] font-medium text-fg truncate">
                        {u.name}
                      </span>
                      {u.canRename && (
                        <button
                          aria-label={`Rename ${u.name}`}
                          title="Change name"
                          disabled={busy}
                          onClick={() => startEdit(u)}
                          className="h-7 w-7 shrink-0 grid place-items-center rounded-full text-fg-3 hover:text-fg hover:bg-surface-2 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="text-[13.5px] text-fg-2 truncate">
                    {u.email}
                  </div>
                </div>
                <div className="sm:w-52">
                  {u.membershipRole === "owner" ? (
                    <Pill tone="gold">Owner</Pill>
                  ) : canChangeRoles || u.membershipRole === "agent" ? (
                    <RoleSelect
                      label={"Role for " + u.name}
                      disabled={busy}
                      value={choiceOf(u.membershipRole, u.category)}
                      allowAdmin={canChangeRoles}
                      className="h-10 w-full rounded-full bg-surface-2 px-4 text-[14px] text-fg outline-none"
                      onChange={(choice) =>
                        void run(() =>
                          updateTenantUser(u.id, parseChoice(choice)),
                        )
                      }
                    />
                  ) : (
                    <Pill tone="neutral">
                      {roleText(u.membershipRole, u.category)}
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
      </div>
    </section>
  );
}
