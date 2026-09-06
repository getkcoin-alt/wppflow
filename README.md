# WppFlow ⚡ — The 10x WhatsApp CRM & Automation Hub

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgetkcoin-alt%2Fwppflow)

**WppFlow** is a modern, high-performance WhatsApp CRM, Shared Team Inbox, and Broadcast Automation platform engineered on top of the open-source **[WPPConnect](https://wppconnect.io/)** ecosystem. 

It is specifically designed to eliminate the crippling conversation fees, 48-hour template approval delays, and rigid single-number limitations imposed by traditional WhatsApp Business Solution Providers (BSPs) like **[Interakt](https://www.interakt.shop/)**.

---

## 🚀 Why WppFlow is 10x Better than Interakt

| Capability | Interakt.shop (Meta Official BSP) | WppFlow (WPPConnect Engine) |
|---|---|---|
| **Meta Conversation Fees** | High monthly plan + \$0.03 – \$0.12 per conversation markups | **$0.00 Meta markups** (Direct WhatsApp Web session connection) |
| **Outbound Template Review** | Mandatory 24–48h review; rejections freeze marketing | **Instant sending** with dynamic variables & spin-tax `{Hi\|Hello}` |
| **WhatsApp Groups Support** | ❌ None (Meta Cloud API limitation) | ✅ **Full Group CRM**: send broadcasts, mention `@everyone`, manage members |
| **Multi-Number Architecture** | 1 phone number per workspace; costly to add more | ✅ **Multi-Session Hub**: orchestrate 5–20+ WhatsApp numbers seamlessly |
| **Anti-Ban Safety** | Official (Meta can still block accounts arbitrarily) | ✅ **Smart Anti-Ban Shield**: humanized typing jitter (3-8s) & warmup scheduler |
| **Developer Experience** | Static docs, closed proprietary webhooks | ✅ **Interactive REST Playground**, Live Webhook Simulator, & Multi-Language SDKs |

---

## 🌟 Core Modules

### 1. 👑 Super Admin & Tenant Control
* **Tenant & User Directory**: Provision workspaces, assign WhatsApp session quotas (1-25 instances), set monthly broadcast caps, and control roles.
* **WPPConnect Cluster Health**: Live telemetry for Headless Chromium worker pools, RAM/CPU allocation, WebSocket streams, and proxy health.
* **Audit & Security Logs**: Comprehensive audit trail of QR pairings, token generations, and quota adjustments.

### 2. 💬 10x Shared Team Inbox
* **WhatsApp Web UI Familiarity**: Ultra-fast keyboard-first 3-pane layout.
* **Dual Mode Composer**: Instant customer WhatsApp replies vs **Internal Team Notes (Yellow)** with `@mention` tagging.
* **Rich Messaging**: Voice notes player with audio waveform, interactive buttons, and PDF document previews.
* **Canned Responses**: Lightning-fast `/` shortcut inserter (`/hello`, `/pricing`, `/shipping`, `/refund`).
* **Customer 360° CRM Drawer**: Shopify order history, lifetime value indicator, tags, and custom attributes.

### 3. 📱 WhatsApp Multi-Session Manager
* **Interactive QR Pairing**: Dynamic QR code with a 30-second countdown timer and auto-refresh.
* **Phone Pairing Code**: Alternative 8-character alphanumeric linking code.
* **Anti-Ban Health Gauge**: 0–100 score monitoring warmup progression (Day 1 to 14) and safe daily limits.
* **Dedicated Proxy Routing**: Isolate each WhatsApp session through residential or datacenter proxies.

### 4. 📢 Broadcasts & Campaigns Studio
* **Spin-Tax Engine**: Dynamic variation preview (`{Bonjour|Hello|Greetings} {{name}}`).
* **Anti-Ban Jitter Slider**: Configurable 2–12s random dispatch delay per message.
* **Meta Savings Calculator**: Real-time counter of dollars saved vs official Meta API fees.

### 5. 🛠️ Developer Guide & API Playground
* **Interactive REST Tester (Postman style)**: Execute live test requests against endpoints like `POST /api/:session/send-message` and `POST /api/:session/send-button-list`.
* **Real-time Webhook Event Simulator**: Stream and inspect `onmessage`, `onack`, `onstatechange`, and `onbattery` payloads.
* **Multi-Language SDKs**: Drop-in snippets in cURL, Node.js, Python, PHP, and Go.

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/getkcoin-alt/wppflow.git

# Navigate into project directory
cd wppflow

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🚀 One-Click Deploy to Vercel

1. Push or fork this repository to your GitHub account.
2. Click the **Deploy with Vercel** button above or import the repository inside [Vercel Dashboard](https://vercel.com/new).
3. The framework preset is automatically detected as **Vite**, with build output in `dist`.
