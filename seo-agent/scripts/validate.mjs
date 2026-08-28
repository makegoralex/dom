import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const semanticMap = readJson('semantic-map.json');
const queue = readJson('content-queue.json');
const protectedPages = readJson('protected-pages.json');
const seedQueries = readJson('seed-queries.json');
const errors = [];

const duplicateValues = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const requireFields = (item, fields, label) => {
  for (const field of fields) {
    if (!(field in item)) errors.push(`${label}: missing ${field}`);
  }
};

requireFields(semanticMap, ['version', 'site', 'updated', 'clusters'], 'semantic-map');
if (!Array.isArray(semanticMap.clusters)) errors.push('semantic-map: clusters must be an array');

const validStatuses = new Set(['published', 'planned', 'reserved', 'review', 'blocked', 'retired']);
const clusterIds = [];
const clusterPages = [];
for (const [index, cluster] of (semanticMap.clusters || []).entries()) {
  const label = `cluster[${index}]`;
  requireFields(cluster, ['id', 'page', 'status', 'pageType', 'intent', 'main', 'keywords', 'priority', 'humanReviewRequired'], label);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cluster.id || '')) errors.push(`${label}: invalid id`);
  if (!(cluster.page || '').startsWith('/')) errors.push(`${label}: page must start with /`);
  if (!validStatuses.has(cluster.status)) errors.push(`${label}: invalid status ${cluster.status}`);
  if (!cluster.main || typeof cluster.main.q !== 'string' || !('vol' in cluster.main)) errors.push(`${label}: invalid main query`);
  if (!Array.isArray(cluster.keywords)) errors.push(`${label}: keywords must be an array`);
  if (!Number.isInteger(cluster.priority) || cluster.priority < 0 || cluster.priority > 100) errors.push(`${label}: priority must be 0..100`);
  if (typeof cluster.humanReviewRequired !== 'boolean') errors.push(`${label}: humanReviewRequired must be boolean`);
  clusterIds.push(cluster.id);
  clusterPages.push(cluster.page);
}

for (const id of duplicateValues(clusterIds)) errors.push(`duplicate cluster id: ${id}`);
for (const page of duplicateValues(clusterPages)) errors.push(`duplicate cluster page: ${page}`);

requireFields(queue, ['version', 'updated', 'items'], 'content-queue');
const ranks = [];
for (const [index, item] of (queue.items || []).entries()) {
  const label = `queue[${index}]`;
  requireFields(item, ['rank', 'clusterId', 'status', 'score', 'blockers', 'nextAction'], label);
  if (!clusterIds.includes(item.clusterId)) errors.push(`${label}: unknown clusterId ${item.clusterId}`);
  if (!Array.isArray(item.blockers)) errors.push(`${label}: blockers must be an array`);
  ranks.push(item.rank);
}
for (const rank of duplicateValues(ranks)) errors.push(`duplicate queue rank: ${rank}`);

requireFields(protectedPages, ['version', 'updated', 'pages'], 'protected-pages');
const protectedUrls = (protectedPages.pages || []).map((item) => item.url);
for (const url of duplicateValues(protectedUrls)) errors.push(`duplicate protected URL: ${url}`);

requireFields(seedQueries, ['version', 'updated', 'batches'], 'seed-queries');
for (const [index, batch] of (seedQueries.batches || []).entries()) {
  requireFields(batch, ['id', 'region', 'devices', 'phrases'], `seed-batch[${index}]`);
  if (!Array.isArray(batch.phrases) || !batch.phrases.length) errors.push(`seed-batch[${index}]: phrases must be a non-empty array`);
  for (const phrase of duplicateValues(batch.phrases || [])) errors.push(`seed-batch[${index}]: duplicate phrase ${phrase}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  clusters: clusterIds.length,
  published: semanticMap.clusters.filter((item) => item.status === 'published').length,
  planned: semanticMap.clusters.filter((item) => item.status === 'planned').length,
  queue: queue.items.length,
  protectedPages: protectedPages.pages.length,
  seedPhrases: seedQueries.batches.reduce((sum, batch) => sum + batch.phrases.length, 0)
}, null, 2));
