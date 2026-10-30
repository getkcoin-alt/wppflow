"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  MessageCircle,
  RotateCcw,
  Bot,
} from "lucide-react";
import { SITE, whatsappHref } from "@/lib/site";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  ctaType?: "trial" | "pricing" | "sales";
}

const DEFAULT_QUESTIONS = [
  {
    icon: Zap,
    label: "⚡ What is Scriwo & how does it work?",
    question: "What is Scriwo and how does the shared WhatsApp inbox work?",
  },
  {
    icon: ShieldCheck,
    label: "🛡️ How does Anti-Ban safety work?",
    question: "How does your Anti-Ban broadcast safety engine protect WhatsApp numbers?",
  },
  {
    icon: Sparkles,
    label: "💰 What are the pricing plans & limits?",
    question: "What are the pricing plans, number limits, and currency options in UAE and India?",
  },
  {
    icon: ArrowRight,
    label: "🚀 How do I start a free trial?",
    question: "How can I start a free trial and what is included?",
  },
];

export function RewoVisitorBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro-1",
      sender: "bot",
      text: "👋 Welcome to **Scriwo**! I'm **Riwo**, your AI concierge.\n\nI can answer questions about our **Shared WhatsApp Inbox**, **Anti-Ban Broadcast Engine**, team collaboration, and pricing plans.\n\nTap a quick question below or ask me anything directly!",
      time: "Just now",
      ctaType: "trial",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  // Delayed teaser balloon entrance (after 2.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!teaserDismissed && !isOpen) {
        setShowTeaser(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [teaserDismissed, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowTeaser(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);
    setError(null);

    // Build chat history for conversational context
    const history = messages
      .slice(-6)
      .map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

    try {
      const response = await fetch("https://app.scriwo.com/api/public/rewo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.reply || "I'm here to help! Could you please rephrase your question?";

      // Determine smart CTA based on content
      let ctaType: "trial" | "pricing" | "sales" | undefined;
      const lowerReply = botReply.toLowerCase();
      if (lowerReply.includes("trial") || lowerReply.includes("sign up") || lowerReply.includes("register")) {
        ctaType = "trial";
      } else if (lowerReply.includes("price") || lowerReply.includes("plan") || lowerReply.includes("aed") || lowerReply.includes("inr")) {
        ctaType = "pricing";
      } else {
        ctaType = "trial";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          ctaType,
        },
      ]);
    } catch (err: unknown) {
      console.warn("Rewo chat API fetch error, using fallback answer:", err);
      // Smart offline fallback
      let fallback = "Thanks for your question! Scriwo provides a shared WhatsApp team inbox, anti-ban bulk broadcast safeguards, and unlimited team seats.\n\nYou can start a **7-Day Free Trial** in under 60 seconds or view all our pricing plans!";
      const qLower = query.toLowerCase();

      if (qLower.includes("anti-ban") || qLower.includes("ban") || qLower.includes("block")) {
        fallback = "🛡️ **Scriwo Anti-Ban Protection Engine**\n\nOur system incorporates 5 protective layers:\n• **Human Jitter**: 8–22s natural delays between messages\n• **Typing Simulation**: Live 'typing...' presence before sending\n• **Smart Batching**: 25 contacts per batch with 5-minute cool-down\n• **Opt-out Suppression**: Instantly blocks contacts who reply STOP\n• **Auto Circuit Breaker**: Halts broadcasts if abnormal failure spikes occur.";
      } else if (qLower.includes("price") || qLower.includes("cost") || qLower.includes("plan")) {
        fallback = "💰 **Scriwo Pricing & Plans**\n\n• **Starter**: 1 Number, 3 Teammates, Shared Inbox\n• **Growth**: 3 Numbers, 10 Teammates, Anti-Ban Broadcasts\n• **Business**: 10 Numbers, Unlimited Teammates, Riwo AI Assistant\n\nAvailable in **AED** (UAE) and **INR** (India) with monthly or discounted annual billing.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          sender: "bot",
          text: fallback,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          ctaType: "trial",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Basic formatted markdown parser (bold, bullet points, linebreaks, links)
  const renderFormatted = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
      const content = isBullet ? line.trim().replace(/^[•-]\s*/, "") : line;

      // Parse bold **word**
      const parts = content.split(/(\*\*[^*]+\*\*)/g);

      return (
        <div key={idx} className={`leading-relaxed ${isBullet ? "flex items-start gap-1.5 pl-1 my-0.5" : "my-0.5"}`}>
          {isBullet && <span className="text-leaf text-xs font-bold leading-5">•</span>}
          <span>
            {parts.map((p, pIdx) => {
              if (p.startsWith("**") && p.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-semibold text-fg">
                    {p.slice(2, -2)}
                  </strong>
                );
              }
              return p;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button & Living Halo (Fixed at bottom right) */}
      <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        {/* Living Teaser Bubble */}
        {showTeaser && !isOpen && (
          <div className="rewo-teaser-float relative mb-3 max-w-[280px] sm:max-w-[320px] rounded-2xl bg-surface/95 backdrop-blur-xl p-3.5 shadow-pop hairline text-xs sm:text-sm text-fg transition-all duration-300">
            <button
              onClick={() => {
                setShowTeaser(false);
                setTeaserDismissed(true);
              }}
              aria-label="Dismiss teaser"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 text-fg-3 hover:text-fg shadow-sm transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="flex items-start gap-3 cursor-pointer" onClick={handleOpen}>
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-gold/40 shadow-sm bg-surface-2 overflow-hidden">
                <img
                  src="/brand/riwo-hold.webp"
                  alt="Riwo AI"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-fg">
                  Have questions about Scriwo?
                </p>
                <p className="mt-0.5 text-fg-3 text-[11px] sm:text-xs">
                  Ask Riwo about features, Anti-Ban broadcasts, and pricing! ✨
                </p>
              </div>
            </div>
            {/* Arrow pointer */}
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-surface hairline border-t-0 border-l-0" />
          </div>
        )}

        {/* Trigger Button with Pulsing Halo Aura */}
        {!isOpen && (
          <div className="relative group">
            {/* Ambient Breathing Glow Aura */}
            <div
              className="rewo-halo pointer-events-none absolute -inset-2 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(circle, rgba(16,185,129,0.45) 0%, rgba(210,176,106,0.3) 50%, transparent 75%)",
              }}
            />

            <button
              onClick={handleOpen}
              aria-label="Open Riwo AI Concierge"
              className="relative flex h-14 items-center gap-3 rounded-full bg-surface pl-2 pr-4 py-2 text-fg shadow-pop hairline transition-all duration-300 hover:scale-105 active:scale-95 group-hover:border-gold/50"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2 ring-gold/40 shadow-sm bg-surface-2 overflow-visible">
                <img
                  src="/brand/riwo-hold.webp"
                  alt="Riwo AI"
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Live Radar Ping */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-surface" />
                </span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold tracking-wide text-fg">Ask Riwo AI</span>
                <span className="text-[10px] text-fg-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Main Glassmorphic Chat Modal */}
      {isOpen && (
        <div className="rewo-spring-up fixed bottom-4 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col w-auto sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl bg-surface/95 backdrop-blur-2xl shadow-pop hairline overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-surface-2/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-gold/40 shadow-sm bg-surface-2 overflow-visible">
                <img
                  src="/brand/riwo-hold.webp"
                  alt="Riwo AI Concierge"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-surface" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-fg">Riwo AI</h3>
                  <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-medium text-gold uppercase tracking-wider">
                    Concierge
                  </span>
                </div>
                <p className="text-[11px] text-fg-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Instant answers & trial support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClose}
                aria-label="Minimize"
                className="flex h-8 w-8 items-center justify-center rounded-full text-fg-3 hover:bg-surface-3 hover:text-fg transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-fg-3 hover:bg-surface-3 hover:text-fg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 transition-all duration-200 ${
                    m.sender === "user"
                      ? "bg-brand-solid text-white rounded-br-none shadow-sm"
                      : "bg-surface-2 text-fg hairline rounded-bl-none shadow-card"
                  }`}
                >
                  <div className="break-words">{renderFormatted(m.text)}</div>

                  {/* High-Converting CTA Buttons inside Bot responses */}
                  {m.sender === "bot" && m.ctaType && (
                    <div className="mt-3 pt-2.5 border-t border-line/10 flex flex-wrap gap-2">
                      {m.ctaType === "trial" && (
                        <a
                          href="https://app.scriwo.com/?signup=1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rewo-shimmer-btn inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-solid to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Start 7-Day Free Trial
                        </a>
                      )}
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-fg-2 hairline hover:bg-surface-3 transition-colors"
                      >
                        View Plans
                      </Link>
                      <a
                        href={whatsappHref("Hi Scriwo, I am chatting with Rewo on your website and want to speak with sales.")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-fg-2 hairline hover:bg-surface-3 transition-colors"
                      >
                        <MessageCircle className="h-3 w-3 text-leaf" />
                        WhatsApp Sales
                      </a>
                    </div>
                  )}
                </div>
                <span className="mt-1 px-1 text-[10px] text-fg-3">{m.time}</span>
              </div>
            ))}

            {/* Live Typing Wave */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-fg-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-gold/40 overflow-hidden bg-surface-2">
                  <img
                    src="/brand/riwo-hold.webp"
                    alt="Riwo typing"
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-surface-2 px-3 py-2 hairline">
                  <span className="rewo-typing-dot h-1.5 w-1.5 rounded-full bg-leaf inline-block" />
                  <span className="rewo-typing-dot h-1.5 w-1.5 rounded-full bg-leaf inline-block" />
                  <span className="rewo-typing-dot h-1.5 w-1.5 rounded-full bg-leaf inline-block" />
                  <span className="ml-1.5 text-[11px] text-fg-3">Riwo is typing…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Interactive Chips */}
          <div className="border-t border-line/60 bg-surface px-3 py-2">
            <p className="mb-1.5 text-[10px] uppercase tracking-wider font-semibold text-fg-3">
              Frequently Asked
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DEFAULT_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.question)}
                  disabled={loading}
                  className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-fg-2 hairline transition-all hover:bg-surface-3 hover:text-fg hover:border-gold/30 active:scale-95 disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-surface border-t border-line">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Riwo anything about Scriwo..."
                disabled={loading}
                className="flex-1 rounded-full bg-surface-2 px-4 py-2 text-xs sm:text-sm text-fg placeholder:text-fg-3 hairline focus:outline-none focus:ring-1 focus:ring-gold/60 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white transition-all hover:bg-brand-hover hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-fg-3">
              <span>Powered by Scriwo AI Engine</span>
              <a
                href="https://app.scriwo.com/?signup=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold font-medium hover:underline"
              >
                Start Free Trial →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
