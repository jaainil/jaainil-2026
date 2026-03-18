import { Github, DiscIcon as Discord } from 'lucide-react';
import { Logo } from './Logo';

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 font-sans border-t border-zinc-200">
      <div className="w-full">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-zinc-800">
          <div className="py-12 md:py-16 border-b md:border-b-0 md:border-r border-zinc-800 px-6 md:px-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 tracking-tight">
              Stay ahead of the curve<br />in the tech world.
            </h2>
          </div>
          <div className="py-12 md:py-16 px-6 md:px-12 flex flex-col justify-center">
            <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-xs font-mono">Subscribe to our weekly newsletter</h3>
            <form className="flex gap-0 border border-zinc-700">
              <input 
                type="email" 
                placeholder="YOUR EMAIL ADDRESS" 
                autoComplete="off"
                className="bg-zinc-800 border-none rounded-none px-4 py-3 grow text-white focus:outline-none focus:ring-0 text-xs font-mono uppercase tracking-widest placeholder:text-zinc-500"
              />
              <button 
                type="submit" 
                className="bg-white text-zinc-900 px-6 py-3 rounded-none font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors border-l border-zinc-700"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Banner Section */}
        <div className="w-full h-40 bg-zinc-950 border-b border-zinc-800 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech/1200/400')] opacity-10 mix-blend-luminosity bg-cover bg-center"></div>
           <div className="bg-white border border-zinc-200 p-6 z-10 shadow-2xl">
             <Logo />
           </div>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          <div className="py-8 md:py-12 px-6 md:px-8 border-b md:border-b-0 border-r border-zinc-800">
            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-widest mb-6">Categories</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">AI & Machine Learning</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Web Development</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hardware</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Startups</a></li>
            </ul>
          </div>
          <div className="py-8 md:py-12 px-6 md:px-8 border-b md:border-b-0 md:border-r border-zinc-800">
            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-widest mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Reviews</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Interviews</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Podcasts</a></li>
            </ul>
          </div>
          <div className="py-8 md:py-12 px-6 md:px-8 border-r border-zinc-800">
            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Advertise</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="py-8 md:py-12 px-6 md:px-8">
            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-widest mb-6">Social</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors flex items-center gap-3"><Github className="w-4 h-4" /> GitHub</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.007 4.126H5.078z"/></svg> X.com</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center gap-3"><Discord className="w-4 h-4" /> Discord</a></li>
            </ul>
          </div>
        </div>

        <div className="py-8 px-6 md:px-8 border-t border-zinc-800 text-[11px] font-mono uppercase tracking-widest text-zinc-500 flex justify-between items-center">
          <p>© 2026 SHRAVONIX MEDIA. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}
