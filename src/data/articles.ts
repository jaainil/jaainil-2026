import type { Article, Author } from '../types';

export type { Article, Author };

export const articles: Article[] = [
  {
    id: 'ai-models-2026',
    title: 'Announcing Vite+ Alpha',
    category: 'ANNOUNCEMENTS',
    date: 'MAR 13, 2026',
    authors: [
      { name: 'LONG Yinan', avatarUrl: 'https://picsum.photos/seed/sarah/40/40' },
      { name: 'MK', avatarUrl: 'https://picsum.photos/seed/marcus/40/40' },
      { name: 'WANG Chi', avatarUrl: 'https://picsum.photos/seed/wang/40/40' },
      { name: 'Evan You', avatarUrl: 'https://picsum.photos/seed/evan/40/40' },
      { name: 'Christoph Nakazawa', avatarUrl: 'https://picsum.photos/seed/chris/40/40' },
    ],
    imageUrl: 'https://picsum.photos/seed/ai-future/800/400',
    readTime: '6 MIN READ',
  },
  {
    id: 'web-frameworks-benchmark',
    title: 'VoidZero and npmx: Building Better Tools Together',
    category: 'ECOSYSTEM',
    date: 'MAR 3, 2026',
    authors: [
      { name: 'Elena Rodriguez', avatarUrl: 'https://picsum.photos/seed/elena/40/40' }
    ],
    imageUrl: 'https://picsum.photos/seed/frameworks/800/400',
    readTime: '4 MIN READ',
  },
  {
    id: 'quantum-computing-breakthrough',
    title: 'What\'s New in ViteLand: February 2026 Recap',
    category: 'UPDATES',
    date: 'MAR 2, 2026',
    authors: [
      { name: 'Dr. James Wilson', avatarUrl: 'https://picsum.photos/seed/james/40/40' }
    ],
    imageUrl: 'https://picsum.photos/seed/quantum/800/400',
    readTime: '8 MIN READ',
  },
  {
    id: 'tech-layoffs-stabilize',
    title: 'Tech Industry Hiring Stabilizes After Tumultuous Year',
    category: 'Industry',
    date: 'FEB 28, 2026',
    authors: [
      { name: 'Amanda Lee', avatarUrl: 'https://picsum.photos/seed/amanda/40/40' }
    ],
    imageUrl: 'https://picsum.photos/seed/office/800/400',
    readTime: '5 MIN READ',
  },
  {
    id: 'apple-ar-glasses-review',
    title: 'Apple Vision Light: The AR Glasses We\'ve Been Waiting For?',
    category: 'Hardware',
    date: 'FEB 15, 2026',
    authors: [
      { name: 'Tom Baker', avatarUrl: 'https://picsum.photos/seed/tom/40/40' }
    ],
    imageUrl: 'https://picsum.photos/seed/glasses/800/400',
    readTime: '10 MIN READ',
  },
  {
    id: 'rust-in-linux-kernel',
    title: 'Rust in the Linux Kernel: One Year Later',
    category: 'Web Dev',
    date: 'JAN 22, 2026',
    authors: [
      { name: 'Linus Torvalds', avatarUrl: 'https://picsum.photos/seed/linus/40/40' }
    ],
    imageUrl: 'https://picsum.photos/seed/linux/800/400',
    readTime: '7 MIN READ',
  }
];
