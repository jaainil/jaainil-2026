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
              target={m[2].startsWith('http') ? '_blank' : undefined}
              rel={m[2].startsWith('http') ? 'noopener noreferrer' : undefined}
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
            target={m[2].startsWith('http') ? '_blank' : undefined}
            rel={m[2].startsWith('http') ? 'noopener noreferrer' : undefined}
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
    out.push(<p key={`p-${key++}`} className="my-1.5">{renderInline(line, `p-${key}`)}</p>);
  }
  flushBullets();

  return <div>{out}</div>;
}

export const JainilsRAGChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Jainil's RAG assistant. Ask me anything about his portfolio, resume, skills, or published articles — every answer cites its source.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
    const assistantMsgId = 'a-' + Date.now();

    setMessages((prev) => [
      ...prev,
      { id: 'u-' + Date.now(), role: 'user', content: query },
    ]);
    setIsLoading(true);

    try {
      const startTime = Date.now();
      const res = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
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
          content: "Sorry, I couldn't reach the knowledge base. Try again, or email Jainil directly at jainilprajapati9@gmail.com.",
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
        aria-label="Open Jainil's AI chat"
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
        className={`md:hidden fixed bottom-[12.25rem] left-4 z-30 transition-all duration-300 ease-out ${
          showHint && !isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1.5 opacity-0'
        }`}
        aria-hidden={!showHint || isOpen}
      >
        <div
          aria-hidden="true"
          className="absolute top-full -mt-[7px] left-[19px] w-3 h-3 rotate-45"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(16, 21, 27, 0.55)' }}>
          <div
            className="relative w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--paper)',
              border: '2px solid var(--keyline)',
              boxShadow: '0 6px 0 var(--keyline)',
              color: 'var(--ink)',
            }}
            role="dialog"
            aria-label="Chat with Jainil's AI assistant"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '2px solid var(--keyline)' }}>
              <div className="flex items-center gap-3">
                <span
                  className="grid place-items-center w-9 h-9 rounded-lg"
                  style={{ background: 'var(--piece)', border: '2px solid var(--keyline)' }}
                >
                  <BrickGlyph />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight flex items-center gap-2">
                    Ask Jainil's AI
                  </h3>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    Grounded in the portfolio, resume & 25+ field notes
                  </p>
                </div>
              </div>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm stud-grid">
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
                              target={s.url.startsWith('http') ? '_blank' : undefined}
                              rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
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
              <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderTop: '2px dashed var(--color-border-soft, #7fa8cc)' }}>
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
              className="p-4 flex gap-2"
              style={{ borderTop: '2px solid var(--keyline)' }}
            >
              <input
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
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2.5 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
                style={{
                  background: 'var(--action)',
                  color: '#fff',
                  border: '2px solid var(--keyline)',
                  boxShadow: '0 3px 0 var(--keyline)',
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default JainilsRAGChat;
