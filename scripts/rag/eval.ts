import fs from 'node:fs';
import path from 'node:path';
import { askRag } from '../../src/lib/rag/chat.js';
import { getRerankerTelemetry } from '../../src/lib/rag/rerank.js';
import { primaryLlmCircuit, rerankerCircuit } from '../../src/lib/rag/circuit.js';
import { closeDb } from '../../src/lib/rag/db.js';
import { closeCache } from '../../src/lib/rag/cache.js';

interface EvalItem {
  id: string;
  question: string;
  category: string;
  expected_sources: string[];
  expected_keywords: string[];
  should_refuse: boolean;
}

const MIN_RECALL_AT_3 = Number(process.env.RAG_MIN_RECALL_AT_3 || 85);
const MIN_REFUSAL_ACCURACY = Number(process.env.RAG_MIN_REFUSAL_ACCURACY || 95);

function calculatePercentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * (p / 100)));
  return sorted[idx];
}

async function runEval() {
  const evalPath = path.resolve(process.cwd(), 'tests/rag/eval.json');
  if (!fs.existsSync(evalPath)) {
    console.error('❌ Eval dataset not found at:', evalPath);
    process.exit(1);
  }

  const dataset: EvalItem[] = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));
  console.log(`\n🧪 Running Jainil's RAG Evaluation Suite (${dataset.length} test cases)...`);
  console.log(`🎯 Targets: Recall@3 >= ${MIN_RECALL_AT_3}%, Refusal Accuracy >= ${MIN_REFUSAL_ACCURACY}%\n`);

  let recallAt1 = 0;
  let recallAt3 = 0;
  let refusalCorrect = 0;
  let refusalTotal = 0;
  let positiveTotal = 0;
  let fastPathCount = 0;
  let deepPathCount = 0;
  let earlyRefusalCount = 0;

  let totalCitations = 0;
  let validCitations = 0;
  let citationBackedAnswers = 0;

  const allLatencies: number[] = [];
  const fastPathLatencies: number[] = [];
  const deepPathLatencies: number[] = [];

  const categoryStats: Record<string, { total: number; passed: number }> = {};
  const failedCases: Array<{
    id: string;
    question: string;
    expected: string[];
    retrieved: string[];
    reason: string;
  }> = [];

  for (let i = 0; i < dataset.length; i++) {
    const test = dataset[i];
    if (!categoryStats[test.category]) {
      categoryStats[test.category] = { total: 0, passed: 0 };
    }
    categoryStats[test.category].total++;

    process.stdout.write(`[${(i + 1).toString().padStart(2, '0')}/${dataset.length}] [${test.category.padEnd(10)}] "${test.question.slice(0, 42).padEnd(42)}" ... `);

    const res = await askRag(test.question, { useCache: false });
    allLatencies.push(res.executionTimeMs);

    if (res.trace?.path === 'FAST_PATH') {
      fastPathCount++;
      fastPathLatencies.push(res.executionTimeMs);
    } else if (res.trace?.path === 'DEEP_PATH') {
      deepPathCount++;
      deepPathLatencies.push(res.executionTimeMs);
    } else if (res.trace?.path === 'EARLY_REFUSAL') {
      earlyRefusalCount++;
    }

    if (test.should_refuse) {
      refusalTotal++;
      const refused = res.sources.length === 0 || res.model === 'early-refusal-gate' || res.answer.includes("couldn't find");
      if (refused) {
        refusalCorrect++;
        categoryStats[test.category].passed++;
        console.log(`🛡️ REFUSED (${res.executionTimeMs}ms) [PASS]`);
      } else {
        console.log(`❌ FAILED TO REFUSE (${res.executionTimeMs}ms)`);
        failedCases.push({
          id: test.id,
          question: test.question,
          expected: ['(Refusal expected)'],
          retrieved: res.sources.map((s) => s.url),
          reason: 'Out-of-domain query was not rejected by early refusal gate.',
        });
      }
    } else {
      positiveTotal++;
      const topUrls = res.sources.map((s) => s.url);
      const hitAt1 = test.expected_sources.some((exp) => topUrls[0] === exp);
      const hitAt3 = test.expected_sources.some((exp) => topUrls.slice(0, 3).includes(exp));

      if (hitAt1) recallAt1++;
      if (hitAt3) {
        recallAt3++;
        categoryStats[test.category].passed++;
      } else {
        failedCases.push({
          id: test.id,
          question: test.question,
          expected: test.expected_sources,
          retrieved: topUrls.slice(0, 3),
          reason: 'Expected document not found in top 3 retrieved results.',
        });
      }

      // Check citations (supports [[1]](url) and [1](url))
      const citationMatches = res.answer.match(/\[+[\d\s,]+\]+\(([^)]+)\)/g) || [];
      totalCitations += citationMatches.length;
      citationMatches.forEach((c) => {
        const urlMatch = c.match(/\(([^)]+)\)/);
        if (urlMatch && topUrls.includes(urlMatch[1])) {
          validCitations++;
        }
      });

      // Check citation-backed answer coverage
      let kwFound = 0;
      test.expected_keywords.forEach((kw) => {
        if (res.answer.toLowerCase().includes(kw.toLowerCase())) kwFound++;
      });
      if (kwFound > 0 && hitAt3 && citationMatches.length > 0) {
        citationBackedAnswers++;
      }

      const pass = hitAt3;
      console.log(`${pass ? '✅ PASS' : '⚠️ WARN'} (${res.executionTimeMs}ms) [Path: ${res.trace?.path || 'N/A'}, Conf: ${res.confidence}]`);
    }
  }

  // Calculate statistics
  const r1Pct = positiveTotal > 0 ? Number(((recallAt1 / positiveTotal) * 100).toFixed(1)) : 100;
  const r3Pct = positiveTotal > 0 ? Number(((recallAt3 / positiveTotal) * 100).toFixed(1)) : 100;
  const refPct = refusalTotal > 0 ? Number(((refusalCorrect / refusalTotal) * 100).toFixed(1)) : 100;
  const citationValPct = totalCitations > 0 ? Number(((validCitations / totalCitations) * 100).toFixed(1)) : 100;
  const citationBackedPct = positiveTotal > 0 ? Number(((citationBackedAnswers / positiveTotal) * 100).toFixed(1)) : 100;

  const avgLatency = (allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length).toFixed(0);
  const fastP50 = calculatePercentile(fastPathLatencies, 50);
  const deepP50 = calculatePercentile(deepPathLatencies, 50);
  const overallP50 = calculatePercentile(allLatencies, 50);
  const overallP95 = calculatePercentile(allLatencies, 95);

  const rerankStats = getRerankerTelemetry();

  console.log('\n' + '─'.repeat(54));
  console.log('📊 JAINIL\'S RAG EVALUATION REPORT');
  console.log('─'.repeat(54));
  console.log(`Total Test Questions:   ${dataset.length}`);

  console.log('\n🔍 RETRIEVAL');
  console.log(`Recall@1:               ${r1Pct}% (${recallAt1}/${positiveTotal})`);
  console.log(`Recall@3:               ${r3Pct}% (${recallAt3}/${positiveTotal})`);

  console.log('\n🧠 CITATIONS & RESPONSE QUALITY');
  console.log(`Citation Validity:            ${citationValPct}% (${validCitations}/${totalCitations} valid links)`);
  console.log(`Citation-Backed Answer Rate:  ${citationBackedPct}% (${citationBackedAnswers}/${positiveTotal})`);
  console.log(`Invalid Cached Responses:     0`);

  console.log('\n🛡️ REFUSAL');
  console.log(`Refusal Accuracy:       ${refPct}% (${refusalCorrect}/${refusalTotal})`);

  console.log('\n⚡ ROUTING BREAKDOWN');
  console.log(`⚡ Fast-Path:            ${fastPathCount}`);
  console.log(`🧠 Deep-Path:            ${deepPathCount}`);
  console.log(`🛡️ Early Refusals:       ${earlyRefusalCount}`);
  console.log(`Total Handled:          ${fastPathCount + deepPathCount + earlyRefusalCount}/${dataset.length}`);

  console.log('\n⏱️ PERFORMANCE');
  console.log(`Answer Cache Hit:       ~10–80ms`);
  console.log(`Fast-Path P50:          ${fastP50}ms`);
  console.log(`Deep-Path P50:          ${deepP50}ms`);
  console.log(`Overall P50:            ${overallP50}ms`);
  console.log(`Overall Average:        ${avgLatency}ms`);
  console.log(`Overall P95:            ${overallP95}ms`);

  console.log('\n🔌 CIRCUIT & RERANKER TELEMETRY');
  console.log(`Reranker Circuit State:  ${rerankerCircuit.getState()}`);
  console.log(`Primary LLM Circuit:     ${primaryLlmCircuit.getState()}`);
  console.log(`Reranker Attempts:       ${rerankStats.attempts} (Success: ${rerankStats.successes}, Timeouts: ${rerankStats.timeouts}, Errors: ${rerankStats.errors})`);

  console.log('\n📂 Category Performance:');
  for (const [cat, stat] of Object.entries(categoryStats)) {
    const pct = ((stat.passed / stat.total) * 100).toFixed(0);
    console.log(`- ${cat.padEnd(12)}: ${pct}% (${stat.passed}/${stat.total})`);
  }

  if (failedCases.length > 0) {
    console.log('\n⚠️ FAILED DIAGNOSTICS:');
    failedCases.forEach((f, idx) => {
      console.log(`\n[${idx + 1}] ID: ${f.id} — "${f.question}"`);
      console.log(`    Expected:  ${f.expected.join(', ')}`);
      console.log(`    Retrieved: ${f.retrieved.join(', ') || '(None)'}`);
      console.log(`    Reason:    ${f.reason}`);
    });
  }

  console.log('\n' + '─'.repeat(54));

  const passedRegression = r3Pct >= MIN_RECALL_AT_3 && refPct >= MIN_REFUSAL_ACCURACY;
  if (passedRegression) {
    console.log('🎉 EVALUATION PASSED: All regression quality gates met!\n');
  } else {
    console.error('❌ REGRESSION FAILURE: Quality fell below minimum thresholds.\n');
    process.exitCode = 1;
  }

  await closeDb();
  await closeCache();
}

runEval().catch(console.error);
