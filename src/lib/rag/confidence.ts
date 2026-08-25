import type { SearchResult, ConfidenceAssessment } from './types.js';

export interface ConfidenceFeatures {
  topVectorScore: number;
  vectorMargin: number;
  topFtsRank: number | null;
  vectorFtsAgreement: boolean;
  topRrfScore: number;
  intentMatch: boolean;
}

/**
 * Multi-Feature Confidence Feature Extractor.
 */
export function extractConfidenceFeatures(
  matches: SearchResult[],
  queryIntent = 'general'
): ConfidenceFeatures {
  if (!matches || matches.length === 0) {
    return {
      topVectorScore: 0,
      vectorMargin: 0,
      topFtsRank: null,
      vectorFtsAgreement: false,
      topRrfScore: 0,
      intentMatch: false,
    };
  }

  const top1 = matches[0];
  const top2 = matches[1];

  const topVectorScore = top1.vectorScore || 0;
  const top2Vector = top2 ? (top2.vectorScore || 0) : 0;
  const vectorMargin = topVectorScore - top2Vector;
  const topFtsRank = (top1.textScore || 0) > 0 ? 1 : null;
  const topRrfScore = top1.rrfScore || 0;

  const vectorFtsAgreement = (top1.textScore || 0) > 0.04 && topVectorScore > 0.45;
  const intentMatch = queryIntent !== 'general' && (
    (queryIntent === 'resume' && top1.url.includes('resume')) ||
    (queryIntent === 'profile' && top1.url.includes('about')) ||
    (queryIntent === 'projects' && (top1.content.toLowerCase().includes('writenex') || top1.content.toLowerCase().includes('dokploy'))) ||
    (queryIntent === 'article' && top1.url.includes('/articles/'))
  );

  return {
    topVectorScore,
    vectorMargin,
    topFtsRank,
    vectorFtsAgreement,
    topRrfScore,
    intentMatch,
  };
}

/**
 * Evaluates retrieval confidence with calibrated multi-feature gates.
 */
export function estimateRetrievalConfidence(
  matches: SearchResult[],
  queryIntent = 'general'
): ConfidenceAssessment {
  if (!matches || matches.length === 0) {
    return {
      isConfident: false,
      isDecisive: false,
      score: 0,
      margin: 0,
      keywordAgreement: false,
      reason: 'No candidate documents retrieved.',
    };
  }

  const features = extractConfidenceFeatures(matches, queryIntent);

  // 1. Out-of-Domain Refusal Gate
  // Only refuse if vector similarity is low (< 0.40), FTS found no keyword match, AND intent is not an explicit match
  const isOutOfDomain =
    !features.intentMatch &&
    ((features.topVectorScore < 0.40 && features.topFtsRank === null) ||
     (features.topVectorScore < 0.33 && (matches[0]?.textScore || 0) < 0.01));

  if (isOutOfDomain) {
    return {
      isConfident: false,
      isDecisive: false,
      score: features.topVectorScore,
      margin: features.vectorMargin,
      keywordAgreement: false,
      reason: `Out of domain: Vector similarity (${features.topVectorScore.toFixed(3)}) below domain threshold and no FTS match.`,
    };
  }

  // 2. Strong / Decisive Match (FAST-PATH)
  const isDecisive =
    features.topVectorScore >= 0.70 ||
    (features.topVectorScore >= 0.55 && features.vectorMargin >= 0.06) ||
    (features.vectorFtsAgreement && features.topRrfScore >= 0.015) ||
    (features.intentMatch && features.topVectorScore >= 0.48);

  const reason = isDecisive
    ? `Strong match (Vector: ${features.topVectorScore.toFixed(3)}, Margin: ${features.vectorMargin.toFixed(3)}): Routing to FAST-PATH.`
    : `Uncertain match (Margin: ${features.vectorMargin.toFixed(3)}): Routing to Reranker.`;

  return {
    isConfident: true,
    isDecisive,
    score: features.topVectorScore,
    margin: features.vectorMargin,
    keywordAgreement: features.vectorFtsAgreement,
    reason,
  };
}
