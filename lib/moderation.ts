// Content moderation extension point — same philosophy as aiClient.ts:
// a stable function signature, backed by local heuristics today, swappable
// for a real model (OpenAI's moderation endpoint is free and a natural
// first real-AI feature to wire in) without touching any caller.

// Deliberately blunt for v1: profanity/slurs, spam patterns (repeated
// chars, all-caps shouting, link/contact-info dropping). Real moderation
// needs to catch more nuance than this — that's exactly the gap a real
// model closes later.
const BLOCKED_TERMS = [
  // kept intentionally short and generic here — extend or replace with a
  // real wordlist / model call before this ever serves real traffic
  "fuck", "shit", "bitch", "asshole", "cunt", "nigger", "faggot",
];

const URL_PATTERN = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]{2,}/i;
const EXCESSIVE_CAPS = /^[^a-z]{12,}$/; // 12+ chars with no lowercase at all
const REPEATED_CHARS = /(.)\1{6,}/; // same character 7+ times in a row

export type ModerationResult = {
  allowed: boolean;
  status: "visible" | "flagged";
  reason: string | null;
};

export async function checkText(text: string): Promise<ModerationResult> {
  const trimmed = text.trim();

  if (!trimmed) {
    return { allowed: false, status: "flagged", reason: "empty" };
  }
  if (trimmed.length > 1000) {
    return { allowed: false, status: "flagged", reason: "too long" };
  }

  const lower = trimmed.toLowerCase();
  const hitTerm = BLOCKED_TERMS.find(term => lower.includes(term));
  if (hitTerm) {
    return { allowed: false, status: "flagged", reason: "blocked term" };
  }
  if (URL_PATTERN.test(trimmed)) {
    return { allowed: false, status: "flagged", reason: "contains a link" };
  }
  if (EXCESSIVE_CAPS.test(trimmed)) {
    return { allowed: false, status: "flagged", reason: "excessive caps" };
  }
  if (REPEATED_CHARS.test(trimmed)) {
    return { allowed: false, status: "flagged", reason: "spam pattern" };
  }

  return { allowed: true, status: "visible", reason: null };
}
