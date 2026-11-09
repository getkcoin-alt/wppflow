// The code a developer pastes. Pure text: the real key and address go in when there is a key to show, a clear placeholder when not.
export type Lang = "curl" | "node" | "python" | "php" | "java" | "nocode";
export const LANGS: { key: Lang; label: string }[] = [
  { key: "node", label: "Node.js" },
  { key: "python", label: "Python" },
  { key: "php", label: "PHP" },
  { key: "java", label: "Java" },
  { key: "curl", label: "cURL" },
  { key: "nocode", label: "No-code" },
];
export const SECRET_PLACEHOLDER = "YOUR_SECRET_KEY";
export const PUBLIC_PLACEHOLDER = "YOUR_PUBLIC_KEY";
const PHONE = "+971501234567";
const CODE = "482913";

export function serverSnippet(lang: Lang, { base, key }: { base: string; key?: string }): string {
  const k = key || SECRET_PLACEHOLDER;
  const api = `${base}/api/otp`;
  switch (lang) {
    case "curl":
      return `# 1. Send a code
curl -X POST ${api}/send \\
  -H "Authorization: Bearer ${k}" \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "${PHONE}"}'
# -> {"status":"success","id":"otp_...","state":"sent","expiresIn":300,"resendAfter":30}

# 2. Check what the person typed
curl -X POST ${api}/verify \\
  -H "Authorization: Bearer ${k}" \\
  -H "Content-Type: application/json" \\
  -d '{"id": "otp_...", "code": "${CODE}"}'
# -> {"status":"success","valid":true,...}`;
    case "node":
      return `const OTP = "${api}";
const headers = { Authorization: "Bearer ${k}", "Content-Type": "application/json" };
const post = (path, body) => fetch(\`\${OTP}/\${path}\`, { method: "POST", headers, body: JSON.stringify(body) }).then((r) => r.json());

// 1. send a code, and keep sent.id for the check
const sent = await post("send", { phone: "${PHONE}" });

// 2. check what the person typed
const check = await post("verify", { id: sent.id, code: "${CODE}" });
if (check.valid) {
  // signed in
} else {
  // check.reason: wrong_code, expired, too_many_attempts, already_used ...
}`;
    case "python":
      return `import requests

OTP = "${api}"
headers = {"Authorization": "Bearer ${k}"}

# 1. send a code, and keep sent["id"] for the check
sent = requests.post(f"{OTP}/send", json={"phone": "${PHONE}"}, headers=headers).json()

# 2. check what the person typed
check = requests.post(f"{OTP}/verify", json={"id": sent["id"], "code": "${CODE}"}, headers=headers).json()
if check.get("valid"):
    pass  # signed in
else:
    print(check.get("reason"))  # wrong_code, expired, too_many_attempts, already_used ...`;
    case "php":
      return `<?php
function otp($path, $body) {
  $ch = curl_init("${api}/" . $path);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: Bearer ${k}", "Content-Type: application/json"],
    CURLOPT_POSTFIELDS => json_encode($body),
  ]);
  return json_decode(curl_exec($ch), true);
}

// 1. send a code, and keep $sent["id"] for the check
$sent = otp("send", ["phone" => "${PHONE}"]);

// 2. check what the person typed
$check = otp("verify", ["id" => $sent["id"], "code" => "${CODE}"]);
if (!empty($check["valid"])) {
  // signed in
}`;
    case "java":
      return `import java.net.URI;
import java.net.http.*;

HttpClient http = HttpClient.newHttpClient();

static HttpRequest call(String path, String json) {
  return HttpRequest.newBuilder(URI.create("${api}/" + path))
      .header("Authorization", "Bearer ${k}")
      .header("Content-Type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(json)).build();
}

// 1. send a code; the answer's "id" is what the check needs
String sent = http.send(call("send", "{\\"phone\\":\\"${PHONE}\\"}"), HttpResponse.BodyHandlers.ofString()).body();

// 2. check what the person typed
String check = http.send(call("verify", "{\\"id\\":\\"otp_...\\",\\"code\\":\\"${CODE}\\"}"), HttpResponse.BodyHandlers.ofString()).body();
// "valid":true means it was right`;
    case "nocode":
      return `In Zapier, Make, n8n or any "HTTP request" step:

STEP 1: send the code
  Method:  POST
  URL:     ${api}/send
  Header:  Authorization = Bearer ${k}
  Header:  Content-Type = application/json
  Body:    {"phone": "<the person's phone number>"}
  Keep:    id  (from the answer)

STEP 2: check what the person typed
  Method:  POST
  URL:     ${api}/verify
  Header:  Authorization = Bearer ${k}
  Header:  Content-Type = application/json
  Body:    {"id": "<id from step 1>", "code": "<what the person typed>"}
  Then:    continue only if  valid  is  true`;
  }
}

// the page: one script and one call. `base` is where the script is served from; `api` only needs saying when the API is elsewhere
// (a developer's own machine), because the widget talks to the address it was loaded from.
export function widgetSnippet({ base, key, api }: { base: string; key?: string; api?: string }): string {
  return `<script src="${base}/otp.js"></script>

<button id="verify-phone">Verify my phone</button>
<script>
  document.getElementById("verify-phone").addEventListener("click", function () {
    ScriwoOTP.verify({
      key: "${key || PUBLIC_PLACEHOLDER}",${api && api !== base ? `\n      api: "${api}",` : ""}
      // phone: "${PHONE}",   // already know the number? Pass it and the person only types the code
      onVerified: function (result) {
        // result.proof: send it to your server with the form (see "Check it on your server")
        document.getElementById("verify-phone").textContent = "Phone verified";
      },
    });
  });
</script>`;
}

// the server's side of the widget: ask Scriwo whether the proof is real
export function proofSnippet({ base, key }: { base: string; key?: string }): string {
  return `curl -X POST ${base}/api/otp/proof/verify \\
  -H "Authorization: Bearer ${key || SECRET_PLACEHOLDER}" \\
  -H "Content-Type: application/json" \\
  -d '{"proof": "otp_proof_..."}'
# -> {"status":"success","valid":true,"phone":"${PHONE}","reference":null}
# A proof works once, for ten minutes.`;
}
