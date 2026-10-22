import * as api from "./api";
import type { AiStyle, AiSummary, AiTone } from "./api";

// What the assistant's screens need from the server. Tests pass their own.
export interface AiClient {
  suggestReply(chatId: string, tone: AiTone): Promise<{ text: string }>;
  summarize(chatId: string): Promise<AiSummary>;
  improve(text: string, style: AiStyle): Promise<{ text: string }>;
  translate(text: string, target: string): Promise<{ text: string }>;
}
export const realAiClient: AiClient = {
  suggestReply: api.aiSuggestReply,
  summarize: api.aiSummary,
  improve: api.aiImprove,
  translate: api.aiTranslate,
};

export const TONES: { key: AiTone; label: string }[] = [
  { key: "friendly", label: "Friendly" },
  { key: "professional", label: "Professional" },
  { key: "brief", label: "Short" },
];
export const STYLES: { key: AiStyle; label: string }[] = [
  { key: "polish", label: "Fix it up" },
  { key: "shorter", label: "Shorter" },
  { key: "friendlier", label: "Friendlier" },
  { key: "formal", label: "More formal" },
];
// The languages teams in the UAE and India work in most.
export const LANGUAGES = [
  "English",
  "Arabic",
  "Hindi",
  "Urdu",
  "Malayalam",
  "Tamil",
  "Telugu",
  "Bengali",
  "Gujarati",
  "Marathi",
  "Punjabi",
  "Kannada",
  "Tagalog",
  "French",
  "Russian",
];

const KEY = "scriwo_translate_to";
export function preferredLanguage(): string {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved && LANGUAGES.includes(saved)) return saved;
  } catch {
    /* storage can be blocked */
  }
  return "English";
}
export function rememberLanguage(language: string) {
  try {
    window.localStorage.setItem(KEY, language);
  } catch {
    /* storage can be blocked */
  }
}
