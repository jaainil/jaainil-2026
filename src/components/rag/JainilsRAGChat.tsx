import React, { useState, useEffect, useRef } from 'react';

interface Source {
  title: string;
  url: string;
  heading: string | null;
  snippet: string;
  score: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  latencyMs?: number;
  cached?: boolean;
}

const SAMPLE_QUESTIONS = [
  'Who is Jainil Prajapati?',
  'What open source projects has Jainil created?',
  'How does feature flagging work at scale?',
  'What leaked in Claude Code?',
];

function BrickGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <rect x="3" y="7" width="18" height="11" rx="2" fill="var(--piece)" stroke="var(--keyline)" strokeWidth="2" />
      <circle cx="8.5" cy="7" r="2.4" fill="var(--piece)" stroke="var(--keyline)" strokeWidth="2" />
      <circle cx="15.5" cy="7" r="2.4" fill="var(--piece)" stroke="var(--keyline)" strokeWidth="2" />
    </svg>
  );
}

const INLINE_RE = /\[(.+?)\]\((.+?)\)|\*\*(.+?)\*\*|`([^`]+)`/g;

/** Renders one line of the RAG's markdown subset: links, bold, inline code. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;

  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      const isNumberedCitation = /^\d+$/.test(m[1]);
      if (isNumberedCitation) {
        nodes.push(
          <sup key={`${keyPrefix}-n-${m.index}`}>
            <a
              href={m[2]}
              target="_blank"
              rel="noopener noreferrer"
              title="View source"
              className="inline-grid place-items-center min-w-[18px] h-[18px] mx-0.5 px-1 rounded-md text-[10px] font-black align-super transition-transform hover:-translate-y-0.5"
              style={{
                background: 'var(--piece)',
                color: '#fff',
                border: '1.5px solid var(--keyline)',
                textDecoration: 'none',
              }}
            >
              {m[1]}
            </a>
          </sup>
        );
      } else {
        nodes.push(
          <a
            key={`${keyPrefix}-l-${m.index}`}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2"
            style={{ color: 'var(--color-link)' }}
          >
            {m[1]}
          </a>
        );
      }
    } else if (m[3]) {
      nodes.push(<strong key={`${keyPrefix}-b-${m.index}`}>{m[3]}</strong>);
    } else if (m[4]) {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${m.index}`}
          className="px-1 py-0.5 rounded-md text-[0.9em] font-bold"
          style={{ border: '1.5px solid var(--color-border-soft, #7fa8cc)', background: 'var(--color-surface-elevated)' }}
        >
          {m[4]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Renders the RAG answer's markdown subset: paragraphs, bullet lists, links, bold, code. */
function RagMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n/);
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    out.push(
      <ul key={`ul-${key++}`} className="my-2 space-y-1.5 pl-1 list-none">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className="mt-[7px] w-2 h-2 rounded-[3px] shrink-0"
              style={{ background: 'var(--piece)', border: '1.5px solid var(--keyline)' }}
              aria-hidden="true"
            />
            <span>{renderInline(b, `li-${key}-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const raw of blocks) {
    const line = raw.trim();
    if (/^[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }
    flushBullets();
    if (line === '') continue;
    const pKey = key++;
    out.push(<p key={`p-${pKey}`} className="my-1.5">{renderInline(line, `p-${pKey}`)}</p>);
  }
  flushBullets();

  return <div>{out}</div>;
}

const STORAGE_KEY_MESSAGES = 'ragchat_messages_v1';
const STORAGE_KEY_OPEN = 'ragchat_open_v1';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: "hey! i'm Jainil's RAG assistant — ask me anything about his portfolio, resume, skills, or published articles. every answer cites its source 🧑‍💻",
  },
];

export const JainilsRAGChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialMessagesMount = useRef(true);
  const isInitialOpenMount = useRef(true);

  // Restore messages and open state on client mount (across page navigation and refresh)
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      /* ignore storage access error */
    }

    try {
      const savedOpen = sessionStorage.getItem(STORAGE_KEY_OPEN);
      if (savedOpen === 'true') {
        setIsOpen(true);
      }
    } catch {
      /* ignore storage access error */
    }
  }, []);

  // Persist messages to localStorage when updated
  useEffect(() => {
    if (isInitialMessagesMount.current) {
      isInitialMessagesMount.current = false;
      return;
    }
    try {
      if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome')) {
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
      } else {
        localStorage.removeItem(STORAGE_KEY_MESSAGES);
      }
    } catch {
      /* ignore storage quota or private mode */
    }
  }, [messages]);

  // Persist open state to sessionStorage so it stays open during navigation/refresh
  useEffect(() => {
    if (isInitialOpenMount.current) {
      isInitialOpenMount.current = false;
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY_OPEN, isOpen ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, [isOpen]);

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
    } catch {
      /* ignore */
    }
  };

  // Lock background scroll (touchpad, wheel, mobile touch) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Focus input field smoothly
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance to prevent layout jumping
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Prevent touch dragging from scrolling background page on mobile / touchpads
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (messagesContainerRef.current && messagesContainerRef.current.contains(target)) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  // ponytail: localStorage flag instead of "seen N times" logic — fine for a hint
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem('ragchat-hint') !== '1') setShowHint(true);
      } catch {
        /* private mode */
      }
    }, 1500);
    const hide = setTimeout(() => setShowHint(false), 9500);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, []);

  const rememberHint = () => {
    try {
      localStorage.setItem('ragchat-hint', '1');
    } catch {
      /* ignore */
    }
  };

  // Scroll safely inside messages container without scrolling outer window/page
  useEffect(() => {
    if (!isOpen) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (questionText: string) => {
    const query = questionText.trim();
    if (!query || isLoading) return;

    setInput('');
    const ts = Date.now();
    const rnd = () => Math.random().toString(36).slice(2, 7);
    const assistantMsgId = `a-${ts}-${rnd()}`;

    setMessages((prev) => [
      ...prev,
      { id: `u-${ts}-${rnd()}`, role: 'user', content: query },
    ]);
    setIsLoading(true);

    try {
      const startTime = Date.now();
      // Send recent turns so follow-up questions keep their context server-side.
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/rag/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, history }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      const latencyMs = Date.now() - startTime;
      const fullText = data.answer || 'No response received.';

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: fullText,
          sources: data.sources || [],
          latencyMs,
          cached: data.cached,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: "ugh, couldn't reach the knowledge base right now 😭 try again in a sec, or just email Jainil directly at jainilprajapati9@gmail.com",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={() => {
          rememberHint();
          setIsOpen(true);
        }}
        className="fixed bottom-36 left-4 md:bottom-6 md:left-6 md:right-auto z-30 flex items-center justify-center gap-2.5 w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-3 rounded-xl transition-transform hover:-translate-y-1 font-bold text-sm cursor-pointer"
        style={{
          backgroundColor: 'var(--marker)',
          color: '#10151b',
          border: '2px solid var(--keyline)',
          boxShadow: '0 3px 0 var(--keyline)',
        }}
        aria-label="Open Jainil's AI chat assistant (or press Command K)"
      >
        <BrickGlyph />
        <span className="hidden md:inline">Ask Jainil's AI</span>
        <kbd
          className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold"
          style={{ border: '2px solid var(--keyline)', background: 'var(--paper)', color: 'var(--ink)' }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Mobile hint bubble — names the unlabeled icon */}
      <div
        className={`md:hidden fixed bottom-49 left-4 z-30 transition-all duration-300 ease-out ${
          showHint && !isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1.5 opacity-0'
        }`}
        aria-hidden={!showHint || isOpen}
      >
        <div
          aria-hidden="true"
          className="absolute top-full mt-[-7px] left-[19px] w-3 h-3 rotate-45"
          style={{ background: 'var(--paper)', borderRight: '2px solid var(--keyline)', borderBottom: '2px solid var(--keyline)' }}
        />
        <button
          onClick={() => {
            rememberHint();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            background: 'var(--paper)',
            color: 'var(--ink)',
            border: '2px solid var(--keyline)',
            boxShadow: '0 3px 0 var(--keyline)',
          }}
        >
          <BrickGlyph />
          Ask me anything about Jainil
        </button>
        <button
          onClick={() => {
            rememberHint();
            setShowHint(false);
          }}
          aria-label="Dismiss hint"
          className="absolute -top-2 -right-2 grid place-items-center w-5 h-5 rounded-md cursor-pointer"
          style={{ background: 'var(--paper)', color: 'var(--ink)', border: '2px solid var(--keyline)', boxShadow: '0 2px 0 var(--keyline)' }}
        >
          <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3.4" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overscroll-contain"
          style={{ background: 'rgba(16, 21, 27, 0.55)', overscrollBehavior: 'contain' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col rounded-2xl overflow-hidden overscroll-contain"
            style={{
              backgroundColor: 'var(--paper)',
              border: '2px solid var(--keyline)',
              boxShadow: '0 6px 0 var(--keyline)',
              color: 'var(--ink)',
              overscrollBehavior: 'contain',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Chat with Jainil's AI assistant"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '2px solid var(--keyline)' }}>
              <div className="flex items-center gap-3">
                <span
                  className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
                  style={{ background: 'var(--piece)', border: '2px solid var(--keyline)' }}
                >
                  <BrickGlyph />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight flex items-center gap-2">
                    Ask Jainil's AI
                  </h3>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    Grounded in portfolio & field notes · AI-generated (verify critical facts)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 1 && (
                  <button
                    onClick={handleResetChat}
                    aria-label="Reset chat conversation"
                    title="Reset conversation"
                    className="grid place-items-center w-9 h-9 rounded-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
                    style={{ border: '2px solid var(--keyline)', background: 'var(--paper)', color: 'var(--ink)', boxShadow: '0 2px 0 var(--keyline)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="grid place-items-center w-9 h-9 rounded-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
                  style={{ border: '2px solid var(--keyline)', background: 'var(--paper)', color: 'var(--ink)', boxShadow: '0 2px 0 var(--keyline)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.6" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 text-sm stud-grid"
              style={{ overscrollBehavior: 'contain' }}
            >
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed ${
                      m.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}
                    style={
                      m.role === 'user'
                        ? {
                            background: 'var(--action)',
                            color: '#ffffff',
                            border: '2px solid var(--keyline)',
                            boxShadow: '0 3px 0 var(--keyline)',
                          }
                        : {
                            background: 'var(--paper)',
                            color: 'var(--ink)',
                            border: '2px solid var(--keyline)',
                            boxShadow: '0 3px 0 var(--keyline)',
                          }
                    }
                  >
                    <div className="whitespace-pre-wrap font-medium">
                      {m.role === 'assistant' ? <RagMarkdown text={m.content} /> : m.content}
                    </div>

                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-3 text-xs" style={{ borderTop: '2px dashed var(--color-border-soft, #7fa8cc)' }}>
                        <div className="font-bold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                          Sources:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold transition-transform hover:-translate-y-0.5"
                              style={{
                                border: '2px solid var(--keyline)',
                                background: 'var(--paper)',
                                color: 'var(--ink)',
                                boxShadow: '0 2px 0 var(--keyline)',
                              }}
                            >
                              <span
                                className="grid place-items-center w-4 h-4 rounded text-[9px] font-black"
                                style={{ background: 'var(--piece)', color: '#fff', border: '1.5px solid var(--keyline)' }}
                              >
                                {idx + 1}
                              </span>
                              {s.title.length > 34 ? s.title.slice(0, 34) + '…' : s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.latencyMs !== undefined && (
                      <div className="mt-2 text-[10px] font-bold flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{m.latencyMs}ms</span>
                        {m.cached && (
                          <span
                            className="px-1.5 py-0.5 rounded-md"
                            style={{ border: '2px solid var(--keyline)', background: 'var(--marker)', color: '#10151b' }}
                          >
                            Cached
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-[4px] animate-bounce"
                    style={{ background: 'var(--piece)', border: '2px solid var(--keyline)' }}
                    aria-hidden="true"
                  />
                  Searching the knowledge base...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Sample Prompts */}
            {messages.length === 1 && (
              <div className="px-5 py-3 flex flex-wrap gap-2 shrink-0" style={{ borderTop: '2px dashed var(--color-border-soft, #7fa8cc)' }}>
                {SAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-transform hover:-translate-y-0.5 cursor-pointer"
                    style={{
                      border: '2px solid var(--keyline)',
                      background: 'var(--paper)',
                      color: 'var(--ink)',
                      boxShadow: '0 2px 0 var(--keyline)',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-4 flex flex-col gap-2 shrink-0"
              style={{ borderTop: '2px solid var(--keyline)' }}
            >
              <div className="flex gap-2">
                <label htmlFor="rag-chat-input" className="sr-only">
                  Ask a question about Jainil's work, resume, or articles
                </label>
                <input
                  id="rag-chat-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Jainil's work, resume, or articles..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
                  style={{
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    border: '2px solid var(--keyline)',
                    boxShadow: '0 2px 0 var(--keyline)',
                  }}
                  disabled={isLoading}
                  aria-describedby="rag-form-consent"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label="Send question to Jainil's AI"
                  className="px-4 py-2.5 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
                  style={{
                    background: 'var(--action)',
                    color: '#fff',
                    border: '2px solid var(--keyline)',
                    boxShadow: '0 2px 0 var(--keyline)',
                  }}
                >
                  Send
                </button>
              </div>
              <p id="rag-form-consent" className="text-[11px] leading-tight px-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                By submitting, you consent to AI processing of your question to retrieve answers. No personal data is stored or sold. Do not submit sensitive details. Read our{' '}
                <a href="/legal/privacy/" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2" style={{ color: 'var(--color-link)' }}>
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default JainilsRAGChat;
