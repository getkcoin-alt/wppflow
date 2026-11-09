# Media storage (photos, videos, voice notes, PDFs)

Files people send and receive are kept in an S3-compatible bucket (Cloudflare R2 in production). The browser uploads **straight to the
bucket** with a short-lived signed address, so large files never pass through the API server.

## How a file is sent

1. `POST /api/attachments/prepare` checks the type and size and returns a signed `uploadUrl` (valid 5 minutes).
2. The browser `PUT`s the file to that address. **This is the step that needs the bucket's CORS rule below.**
3. `POST /api/attachments/:id/send` checks the file arrived, makes a small preview for photos and sends the message.

## What the server needs

`S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; `S3_ENDPOINT` (R2: `https://<account id>.r2.cloudflarestorage.com`);
optionally `S3_REGION` (default `auto`) and `S3_FORCE_PATH_STYLE=true`. Without the three required ones the paperclip is disabled.

## The bucket's CORS rule (without it, nobody can send a file)

A browser may not upload to another address unless the bucket says it may. Without a CORS rule the bucket answers the browser's
check with `403 CORS not configured for this bucket`, and the app shows that the file could not be uploaded. The server's own checks all
pass, which makes it easy to miss. Add this once (Cloudflare: **R2 object storage → the bucket → Settings → CORS Policy → Add CORS
policy → JSON**):

```json
[
  {
    "AllowedOrigins": ["https://app.scriwo.com", "https://homes.scriwo.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

List every address the app is opened from. Scriwo and Scriwo Homes are one app under two addresses and share the bucket; a new address
(a white-label domain, a staging site) must be added here too. Cloudflare's own page on this: *R2 → Buckets → Configure CORS*.

## Checking it

Platform admin → Cluster health → **Media storage → Run test**. It proves two things: that the server can read and write the bucket,
and that a browser on the address you are using can upload to it. When the second one fails because of CORS, the card shows this rule
with the addresses filled in, ready to copy. Run it again after saving the rule.

## Limits and types

The server accepts photos, video and audio up to 16 MB and documents up to 64 MB; the composer currently stops files over 10 MB.
Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, 3GP, QuickTime, MP3, OGG, AAC, M4A, AMR, PDF, plain text, CSV, ZIP, and Word, Excel and
PowerPoint files. Scripts, HTML, SVG and executables are never stored.

## What happened on 9 November 2026

Sending any file failed for everyone: the bucket had no CORS rule. The server-side check passed and so did an upload made outside a
browser, so the fault was only visible from a browser. Found by running the same two steps the app runs, from a real browser on
`app.scriwo.com` and `homes.scriwo.com`, and by asking the bucket what it answers to a browser's check (`403 CORS not configured`).
