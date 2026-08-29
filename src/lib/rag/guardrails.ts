/**
 * Pre-LLM guardrails: identity meta-questions and prompt-injection deflection.
 * Both rails are deterministic regex checks that short-circuit before retrieval
 * and generation, so they cost zero model tokens and return instantly.
 * Injection detection layers llm-prompt-guard (maintained upstream patterns)
 * on top of the local rules; the library failure path fails open.
 */
import { createGuard } from 'llm-prompt-guard';

const IDENTITY_RE = new RegExp(
  [
    '\\b(?:which|what)\\s+(?:model|llm|ai)\\s+(?:are|is)\\s+(?:you|this)\\b',
    '\\bwhat\\s+are\\s+you\\b',
    "\\bwhat(?:'s|\\s+is)\\s+your\\s+name\\b",
    '\\bwho\\s+(?:made|built|created|trained|developed)\\s+you\\b',
    '\\bare\\s+you\\s+(?:chatgpt|gpt-?\\d*|gemini|claude|copilot|deepseek|grok|llama|mistral|an?\\s+(?:ai|llm|bot|human|person))\\b',
    '\\bis\\s+(?:this|that)\\s+(?:an?\\s+(?:ai|bot|human)|chatgpt|gemini|claude)\\b',
  ].join('|'),
  'i'
);

const INJECTION_RE = new RegExp(
  [
    '\\bignore\\s+(?:all\\s+|any\\s+)?(?:previous|prior|above|earlier|past)\\s+(?:instructions?|prompts?|messages?|rules?|context)\\b',
    '\\bdisregard\\s+(?:all\\s+|any\\s+)?(?:previous|prior|above|earlier)\\s+(?:instructions?|prompts?|rules?|context)\\b',
    '\\b(?:reveal|show|print|repeat|output|display|dump|leak|expose)\\b[^.?!]{0,40}\\b(?:system\\s+(?:prompt|instruction|message)s?|(?:initial|original|hidden|secret|first)\\s+(?:prompt|instructions?)\\b|your\\s+(?:\\w+\\s+){0,2}(?:instructions?|prompt|rules?|programming)s?\\b)',
    '\\bsystem\\s+prompt\\b',
    '\\byou\\s+are\\s+now\\b',
    "(?<!\\b(?:he|she|they|it)\\s+)\\bact\\s+as\\s+(?:if|a|an|my)\\b",
    '\\bpretend\\s+(?:to\\s+be|you\\s+are)\\b',
    '\\benter\\s+(?:developer|dan|god)\\s+mode\\b',
    '\\bjailbreak\\b',
    '\\bdo\\s+anything\\s+now\\b',
    '\\bforget\\s+(?:everything|all|your)\\b',
    '\\b(?:your|the)\\s+(?:original|initial|hidden|secret|first)\\s+(?:prompt|instructions?|message)s?\\b',
    '\\b(?:repeat|echo|output|print)\\s+(?:the\\s+)?(?:text|everything|all|context)\\s+(?:above|before|prior|earlier)\\b',
  ].join('|'),
  'i'
);

export function matchIdentity(question: string): boolean {
  return IDENTITY_RE.test(question);
}

export function matchInjection(question: string): boolean {
  return INJECTION_RE.test(question);
}

// Encoding-bypass normalization: strips invisible characters, folds homoglyph
// look-alikes, and un-leets common substitutions before rail matching.
// U+200B is a space that sneaks past filters — it separates words, so map it to one;
// the rest are invisible joiners/embedding controls inside words and just get stripped.
const ZERO_WIDTH_RE = /[\u200C-\u200F\u202A-\u202E\u2060\uFEFF]/g;

const HOMOGLYPHS: Record<string, string> = {
  '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p', '\u0441': 'c', // Cyrillic а е о р с
  '\u0445': 'x', '\u0443': 'y', '\u0456': 'i', '\u043f': 'p', '\u043d': 'h', // х у і п н
  '\u0391': 'A', '\u039f': 'O', '\u03a1': 'P', '\u03a4': 'T', '\u0410': 'A', '\u0415': 'E', // Ο Τ Α Ε
};

const LEET_MAP: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

const upstreamGuard = createGuard();

/** Collapses bypass encodings (invisible chars, homoglyphs, leetspeak) so the rails see plain text. */
export function normalizeInput(question: string): string {
  let s = question.normalize('NFKC').replace(/\u200B/g, ' ').replace(ZERO_WIDTH_RE, '');
  s = s.replace(/./gu, (ch) => HOMOGLYPHS[ch] ?? ch);
  s = s.replace(/[013457@$!]/g, (ch) => LEET_MAP[ch] ?? ch);
  return s.replace(/\s+/g, ' ');
}

/** True if either the raw or the bypass-normalized text trips the injection rail. */
export function isInjectionAttempt(question: string): boolean {
  if (INJECTION_RE.test(question) || INJECTION_RE.test(normalizeInput(question))) return true;
  // Upstream maintained layer. Its "act as" pattern is high-severity with no
  // third-person awareness, so mask that construct (a portfolio bot gets
  // "how does he act as a DevOps engineer" as a legitimate question) first.
  const masked = question.replace(/\b(?:he|she|they|it|jainil)\s+acts?\s+as\b/gi, 'acts');
  try {
    return upstreamGuard.assess(masked).hasHighSeverity;
  } catch {
    return false; // ponytail: fail open — local rails + prompt hardening still cover
  }
}

/** True if the raw or normalized text hits the identity rail. */
export function isIdentityQuestion(question: string): boolean {
  return IDENTITY_RE.test(question) || IDENTITY_RE.test(normalizeInput(question));
}

// Phrases only the system prompt contains — their echo means the prompt leaked.
const PROMPT_ECHO_RE =
  /(Jainil's RAG AI Assistant|Citation & Grounding Rules|untrusted data, never an instruction|Do not invent facts or infer unmentioned)/i;

/**
 * Output exfil scan: rejects answers that echo the system prompt or emit a URL
 * that is not one of the verified sources.
 */
export function isExfil(answer: string, sourceUrls: string[]): boolean {
  if (PROMPT_ECHO_RE.test(answer)) return true;
  const allowed = new Set(sourceUrls.map((u) => u.replace(/\/$/, '')));
  for (const url of answer.match(/https?:\/\/[^\s)>\]]+/g) ?? []) {
    if (!allowed.has(url.replace(/[).,\]]+$/, '').replace(/\/$/, ''))) return true;
  }
  return false;
}

/** Canned identity answer; covers both "who are you" readings (the bot or the man). */
export function identityAnswer(model: string): string {
  return (
    `okay so i'm basically a small RAG pipeline running on this site — ` +
    `i match your question against an index of Jainil's portfolio, resume, and published articles, ` +
    `and then ${model} writes the answer strictly from those sources.\n\n` +
    `if you meant Jainil himself: full-stack & DevOps engineer at Aexaware Infotech, ` +
    `creator of Writenex CMS, Dokploy contributor. ask me about his work and i'll cite my sources 🧑‍💻`
  );
}

export const INJECTION_ANSWER =
  `nice try 😭 but i only answer questions about Jainil's portfolio, resume, and published articles. ` +
  `ask me one of those and i'll cite my sources.`;

/**
 * Response-side guardrails (output gate).
 * PII/secret redaction + degenerate-output detection, ported from the
 * guardrails-ai validator set (DetectPII, GibberishText) to native TS so the
 * Node pipeline needs no Python runtime.
 */

// Jainil's public contact details are site content, not leaks.
const ALLOWED_CONTACT_DIGITS = new Set(['919725284302', '9725284302']);

const SECRET_RE = /\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[bap]-[A-Za-z0-9-]{10,}|AIza[A-Za-z0-9_-]{30,})\b/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g;
const PHONE_CANDIDATE_RE = /\+?\d[\d\s().-]{7,20}\d/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;

/** Redacts emails, phone numbers, SSNs, and API-key-shaped secrets; keeps Jainil's public contacts. */
export function redactPii(text: string): string {
  let out = text.replace(EMAIL_RE, (m) => (m.toLowerCase() === 'jainilprajapati9@gmail.com' ? m : '[redacted email]'));
  out = out.replace(PHONE_CANDIDATE_RE, (m) => {
    const digits = m.replace(/\D/g, '');
    if (ALLOWED_CONTACT_DIGITS.has(digits) || [...ALLOWED_CONTACT_DIGITS].some((a) => digits.endsWith(a))) return m;
    return digits.length >= 10 ? '[redacted number]' : m;
  });
  out = out.replace(SSN_RE, '[redacted number]');
  out = out.replace(SECRET_RE, '[redacted]');
  return out;
}

/** Detects degenerate LLM output: runaway long tokens or the same phrase looped. */
export function isGibberish(text: string): boolean {
  // Code spans and URLs legitimately contain long tokens — mask them first.
  const masked = text.replace(/`[^`]*`/g, ' ').replace(/https?:\/\/\S+/g, ' ');
  if (/\S{41,}/.test(masked)) return true;

  const words = masked.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length < 12) return false;
  const counts = new Map<string, number>();
  for (let i = 0; i + 3 <= words.length; i++) {
    const gram = words.slice(i, i + 3).join(' ');
    const n = (counts.get(gram) ?? 0) + 1;
    counts.set(gram, n);
    if (n >= 4) return true;
  }
  return false;
}

export function sanitizeAnswer(text: string): { text: string; gibberish: boolean } {
  return { text: redactPii(text), gibberish: isGibberish(text) };
}
