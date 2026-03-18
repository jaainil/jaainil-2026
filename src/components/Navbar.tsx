import { Link } from 'react-router-dom';
import { Github, MessageCircle, Send, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 font-sans">
      <div className="w-full">
        <div className="flex justify-between items-stretch h-16">
          <div className="flex items-stretch">
            <div className="flex items-center px-6 md:px-8 border-r border-zinc-200 hover:bg-zinc-50 transition-colors">
              <Logo className="scale-75 origin-left" />
            </div>
            <nav className="hidden md:flex text-[11px] font-mono uppercase tracking-widest text-zinc-600">
              <Link to="#" className="flex items-center gap-1 px-6 border-r border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">Open Source <ChevronDown className="w-3 h-3 text-zinc-400" /></Link>
              <Link to="/" className="flex items-center px-6 border-r border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">Blog</Link>
              <Link to="#" className="flex items-center px-6 border-r border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">About</Link>
              <Link to="#" className="flex items-center gap-1 px-6 border-r border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">Void <ArrowUpRight className="w-3 h-3 text-zinc-400" /></Link>
            </nav>
          </div>
          <div className="flex items-stretch text-zinc-400">
            <a href="#" className="flex items-center px-3 sm:px-4 md:px-6 border-l border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="flex items-center px-3 sm:px-4 md:px-6 border-l border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.007 4.126H5.078z"/></svg>
            </a>
            <a href="#" className="flex items-center px-3 sm:px-4 md:px-6 border-l border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href="#" className="flex items-center px-3 sm:px-4 md:px-6 border-l border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <Send className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
