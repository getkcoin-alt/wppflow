import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  ChevronDown,
  Volume2,
  VolumeX,
  ShieldCheck,
  Users,
  CreditCard,
  Building,
  Zap,
  ArrowRight,
  Bot,
  Flame,
} from "lucide-react";
import { playPing } from "../../utils/alerts";
import { backendBaseFor } from "../../utils/backendBase";

interface Message {
  id: string;
  sender: "rewo" | "user";
  text: string;
  timestamp: string;
  cta?: {
    label: string;
    action: "signup" | "pricing" | "question";
    payload?: string;
  };
}

const DEFAULT_QUESTIONS = [
  {
    icon: ShieldCheck,
    label: "Anti-Ban Protection",
    question: "How does the Anti-Ban broadcast engine protect my number from getting blocked?",
  },
  {
    icon: Users,
    label: "Team Collaboration",
    question: "Can multiple team members chat from the same official WhatsApp number?",
  },
  {
    icon: CreditCard,
    label: "Plans & Pricing",
    question: "What are the subscription plans, and is there a free trial?",
  },
  {
    icon: Building,
    label: "Real Estate CRM",
    question: "How does Scriwo help Real Estate businesses and high-ticket sales?",
  },
  {
    icon: Zap,
    label: "Setup Time",
    question: "How quickly can I connect my WhatsApp number and start?",
  },
];

// Rich fallback knowledge base ensuring 100% uptime and immediate answers
const KNOWLEDGE_BASE: Array<{
  keywords: string[];
  reply: string;
  cta?: { label: string; action: "signup" | "pricing" };
}> = [
  {
    keywords: ["anti-ban", "ban", "block", "safety", "200", "broadcast", "spam"],
    reply: `Scriwo's **State-of-the-Art Anti-Ban Broadcast Engine** protects your WhatsApp numbers by strictly breaking the robotic patterns that trigger Meta's spam filters:\n\n` +
      `• 🎲 **Dynamic Human Jitter**: 8–14s randomized natural pauses between messages instead of robotic fixed cadences.\n` +
      `• 🔀 **Spintax Syntax**: Automatic variations like \`{Hi|Hello|Hey}\` ensure each contact receives uniquely phrased text.\n` +
      `• ✍️ **Simulated Typing Presence**: Signals realistic "typing..." presence to WhatsApp before every send.\n` +
      `• ⏸️ **Smart Batching**: Sends in batches of 20–25 messages with automated 5-minute cool-downs so your phone can rest and receive replies.\n` +
      `• 🛑 **Instant Opt-Out Shield**: Automatically suppresses contacts who text "STOP" so they never hit WhatsApp's red "Report as Spam" button.\n` +
      `• ⚡ **Automated Circuit Breaker**: Auto-pauses broadcasts if consecutive delivery failures occur.\n\n` +
      `Result: **Maximum deliverability, high engagement, zero bans.** 🚀`,
    cta: { label: "🚀 Start 14-Day Free Trial", action: "signup" },
  },
  {
    keywords: ["team", "multiple", "agents", "share", "inbox", "one number", "collision"],
    reply: `Yes, absolutely! With Scriwo, **your entire team shares one official WhatsApp number** without ever stepping on each other's toes:\n\n` +
      `• 👥 **Team Inbox**: Assign chats to specific sales or support reps in 1 click.\n` +
      `• 🔒 **Private Internal Notes**: Leave team-only notes right inside customer chats that customers *never* see.\n` +
      `• ✍️ **Collision Prevention**: See in real time when a teammate is viewing or replying to a chat.\n` +
      `• ⏱️ **SLA & Wait Time Tracking**: Identify high-priority leads waiting for replies before they go cold.\n\n` +
      `Your team will respond 3x faster and never lose another customer enquiry!`,
    cta: { label: "🚀 Create Your Team Workspace", action: "signup" },
  },
  {
    keywords: ["price", "pricing", "plan", "cost", "subscription", "free trial", "free"],
    reply: `Scriwo offers transparent, high-ROI plans designed for businesses of all sizes:\n\n` +
      `• 🌟 **Starter Plan**: Perfect for small teams needing shared WhatsApp access, internal notes, and basic broadcasts.\n` +
      `• 🚀 **Growth Plan**: Includes the complete Anti-Ban broadcast engine, Spintax, advanced automations, and team performance metrics.\n` +
      `• 🏢 **Business / Enterprise Plan**: Multi-number support, dedicated account manager, custom API access, and tailored CRM workflows.\n\n` +
      `🎁 **14-Day Free Trial Available**: You can get started right now with full access, no credit card required!`,
    cta: { label: "🚀 Start Free Trial Now", action: "signup" },
  },
  {
    keywords: ["real estate", "property", "viewing", "broker", "realtor", "listing", "crm"],
    reply: `Scriwo includes a dedicated **Real Estate Solution** built for high-ticket property brokers and developers:\n\n` +
      `• 🏡 **Automated Lead Qualification**: Riwo AI scans WhatsApp chats to detect buyer budgets, preferred locations, and timelines.\n` +
      `• 📅 **Viewing & Follow-up Scheduler**: Automatic viewing reminders with acoustic alerts so agents never miss appointments.\n` +
      `• 📑 **Listing Matching**: Instant brochure and inventory sharing directly inside WhatsApp.\n` +
      `• 📊 **Pipeline Revenue Tracker**: Track deals from initial enquiry to closed commission.`,
    cta: { label: "🏢 Explore Real Estate Features", action: "signup" },
  },
  {
    keywords: ["setup", "connect", "start", "time", "qr", "how to"],
    reply: `Setup takes **under 2 minutes**! ⚡\n\n` +
      `1. Sign up for a free workspace.\n` +
      `2. Open the **Numbers** tab and scan the pairing QR code with your WhatsApp app (just like WhatsApp Web).\n` +
      `3. Invite your team members and start replying instantly!\n\n` +
      `No complex Meta API approval, no 2-week verification delays, and no credit card required to start.`,
    cta: { label: "🚀 Get Started in 2 Minutes", action: "signup" },
  },
];

export function RewoWebsiteWidget({
  onOpenSignup,
}: {
  onOpenSignup?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "rewo",
      text: "👋 Hi there! I'm **Rewo**, your Scriwo AI concierge. I can answer any questions about our shared WhatsApp inbox, Anti-Ban broadcasts, and pricing.\n\nTap a quick question below or type anything you'd like to know!",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show friendly teaser after 2.5s if unopened
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!teaserDismissed && !isOpen) {
        setShowTeaser(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [teaserDismissed, isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setShowTeaser(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async (questionText?: string) => {
    const userQuery = (questionText || input).trim();
    if (!userQuery) return;

    if (!questionText) setInput("");

    const userMsg: Message = {
      id: "u-" + Date.now(),
      sender: "user",
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    let answerText = "";
    let ctaAction: Message["cta"] = undefined;

    try {
      const host = typeof window !== "undefined" ? window.location.hostname : "";
      const base = backendBaseFor(host);
      const res = await fetch(`${base}/api/public/rewo/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userQuery,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.reply) {
          answerText = data.reply;
          ctaAction = { label: "🚀 Start Free Trial", action: "signup" };
        }
      }
    } catch {
      // Non-fatal, use fallback engine below
    }

    // If API returned fallback or failed, use smart NLP matching engine
    if (!answerText) {
      const lower = userQuery.toLowerCase();
      const match = KNOWLEDGE_BASE.find((item) =>
        item.keywords.some((kw) => lower.includes(kw))
      );

      if (match) {
        answerText = match.reply;
        ctaAction = match.cta;
      } else {
        answerText =
          `Scriwo empowers businesses with a **unified WhatsApp team inbox, zero-ban high-volume broadcasts, and sales CRM automation**! 🌟\n\n` +
          `• Share one WhatsApp number across multiple agents.\n` +
          `• Send bulk broadcasts safely with human cadence jitter and Spintax.\n` +
          `• Automatic lead capture and private internal notes.\n\n` +
          `Would you like to start a 14-day free trial or see pricing plans?`;
        ctaAction = { label: "🚀 Start Free Trial", action: "signup" };
      }
    }

    // Realistic typing pause (600 - 1100ms)
    setTimeout(() => {
      setIsTyping(false);
      const rewoMsg: Message = {
        id: "r-" + Date.now(),
        sender: "rewo",
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        cta: ctaAction,
      };
      setMessages((prev) => [...prev, rewoMsg]);
      if (soundEnabled) {
        playPing();
      }
    }, 750);
  };

  const handleCtaClick = (cta?: Message["cta"]) => {
    if (!cta) return;
    if (cta.action === "signup") {
      setIsOpen(false);
      onOpenSignup?.();
    } else if (cta.action === "pricing") {
      handleSend("What are the subscription plans?");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans select-none" data-testid="rewo-widget">
      {/* Floating Teaser Bubble */}
      {showTeaser && !isOpen && (
        <div className="absolute bottom-16 right-0 mb-3 w-[270px] sm:w-[300px] animate-rise">
          <div className="relative rounded-2xl bg-surface-1/95 backdrop-blur-md border border-line p-3.5 shadow-2xl text-[13px] text-fg">
            <button
              onClick={() => {
                setShowTeaser(false);
                setTeaserDismissed(true);
              }}
              className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-surface-2 border border-line text-fg-3 hover:text-fg flex items-center justify-center text-[11px]"
              aria-label="Dismiss teaser"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-2.5">
              <div className="relative h-7 w-7 rounded-full bg-gold-gradient grid place-items-center text-white shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-ok border-2 border-surface-1" />
              </div>
              <div className="cursor-pointer" onClick={() => setIsOpen(true)}>
                <p className="font-semibold text-fg flex items-center gap-1.5">
                  Rewo is Online
                  <span className="inline-block h-2 w-2 rounded-full bg-ok animate-pulse" />
                </p>
                <p className="text-fg-2 text-[12px] mt-0.5 leading-snug">
                  Have questions about WhatsApp Anti-Ban or pricing? Ask me anytime!
                </p>
              </div>
            </div>
          </div>
          {/* Triangle pointer */}
          <div className="absolute -bottom-2 right-6 h-3 w-3 rotate-45 bg-surface-1 border-r border-b border-line" />
        </div>
      )}

      {/* Main Collapsed Orb / Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-[#181a1d] to-[#121316] border border-gold/40 hover:border-gold p-2 pr-4 shadow-[0_12px_36px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-105"
          aria-label="Open Rewo AI Assistant"
        >
          {/* Animated Radial Pulse Glow */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-gold/30 via-brand-solid/30 to-gold/30 blur-md opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />

          {/* Avatar Icon */}
          <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-[#0F6B55] to-[#D6B97B] p-0.5 flex items-center justify-center shadow-md">
            <div className="h-full w-full rounded-full bg-[#08090a] flex items-center justify-center text-gold">
              <Bot className="w-6 h-6 text-gold group-hover:rotate-12 transition-transform duration-300" />
            </div>
            {/* Live radar beacon */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-ok border-2 border-[#08090a]" />
            </span>
          </div>

          {/* Label */}
          <div className="relative text-left">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white tracking-wide">
              <span>Ask Rewo AI</span>
              <Sparkles className="w-3.5 h-3.5 text-gold animate-bounce" />
            </div>
            <div className="text-[11px] text-white/60 font-medium">Live Concierge</div>
          </div>
        </button>
      )}

      {/* Expanded Interactive Chat Drawer */}
      {isOpen && (
        <div className="relative w-[92vw] sm:w-[410px] h-[560px] max-h-[82vh] rounded-[26px] bg-surface-1/95 backdrop-blur-2xl border border-line shadow-[0_24px_70px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-rise">
          {/* Live Top Gradient Ambient Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-solid via-gold to-brand-solid animate-pulse" />

          {/* Header */}
          <div className="px-4 py-3.5 border-b border-line/80 flex items-center justify-between bg-surface-2/60">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-[#0F6B55] to-[#D6B97B] p-0.5 flex items-center justify-center">
                <div className="h-full w-full rounded-full bg-[#08090a] flex items-center justify-center text-gold">
                  <Bot className="w-5 h-5 text-gold" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-ok border-2 border-surface-1" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-fg flex items-center gap-1.5">
                  Rewo AI
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-ok/15 text-ok">
                    Live
                  </span>
                </h3>
                <p className="text-[11.5px] text-fg-3 leading-none">
                  Scriwo Concierge & Onboarding
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8 rounded-full text-fg-3 hover:text-fg hover:bg-surface-3 flex items-center justify-center transition"
                title={soundEnabled ? "Mute chimes" : "Enable sound chimes"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-gold" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full text-fg-3 hover:text-fg hover:bg-surface-3 flex items-center justify-center transition"
                aria-label="Minimize Rewo"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "rounded-br-sm bg-brand-solid text-white shadow-sm"
                      : "rounded-tl-sm bg-surface-2 text-fg border border-line/60 shadow-sm"
                  }`}
                >
                  {m.text}
                </div>

                {/* Optional Call to Action Button inside message */}
                {m.cta && (
                  <button
                    type="button"
                    onClick={() => handleCtaClick(m.cta)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-gradient-to-r from-gold to-[#c7a45e] text-[#08090a] hover:opacity-95 shadow-md transition transform active:scale-95"
                  >
                    <span>{m.cta.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <span className="text-[10px] text-fg-3 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {/* Live Typing Animation */}
            {isTyping && (
              <div className="flex items-center gap-2 text-fg-3 text-[12px] pl-1 animate-pulse">
                <div className="h-6 w-8 rounded-full bg-surface-2 flex items-center justify-center gap-1 px-2 border border-line">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>Rewo is thinking…</span>
              </div>
            )}

            {/* Default Quick Questions Chips */}
            {messages.length <= 2 && !isTyping && (
              <div className="pt-2">
                <p className="text-[11.5px] font-semibold text-fg-3 uppercase tracking-wider mb-2 ml-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-gold" />
                  Frequently Asked Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {DEFAULT_QUESTIONS.map((q) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => handleSend(q.question)}
                        className="w-full text-left p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line/70 hover:border-gold/50 text-[12.5px] text-fg flex items-center justify-between group transition duration-200"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Icon className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                          {q.label}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-fg-3 group-hover:text-gold group-hover:translate-x-0.5 transition" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Trial Motivation Strip */}
          <div className="px-4 py-2 bg-gold/10 border-t border-gold/20 flex items-center justify-between text-[11.5px]">
            <span className="text-fg-2 font-medium">
              Ready to automate WhatsApp safely?
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSignup?.();
              }}
              className="text-gold font-semibold hover:underline flex items-center gap-1"
            >
              Start Free Trial →
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-3 border-t border-line/80 bg-surface-2/80 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Rewo anything about Scriwo..."
              disabled={isTyping}
              maxLength={800}
              className="flex-1 bg-surface-1 border border-line rounded-xl px-3.5 py-2 text-[13px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-gold transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="h-9 w-9 rounded-xl bg-brand-solid hover:bg-brand-solid/90 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition shadow-sm"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
