# SEO factory for Evtenia

This directory is the portable source of truth for the SEO workflow. Site-specific facts live in `knowledge/`; reusable rules live in `rules/`; demand and production state live in JSON files.

## Read order for every run

1. `knowledge/company-facts.md`
2. `rules/editorial-policy.md`
3. `rules/article-standard.md`
4. `rules/technical-checklist.md`
5. `rules/stop-list.md`
6. `rules/quality-gate.md`
7. `protected-pages.json`
8. `seed-queries.json`
9. `cluster-definitions.json`
10. `semantic-map.json`
11. `content-queue.json`

An agent must not invent keyword volumes, prices, mortgage terms, deadlines, regulations, warranties, project specifications or company facts. Missing data stays `null` or is marked `needs_expert_input`.

Before approving a new cluster, check both `protected-pages.json` and `semantic-map.json`. A Journal article may support a protected commercial page but may not replace its transactional intent.

## Workflow

`semantic map -> queue -> brief -> draft -> fact-check -> quality gate -> CMS draft -> human review -> publish -> indexing -> monitoring`

The CMS adapter is site-specific. Everything before the adapter should remain reusable for another service or domain.

Validate the source of truth before every production run:

```bash
node seo-agent/scripts/soft-cluster-wordstat.mjs
node seo-agent/scripts/build-semantic-assets.mjs
node seo-agent/scripts/validate.mjs
```

The first command deduplicates Wordstat rows and assigns exactly one intent owner. The second rebuilds the semantic map and ranked content queue. Never use `coverageVolumeDiagnostic` as market demand: it is a diagnostic sum of overlapping broad-query rows. For planning, use `main.vol`, the highest observed row in the cluster.

Rows that do not match confidently are not discarded. Review them in `data/soft-cluster-review-2026-08-27.json`, then improve `cluster-definitions.json` and rerun the pipeline. Do not edit generated cluster, map or queue files by hand.

## Status vocabulary

- `published`: a live page already owns the cluster.
- `planned`: approved cluster with no page yet.
- `reserved`: temporarily locked by a brief or draft.
- `review`: content is in editorial review.
- `blocked`: missing facts, access or expert approval.
- `retired`: cluster intentionally merged or redirected.

## Current limitations

- The dated Yandex Wordstat snapshot contains 4,336 collected rows. After deduplication, rule-based exclusions and soft clustering, 3,030 unique rows have owners; unresolved and ambiguous rows remain in the review file.
- The semantic map has 56 consolidated page owners: 17 commercial/live owners and 39 planned informational owners. The current queue contains the top 30 article clusters.
- Soft clustering is a deterministic first pass, not a substitute for live SERP validation and editorial review before each brief.
- Search Console and Yandex Webmaster are not connected.
- The production site currently returns the SPA shell for `/robots.txt` and `/sitemap.xml`; this is a release blocker for automated publishing, recorded in the technical checklist.
- Technology filters use query parameters. Static SEO landing pages should later replace them.
