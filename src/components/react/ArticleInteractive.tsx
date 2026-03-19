'use client';

import { useState } from 'react';

interface Props {
  articleTitle: string;
}

export default function ArticleInteractive({ articleTitle }: Props) {
  const [showToast, setShowToast] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(articleTitle)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.007 4.126H5.078z"/>
          </svg>
          <span className="hidden sm:inline">Share</span>
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span className="hidden sm:inline">Share</span>
        </a>
        <button 
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="hidden sm:inline">Copy Link</span>
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3">
          <div className="bg-zinc-900 text-white px-4 py-3 text-xs font-mono uppercase tracking-widest shadow-xl flex items-center gap-3 min-w-[200px]">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0" />
            <span className="flex-1">Link copied!</span>
          </div>
        </div>
      )}
    </>
  );
}