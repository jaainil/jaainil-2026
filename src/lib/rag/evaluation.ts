export interface EvaluationMetrics {
  recallAt3: number;
  refusalAccuracy: number;
  citationValidity: number;
  citationBackedAnswers: number;
}

export function passesEvaluation(
  metrics: EvaluationMetrics,
  thresholds = { recallAt3: 85, refusalAccuracy: 95, citationValidity: 100, citationBackedAnswers: 85 },
): boolean {
  return Object.values(metrics).every(Number.isFinite) &&
    metrics.recallAt3 >= thresholds.recallAt3 &&
    metrics.refusalAccuracy >= thresholds.refusalAccuracy &&
    metrics.citationValidity >= thresholds.citationValidity &&
    metrics.citationBackedAnswers >= thresholds.citationBackedAnswers;
}
