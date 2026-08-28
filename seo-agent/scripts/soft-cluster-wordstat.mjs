import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const snapshotDate = '2026-08-27';
const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', `wordstat-raw-${snapshotDate}.json`), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(root, 'cluster-definitions.json'), 'utf8'));

function normalize(value) {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]+/g, ' ').trim();
}

function contains(text, fragment) {
  return text.includes(normalize(fragment));
}

function specificity(definition) {
  return [...(definition.includeAll || []), ...(definition.includeAny || [])]
    .reduce((sum, item) => sum + normalize(item).length, 0);
}

function scoreRow(row, batchId, definition) {
  if (definition.batchIds && !definition.batchIds.includes(batchId)) return null;
  const text = normalize(row.q);
  if ((definition.excludeAny || []).some((item) => contains(text, item))) return null;
  const required = definition.includeAll || [];
  if (required.some((item) => !contains(text, item))) return null;
  const optional = (definition.includeAny || []).filter((item) => contains(text, item));
  if (!required.length && !optional.length) return null;
  if (required.length && definition.includeAny?.length && !optional.length) return null;
  return Number(definition.priority || 0) + required.length * 30 + optional.length * 14 + Math.min(20, specificity(definition) / 12);
}

const deduped = new Map();
for (const batch of raw.batches) {
  for (const item of batch.items) {
    for (const row of item.rows || []) {
      const key = `${batch.id}\u0000${normalize(row.q)}`;
      const current = deduped.get(key);
      if (!current) {
        deduped.set(key, {batchId: batch.id, region: batch.region, q: row.q, count: row.count, seeds: [item.seed]});
      } else {
        current.count = Math.max(current.count, row.count);
        if (!current.seeds.includes(item.seed)) current.seeds.push(item.seed);
      }
    }
  }
}

const clusters = new Map(config.definitions.map((definition) => [definition.id, {definition, rows: []}]));
const unresolved = [];
const excluded = [];
const ambiguous = [];

for (const row of deduped.values()) {
  const normalized = normalize(row.q);
  const exclusion = config.globalExclusions.find((item) => contains(normalized, item));
  if (exclusion) {
    excluded.push({...row, reason: `global_exclusion:${exclusion}`});
    continue;
  }
  const candidates = config.definitions
    .map((definition) => ({definition, score: scoreRow(row, row.batchId, definition)}))
    .filter((candidate) => candidate.score !== null)
    .sort((a, b) => b.score - a.score || specificity(b.definition) - specificity(a.definition));
  if (!candidates.length) {
    unresolved.push({...row, reason: 'no_owner_rule'});
    continue;
  }
  const top = candidates[0];
  const second = candidates[1];
  const margin = second ? top.score - second.score : top.score;
  const confidence = second ? Math.max(0.5, Math.min(0.99, 0.7 + margin / 100)) : 0.99;
  const assigned = {...row, score: Number(top.score.toFixed(2)), confidence: Number(confidence.toFixed(2))};
  clusters.get(top.definition.id).rows.push(assigned);
  if (second && margin < 8) {
    ambiguous.push({...row, assignedTo: top.definition.id, alternative: second.definition.id, margin: Number(margin.toFixed(2))});
  }
}

const outputClusters = [...clusters.values()].map(({definition, rows}) => {
  rows.sort((a, b) => b.count - a.count || a.q.localeCompare(b.q, 'ru'));
  const sources = [...new Set(rows.flatMap((row) => row.seeds))];
  return {
    id: definition.id,
    owner: definition.owner,
    ownerType: definition.ownerType,
    pageType: definition.pageType,
    category: definition.category,
    intent: definition.intent,
    funnel: definition.funnel,
    region: definition.region,
    author: definition.author,
    reviewer: definition.reviewer || null,
    main: rows[0] ? {q: rows[0].q, vol: rows[0].count} : {q: null, vol: 0},
    rowCount: rows.length,
    maxObservedVolume: rows[0]?.count || 0,
    coverageVolumeDiagnostic: rows.reduce((sum, row) => sum + row.count, 0),
    sourceSeeds: sources,
    requiredLinks: definition.requiredLinks || [],
    status: rows.length ? 'clustered' : 'no_rows_in_snapshot',
    rows
  };
}).sort((a, b) => b.maxObservedVolume - a.maxObservedVolume || a.id.localeCompare(b.id));

unresolved.sort((a, b) => b.count - a.count);
excluded.sort((a, b) => b.count - a.count);
ambiguous.sort((a, b) => b.count - a.count);

const report = {
  version: 1,
  generated: snapshotDate,
  source: `wordstat-raw-${snapshotDate}.json`,
  policy: {
    countMeaning: 'maxObservedVolume is the highest Wordstat row in the cluster; coverageVolumeDiagnostic is diagnostic only and must never be presented as unique demand.',
    deduplication: 'Rows are deduplicated by batch and normalized query; overlapping seed counts use max, never sum.',
    assignment: 'One normalized query has one owner. Ambiguous rows are still assigned but duplicated in the review report.'
  },
  summary: {
    rawRows: raw.batches.reduce((sum, batch) => sum + batch.items.reduce((inner, item) => inner + (item.rows?.length || 0), 0), 0),
    dedupedRows: deduped.size,
    assignedRows: outputClusters.reduce((sum, cluster) => sum + cluster.rowCount, 0),
    unresolvedRows: unresolved.length,
    excludedRows: excluded.length,
    ambiguousRows: ambiguous.length,
    clustersWithRows: outputClusters.filter((cluster) => cluster.rowCount).length,
    clusterDefinitions: outputClusters.length
  },
  clusters: outputClusters
};

const review = {
  version: 1,
  generated: snapshotDate,
  summary: report.summary,
  unresolvedHighVolume: unresolved.filter((row) => row.count >= 10).slice(0, 500),
  ambiguous: ambiguous.slice(0, 500),
  excludedHighVolume: excluded.filter((row) => row.count >= 10).slice(0, 500),
  unresolvedAll: unresolved
};

fs.writeFileSync(path.join(root, 'data', `soft-clusters-${snapshotDate}.json`), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'data', `soft-cluster-review-${snapshotDate}.json`), JSON.stringify(review, null, 2) + '\n');

console.log(JSON.stringify(report.summary, null, 2));
