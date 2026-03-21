import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  title: string;
}

interface Props {
  items: TocItem[];
}

export default function AnimatedToc({ items }: Props) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const getActiveId = () => {
      const scrollY = window.scrollY + 120; // offset for navbar
      let current = items[0]?.id ?? '';
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollY) {
          current = item.id;
        }
      }
      setActiveId(current);
    };

    getActiveId();
    window.addEventListener('scroll', getActiveId, { passive: true });
    return () => window.removeEventListener('scroll', getActiveId);
  }, [items]);

  return (
    <div className="relative border-l" style={{ borderColor: 'var(--color-border)' }}>
      <ul className="text-[14.5px] font-sans">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <a
              href={`#${item.id}`}
              className="block pl-4 py-2 transition-all duration-200"
              style={{
                color: activeId === item.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontWeight: activeId === item.id ? '500' : '400',
                borderLeft: activeId === item.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                marginLeft: '-1px',
              }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
