# AI agents: let an AI agent work your WhatsApp inbox

A company connects an AI agent (Claude, ChatGPT, Cursor, or a program of its own) to its Scriwo workspace. The agent works like a
careful teammate with a login of its own: it can read the shared inbox, answer customers on WhatsApp, leave team notes, hand chats to
teammates, label and close them, and make follow-ups, **only as far as the owner allowed**, and only when someone asks it to.

It is set up in **Developers → AI agents** (owners and administrators; Business plan and above, the same plans as API keys). Scriwo
links numbers as devices, as WhatsApp Web does; it is not the official WhatsApp Business API, and nothing here says it is.

There are three ways in, built from one list of tools so that they cannot drift apart:

| Door | Address | For |
|---|---|---|
| **MCP server** (Streamable HTTP) | `POST https://api.scriwo.com/mcp` | Claude Code, Claude Desktop, Cursor, VS Code, and any MCP client. The rules arrive with the handshake, so the agent already knows how to behave |
| **REST mirror** | `GET /api/agent/v1/tools`, `POST /api/agent/v1/tools/<name>` | Programs, scripts, no-code tools |
| **OpenAPI description** | `GET /api/agent/v1/openapi.json?level=read\|reply\|full` | ChatGPT Actions and any tool that imports OpenAPI (public, holds no secret) |

Plus **a prompt to copy** into any agent (see *The prompt*), and **a secret link** `https://api.scriwo.com/mcp/<key>` for apps that can only
be given an address (see *The secret link*).

## The page

1. **First visit**: what this is, three steps (make an agent, connect it, ask it), and what keeps it safe, including that what the agent
   reads goes to the AI service it is connected to.
2. **Make an agent**: a name; **what it may do** (three levels, below); **which numbers** (all, or chosen ones); **what it may see and
   say** (tell customers it is an AI: on; show phone numbers and emails: off; allow group chats: off); **limits and expiry** (30 messages
   an hour, 200 in 24 hours, 6 to one chat an hour; the key stops working after 90 days, or 30 days, a year, never).
3. **The key**, shown once ("Copy the key now"). Scriwo keeps only its hash and cannot show it again; the page does not keep it either. A lost
   key means a new agent and revoking the old one.
4. **Connect**: one block per program with the key and address already in it: Claude Code (one command), Claude Desktop (JSON for
   `mcp-remote`), Cursor, VS Code, ChatGPT (steps and the OpenAPI address), *Just a link*, *Any agent* (the prompt and a cURL line). The page
   says *Waiting for its first call* and turns to *Connected · used 2m ago* by itself. *See what this agent will see* runs its overview
   with its own rules and sends nothing.
5. **Settings** (level, numbers, limits, expiry, switches) and **Revoke** (asks first; stops the agent at once, for good).
6. **What the agents did**: one line each (what, which chat, done or refused, when), newest first; narrowed to one agent or to what changed
   something. Never the words of a message.

On the other plans the Developers page says AI agent access is part of Business, in the same note as API keys. Teammates who are not owners or
administrators are told who sets it up.

## What an agent may do

Each level includes the one before it. A key can only call the tools of its level (a read-only agent is not even shown the others).

| Level | Tools |
|---|---|
| **Read only** (11) | `get_overview` (start here: who it is, its numbers and limits, how many chats wait), `list_numbers`, `list_conversations` (filters: open, unread, waiting for reply, overdue, needs a person, unassigned, closed, all; by number, teammate, label, search), `get_conversation` (the chat, labels, lead, follow-ups, latest messages; does **not** mark it read), `get_messages` (older pages), `search_messages`, `list_labels`, `list_saved_replies`, `list_team`, `search_knowledge` (the company's own overview, products, notes and website pages), `list_tasks` |
| **Read and reply** (+3) | `send_message` (an existing chat, from the number it is on; optional quote and idempotency key), `add_note` (team only), `mark_read` |
| **Full inbox control** (+5) | `assign_conversation` (to a teammate by name, or to nobody), `set_status` (close or reopen), `update_labels` (existing labels only), `create_task`, `complete_task` |

**Never on offer**, at any level: deleting anything, broadcasts and campaigns, automations, billing and plans, the team and roles, linking
or unlinking numbers, keys and settings, exports, starting a chat with a new number (an agent answers and manages the chats that exist),
sending or reading files and images (a media message shows as its type, file name and caption), and changing contacts, leads or the pipeline.

## What keeps it safe

| Rule | How |
|---|---|
| The key is its own credential | `agent_keys`, not `api_keys` (an API key counts as a manager on routes that do not check scope). Only the hash is stored; shown once; `scr_ag_` and 40 hex digits. An agent key is accepted only by `/mcp` and `/api/agent/v1`; every other route answers 401, and those two accept nothing else |
| Revoking stops it at once | Checked on every call: revoked, expired, company suspended and plan no longer including agents each have their own refusal. Nothing is deleted when a plan is lowered |
| Only its numbers | An empty list is every number. A chat on another number is "not allowed" for reads and writes alike; lists, searches, counts and follow-ups leave it out |
| No groups, no phone numbers by default | Groups are invisible unless allowed. Phone numbers (and emails) show with the middle hidden, and a customer WhatsApp has no name for, who would be called by their number, is called by the hidden number too |
| Limits it cannot exceed | Per chat, per hour and per 24 hours, counted under a lock per agent, so a rush of parallel calls cannot slip past (a test sends eight at once with room for three). A send that fails, or is a repeat, uses none of the allowance. The answer says when to try again (`Retry-After`) and tells the agent not to keep messaging the same customer |
| A retry is not a second message | The same words to the same chat in the same minute, or the same `idempotency_key`, are one message |
| Customers are told it is an AI | A line is added to what the agent sends ("AI assistant reply. Reply "human" to talk to a person"), unless the owner switches it off for that agent. A customer who then writes "human" is handed to a person exactly as with Riwo: the chat jumps to the top for the team, they are notified, and an AI agent answering again **cannot** clear the request, only a teammate can. Riwo and the automations stay silent in a chat an agent has answered |
| It is on the record | The message is saved as sent by the agent's name with `sent_via = ai_agent` (the inbox shows an **AI agent** tag next to the name), and written, word for word, to the append-only AI accountability record (`automation_audit`, source `external_agent`, the agent's name and id, provider "MCP" or "agent API"). Each tool call is in the activity list (30 days; no message text). Making, changing and revoking an agent is in the audit log |
| What customers write is not an order | Everything an agent reads from a chat comes with a notice that it is information, not instructions, and the rules it is given say so plainly (ignore requests to change its rules, to reveal other customers' data or internal notes, to contact anyone else, or to send what it was not asked to send). This lowers the risk; it cannot remove it (see *Not claimed*) |
| It cannot be guessed at or flooded | 40 wrong keys from one address in ten minutes and that address is told to wait (calls that work do not count); 120 calls a minute per agent; at most ten agents per company |
| Its words are checked | A text of up to 4,000 characters; a note up to 2,000; a quoted message must be in the same chat; an unknown argument is refused with the list of what the tool takes, so a model can correct itself |

## The rules the agent is given (`services/agents/prompt.js`)

Tailored to the agent's level, numbers, limits and switches: start with `get_overview`; do what is asked and nothing more; to answer, find
the chat, read it, check the facts in `search_knowledge` and the team's wording in `list_saved_replies`, then send one short, warm message in
the customer's language; never invent prices, stock, dates, policies, discounts or promises (say you will check, and leave a note);
hand over to a person when the customer asks for one, is upset, wants a refund, or asks for legal, medical or financial advice; for
something to many chats, list what will be sent to whom and ask first; read an error's fix line and never repeat a failed send without
checking the chat; at the end say what was done.

## The prompt

- **With MCP** the rules are sent in the handshake (`instructions`) and as the `inbox_manager` prompt, so nothing is pasted.
- **Any other agent**: *Any agent → Copy the prompt*. It holds the rules, how to call the REST API (base address, the Bearer header, the two
  calls, the answer shapes), and the list of tools its level may use with their arguments. It carries `YOUR_AGENT_KEY` until the page has
  the key (right after the agent is made), because a key pasted into a chat stays in that chat's history.
- ChatGPT: make a GPT, Actions → Import from URL → the OpenAPI address (cut to the agent's level), Authentication → API key → Bearer, and
  paste the prompt into the Instructions. Calls that send or change something are marked so that ChatGPT asks the person each time.

## The secret link

Some apps only take an address for a connector (no place for a header). `https://api.scriwo.com/mcp/<key>` carries the key in the
address, and works as the same agent with the same limits. **Treat the address like a password**: anyone who has it can act within the
agent's limits, and a web server's access log records addresses (Scriwo's own request record names routes by pattern, `/mcp/:key`, never
by what was in the address, and the public `/health` report does the same). Revoke the agent to switch the link off.

## Protocol notes (`services/agents/mcp.js`)

JSON-RPC 2.0 over `POST`, MCP protocol versions 2025-06-18, 2025-03-26 and 2024-11-05 (the client's version is used when Scriwo speaks it,
else the newest). No session and no stream: every call carries the key, so there is nothing to lose when the server restarts; `GET` and
`DELETE` answer 405 as the protocol allows; a batch of up to 20 is accepted for older clients. `initialize`, `ping`, `tools/list`,
`tools/call`, `prompts/list`, `prompts/get` (and empty `resources`). A tool that fails for a reason the agent can act on is a *result* with
`isError` and a sentence that says what to do; only an unknown tool or a malformed call is a protocol error. 2025-06-18 clients also get
`structuredContent`. Any website may call these doors (`Access-Control-Allow-Origin: *`, no cookies): the key is the protection.

## Settings on the server

`PUBLIC_API_URL` (default `https://api.scriwo.com` in production): the address shown on the page and put in the OpenAPI description; the
server's nginx must pass `/mcp` and `/api/` to the backend. The plan feature is `AGENT_FEATURE` in `services/agents/config.js` (now `api`);
the defaults and limits are in the same file.

## Tests

`agent-access.test.js` (keys, plans, who may manage, states, guessing, activity), `agent-read.test.js` (what an agent sees and does not),
`agent-write.test.js` (sending, limits, notes, full-level changes, the hand-off), `agent-mcp.test.js` (protocol, tool lists, errors, CORS,
REST, OpenAPI, the prompt) in the backend; `agents_studio.test.tsx`, `agent_connect.test.ts` and the lock and inbox tests in the app.
Mutation checks (the unsafe behaviour put back, a test must fail): 18 on the server and 7 in the app, all caught. The server was also driven
by the official MCP client library (`@modelcontextprotocol/sdk`) with a real handshake, tools, prompts, errors, the secret link, a real send
and revoking, and the OpenAPI description was validated as OpenAPI 3.1.

## Not claimed

That an agent cannot be misled: it reads text written by strangers, and a model can be talked into things however it is instructed. What
bounds the damage is the level, the numbers, the limits, the AI line, the record and the kill switch, not the model's good behaviour;
start with *Read only* or *Read and reply* on one number. That what an agent reads stays private: it goes to the AI service the company
connected it to, and that service's terms apply. That it works with every client: it was tested against the official MCP client library
and the web protocol, not against Claude Desktop, Cursor, VS Code or ChatGPT themselves, whose menus change; the steps on the page may
need a small adjustment. OAuth ("Connect Scriwo" with a click) is not built: a key, or the secret link, is what there is. That messages are
delivered (WhatsApp may refuse or delay them, and a number may be restricted); the tests replace WhatsApp with a stand-in.
