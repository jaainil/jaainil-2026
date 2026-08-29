import type { QueryIntent } from './types.js';

/**
 * Lightweight, zero-latency rule-based query classifier.
 * Classifies user intent without making expensive LLM calls.
 * Keywords match on word boundaries so "downloaded" never triggers "download".
 */
function hasKeyword(q: string, keywords: string[]): boolean {
  return keywords.some((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q));
}

export function classifyQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase().trim();

  // 1. Resume / Contact Intent
  if (
    hasKeyword(q, ['resume', 'cv', 'download', 'contact', 'email', 'phone', 'hire', 'reach out'])
  ) {
    return 'resume';
  }

  // 2. Open Source & Projects Intent
  if (
    hasKeyword(q, ['project', 'writenex', 'dokploy', 'blog maker', 'memoryview', 'github', 'npm', 'open source'])
  ) {
    return 'projects';
  }

  // 3. Work Experience / Job Intent
  if (
    hasKeyword(q, ['experience', 'work experience', 'work history', 'job', 'aexaware', 'role', 'company', 'career'])
  ) {
    return 'experience';
  }

  // 4. Skills & Tech Stack Intent
  if (
    hasKeyword(q, ['skill', 'tech stack', 'technology', 'technologies', 'languages', 'tools', 'docker', 'linux', 'devops', 'proxmox', 'homelab', 'networking'])
  ) {
    return 'skills';
  }

  // 5. Personal Identity & Bio Intent
  if (
    hasKeyword(q, ['who is', 'about jainil', 'education', 'college', 'svit', 'gujarat', 'anand'])
  ) {
    return 'profile';
  }

  // 6. Technical Article & Publication Intent
  if (
    hasKeyword(q, ['claude', 'vite', 'hotstar', 'jio', 'qwen', 'navic', 'compute', 'india', 'ethanol', 'roads', 'article', 'blog', 'shravonix'])
  ) {
    return 'article';
  }

  return 'general';
}
