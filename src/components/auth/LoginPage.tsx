import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  loginUser,
  signupUser,
  setStoredToken,
  acceptInvitation,
  getInviteInfo,
  requestPasswordReset,
  getResetInfo,
  resetPassword,
} from "../../services/api";
import { AuthUser } from "../../types";
import { AuthNote, AuthShell } from "./AuthShell";
import { btn, inputCls } from "../ui/styles";

interface LoginPageProps {
  onAuthSuccess: (user: AuthUser, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const [invite, setInvite] = useState(
    () => new URLSearchParams(window.location.search).get("invite") || "",
  );
  // The link in the "reset your password" email: /?reset=<token>
  const [reset, setReset] = useState(
    () => new URLSearchParams(window.location.search).get("reset") || "",
  );
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const role = "user";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    name: string;
    company: string;
    setPassword: boolean;
  } | null>(null);
  const [confirm, setConfirm] = useState("");
  useEffect(() => {
    if (!invite) return;
    let active = true;
    getInviteInfo(invite)
      .then((info) => active && setInviteInfo(info))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [invite]);
  useEffect(() => {
    if (!reset) return;
    let active = true;
    getResetInfo(reset)
      .then((info) => active && setResetEmail(info.email))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (reset) {
        if (password !== confirm) {
          setError("The two passwords do not match.");
          return;
        }
        await resetPassword(reset, password);
        setReset("");
        window.history.replaceState(null, "", window.location.pathname);
        if (resetEmail) setEmail(resetEmail);
        setMode("login");
        setSuccessMsg("Password changed. Sign in with your new password.");
        setPassword("");
        setConfirm("");
        return;
      }
      if (mode === "forgot") {
        const res = await requestPasswordReset(email);
        setSuccessMsg(
          res.message ||
            "If that address has an account, we have emailed a link to choose a new password.",
        );
        return;
      }
      if (invite) {
        if (inviteInfo?.setPassword && password !== confirm) {
          setError("The two passwords do not match.");
          return;
        }
        await acceptInvitation(invite, password);
        setInvite("");
        window.history.replaceState(null, "", window.location.pathname);
        if (inviteInfo?.email) setEmail(inviteInfo.email);
        setSuccessMsg(
          inviteInfo?.setPassword
            ? "Password saved. Log in with your email and new password."
            : "Account activated. Log in with your invited email.",
        );
        setPassword("");
        setConfirm("");
        return;
      }
      if (mode === "login") {
        const res = await loginUser(email, password);
        if (res.status === "success" && res.token && res.user) {
          setStoredToken(res.token);
          setSuccessMsg("Welcome back. Opening your workspace…");
          setTimeout(() => onAuthSuccess(res.user, res.token!), 700);
        } else {
          setError(res.message || "Invalid email or password.");
        }
      } else {
        const res = await signupUser(name, email, password, companyName, role);
        if (res.status === "success" && res.token && res.user) {
          setStoredToken(res.token);
          setSuccessMsg("Account created. Welcome to Scriwo.");
          setTimeout(() => onAuthSuccess(res.user, res.token!), 700);
        } else {
          setError(res.message || "Signup failed. Please try again.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, input: React.ReactNode) => (
    <label className="block">
      <span className="block text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
        {label}
      </span>
      {input}
    </label>
  );

  if (reset)
    return (
      <AuthShell>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <h1 className="text-[32px] leading-tight font-semibold">
              {!resetEmail && error
                ? "This link no longer works"
                : "Choose a new password"}
            </h1>
            <p className="text-[15.5px] text-fg-2 mt-2 leading-relaxed">
              {resetEmail
                ? `Choose a password of at least 10 characters for ${resetEmail}. You will be signed out of every device.`
                : error || "Checking your link…"}
            </p>
          </div>
          {resetEmail && (
            <>
              <label className="block">
                <span className="block text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
                  New password
                </span>
                <input
                  required
                  minLength={10}
                  maxLength={128}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
                  Confirm new password
                </span>
                <input
                  required
                  minLength={10}
                  maxLength={128}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputCls}
                />
              </label>
              {error && <AuthNote tone="error">{error}</AuthNote>}
              <button
                disabled={loading}
                className={`${btn("primary")} w-full !h-12 text-[15px]`}
              >
                Save password
              </button>
            </>
          )}
          {!resetEmail && error && (
            <button
              type="button"
              onClick={() => {
                setReset("");
                setError(null);
                setMode("forgot");
                window.history.replaceState(null, "", window.location.pathname);
              }}
              className={`${btn("primary")} w-full !h-12 text-[15px]`}
            >
              Email me a new link
            </button>
          )}
        </form>
      </AuthShell>
    );

  if (invite)
    return (
      <AuthShell>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <h1 className="text-[32px] leading-tight font-semibold">
              {inviteInfo?.setPassword
                ? "Set your password"
                : "Join your team on Scriwo"}
            </h1>
            <p className="text-[15.5px] text-fg-2 mt-2 leading-relaxed">
              {!inviteInfo
                ? error || "Checking your invitation…"
                : inviteInfo.setPassword
                  ? `Choose a password of at least 10 characters for ${inviteInfo.email}${inviteInfo.company ? " (" + inviteInfo.company + ")" : ""}.`
                  : `Enter the current password of your existing account ${inviteInfo.email} to join ${inviteInfo.company}.`}
            </p>
          </div>
          <label className="block">
            <span className="block text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
              {inviteInfo?.setPassword ? "New password" : "Password"}
            </span>
            <input
              required
              minLength={inviteInfo?.setPassword ? 10 : 1}
              maxLength={128}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </label>
          {inviteInfo?.setPassword && (
            <label className="block">
              <span className="block text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
                Confirm new password
              </span>
              <input
                required
                minLength={10}
                maxLength={128}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
              />
            </label>
          )}
          {error && inviteInfo && <AuthNote tone="error">{error}</AuthNote>}
          <button
            disabled={loading || !inviteInfo}
            className={`${btn("primary")} w-full !h-12 text-[15px]`}
          >
            {inviteInfo?.setPassword ? "Save password" : "Join team"}
          </button>
        </form>
      </AuthShell>
    );

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="text-[32px] leading-tight font-semibold">
          {mode === "login"
            ? "Welcome back"
            : mode === "forgot"
              ? "Reset your password"
              : "Create your workspace"}
        </h2>
        <p className="text-[15.5px] text-fg-2 mt-2">
          {mode === "login"
            ? "Sign in to continue to your inbox."
            : mode === "forgot"
              ? "Enter the email you sign in with and we will send you a link to choose a new password."
              : "Set up your company and start inviting your team."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthNote tone="error">{error}</AuthNote>}
        {successMsg && <AuthNote tone="success">{successMsg}</AuthNote>}

        {mode === "signup" && (
          <>
            {field(
              "Your name",
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />,
            )}
            {field(
              "Company",
              <input
                type="text"
                placeholder="Acme Logistics"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputCls}
              />,
            )}
            <p className="text-[13px] text-fg-3 leading-relaxed px-1">
              Creating a workspace makes you its owner. You can invite teammates
              as agents or administrators from Team.
            </p>
          </>
        )}

        {field(
          "Email",
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />,
        )}
        {mode !== "forgot" &&
          field(
          "Password",
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={mode === "signup" ? 10 : 1}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-fg"
            >
              {showPassword ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>,
        )}

        {mode === "login" && (
          <div className="-mt-1 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setSuccessMsg(null);
                setPassword("");
              }}
              className="text-[13.5px] font-medium text-gold hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {mode === "signup" && (
          <p className="text-[13px] text-fg-3 -mt-1">
            A new workspace starts on the Free plan: one person and one WhatsApp number. For a team, write to us and we will move you to a bigger plan.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`${btn("primary")} w-full !h-12 text-[15px] mt-2`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              One moment…
            </span>
          ) : mode === "login" ? (
            "Sign in"
          ) : mode === "forgot" ? (
            "Send reset link"
          ) : (
            "Create workspace"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[14.5px] text-fg-2">
        {mode === "login"
          ? "New to Scriwo?"
          : mode === "forgot"
            ? "Remembered it?"
            : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setSuccessMsg(null);
          }}
          className="font-medium text-gold hover:underline"
        >
          {mode === "login" ? "Create a workspace" : "Sign in"}
        </button>
      </p>
    </AuthShell>
  );
};
