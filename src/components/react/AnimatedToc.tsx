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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="relative border-l border-zinc-200">
      <ul className="text-[14.5px] font-sans">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <a
              href={`#${item.id}`}
              className={`block pl-4 py-2 transition-all duration-200 ${
                activeId === item.id
                  ? 'text-zinc-900 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              style={{
                borderLeft: activeId === item.id ? '2px solid #18181b' : '2px solid transparent',
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
