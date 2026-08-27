export type QueryIntent = 'profile' | 'skills' | 'experience' | 'projects' | 'resume' | 'article' | 'general';

export interface DocumentRecord {
  id?: number;
  url: string;
  title: string;
  type: 'article' | 'page' | 'resume' | 'doc';
  category?: string;
  description?: string;
  tags?: string[];
  sourceHash?: string;
  publishedAt?: Date | string | null;
  indexedAt?: Date | string;
  lastSeenAt?: Date | string;
}

export interface ChunkRecord {
  id?: number;
  documentId?: number;
  heading: string | null;
  chunkIndex: number;
  content: string;
  contentHash?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  embeddingModel?: string;
  embeddingDimension?: number;
}

export interface SearchResult {
  id: number;
  documentId: number;
  url: string;
  title: string;
  heading: string | null;
  category: string | null;
  publishedAt: string | null;
  content: string;
  vectorScore: number;
  textScore: number;
  rrfScore: number;
  rank?: number;
  embeddingModel: string;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  category?: string;
  type?: string;
  intent?: QueryIntent;
  enableRerank?: boolean;
  useCache?: boolean;
  rrfK?: number;
  vectorWeight?: number;
  textWeight?: number;
}

export interface RAGSource {
  title: string;
  url: string;
  heading: string | null;
  snippet: string;
  score: number;
}

export interface ConfidenceAssessment {
  isConfident: boolean;
  isDecisive: boolean;
  score: number;
  margin: number;
  keywordAgreement: boolean;
  reason: string;
}

export interface RAGTrace {
  requestId: string;
  query: string;
  intent: QueryIntent;
  cacheHit: boolean;
  cacheTier?: 1 | 2 | 3;
  path: 'FAST_PATH' | 'DEEP_PATH' | 'EARLY_REFUSAL' | 'CACHE_HIT' | 'IDENTITY_RAIL' | 'INJECTION_RAIL';
  confidence: ConfidenceAssessment;
  latencies: {
    embeddingMs?: number;
    searchMs?: number;
    rerankMs?: number;
    generationMs?: number;
    totalMs: number;
  };
  model: string;
  kbVersion: string;
}

export interface RAGResponse {
  question: string;
  answer: string;
  confidence: number;
  sources: RAGSource[];
  cached: boolean;
  model: string;
  executionTimeMs: number;
  intent?: QueryIntent;
  trace?: RAGTrace;
}

export interface DatabaseStats {
  documentCount: number;
  chunkCount: number;
  categories: { category: string; count: number }[];
  embeddingModels: { model: string; count: number }[];
  kbVersion: string;
  lastIndexedAt: string | null;
  vectorExtensionVersion: string;
  tableSize: string;
}
