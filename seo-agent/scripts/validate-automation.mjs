import fs from 'node:fs';
import path from 'node:path';
import {
  agentDir,
  readJson,
  selectCandidate,
  validateConfig
} from './automation-lib.mjs';

const config = readJson('automation-config.json');
const queue = readJson('content-queue.json');
const semanticMap = readJson('semantic-map.json');
const state = readJson('automation-state.json');
const errors = validateConfig(config);

if (!Array.isArray(queue.items)) errors.push('content-queue.json has no items array');
if (!Array.isArray(semanticMap.clusters)) errors.push('semantic-map.json has no clusters array');
if (!state.monthlyUsage || typeof state.monthlyUsage !== 'object') errors.push('automation-state.json has no monthlyUsage object');

const requiredFiles = [
  'knowledge/company-facts.md',
  'rules/editorial-policy.md',
  'rules/article-standard.md',
  'rules/quality-gate.md',
  'rules/stop-list.md',
  'schemas/generated-article.schema.json',
  'schemas/article-review.schema.json'
];
for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(agentDir, relativePath))) errors.push(`Required file is missing: ${relativePath}`);
}

let selected = null;
try {
  selected = selectCandidate(queue, semanticMap, config);
} catch (error) {
  errors.push(error.message);
}
if (!selected) errors.push('No eligible queue item exists');
if (selected && !config.categoryMap[selected.cluster.category]) {
  errors.push(`No CMS category mapping for ${selected.cluster.category}`);
}
for (const author of Object.values(config.authors || {})) {
  if (!author.role || author.reviewAttributionApproved !== true) errors.push('Every configured author needs a role and approved review attribution');
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  paidAutomationEnabled: config.enabled,
  publicationMode: config.publicationMode,
  selectedCluster: selected.item.clusterId,
  selectedTitle: selected.item.titleIntent,
  plannedCmsCategoryId: config.categoryMap[selected.cluster.category],
  imagesEnabled: config.images.enabled,
  note: config.enabled ? 'Paid runs are enabled.' : 'Safe mode: paid API calls are disabled.'
}, null, 2));
