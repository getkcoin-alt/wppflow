import { useState } from "react";
import { changePassword } from "../../services/api";
import type { AuthUser } from "../../types";
import { AuthNote, AuthShell } from "./AuthShell";
import { btn, inputCls } from "../ui/styles";

export function ChangePassword({
  user,
  onChanged,
  onLogout,
}: {
  user: AuthUser;
  onChanged: (user: AuthUser) => void;
  onLogout: () => void;
}) {
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) return setError("The new passwords do not match");
    setBusy(true);
    try {
      const res = await changePassword(current, next);
      onChanged(res.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <form onSubmit={submit} className="space-y-4">
        <div className="mb-4">
          <h1 className="text-[32px] leading-tight font-semibold">
            Choose a new password
          </h1>
          <p className="text-[15.5px] text-fg-2 mt-2 leading-relaxed">
            {user.email} signed in with a temporary password. Set your own
            before continuing.
          </p>
        </div>
        {error && <AuthNote tone="error">{error}</AuthNote>}
        <input
          aria-label="Temporary password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Temporary password from your email"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputCls}
        />
        <input
          aria-label="New password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          placeholder="New password (at least 10 characters)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputCls}
        />
        <input
          aria-label="Confirm new password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
        <button
          disabled={busy}
          className={`${btn("primary")} w-full !h-12 text-[15px] mt-2`}
        >
          Save password
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full text-center text-[14.5px] text-fg-2 hover:text-fg pt-2"
        >
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}
