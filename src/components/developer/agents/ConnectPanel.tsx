import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, FlaskConical } from "lucide-react";
import { getAgentPrompt, getStoredTenantId, testAgent, type Agent, type AgentOverviewTest, type AgentsOverview } from "../../../services/api";
import { useCopy } from "../../../hooks/useCopy";
import { timeAgo } from "../../../utils/timeAgo";
import { Notice, Pill, Segmented } from "../../ui/Page";
import { btn } from "../../ui/styles";
import { CodeBlock } from "../otp/CodeBlock";
import { CLIENTS, KEY_PLACEHOLDER, claudeCodeCommand, claudeDesktopConfig, cursorConfig, curlExample, openApiUrl, secretLink, vscodeConfig, withKey, type ClientKey } from "./connect";

const ASK = ["Which WhatsApp chats are waiting for a reply?", "Answer the customers who asked about delivery, and tell me what you sent.", "Summarise today's chats and list the ones that need a person."];

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="h-6 w-6 shrink-0 rounded-full bg-surface-2 text-fg-2 grid place-items-center text-[12.5px] font-semibold" aria-hidden>
        {n}
      </span>
      <div className="min-w-0 flex-1 text-[14.5px] text-fg-2 space-y-2">{children}</div>
    </li>
  );
}

/** The prompt for an agent with no MCP: who it is, the rules, and how to call Scriwo with plain web requests. */
function PromptBlock({ agent, secret }: { agent: Agent; secret: string | null }) {
  const tenant = getStoredTenantId();
  const prompt = useQuery({ queryKey: ["agent-prompt", tenant, agent.id, agent.updatedAt], queryFn: () => getAgentPrompt(agent.id, "rest"), staleTime: 60_000 });
  const text = prompt.data ? withKey(prompt.data, secret) : "";
  const { state, copy } = useCopy(text);
  if (prompt.error) return <Notice tone="error">{prompt.error.message}</Notice>;
  if (!prompt.data) return <p className="text-[14px] text-fg-3" role="status">Loading the prompt…</p>;
  return (
    <div className="space-y-3">
      <p className="text-[14.5px] text-fg-2">
        Paste this into any AI agent that can make web requests: it says who the agent is, the rules it follows, and how to reach Scriwo. {secret ? "Your key is already in it." : `Replace ${KEY_PLACEHOLDER} with the key.`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void copy()} className={btn("primary")}>
          {state === "copied" ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
          {state === "copied" ? "Copied" : state === "blocked" ? "Could not copy" : "Copy the prompt"}
        </button>
        <span className="sr-only" role="status">{state === "copied" ? "Copied. Paste it into your agent." : ""}</span>
      </div>
      <details className="rounded-2xl bg-surface-2">
        <summary className="cursor-pointer select-none px-4 min-h-11 flex items-center text-[14px] font-medium text-fg">Read the prompt</summary>
        <pre aria-label="Prompt for any agent" tabIndex={0} className="overflow-auto max-h-[28rem] px-4 pb-4 font-mono text-[12.5px] leading-relaxed text-fg-2 whitespace-pre-wrap break-words">
          {text}
        </pre>
      </details>
    </div>
  );
}

function TestBox({ agent }: { agent: Agent }) {
  const [result, setResult] = useState<AgentOverviewTest | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setError("");
    try {
      setResult(await testAgent(agent.id));
    } catch (e: any) {
      setResult(null);
      setError(e?.message || "That did not work.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => void run()} disabled={busy} className={btn("secondary", "sm")}>
        <FlaskConical className="w-4 h-4" aria-hidden /> See what this agent will see
      </button>
      {error && <Notice tone="error">{error}</Notice>}
      {result && (
        <div className="rounded-2xl bg-surface-2 p-4 text-[14px] text-fg-2 space-y-1.5" aria-label="What this agent sees">
          <p>
            <strong className="text-fg">{result.company}</strong>: {result.inbox.openChats} open chats, {result.inbox.unreadChats} unread, {result.inbox.waitingForReply} waiting for a reply
            {result.inbox.askedForAPerson ? `, ${result.inbox.askedForAPerson} asked for a person` : ""}.
          </p>
          <p>
            Numbers it may use: {result.numbers.length ? result.numbers.map((n) => `${n.name} (${n.connected ? "connected" : "not connected"})`).join(", ") : "none linked yet"}.
          </p>
          <p>Phone numbers: {result.you.customerPhoneNumbers}. Groups: {result.you.groupChats ? "allowed" : "not available"}. Nothing was sent or changed.</p>
        </div>
      )}
    </div>
  );
}

/** How to connect one agent: pick the program it runs in, copy the lines, and watch for its first call. */
export function ConnectPanel({ agent, secret, endpoints }: { agent: Agent; secret: string | null; endpoints: AgentsOverview["endpoints"] }) {
  const [client, setClient] = useState<ClientKey>("claude-code");
  const key = secret ?? KEY_PLACEHOLDER;
  const openApi = openApiUrl(endpoints, agent.level);
  const { state: copiedApi, copy: copyApi } = useCopy(openApi);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="text-[15.5px] font-semibold text-fg">Connect {agent.name}</h4>
        {agent.lastUsedAt ? (
          <Pill tone="ok" dot>
            Connected · used {timeAgo(agent.lastUsedAt)}
          </Pill>
        ) : (
          <Pill tone="neutral">Waiting for its first call… this page updates by itself</Pill>
        )}
      </div>
      {!secret && (
        <Notice tone="info">
          The examples show {KEY_PLACEHOLDER}: use the key you copied when you made this agent. Scriwo cannot show a key again. If it is lost, make a new agent and revoke this one.
        </Notice>
      )}
      <Segmented label="Where the agent runs" items={CLIENTS} value={client} onChange={setClient} />

      {client === "claude-code" && (
        <ol className="space-y-4">
          <Step n={1}>
            <p>Run this in a terminal:</p>
            <CodeBlock label="Claude Code command" code={claudeCodeCommand(endpoints, key)} wrap />
          </Step>
          <Step n={2}>
            <p>Open Claude Code and ask it something. It already knows the rules for working your inbox.</p>
          </Step>
        </ol>
      )}
      {client === "claude-desktop" && (
        <ol className="space-y-4">
          <Step n={1}>
            <p>
              In Claude Desktop open Settings, Developer, Edit config, and add this to <code className="font-mono text-[12.5px]">claude_desktop_config.json</code> (it needs Node.js installed):
            </p>
            <CodeBlock label="Claude Desktop configuration" code={claudeDesktopConfig(endpoints, key)} />
          </Step>
          <Step n={2}>
            <p>Restart Claude Desktop. Scriwo appears among its tools.</p>
          </Step>
        </ol>
      )}
      {client === "cursor" && (
        <ol className="space-y-4">
          <Step n={1}>
            <p>
              Add this to <code className="font-mono text-[12.5px]">~/.cursor/mcp.json</code> (all your projects) or <code className="font-mono text-[12.5px]">.cursor/mcp.json</code> (one project):
            </p>
            <CodeBlock label="Cursor configuration" code={cursorConfig(endpoints, key)} />
          </Step>
          <Step n={2}>
            <p>Open Cursor's settings, MCP, and switch Scriwo on.</p>
          </Step>
        </ol>
      )}
      {client === "vscode" && (
        <ol className="space-y-4">
          <Step n={1}>
            <p>
              Add this to <code className="font-mono text-[12.5px]">.vscode/mcp.json</code> in your project, then use Copilot's agent mode:
            </p>
            <CodeBlock label="VS Code configuration" code={vscodeConfig(endpoints, key)} />
          </Step>
        </ol>
      )}
      {client === "chatgpt" && (
        <ol className="space-y-4">
          <Step n={1}>
            <p>In ChatGPT make a GPT (Explore GPTs, Create), and open Configure, Actions, Create new action.</p>
          </Step>
          <Step n={2}>
            <p>Choose Import from URL and paste this address:</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 break-all rounded-xl bg-surface-2 px-3 py-2 font-mono text-[12.5px] text-fg-2">{openApi}</code>
              <button type="button" onClick={() => void copyApi()} className={btn("secondary", "sm")}>
                {copiedApi === "copied" ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
                {copiedApi === "copied" ? "Copied" : "Copy"}
              </button>
            </div>
          </Step>
          <Step n={3}>
            <p>
              Under Authentication choose API key, then Bearer, and paste the key{secret ? " (below)" : ""}. Then paste the prompt from the Any agent tab into the GPT's Instructions.
            </p>
            {secret && <CodeBlock label="Agent key" code={secret} wrap />}
          </Step>
          <Step n={4}>
            <p>ChatGPT asks you to confirm each action that sends or changes something.</p>
          </Step>
        </ol>
      )}
      {client === "link" && (
        <div className="space-y-3">
          <p className="text-[14.5px] text-fg-2">
            For apps that ask for a connector or MCP server address and have no place for a key (Claude's custom connectors, for example). Paste this address there:
          </p>
          <CodeBlock label="Connector address" code={secretLink(endpoints, key)} wrap />
          <Notice tone="warn">The key is part of this address, so treat the address like a password. Anyone who has it can act within this agent's limits. Revoke the agent to switch it off.</Notice>
        </div>
      )}
      {client === "prompt" && (
        <div className="space-y-5">
          <PromptBlock agent={agent} secret={secret} />
          <div className="space-y-2">
            <p className="text-[13.5px] text-fg-3">Or call Scriwo yourself with any HTTP client:</p>
            <CodeBlock label="curl example" code={curlExample(endpoints, key)} wrap />
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-surface-2/60 p-4">
        <p className="text-[13.5px] font-medium text-fg">Then try asking it</p>
        <ul className="mt-2 space-y-1 text-[13.5px] text-fg-2 list-disc pl-5">
          {ASK.map((q) => (
            <li key={q}>"{q}"</li>
          ))}
        </ul>
      </div>
      <TestBox agent={agent} />
    </div>
  );
}
