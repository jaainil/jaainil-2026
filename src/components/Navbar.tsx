import { Link } from 'react-router-dom';
import { Github, DiscIcon as Discord, ChevronDown, ArrowUpRight } from 'lucide-react';
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
              <Discord className="w-4 h-4" />
            </a>
            <a href="#" className="flex items-center px-3 sm:px-4 md:px-6 border-l border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.905C2.566 1.044 1.56 1.262 1.043 1.587c-.606.38-.97 1.161-.97 2.136 0 1.972 1.834 5.59 3.1 7.386 1.307 1.85 2.813 3.32 4.488 4.105-1.982-.53-4.646-.766-6.767-.435-1.162.182-1.503 1.036-1.503 1.758 0 .894.672 1.9 1.832 2.44 1.928.897 5.309 1.212 8.442.12C10.67 18.75 12 17.25 12 17.25s1.33 1.5 2.335 1.857c3.133 1.092 6.514.777 8.442-.12 1.16-.54 1.832-1.546 1.832-2.44 0-.722-.341-1.576-1.503-1.758-2.121-.331-4.785-.095-6.767.435 1.675-.785 3.181-2.255 4.488-4.105 1.266-1.796 3.1-5.414 3.1-7.386 0-.975-.364-1.756-.97-2.136-.517-.325-1.523-.543-4.159 1.308-2.752 1.852-5.711 5.791-6.798 7.905z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
