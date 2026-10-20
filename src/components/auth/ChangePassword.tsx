import { useState } from "react";
import { changePassword } from "../../services/api";
import type { AuthUser } from "../../types";

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
    <main className="min-h-screen bg-[#0c1317] text-[#e9edef] flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-2xl p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">Choose a new password</h1>
        <p className="text-sm text-slate-400">
          {user.email} signed in with a temporary password. Set your own before
          continuing.
        </p>
        {error && (
          <p role="alert" className="text-rose-300 text-sm">
            {error}
          </p>
        )}
        <input
          aria-label="Temporary password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Temporary password from your email"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full bg-[#202c33] p-2.5 rounded"
        />
        <input
          aria-label="New password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          placeholder="New password (min 10 characters)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full bg-[#202c33] p-2.5 rounded"
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
          className="w-full bg-[#202c33] p-2.5 rounded"
        />
        <div className="flex items-center justify-between">
          <button
            disabled={busy}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            Save password
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-slate-400 underline"
          >
            Sign out
          </button>
        </div>
      </form>
    </main>
  );
}
