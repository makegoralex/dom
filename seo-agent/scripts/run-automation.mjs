import {
  cmsRequest,
  createStructuredResponse,
  estimateCostUsd,
  monthKey,
  moscowDate,
  readJson,
  readText,
  requiresHumanReview,
  selectCandidate,
  usageTotals,
  validateConfig,
  validateGeneratedArticle,
  writeJsonAtomic,
  writeTextAtomic
} from './automation-lib.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const scheduledRun = args.has('--scheduled');
const config = readJson('automation-config.json');
const queue = readJson('content-queue.json');
const semanticMap = readJson('semantic-map.json');
const productionState = readJson('production-state.json');
const automationState = readJson('automation-state.json');
const clusterDefinitions = readJson('cluster-definitions.json');
const generatedArticleSchema = readJson('schemas/generated-article.schema.json');
const articleReviewSchema = readJson('schemas/article-review.schema.json');

const configErrors = validateConfig(config);
if (configErrors.length) throw new Error(`Automation configuration is invalid:\n- ${configErrors.join('\n- ')}`);

const candidate = selectCandidate(queue, semanticMap, config);
if (!candidate) {
  console.log(JSON.stringify({ generated: false, reason: 'queue_empty' }));
  process.exit(0);
}

const today = moscowDate();
const currentMonth = monthKey();
const monthlyUsage = automationState.monthlyUsage[currentMonth] || { articleCount: 0, estimatedCostUsd: 0, inputTokens: 0, outputTokens: 0 };

if (scheduledRun && automationState.lastRun?.successfulDateMoscow === today) {
  console.log(JSON.stringify({ generated: false, reason: 'already_completed_today', date: today }));
  process.exit(0);
}
if (monthlyUsage.articleCount >= config.maxArticlesPerMonth) {
  console.log(JSON.stringify({ generated: false, reason: 'monthly_article_limit', month: currentMonth }));
  process.exit(0);
}
if (config.enabled && monthlyUsage.estimatedCostUsd + config.maxEstimatedCostPerRunUsd > config.monthlyBudgetUsd) {
  console.log(JSON.stringify({ generated: false, reason: 'monthly_budget_guard', month: currentMonth }));
  process.exit(0);
}

const categoryId = config.categoryMap[candidate.cluster.category];
if (!categoryId) throw new Error(`No CMS category mapping for ${candidate.cluster.category}`);
const author = config.authors[candidate.item.author || candidate.cluster.author];
if (!author) throw new Error(`Author is not configured: ${candidate.item.author || candidate.cluster.author}`);

const plan = {
  generated: false,
  dryRun,
  paidAutomationEnabled: config.enabled,
  selected: {
    clusterId: candidate.item.clusterId,
    titleIntent: candidate.item.titleIntent,
    page: candidate.cluster.page,
    category: candidate.cluster.category,
    categoryId,
    intent: candidate.cluster.intent,
    region: candidate.cluster.region,
    author: candidate.item.author,
    authorRole: author.role,
    requiredLinks: candidate.cluster.requiredLinks,
    humanReviewRequiredByMap: candidate.cluster.humanReviewRequired
  },
  limits: {
    articlesPerRun: config.articlesPerRun,
    maxArticlesPerMonth: config.maxArticlesPerMonth,
    monthlyBudgetUsd: config.monthlyBudgetUsd,
    maxEstimatedCostPerRunUsd: config.maxEstimatedCostPerRunUsd,
    maxApiCallsPerRun: config.maxApiCallsPerRun,
    maxTextOutputTokensPerRun: config.maxTextOutputTokensPerRun
  }
};

if (dryRun) {
  console.log(JSON.stringify({ ...plan, reason: 'dry_run_stopped_before_network_and_file_writes' }, null, 2));
  process.exit(0);
}
if (!config.enabled) {
  if (scheduledRun) {
    console.log(JSON.stringify({ ...plan, reason: 'paid_automation_disabled' }, null, 2));
    process.exit(0);
  }
  throw new Error('Paid automation is disabled in automation-config.json. Use --dry-run until a budget is approved.');
}

const apiKey = process.env.OPENAI_API_KEY;
const cmsSecret = process.env.CRM_API_SECRET || process.env.CRM_SUBMISSION_SECRET;
if (!apiKey) throw new Error('OPENAI_API_KEY is missing');
if (!cmsSecret) throw new Error('CRM_API_SECRET or CRM_SUBMISSION_SECRET is missing');

const liveCategories = await cmsRequest(config, cmsSecret, config.cms.categoriesPath);
if (!liveCategories.some((category) => category.id === categoryId)) {
  throw new Error(`CMS category ${categoryId} does not exist on production`);
}

const companyFacts = readText('knowledge/company-facts.md');
const editorialPolicy = readText('rules/editorial-policy.md');
const articleStandard = readText('rules/article-standard.md');
const qualityGate = readText('rules/quality-gate.md');
const stopList = readText('rules/stop-list.md');
const definition = clusterDefinitions.definitions.find((item) => item.id === candidate.item.clusterId);
const expectedSlug = candidate.cluster.page.replace(/^\/journal\//, '');
const allowedDomains = [
  ...config.research.allowedDomains,
  ...config.research.competitorDomainsForIntentOnly
];

const draftInstructions = [
  'Ты — редактор строительного журнала Evtenia.',
  'Подготовь полезную русскоязычную статью под заданный поисковый интент.',
  'Не выдумывай цены, сроки, гарантии, характеристики, нормативы, кейсы, цитаты или опыт компании.',
  'Конкурентные сайты разрешено использовать только для понимания интента и структуры выдачи, но не как источник фактов.',
  'Существенные технические, юридические и финансовые утверждения подтверждай первичными источниками.',
  'Не добавляй H1 в contentHtml: H1 выводит шаблон страницы.',
  'Верни только объект, соответствующий JSON Schema.'
].join(' ');

const draftInput = JSON.stringify({
  assignment: {
    clusterId: candidate.item.clusterId,
    titleIntent: candidate.item.titleIntent,
    exactSlug: expectedSlug,
    region: candidate.cluster.region,
    intent: candidate.cluster.intent,
    funnel: candidate.cluster.funnel,
    category: candidate.cluster.category,
    mainQuery: candidate.cluster.main,
    supportingQueries: candidate.cluster.keywords,
    requiredInternalLinks: candidate.cluster.requiredLinks,
    author: candidate.item.author,
    authorRole: author.role,
    humanReviewRequired: candidate.cluster.humanReviewRequired,
    notes: candidate.cluster.notes,
    definitionNotes: definition?.notes || ''
  },
  companyFacts,
  editorialPolicy,
  articleStandard,
  stopList,
  outputRequirements: {
    language: 'ru-RU',
    minimumBodyCharacters: config.minimumBodyCharacters,
    minimumH2Count: config.minimumH2Count,
    contentFormat: 'Safe semantic HTML fragment. Use h2, h3, p, ul, ol, table, blockquote, nav where useful.',
    sourceLinks: 'Include sourceUrls and place contextual source links in contentHtml for non-obvious factual claims.',
    cta: 'One helpful CTA matching the reader intent; do not pressure.',
    reviewClaims: 'List every claim that still needs named expert verification.'
  }
}, null, 2);

const draftResult = await createStructuredResponse({
  apiKey,
  model: config.models.draft,
  instructions: draftInstructions,
  input: draftInput,
  schema: generatedArticleSchema,
  schemaName: 'evtenia_journal_article',
  maxOutputTokens: config.limits.draftMaxOutputTokens,
  maxToolCalls: config.limits.maxWebSearchCallsPerResponse,
  allowedDomains,
  pollIntervalSeconds: config.pollIntervalSeconds,
  maxWaitMinutes: config.maxBackgroundWaitMinutes
});

const discoveredSourceUrls = draftResult.sources
  .map((source) => source.url)
  .filter((url) => typeof url === 'string');
draftResult.data.sourceUrls = [...new Set([...draftResult.data.sourceUrls, ...discoveredSourceUrls])];
const deterministicGate = validateGeneratedArticle(draftResult.data, candidate, config);
if (deterministicGate.errors.length) {
  throw new Error(`Generated article failed deterministic validation:\n- ${deterministicGate.errors.join('\n- ')}`);
}

const reviewInstructions = [
  'Ты — строгий фактчекер и выпускающий редактор строительного журнала.',
  'Проверь материал по приложенным правилам и первичным источникам.',
  'Fail означает, что материал нельзя загружать даже как редакционный черновик.',
  'Review означает, что структура пригодна, но публикация возможна только после проверки человеком.',
  'Pass означает отсутствие найденных блокирующих проблем; обязательность человеческой проверки всё равно выставляй отдельно.',
  'Не переписывай статью и верни только объект по JSON Schema.'
].join(' ');
const reviewInput = JSON.stringify({
  article: draftResult.data,
  assignment: candidate,
  qualityGate,
  editorialPolicy,
  stopList
}, null, 2);

const reviewResult = await createStructuredResponse({
  apiKey,
  model: config.models.review,
  instructions: reviewInstructions,
  input: reviewInput,
  schema: articleReviewSchema,
  schemaName: 'evtenia_article_review',
  maxOutputTokens: config.limits.reviewMaxOutputTokens,
  maxToolCalls: config.limits.maxWebSearchCallsPerResponse,
  allowedDomains: config.research.allowedDomains,
  pollIntervalSeconds: config.pollIntervalSeconds,
  maxWaitMinutes: config.maxBackgroundWaitMinutes
});

if (reviewResult.data.decision === 'fail') {
  throw new Error(`Editorial review failed: ${reviewResult.data.summary}; ${reviewResult.data.issues.join('; ')}`);
}

const humanReviewRequired = requiresHumanReview(candidate, draftResult.data, reviewResult.data, config)
  || deterministicGate.result === 'review'
  || draftResult.data.claimsNeedingHumanReview.length > 0
  || reviewResult.data.issues.length > 0
  || reviewResult.data.requiredCorrections.length > 0
  || reviewResult.data.unsupportedClaims.length > 0;
const cmsStatus = config.publicationMode === 'automatic' && !humanReviewRequired
  ? 'published'
  : config.publicationMode === 'hybrid' && !humanReviewRequired
    ? 'published'
    : 'review';
const reviewerName = `${candidate.item.author || candidate.cluster.author}, ${author.role}`;
const articlePayload = {
  title: draftResult.data.title,
  slug: draftResult.data.slug,
  excerpt: draftResult.data.excerpt,
  content: draftResult.data.contentHtml,
  coverImage: '',
  categoryId,
  tags: draftResult.data.tags,
  author: candidate.item.author || candidate.cluster.author,
  authorRole: author.role,
  authorBio: '',
  reviewer: reviewerName,
  status: cmsStatus,
  featured: false,
  relatedProjectIds: draftResult.data.relatedProjectIds,
  relatedServiceSlugs: draftResult.data.relatedServiceSlugs,
  ctaTitle: draftResult.data.ctaTitle,
  ctaText: draftResult.data.ctaText,
  ctaHref: draftResult.data.ctaHref,
  seoTitle: draftResult.data.seoTitle,
  seoDescription: draftResult.data.seoDescription
};

const articlePath = config.cms.articlePathTemplate.replace('{sourceId}', encodeURIComponent(candidate.item.clusterId));
const cmsArticle = await cmsRequest(config, cmsSecret, articlePath, {
  method: 'PUT',
  body: JSON.stringify(articlePayload)
});

const totals = usageTotals(draftResult.usage, reviewResult.usage);
const estimatedCostUsd = estimateCostUsd(config, [
  { model: config.models.draft, usage: draftResult.usage, webSearchCalls: draftResult.webSearchCalls },
  { model: config.models.review, usage: reviewResult.usage, webSearchCalls: reviewResult.webSearchCalls }
]);
if (estimatedCostUsd > config.maxEstimatedCostPerRunUsd) {
  console.warn(`Actual estimated cost ${estimatedCostUsd} exceeded configured per-run estimate ${config.maxEstimatedCostPerRunUsd}`);
}

const completedAt = new Date().toISOString();
const draftRelativePath = `drafts/${candidate.item.clusterId}.json`;
const htmlRelativePath = `drafts/${candidate.item.clusterId}.html`;
const reportRelativePath = `reports/${candidate.item.clusterId}-gate.json`;
const briefRelativePath = `briefs/${candidate.item.clusterId}.md`;
const persistedDraft = {
  ...articlePayload,
  id: cmsArticle.id,
  source: 'crm',
  sourceId: candidate.item.clusterId,
  sourceUrls: draftResult.data.sourceUrls,
  claimsNeedingHumanReview: draftResult.data.claimsNeedingHumanReview,
  generatedAt: completedAt,
  automation: {
    draftResponseId: draftResult.responseId,
    reviewResponseId: reviewResult.responseId,
    estimatedCostUsd,
    usage: totals
  }
};
const gateReport = {
  clusterId: candidate.item.clusterId,
  generatedAt: completedAt,
  result: cmsStatus === 'published' ? 'pass' : 'review',
  cmsStatus,
  deterministic: deterministicGate,
  editorial: reviewResult.data,
  sourceUrls: draftResult.data.sourceUrls,
  usage: totals,
  estimatedCostUsd,
  responseIds: {
    draft: draftResult.responseId,
    review: reviewResult.responseId
  }
};
const briefMarkdown = [
  `# ${candidate.item.titleIntent}`,
  '',
  `- Cluster: \`${candidate.item.clusterId}\``,
  `- URL: \`${candidate.cluster.page}\``,
  `- Intent: ${candidate.cluster.intent}`,
  `- Region: ${candidate.cluster.region}`,
  `- Author: ${candidate.item.author} — ${author.role}`,
  `- Human review: ${humanReviewRequired ? 'required' : 'not required by the current rules'}`,
  `- Generated: ${completedAt}`,
  '',
  '## Required internal links',
  '',
  ...(candidate.cluster.requiredLinks || []).map((link) => `- ${link}`),
  '',
  '## Sources',
  '',
  ...draftResult.data.sourceUrls.map((url) => `- ${url}`),
  '',
  '## Claims needing review',
  '',
  ...(draftResult.data.claimsNeedingHumanReview.length
    ? draftResult.data.claimsNeedingHumanReview.map((claim) => `- ${claim}`)
    : ['- None returned by the draft stage.']),
  ''
].join('\n');

const queueItem = queue.items.find((item) => item.clusterId === candidate.item.clusterId);
queueItem.status = cmsStatus;
queueItem.reviewer = reviewerName;
queueItem.artifacts = { brief: briefRelativePath, draft: draftRelativePath, report: reportRelativePath };
queueItem.nextAction = cmsStatus === 'published'
  ? 'Monitor indexing, queries and conversions.'
  : 'Review the generated article in the Journal admin, correct claims if needed, then publish.';
queue.updated = today;

productionState.updated = today;
productionState.clusters[candidate.item.clusterId] = {
  semanticStatus: cmsStatus,
  queueStatus: cmsStatus,
  brief: briefRelativePath,
  draft: draftRelativePath,
  report: reportRelativePath,
  reservedAt: today,
  ...(cmsStatus === 'published' ? { publishedAt: today } : {}),
  notes: cmsStatus === 'published'
    ? 'Generated, validated and published by the SEO automation.'
    : 'Generated and sent to the Journal admin for human review.'
};

automationState.updatedAt = completedAt;
automationState.lastRun = {
  successfulDateMoscow: today,
  completedAt,
  clusterId: candidate.item.clusterId,
  cmsStatus,
  estimatedCostUsd,
  usage: totals
};
automationState.monthlyUsage[currentMonth] = {
  articleCount: monthlyUsage.articleCount + 1,
  estimatedCostUsd: Number((monthlyUsage.estimatedCostUsd + estimatedCostUsd).toFixed(6)),
  inputTokens: monthlyUsage.inputTokens + totals.inputTokens,
  outputTokens: monthlyUsage.outputTokens + totals.outputTokens
};
automationState.runs = [automationState.lastRun, ...(automationState.runs || [])].slice(0, 50);

writeJsonAtomic(draftRelativePath, persistedDraft);
writeTextAtomic(htmlRelativePath, `${draftResult.data.contentHtml.trim()}\n`);
writeJsonAtomic(reportRelativePath, gateReport);
writeTextAtomic(briefRelativePath, briefMarkdown);
writeJsonAtomic('content-queue.json', queue);
writeJsonAtomic('production-state.json', productionState);
writeJsonAtomic('automation-state.json', automationState);

console.log(JSON.stringify({
  generated: true,
  clusterId: candidate.item.clusterId,
  cmsStatus,
  articleId: cmsArticle.id,
  articleUrl: cmsStatus === 'published' ? `${config.siteUrl}${candidate.cluster.page}` : null,
  estimatedCostUsd,
  usage: totals
}, null, 2));
