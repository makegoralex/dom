# Soft-clustering report — 2026-08-28

## Outcome

- Wordstat rows collected: 4,336.
- Unique rows after deduplication by batch and normalized query: 4,131.
- Rows assigned to one intent owner: 3,030.
- Rows excluded by explicit noise rules: 124.
- Unresolved rows retained for review: 977.
- Assigned rows also flagged as ambiguous: 70.
- Routing definitions: 61.
- Definitions with data in this snapshot: 53.
- Consolidated semantic page owners: 56.
- Protected/published owners in the semantic map: 17.
- Planned informational owners: 39.
- Ranked article queue: 30.

No frequencies from overlapping Wordstat seed lists were added together. `main.vol` is the largest observed row owned by the cluster. `coverageVolumeDiagnostic` is only a coverage/debug metric.

## Important routing decisions

1. Transactional demand belongs to an existing or recommended commercial page. Journal pages support those owners through internal links and must not target the same buying intent.
2. `/`, `/projects/modulnye-doma` and `/services/remont` each receive several routing rules but remain one consolidated semantic owner per URL.
3. The broad query `ремонт дома` stays unresolved because the snapshot mixes private-house renovation, apartment-building capital repair and unrelated repair services. Only explicit private-house/Penza formulations are routed to the service.
4. Queries about generators, household appliances, repair of equipment, apartment-building capital-repair funds, DIY instructions and unrelated locations are excluded or kept outside the publishing queue.
5. Modular-house commercial demand is national. Other house-construction clusters remain Penza/Penza Oblast unless company geography is explicitly expanded.
6. Mortgage, cadastral and land topics are assigned to Евгения Викторовна Кислякова. Technical, construction and engineering topics are assigned to Олег Иванович Кисляков.

## SERP intent check

The live result pattern confirms that `модульный или каркасный дом` is informational/comparison intent: the result set is dominated by comparison articles from builders. The result set for `модульный дом для постоянного проживания` is mixed: commercial landings coexist with informational material, so the commercial landing owns price/buy/turnkey variants while the Journal owns evaluation, drawbacks and suitability questions.

For local services, `отделка частного дома Пенза` and `септик для частного дома Пенза` are dominated by service/catalog pages with price, scope and lead forms. Those intents therefore remain protected commercial owners, not Journal articles.

## First publication queue

The first six briefs currently are:

1. Модульные дома: отзывы, минусы и подводные камни.
2. Какую технологию дома выбрать: каркас, газобетон или модуль.
3. Доставка и монтаж модульного дома на участке.
4. Модульный дом с коммуникациями: что входит в комплектацию.
5. Модульный или каркасный дом: отличия и выбор технологии.
6. Модульный дом для постоянного проживания: что проверить до заказа.

This order is a production priority, not a promise to publish without evidence. Each brief still needs current SERP review, company examples, expert approval and the quality gate.

## Files produced

- `cluster-definitions.json` — reusable intent-routing rules.
- `data/soft-clusters-2026-08-27.json` — assigned rows and cluster evidence.
- `data/soft-cluster-review-2026-08-27.json` — unresolved, excluded and ambiguous tail.
- `semantic-map.json` — consolidated page owners.
- `content-queue.json` — ranked article queue.
- `scripts/soft-cluster-wordstat.mjs` — deterministic classifier.
- `scripts/build-semantic-assets.mjs` — map and queue generator.

## Next stage

Create the first content brief from queue rank 1. Before drafting, collect Evtenia-specific facts about module construction, insulation, transport limits, installation, warranties, typical misconceptions and real project examples. Then run a current SERP structure check and write the article as Олег Иванович Кисляков with human approval before publication.
