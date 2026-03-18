import { Link } from 'react-router-dom';

export function Logo({ className = "", disableLink = false }: { className?: string, disableLink?: boolean }) {
  const content = (
    <img src="/shravonix.png" alt="Shravonix" className="h-8 sm:h-10 w-auto" />
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
