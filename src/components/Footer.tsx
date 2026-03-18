import { Github, DiscIcon as Discord } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-zinc-500 border-t border-zinc-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-zinc-200">
          <div className="py-12 md:py-16 border-b md:border-b-0 md:border-r border-zinc-200 md:pr-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4 tracking-tight">
              Stay ahead of the curve<br />in the tech world.
            </h2>
          </div>
          <div className="py-12 md:py-16 md:pl-12 flex flex-col justify-center">
            <h3 className="text-zinc-900 font-bold mb-4 uppercase tracking-widest text-xs font-mono">Subscribe to our weekly newsletter</h3>
            <form className="flex gap-0 border border-zinc-200">
              <input 
                type="email" 
                placeholder="YOUR EMAIL ADDRESS" 
                className="bg-zinc-50 border-none rounded-none px-4 py-3 flex-grow text-zinc-900 focus:outline-none focus:ring-0 text-xs font-mono uppercase tracking-widest placeholder:text-zinc-400"
              />
              <button 
                type="submit" 
                className="bg-zinc-900 text-white px-6 py-3 rounded-none font-mono text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors border-l border-zinc-900"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Banner Section */}
        <div className="w-full h-32 bg-zinc-100 border-b border-zinc-200 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech/1200/400')] opacity-20 mix-blend-luminosity bg-cover bg-center"></div>
           <div className="bg-white border border-zinc-200 p-4 z-10">
             <span className="text-zinc-900 font-bold text-2xl tracking-tighter">VOID(<span className="font-sans">0</span>)</span>
           </div>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          <div className="py-8 md:py-12 pr-4 md:pr-8 border-b md:border-b-0 border-r border-zinc-200">
            <h4 className="text-[11px] font-mono font-bold text-zinc-900 uppercase tracking-widest mb-6">Categories</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-zinc-900 transition-colors">AI & Machine Learning</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Web Development</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Hardware</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Startups</a></li>
            </ul>
          </div>
          <div className="py-8 md:py-12 pl-4 md:px-8 border-b md:border-b-0 md:border-r border-zinc-200">
            <h4 className="text-[11px] font-mono font-bold text-zinc-900 uppercase tracking-widest mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Guides</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Reviews</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Interviews</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Podcasts</a></li>
            </ul>
          </div>
          <div className="py-8 md:py-12 pr-4 md:px-8 border-r border-zinc-200">
            <h4 className="text-[11px] font-mono font-bold text-zinc-900 uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-zinc-900 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Advertise</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="py-8 md:py-12 pl-4 md:pl-8">
            <h4 className="text-[11px] font-mono font-bold text-zinc-900 uppercase tracking-widest mb-6">Social</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-zinc-900 transition-colors flex items-center gap-3"><Github className="w-4 h-4" /> GitHub</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.007 4.126H5.078z"/></svg> X.com</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors flex items-center gap-3"><Discord className="w-4 h-4" /> Discord</a></li>
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-zinc-200 text-[11px] font-mono uppercase tracking-widest text-zinc-400 flex justify-between items-center">
          <p>© 2026 VOID(0) MEDIA. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}
