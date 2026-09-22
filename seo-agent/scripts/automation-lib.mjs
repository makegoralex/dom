import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const agentDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const repoRoot = path.resolve(agentDir, '..');

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(agentDir, relativePath), 'utf8'));
}

export function readText(relativePath) {
  return fs.readFileSync(path.join(agentDir, relativePath), 'utf8');
}

export function writeJsonAtomic(relativePath, value) {
  const target = path.join(agentDir, relativePath);
  const temporary = `${target}.tmp-${process.pid}`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, target);
}

export function writeTextAtomic(relativePath, value) {
  const target = path.join(agentDir, relativePath);
  const temporary = `${target}.tmp-${process.pid}`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(temporary, value);
  fs.renameSync(temporary, target);
}

export function moscowDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function monthKey(date = new Date()) {
  return moscowDate(date).slice(0, 7);
}

export function validateConfig(config) {
  const errors = [];
  if (!config.siteUrl?.startsWith('https://')) errors.push('siteUrl must use HTTPS');
  if (!['hybrid', 'review', 'automatic'].includes(config.publicationMode)) errors.push('publicationMode is invalid');
  if (!Number.isInteger(config.articlesPerRun) || config.articlesPerRun !== 1) errors.push('articlesPerRun must be exactly 1');
  if (!Number.isInteger(config.maxArticlesPerMonth) || config.maxArticlesPerMonth < 1) errors.push('maxArticlesPerMonth must be positive');
  if (config.enabled && !(Number(config.monthlyBudgetUsd) > 0)) errors.push('monthlyBudgetUsd must be set before paid automation is enabled');
  if (config.enabled && !(Number(config.maxEstimatedCostPerRunUsd) > 0)) errors.push('maxEstimatedCostPerRunUsd must be set before paid automation is enabled');
  if (!config.models?.draft || !config.models?.review) errors.push('draft and review models are required');
  if (config.maxApiCallsPerRun < 2) errors.push('maxApiCallsPerRun must allow draft and review');
  const totalConfiguredTokens = Number(config.limits?.draftMaxOutputTokens || 0) + Number(config.limits?.reviewMaxOutputTokens || 0);
  if (totalConfiguredTokens > config.maxTextOutputTokensPerRun) errors.push('stage token limits exceed maxTextOutputTokensPerRun');
  return errors;
}

export function selectCandidate(queue, semanticMap, config) {
  const eligible = new Set(config.queueEligibleStatuses);
  const semanticById = new Map(semanticMap.clusters.map((cluster) => [cluster.id, cluster]));
  const item = [...queue.items]
    .filter((candidate) => eligible.has(candidate.status))
    .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))[0];
  if (!item) return null;
  const cluster = semanticById.get(item.clusterId);
  if (!cluster) throw new Error(`Queue cluster ${item.clusterId} is missing from semantic-map.json`);
  if (cluster.status !== 'planned') throw new Error(`Cluster ${item.clusterId} has semantic status ${cluster.status}, expected planned`);
  return { item, cluster };
}

export function requiresHumanReview(candidate, article, review, config) {
  if (config.publicationMode === 'review') return true;
  if (candidate.cluster.humanReviewRequired || article.humanReviewRequired || review.humanReviewRequired) return true;
  if (review.decision === 'review') return true;
  const haystack = [candidate.cluster.intent, candidate.cluster.category, candidate.item.titleIntent, candidate.item.clusterId]
    .join(' ')
    .toLowerCase();
  const blocked = [
    ...config.automaticPublication.blockedIntentFragments,
    ...config.automaticPublication.blockedTopicFragments
  ];
  return blocked.some((fragment) => haystack.includes(fragment.toLowerCase()));
}

function countMatches(text, expression) {
  return [...text.matchAll(expression)].length;
}

export function validateGeneratedArticle(article, candidate, config) {
  const errors = [];
  const warnings = [];
  const expectedSlug = candidate.cluster.page.replace(/^\/journal\//, '');
  if (article.slug !== expectedSlug) errors.push(`slug must be ${expectedSlug}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) errors.push('slug must be lowercase Latin with hyphens');
  for (const field of ['title', 'excerpt', 'contentHtml', 'seoTitle', 'seoDescription', 'ctaTitle', 'ctaText', 'ctaHref']) {
    if (!String(article[field] || '').trim()) errors.push(`${field} is required`);
  }
  if (article.contentHtml.length < config.minimumBodyCharacters) errors.push(`contentHtml is shorter than ${config.minimumBodyCharacters} characters`);
  if (countMatches(article.contentHtml, /<h1\b/gi)) errors.push('contentHtml must not contain H1');
  if (countMatches(article.contentHtml, /<h2\b/gi) < config.minimumH2Count) errors.push(`contentHtml needs at least ${config.minimumH2Count} H2 headings`);
  if (/<(?:script|iframe)\b|\son\w+\s*=|javascript:/i.test(article.contentHtml)) errors.push('unsafe HTML is present');
  if (/\b(?:TODO|TBD|needs_expert_input)\b/i.test(article.contentHtml)) errors.push('placeholder is present');
  if (article.seoDescription.length > 250) errors.push('seoDescription is longer than 250 characters');
  for (const requiredLink of candidate.cluster.requiredLinks || candidate.item.requiredLinks || []) {
    const decodedLink = decodeURIComponent(requiredLink);
    if (!article.contentHtml.includes(requiredLink) && !article.contentHtml.includes(decodedLink)) {
      errors.push(`required internal link is missing: ${requiredLink}`);
    }
  }
  if (!Array.isArray(article.sourceUrls) || article.sourceUrls.length === 0) warnings.push('No external source URLs were returned');
  if (!Array.isArray(article.tags) || article.tags.length < 2) warnings.push('Fewer than two tags were returned');
  return { result: errors.length ? 'fail' : warnings.length ? 'review' : 'pass', errors, warnings };
}

function stripUnsupportedSchemaKeywords(schema) {
  const clean = structuredClone(schema);
  delete clean.$schema;
  return clean;
}

export function extractOutputText(response) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text;
  const chunks = [];
  for (const item of response.output || []) {
    if (item.type !== 'message') continue;
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

function parseRetrySeconds(message) {
  const match = String(message).match(/try again in\s+([0-9.]+)\s*(ms|s|sec|seconds)?/i);
  if (!match) return 15;
  const value = Number(match[1]);
  const seconds = match[2]?.toLowerCase() === 'ms' ? value / 1000 : value;
  return Math.min(90, Math.max(15, Math.ceil(seconds + 5)));
}

function isRetryableTpm(status, body) {
  if (status !== 429) return false;
  const text = JSON.stringify(body).toLowerCase();
  return text.includes('rate_limit') || text.includes('tokens per min') || text.includes('tpm') || text.includes('rate limit reached');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, options, label) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`${label} network failure; request was not retried because creation may have succeeded: ${error.message}`);
  }
  const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => '') }));
  return { response, body };
}

export async function createStructuredResponse({ apiKey, model, instructions, input, schema, schemaName, maxOutputTokens, maxToolCalls, allowedDomains, pollIntervalSeconds, maxWaitMinutes }) {
  const payload = {
    model,
    instructions,
    input,
    background: true,
    store: false,
    reasoning: { effort: 'high' },
    max_output_tokens: maxOutputTokens,
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema: stripUnsupportedSchemaKeywords(schema)
      }
    }
  };
  if (allowedDomains?.length) {
    payload.tools = [{ type: 'web_search', filters: { allowed_domains: allowedDomains } }];
    payload.max_tool_calls = maxToolCalls;
    payload.include = ['web_search_call.action.sources'];
  }

  let attempt = 0;
  let created;
  while (attempt < 2) {
    const { response, body } = await requestJson('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 'OpenAI POST');
    if (response.ok) {
      created = body;
      break;
    }
    if (attempt === 0 && isRetryableTpm(response.status, body)) {
      await sleep(parseRetrySeconds(body?.error?.message));
      attempt += 1;
      continue;
    }
    throw new Error(`OpenAI POST failed with ${response.status}: ${body?.error?.message || JSON.stringify(body)}`);
  }
  if (!created?.id) throw new Error('OpenAI response did not include response.id');

  let current = created;
  const deadline = Date.now() + maxWaitMinutes * 60_000;
  while (current.status === 'queued' || current.status === 'in_progress') {
    if (Date.now() >= deadline) throw new Error(`OpenAI response ${current.id} exceeded ${maxWaitMinutes} minutes`);
    await sleep(pollIntervalSeconds * 1000);
    const { response, body } = await requestJson(`https://api.openai.com/v1/responses/${encodeURIComponent(current.id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    }, 'OpenAI polling GET');
    if (!response.ok) throw new Error(`OpenAI polling failed with ${response.status}: ${body?.error?.message || JSON.stringify(body)}`);
    current = body;
  }
  if (current.status === 'incomplete') {
    throw new Error(`OpenAI response incomplete: ${current.incomplete_details?.reason || 'unknown reason'}`);
  }
  if (current.status !== 'completed') {
    throw new Error(`OpenAI response ended with status ${current.status}: ${current.error?.message || 'unknown error'}`);
  }
  const outputText = extractOutputText(current);
  if (!outputText) throw new Error('OpenAI response completed without text output');
  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    throw new Error(`OpenAI structured output was not valid JSON: ${error.message}`);
  }
  return {
    data: parsed,
    responseId: current.id,
    usage: current.usage || {},
    webSearchCalls: (current.output || []).filter((item) => item.type === 'web_search_call').length,
    sources: (current.output || [])
      .filter((item) => item.type === 'web_search_call')
      .flatMap((item) => item.action?.sources || [])
  };
}

export async function cmsRequest(config, secret, pathname, options = {}) {
  const response = await fetch(new URL(pathname, config.siteUrl), {
    ...options,
    headers: {
      [config.cms.secretHeader]: secret,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => '') }));
  if (!response.ok) throw new Error(`CMS ${options.method || 'GET'} ${pathname} failed with ${response.status}: ${body.message || JSON.stringify(body)}`);
  return body;
}

export function usageTotals(...usageObjects) {
  return usageObjects.reduce((total, usage) => ({
    inputTokens: total.inputTokens + Number(usage?.input_tokens || 0),
    outputTokens: total.outputTokens + Number(usage?.output_tokens || 0),
    totalTokens: total.totalTokens + Number(usage?.total_tokens || 0)
  }), { inputTokens: 0, outputTokens: 0, totalTokens: 0 });
}

export function estimateCostUsd(config, stages) {
  let total = 0;
  for (const stage of stages) {
    const rates = config.pricingSnapshot.modelsPerMillionTokens[stage.model];
    if (!rates) throw new Error(`No pricing snapshot for model ${stage.model}`);
    total += (Number(stage.usage?.input_tokens || 0) / 1_000_000) * rates.input;
    total += (Number(stage.usage?.output_tokens || 0) / 1_000_000) * rates.output;
    total += (Number(stage.webSearchCalls || 0) / 1000) * config.pricingSnapshot.webSearchPerThousandCalls;
  }
  return Number(total.toFixed(6));
}
