import { apiGet, apiPost } from "./api";
import { VERTICALS } from "../utils/vertical";

export interface CheckResult {
  ok: boolean;
  note: string;
  /** The rule to add to the storage bucket's CORS settings, when that is what stops uploads from a browser. */
  corsRule?: string;
}
export interface MediaCheck {
  server: CheckResult;
  browser: CheckResult | null; // null: not attempted because the server step failed
}

// The addresses the app is opened from. Scriwo and Scriwo Homes are one app under two addresses (app. and homes.), and both
// upload to the same bucket, so a rule that names only the address being tested would fix one and leave the other broken.
export function appOriginsFor(origin: string): string[] {
  const found = [origin];
  try {
    const url = new URL(origin);
    const labels = url.hostname.split(".");
    if (url.protocol === "https:" && labels.length >= 3) {
      const base = labels.slice(1).join(".");
      for (const first of ["app", ...Object.keys(VERTICALS)]) found.push(`https://${first}.${base}`);
    }
  } catch {
    /* not an address: only the one given */
  }
  return [...new Set(found)];
}

// What a bucket needs to take uploads (and downloads) from the app in a browser, in the form storage dashboards accept.
export const corsRuleFor = (origin: string): string =>
  JSON.stringify(
    [
      {
        AllowedOrigins: appOriginsFor(origin),
        AllowedMethods: ["PUT", "GET", "HEAD"],
        AllowedHeaders: ["Content-Type"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ],
    null,
    2,
  );

// Proves media storage works end to end: first that the server can use the bucket, then that this
// browser can upload to it (which fails when the bucket's CORS rules do not allow this address).
export async function runMediaCheck(
  origin: string = window.location.origin,
): Promise<MediaCheck> {
  const server = await apiGet("/api/workspace/media-check");
  if (!server.configured)
    return {
      server: {
        ok: false,
        note: `Not set up yet. Missing on the server: ${(server.missing || []).join(", ")}.`,
      },
      browser: null,
    };
  if (!server.ok)
    return {
      server: { ok: false, note: server.error || "Storage did not respond." },
      browser: null,
    };
  const serverStep = {
    ok: true,
    note: `The server can read and write the bucket${server.ms ? ` (${server.ms} ms)` : ""}.`,
  };

  const target = await apiPost("/api/workspace/media-check/upload", {});
  try {
    const res = await fetch(target.url, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: "check",
    });
    if (!res.ok)
      return {
        server: serverStep,
        browser: {
          ok: false,
          note: `Storage refused the upload (HTTP ${res.status}). Check the bucket's access rules.`,
        },
      };
  } catch {
    return {
      server: serverStep,
      browser: {
        ok: false,
        note: `This browser was blocked from uploading. The bucket's CORS rules probably do not include ${origin}. Nobody can send photos, videos or files until they do.`,
        corsRule: corsRuleFor(origin),
      },
    };
  }
  const done = await apiPost("/api/workspace/media-check/finish", {
    key: target.key,
  });
  return {
    server: serverStep,
    browser: done.ok
      ? { ok: true, note: "This browser can upload files to the bucket." }
      : { ok: false, note: done.error || "The upload did not arrive." },
  };
}
