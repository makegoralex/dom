import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const date = '2026-08-27';
const config = JSON.parse(fs.readFileSync(path.join(root, 'cluster-definitions.json'), 'utf8'));
const clustered = JSON.parse(fs.readFileSync(path.join(root, 'data', `soft-clusters-${date}.json`), 'utf8'));
const previousMap = JSON.parse(fs.readFileSync(path.join(root, 'semantic-map.json'), 'utf8'));
const statePath = path.join(root, 'production-state.json');
const productionState = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {clusters: {}};
const byId = new Map(clustered.clusters.map((cluster) => [cluster.id, cluster]));

const routedClusters = config.definitions.map((definition) => {
  const evidence = byId.get(definition.id);
  const rows = evidence?.rows || [];
  const main = evidence?.main?.q ? evidence.main : {q: definition.includeAny?.[0] || definition.includeAll?.join(' ') || definition.id, vol: 0};
  const keywords = rows.filter((row) => row.q !== main.q).slice(0, 12).map((row) => ({q: row.q, vol: row.count}));
  return {
    id: definition.id,
    page: definition.owner,
    status: definition.ownerType === 'protected' ? 'published' : (productionState.clusters?.[definition.id]?.semanticStatus || 'planned'),
    pageType: definition.pageType,
    intent: definition.intent,
    funnel: definition.funnel,
    category: definition.category,
    region: definition.region,
    author: definition.author,
    reviewer: definition.reviewer || null,
    main,
    keywords,
    priority: Math.min(100, definition.priority),
    humanReviewRequired: definition.ownerType !== 'protected',
    indexingState: definition.ownerType === 'protected' ? 'live_or_recommended_owner' : 'planned',
    requiredLinks: definition.requiredLinks || [],
    notes: definition.ownerType === 'protected'
      ? 'Protected commercial owner. An article must not target the same transactional intent.'
      : 'Soft cluster from Wordstat. Validate facts and live SERP before publication.',
    volumeEvidence: {
      source: `data/soft-clusters-${date}.json`,
      metric: 'max observed row; overlapping Wordstat seeds are not summed',
      rowCount: evidence?.rowCount || 0,
      sourceSeeds: evidence?.sourceSeeds || []
    }
  };
});

const consolidated = new Map();
for (const cluster of routedClusters) {
  const key = cluster.pageType === 'article' ? cluster.id : cluster.page;
  const current = consolidated.get(key);
  if (!current) {
    consolidated.set(key, {...cluster, absorbedDefinitionIds: [cluster.id]});
    continue;
  }
  current.absorbedDefinitionIds.push(cluster.id);
  current.keywords = [...current.keywords, {q: cluster.main.q, vol: cluster.main.vol}, ...cluster.keywords]
    .filter((item, index, all) => item.q && all.findIndex((candidate) => candidate.q === item.q) === index)
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 20);
  current.requiredLinks = [...new Set([...current.requiredLinks, ...cluster.requiredLinks])];
  current.priority = Math.max(current.priority, cluster.priority);
  if (cluster.main.vol > current.main.vol) {
    current.id = cluster.id;
    current.main = cluster.main;
    current.intent = cluster.intent;
    current.funnel = cluster.funnel;
    current.category = cluster.category;
    current.author = cluster.author;
  }
  current.notes = `Protected owner consolidated from routing rules: ${current.absorbedDefinitionIds.join(', ')}.`;
}

const clusters = [...consolidated.values()]
  .map((cluster) => ({...cluster, absorbedDefinitionIds: cluster.absorbedDefinitionIds.length > 1 ? cluster.absorbedDefinitionIds : undefined}))
  .sort((a, b) => b.main.vol - a.main.vol || b.priority - a.priority);

const semanticMap = {
  ...previousMap,
  version: 2,
  updated: date,
  volumePolicy: {
    ...previousMap.volumePolicy,
    softClusters: `data/soft-clusters-${date}.json`,
    reviewTail: `data/soft-cluster-review-${date}.json`,
    rule: 'One normalized query has one owner. Main volume is the maximum observed Wordstat row in the cluster. Counts from overlapping seed lists are never summed. Ambiguous and unmatched rows require review.'
  },
  clusterRules: {
    ...previousMap.clusterRules,
    definitions: 'cluster-definitions.json',
    queryHasExactlyOneOwner: true,
    ambiguousQueriesGoToReview: true
  },
  clusters
};

const evidenceBlockers = {
  'Ипотека и документы': ['publication_day_official_check', 'author_approval'],
  'Участок и оформление': ['current_legal_check', 'author_approval'],
  'Стоимость и бюджет': ['evtenia_current_ranges', 'approved_inclusions'],
  'Модульные дома': ['evtenia_module_specs', 'technical_review'],
  'Каркасные дома': ['evtenia_wall_assemblies', 'technical_review'],
  'Газобетонные дома': ['evtenia_assemblies', 'technical_review'],
  'Фундамент и участок': ['local_cases', 'technical_review'],
  'Инженерные системы': ['site_conditions_examples', 'technical_review']
};

const titleIntents = {
  'modulnye-doma-otzyvy-i-minusy': 'Модульные дома: отзывы, минусы и подводные камни',
  'dostavka-i-montazh-modulnogo-doma': 'Доставка и монтаж модульного дома на участке',
  'modulnyy-dom-s-kommunikaciyami': 'Модульный дом с коммуникациями: что входит в комплектацию',
  'modulnyy-dom-dlya-postoyannogo-prozhivaniya': 'Модульный дом для постоянного проживания: что проверить до заказа',
  'modulnyy-ili-karkasnyy-dom': 'Модульный или каркасный дом: отличия и выбор технологии',
  'kakuyu-tekhnologiyu-doma-vybrat': 'Какую технологию дома выбрать: каркас, газобетон или модуль',
  'semeynaya-ipoteka-na-stroitelstvo-doma': 'Семейная ипотека на строительство дома: условия и порядок',
  'fundament-dlya-doma-iz-gazobetona': 'Какой фундамент выбрать для дома из газобетона',
  'usloviya-ipoteki-na-stroitelstvo': 'Ипотека на строительство дома: условия и требования',
  'kak-vybrat-vhodnuyu-dver-v-dom': 'Как выбрать входную дверь в частный дом',
  'ochistka-vody-iz-skvazhiny': 'Очистка воды из скважины в частном доме',
  'kak-vybrat-septik-dlya-doma': 'Как выбрать септик для частного дома',
  'stena-i-uteplenie-karkasnogo-doma': 'Стена каркасного дома: состав и утепление',
  'skolko-stoit-postroit-dom': 'Сколько стоит построить дом в Пензе и из чего складывается смета',
  'mezhevanie-pered-stroitelstvom': 'Нужно ли межевание участка перед строительством дома',
  'fundament-dlya-karkasnogo-doma': 'Какой фундамент выбрать для каркасного дома',
  'kak-vybrat-skvazhinu-dlya-doma': 'Как выбрать скважину для частного дома',
  'dokumenty-dlya-ipoteki-na-stroitelstvo': 'Документы для ипотеки на строительство дома',
  'planirovka-chastnogo-doma': 'Как выбрать планировку частного дома',
  'karkasnyy-dom-dlya-postoyannogo-prozhivaniya': 'Каркасный дом для постоянного проживания: требования к конструкции',
  'plyusy-minusy-karkasnogo-doma': 'Плюсы и минусы каркасного дома',
  'kak-vybrat-okna-v-chastnyy-dom': 'Как выбрать окна для частного дома',
  'nuzhno-li-uteplyat-gazobeton': 'Нужно ли утеплять дом из газобетона',
  'kakoy-fundament-vybrat-dlya-doma': 'Какой фундамент выбрать для частного дома',
  'karkasnyy-ili-gazobetonnyy-dom': 'Каркасный или газобетонный дом: что выбрать',
  'etapy-stroitelstva-doma': 'Этапы строительства частного дома',
  'plyusy-minusy-doma-iz-gazobetona': 'Плюсы и минусы дома из газобетона',
  'kak-vybrat-zabor-dlya-uchastka': 'Как выбрать забор для участка',
  'landshaftnyy-dizayn-10-sotok': 'Ландшафтный дизайн участка 10 соток с домом',
  'kak-vybrat-proekt-doma': 'Как выбрать проект дома',
  'odnoetazhnyy-ili-dvukhetazhnyy-dom': 'Одноэтажный или двухэтажный дом: что выбрать',
  'podgotovka-uchastka-k-stroitelstvu': 'Как подготовить участок к строительству дома',
  'nuzhna-li-geologiya-uchastka': 'Нужна ли геология участка перед строительством дома'
};

function queueScore(cluster) {
  const demand = Math.log10(Math.max(1, cluster.main.vol) + 1) * 8;
  const funnel = cluster.funnel === 'decision' ? 12 : cluster.funnel === 'consideration' ? 8 : 3;
  const commercial = cluster.intent.includes('commercial') || cluster.intent.includes('comparison') ? 6 : 2;
  const regional = cluster.region === 'Россия' ? 3 : 0;
  return Math.round(cluster.priority * 0.55 + demand + funnel + commercial + regional);
}

const articleCandidates = clusters
  .filter((cluster) => cluster.pageType === 'article' && cluster.main.vol > 0)
  .map((cluster) => ({cluster, score: queueScore(cluster)}))
  .sort((a, b) => b.score - a.score || b.cluster.main.vol - a.cluster.main.vol)
  .slice(0, 30);

const items = articleCandidates.map(({cluster, score}, index) => {
  const blockers = evidenceBlockers[cluster.category] || ['author_review', 'evtenia_examples'];
  return {
    rank: index + 1,
    clusterId: cluster.id,
    titleIntent: titleIntents[cluster.id] || cluster.main.q,
    owner: cluster.page,
    region: cluster.region,
    author: cluster.author,
    reviewer: cluster.reviewer,
    verifiedMainVolume: cluster.main.vol,
    score,
    status: productionState.clusters?.[cluster.id]?.queueStatus || (blockers.some((item) => item.includes('current') || item.includes('official') || item.includes('ranges')) ? 'blocked_for_evidence' : 'ready_for_brief'),
    artifacts: productionState.clusters?.[cluster.id] ? {brief: productionState.clusters[cluster.id].brief, draft: productionState.clusters[cluster.id].draft} : undefined,
    blockers,
    requiredLinks: cluster.requiredLinks,
    nextAction: `Prepare a SERP/content brief for “${cluster.main.q}”, collect Evtenia examples, then run the quality gate.`
  };
});

const queue = {
  version: 2,
  updated: date,
  status: 'wordstat_soft_clustered',
  selectionRule: 'Ranked only after one-query-one-owner soft clustering. Score combines curated business priority, verified max row demand, funnel proximity, commercial relevance and national modular reach. It does not sum overlapping Wordstat rows.',
  source: `data/soft-clusters-${date}.json`,
  items
};

fs.writeFileSync(path.join(root, 'semantic-map.json'), JSON.stringify(semanticMap, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'content-queue.json'), JSON.stringify(queue, null, 2) + '\n');
console.log(JSON.stringify({semanticClusters: clusters.length, articleCandidates: articleCandidates.length, queueItems: items.length}, null, 2));
