import { apiGet, apiPost } from "./api";

export interface CheckResult {
  ok: boolean;
  note: string;
}
export interface MediaCheck {
  server: CheckResult;
  browser: CheckResult | null; // null: not attempted because the server step failed
}

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
        note: `This browser was blocked from uploading. The bucket's CORS rules probably do not include ${origin}.`,
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
