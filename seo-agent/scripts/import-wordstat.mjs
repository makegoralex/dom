import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawPath = path.join(root, 'data', 'wordstat-raw-2026-08-27.json');
const clusterVolumesPath = path.join(root, 'data', 'wordstat-cluster-volumes-2026-08-27.json');
const mapPath = path.join(root, 'semantic-map.json');
const reportPath = path.join(root, 'data', 'wordstat-import-report-2026-08-27.json');
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const clusterVolumes = JSON.parse(fs.readFileSync(clusterVolumesPath, 'utf8'));
const semanticMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const volumeByCluster = new Map(clusterVolumes.items.map((item) => [item.id, item]));

const normalize = (value) => value
  .toLocaleLowerCase('ru-RU')
  .replace(/ё/g, 'е')
  .replace(/[^a-zа-я0-9]+/gi, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const batchIndexes = new Map();
for (const batch of raw.batches) {
  const index = new Map();
  for (const item of batch.items) {
    for (const row of item.rows) {
      const key = normalize(row.q);
      const previous = index.get(key);
      if (!previous || row.count > previous.count) index.set(key, { q: row.q, count: row.count, seed: item.seed });
    }
  }
  batchIndexes.set(batch.id, index);
}

const useRussia = (cluster) => /moduln/.test(cluster.id);
const matched = [];
const unmatched = [];
let keywordMatches = 0;

for (const cluster of semanticMap.clusters) {
  const batchId = useRussia(cluster) ? 'russia-modular' : 'penza-core';
  const index = batchIndexes.get(batchId);
  const directVolume = volumeByCluster.get(cluster.id);
  const mainMatch = directVolume || index.get(normalize(cluster.main.q));
  if (mainMatch) {
    cluster.main.vol = directVolume ? directVolume.total : mainMatch.count;
    cluster.volumeEvidence = {
      batchId,
      seed: directVolume ? directVolume.q : mainMatch.seed,
      period: raw.period,
      match: directVolume ? clusterVolumes.matchType : 'exact_normalized'
    };
    matched.push({ id: cluster.id, q: cluster.main.q, vol: cluster.main.vol, batchId });
  } else {
    cluster.main.vol = null;
    delete cluster.volumeEvidence;
    unmatched.push({ id: cluster.id, q: cluster.main.q, batchId });
  }

  for (const keyword of cluster.keywords) {
    const match = index.get(normalize(keyword.q));
    keyword.vol = match ? match.count : null;
    if (match) keywordMatches += 1;
  }
}

semanticMap.updated = '2026-08-27';
semanticMap.volumePolicy = {
  source: 'Yandex Wordstat web snapshot',
  snapshot: 'data/wordstat-raw-2026-08-27.json',
  clusterVolumes: 'data/wordstat-cluster-volumes-2026-08-27.json',
  period: raw.period,
  penzaRegionId: 11095,
  russiaRegionId: 225,
  rule: 'Main cluster volumes are direct last-30-day broad phrase totals. Supporting keyword counts come from top-query rows and must not be summed across overlapping seeds. Penza Oblast is used by default; Russia is used for modular-house clusters.'
};

const report = {
  version: 1,
  importedAt: '2026-08-27',
  source: path.relative(root, rawPath),
  matchedMainQueries: matched.length,
  unmatchedMainQueries: unmatched.length,
  matchedSupportingQueries: keywordMatches,
  matched,
  unmatched
};

fs.writeFileSync(mapPath, `${JSON.stringify(semanticMap, null, 2)}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ matched: matched.length, unmatched: unmatched.length, keywordMatches }, null, 2));
