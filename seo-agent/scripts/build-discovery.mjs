import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', 'wordstat-raw-2026-08-27.json'), 'utf8'));
const outputPath = path.join(root, 'data', 'wordstat-discovery-2026-08-27.json');

const definitions = [
  ['technology-choice', /какой дом|какие дома|что лучше|выбрать дом|из чего строить|технологи.{0,12}строитель/i],
  ['frame-houses', /каркасн/i],
  ['modular-houses', /модульн/i],
  ['aerated-concrete', /газобетон|газоблок/i],
  ['projects-and-planning', /проект|планиров|площадь дома|одноэтаж|двухэтаж|комнат/i],
  ['cost-and-estimate', /стоим|цен[аы]|сколько стоит|смет|расчет|калькулятор|бюджет/i],
  ['foundation', /фундамент|сва[ия]|плит[аы]|ростверк|ленточн/i],
  ['mortgage-and-finance', /ипотек|кредит|материнск|мат капитал|эскроу|рассроч/i],
  ['land-and-documents', /участ|земл|межев|кадастр|уведомлен|разрешен|документ|оформлен/i],
  ['construction-process', /этап|начать стро|порядок стро|срок стро|время стро|зимой|летом|контрол/i],
  ['engineering', /коммуникац|электрич|отоплен|водоснаб|канализац|вентиляц|скважин|септик/i],
  ['finishing-and-repair', /отделк|ремонт|стяжк|лестниц|двер|окн[ао]|кондиционер/i],
  ['site-improvement', /забор|ландшафт|озеленен|беседк|благоустрой/i],
  ['trust-and-cases', /отзыв|фото|пример|объект|опыт|ошибк|минус|плюс/i]
];

const hardNoise = /многоквартир|долевое строитель|майнкрафт|minecraft|симс|the sims|ваканси|работа строитель|реферат|курсов|скачать бесплатно|аварийн|снос дома/i;
const geoNoise = /москв|санкт|спб|ленинград|новосибир|нижн.{0,8}новгород|краснодар|тюмень|екатеринбург|челябинск|вьетнам/i;
const brandNoise = /терем|зодчий|этажи|дом рф|домклик|авито|пинтерест/i;

const buckets = new Map(definitions.map(([id]) => [id, new Map()]));
const unclassified = new Map();

for (const batch of raw.batches) {
  for (const item of batch.items) {
    for (const row of item.rows) {
      const q = row.q.toLocaleLowerCase('ru-RU').trim();
      if (!q || hardNoise.test(q) || geoNoise.test(q) || brandNoise.test(q)) continue;
      let assigned = false;
      for (const [id, pattern] of definitions) {
        if (!pattern.test(q)) continue;
        assigned = true;
        const key = `${batch.id}:${q}`;
        const existing = buckets.get(id).get(key);
        if (!existing || row.count > existing.count) buckets.get(id).set(key, { q: row.q, count: row.count, batchId: batch.id, seed: item.seed });
      }
      if (!assigned) {
        const key = `${batch.id}:${q}`;
        const existing = unclassified.get(key);
        if (!existing || row.count > existing.count) unclassified.set(key, { q: row.q, count: row.count, batchId: batch.id, seed: item.seed });
      }
    }
  }
}

const sortRows = (map) => [...map.values()].sort((a, b) => b.count - a.count || a.q.localeCompare(b.q, 'ru'));
const output = {
  version: 1,
  generatedAt: '2026-08-27',
  source: 'data/wordstat-raw-2026-08-27.json',
  warning: 'These are discovery candidates, not final clusters. Counts overlap across seeds and must never be summed. Human/SERP soft clustering is still required.',
  buckets: Object.fromEntries([...buckets].map(([id, rows]) => [id, sortRows(rows).slice(0, 100)])),
  unclassifiedTop: sortRows(unclassified).slice(0, 200)
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  buckets: Object.fromEntries(Object.entries(output.buckets).map(([id, rows]) => [id, rows.length])),
  unclassified: output.unclassifiedTop.length
}, null, 2));

