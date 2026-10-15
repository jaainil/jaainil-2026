'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Share2, Copy } from 'lucide-react';

interface Props {
  articleTitle: string;
  articleUrl: string;
}

const controlStyle: React.CSSProperties = {
  border: '2px solid var(--keyline)',
  color: 'var(--ink)',
  background: 'var(--paper)',
  boxShadow: '0 2px 0 var(--keyline)',
  borderRadius: '10px',
};

export default function ArticleInteractive({ articleTitle, articleUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const panelId = useId();
  const url = encodeURIComponent(articleUrl);
  const title = encodeURIComponent(articleTitle);
  const destinations = [
    ['WhatsApp', `https://wa.me/?text=${title}%20${url}`],
    ['Telegram', `https://t.me/share/url?url=${url}&text=${title}`],
    ['X', `https://twitter.com/intent/tweet?url=${url}&text=${title}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${url}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${url}`],
    ['Reddit', `https://www.reddit.com/submit?url=${url}&title=${title}`],
    ['Email', `mailto:?subject=${title}&body=${title}%0A%0A${url}`],
  ];

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const share = async () => {
    if (open) { setOpen(false); return; }
    if (navigator.share) {
      try {
        await navigator.share({ title: articleTitle, url: articleUrl });
        return;
      } catch (error) {
        // Dismissing the device sheet should not open another sharing surface.
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    setCopyFailed(false);
    setOpen(true);
  };

  const copyLink = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(articleUrl);
      setStatus('Link copied');
      setOpen(false);
      trigger.current?.focus();
    } catch {
      setCopyFailed(true);
      setStatus('Select and copy the link below.');
    }
    timer.current = setTimeout(() => setStatus(''), 4000);
  };

  return (
    <div ref={root} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={trigger}
        type="button"
        onClick={share}
        aria-label="Share article"
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-bold cursor-pointer transition-transform hover:-translate-y-0.5"
        style={{ ...controlStyle, background: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
      >
        <Share2 size={16} aria-hidden="true" />
        Share
      </button>
      {open && (
        <div id={panelId} role="region" aria-label="Share this article"
          className="absolute right-0 top-full mt-3 z-40 w-72 max-w-[calc(100vw-5rem)] p-4"
          style={{ ...controlStyle, boxShadow: '0 4px 0 var(--keyline)' }}>
          <p className="font-bold text-sm mb-3">Share this article</p>
          <div className="grid grid-cols-2 gap-2">
            {destinations.map(([name, href]) => (
              <a key={name} href={href} target={name === 'Email' ? undefined : '_blank'} rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center px-2 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
                style={controlStyle} onClick={() => setOpen(false)}>{name}</a>
            ))}
            <button type="button" onClick={copyLink}
              className="flex min-h-11 items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold cursor-pointer hover:-translate-y-0.5 transition-transform"
              style={controlStyle}><Copy size={14} aria-hidden="true" />Copy link</button>
          </div>
          {copyFailed && (
            <label className="block mt-4 text-sm font-semibold">
              Article link
              <input readOnly value={articleUrl} onFocus={event => event.currentTarget.select()}
                className="mt-2 w-full min-h-11 px-2 text-sm" style={controlStyle} />
            </label>
          )}
        </div>
      )}
      <span role="status" aria-live="polite" className={status ? 'block mt-2 text-sm font-semibold' : 'sr-only'} style={{ color: 'var(--ink)' }}>{status}</span>
    </div>
  );
}
