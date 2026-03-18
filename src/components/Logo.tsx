import { Link } from 'react-router-dom';

export function Logo({ className = "", disableLink = false }: { className?: string, disableLink?: boolean }) {
  const content = (
    <>
      {/* Icon */}
      <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-12 sm:h-12 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="50" cy="50" r="40" />
        <path d="M 65 30 L 35 30 L 25 48 L 65 48 L 55 66 L 25 66" />
      </svg>
      
      {/* Text & Tagline */}
      <div className="flex flex-col justify-center pt-1">
        <span className="text-2xl sm:text-3xl font-bold text-[#2563EB] tracking-wide leading-none font-sans">
          SHRAVONIX
        </span>
        
        {/* Cyan Line with Gap */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="h-1 sm:h-1.5 bg-[#06B6D4] flex-grow rounded-full"></div>
          <div className="h-1 sm:h-1.5 w-6 sm:w-8 bg-[#06B6D4] rounded-full"></div>
        </div>
        
        {/* Tagline */}
        <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-zinc-400 uppercase tracking-[0.2em] mt-1 font-medium">
          <span className="text-[#06B6D4] text-xs leading-none">•</span>
          <span>Signal over noise.</span>
          <span className="text-[#06B6D4] text-xs leading-none">•</span>
        </div>
      </div>
    </>
  );

  const containerClass = `flex items-center gap-3 ${!disableLink ? 'hover:opacity-90 transition-opacity' : ''} ${className}`;

  if (disableLink) {
    return (
      <div className={containerClass}>
        {content}
      </div>
    );
  }

  return (
    <Link to="/" className={containerClass}>
      {content}
    </Link>
  );
}
