import { CheckCheck, Search, StickyNote } from "lucide-react";

// A drawn (not screenshotted) preview of the Scriwo inbox: crisp at any size, themed, and weightless.
const chats = [
  { name: "Aisha · Marina Homes", text: "Can we view the 2BR on Saturday?", who: "Rahul", time: "2m", unread: 2 },
  { name: "Dr. Mehta Clinic", text: "Booked for 4:30 pm, thank you", who: "Sara", time: "8m" },
  { name: "Vikram Jewellers", text: "Please share today's 22K rate", who: "Unassigned", time: "11m", unread: 1 },
  { name: "Omar Al Mansoori", text: "Invoice received 👍", who: "You", time: "1h" },
];

export function InboxMock() {
  return (
    <div className="float card overflow-hidden !rounded-4xl shadow-pop" role="img" aria-label="Preview of the Scriwo shared inbox with assigned chats and a private note">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-4 flex flex-1 items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-fg-3">
          <Search className="h-3.5 w-3.5" /> Search chats <kbd className="ml-auto rounded bg-surface-3 px-1.5 text-[10px]">⌘K</kbd>
        </div>
      </div>
      <div className="grid sm:grid-cols-[minmax(0,15rem)_1fr]">
        <ul className="hidden border-r border-line sm:block">
          {chats.map((c, i) => (
            <li key={c.name} className={`border-b border-line px-4 py-3 ${i === 0 ? "bg-brand/10" : ""}`}>
              <div className="flex items-center justify-between text-[13px] font-medium">
                <span className="truncate">{c.name}</span>
                <span className="text-[11px] text-fg-3">{c.time}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-fg-3">
                <span className="truncate">{c.text}</span>
                {c.unread && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand-solid px-1 text-[10px] text-white">{c.unread}</span>}
              </div>
              <span className="mt-1.5 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-fg-2">{c.who}</span>
            </li>
          ))}
        </ul>
        <div className="flex min-h-[20rem] flex-col gap-3 bg-surface-2/60 p-5 text-[13px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Aisha · Marina Homes</p>
              <p className="text-xs text-fg-3">via Rahul&apos;s number · assigned to Rahul</p>
            </div>
            <span className="rounded-full bg-ok/15 px-2.5 py-1 text-[11px] font-medium text-ok">Live</span>
          </div>
          <p className="max-w-[80%] self-start rounded-2xl rounded-tl-md bg-bubble-in px-3.5 py-2 shadow-card">Hi, is the 2 bedroom in Marina still available?</p>
          <p className="max-w-[80%] self-end rounded-2xl rounded-tr-md bg-bubble-out px-3.5 py-2">
            Yes it is. Floor plan attached. Would Saturday 11am work for a viewing?
            <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-fg-3">Rahul <CheckCheck className="h-3 w-3 text-info" /></span>
          </p>
          <p className="max-w-[80%] self-start rounded-2xl rounded-tl-md bg-bubble-in px-3.5 py-2 shadow-card">Can we view the 2BR on Saturday?</p>
          <p className="flex max-w-[85%] items-start gap-2 self-end rounded-2xl bg-note px-3.5 py-2">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            <span><b>Private note:</b> budget AED 2.4M, cash buyer. <span className="text-brand">@Sara</span> can you hold the key?</span>
          </p>
        </div>
      </div>
    </div>
  );
}
