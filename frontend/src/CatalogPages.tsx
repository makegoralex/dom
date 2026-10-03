import React, { ComponentType, FormEvent, useEffect, useState } from 'react';

type CatalogPageProps = {
  apiBase: string;
  Header: ComponentType;
  Footer: ComponentType;
  PrivacyConsent: ComponentType;
  formatPhone: (value: string) => string;
};

type DoorCollection = {
  slug: string;
  name: string;
  image: string;
  images?: string[];
  models?: string[];
  productCutout?: boolean;
  description: string;
  style: 'Современный стиль' | 'Классика' | 'Текстура дерева';
};

type ChanyModel = {
  name: string;
  image: string;
  category: 'Круглый чан' | 'Купель и терраса';
  from: number;
  steel304?: number;
  facts: string[];
  description: string;
  tag?: string;
};

const DOORS: DoorCollection[] = [
  { slug: 'soul', name: 'Соул', image: 'soul', description: 'Ровная геометрия и спокойная отделка — для интерьеров, где важны чистые линии и визуальная лёгкость.', style: 'Современный стиль' },
  { slug: 'siciliya', name: 'Сицилия', image: 'sicily', description: 'Мягкая классическая филёнка и аккуратный рельеф: выразительно, но без тяжеловесного декора.', style: 'Классика' },
  { slug: 'solo', name: 'Соло', image: 'solo', description: 'Лаконичное полотно без лишних деталей, которое легко сочетать с разными цветами стен и пола.', style: 'Современный стиль' },
  { slug: 'line', name: 'Лайн', image: 'line', description: 'Горизонтальные линии добавляют ритм и поддерживают современную архитектуру комнаты.', style: 'Современный стиль' },
  { slug: 'yukon', name: 'Юкон', image: 'yukon', description: 'Сдержанная фактура и простая форма — практичная основа для спокойного домашнего интерьера.', style: 'Текстура дерева' },
  { slug: 'erika', name: 'Эрика', image: 'erika', description: 'Объёмные контуры и декоративная пластика для интерьеров с более мягким, классическим настроением.', style: 'Классика' },
  { slug: 'dizayn', name: 'Дизайн', image: 'design', description: 'Детали и комбинации отделки помогают сделать дверь заметным, но гармоничным акцентом.', style: 'Современный стиль' },
  { slug: 'modern', name: 'Модерн', image: 'modern', description: 'Графичные вставки и строгие пропорции для современных квартир и загородных домов.', style: 'Современный стиль' },
  { slug: 'neoklassika', name: 'Неоклассика', image: 'neoclassic', description: 'Симметрия и деликатная профилировка сочетают традиционный рисунок с лёгким современным видом.', style: 'Классика' },
  { slug: 'klassika', name: 'Классика', image: 'classic', description: 'Рельефные панели и привычные пропорции, которые уместны в традиционном интерьере.', style: 'Классика' },
  { slug: 'eko', name: 'Эко', image: 'eco', description: 'Тёплый древесный рисунок и выразительная фактура для уютных натуральных интерьеров.', style: 'Текстура дерева' },
  { slug: 'ekogrand', name: 'ЭкоГранд', image: 'eco-grand', description: 'Древесная фактура с более заметным рисунком полотна — для тех, кто хочет подчеркнуть материал.', style: 'Текстура дерева' },
  { slug: 'kaliforniya', name: 'Калифорния', image: 'california-1', images: ['california-1', 'california-2', 'california-3'], models: ['М451', 'М452', 'М453'], productCutout: true, description: 'Рельефная фрезеровка повторяет силуэт арок и создаёт выразительный рисунок полотна.', style: 'Классика' },
  { slug: 'minimal', name: 'Минимал', image: 'minimal-1', images: ['minimal-1', 'minimal-2', 'minimal-3'], models: ['Минимал 1', 'Минимал 2', 'Минимал 4'], productCutout: true, description: 'Лаконичные гладкие полотна для жилых и коммерческих интерьеров, где важны простота и спокойный фон.', style: 'Современный стиль' },
  { slug: 'notte', name: 'Ноттэ', image: 'notte-1', images: ['notte-1', 'notte-2'], models: ['М371', 'М372'], productCutout: true, description: 'Вертикальная фрезеровка с ритмом, напоминающим спокойную водную гладь; отдельные варианты допускают декоративные вставки.', style: 'Современный стиль' },
  { slug: 'smart', name: 'Смарт', image: 'smart-1', images: ['smart-1', 'smart-2', 'smart-3', 'smart-4', 'smart-5'], models: ['Смарт 01', 'Смарт 02', 'Смарт 03', 'Смарт 04', 'Смарт 05'], productCutout: true, description: 'Каркасно-щитовые полотна с актуальным рисунком и доступными вариантами отделки.', style: 'Современный стиль' },
  { slug: 'toskana', name: 'Тоскана', image: 'toscana-1', images: ['toscana-1', 'toscana-2', 'toscana-3', 'toscana-4'], models: ['М411', 'М412', 'М421', 'М422'], productCutout: true, description: 'Коллекция с гармоничными линиями и выразительным характером для интерьера с тёплыми акцентами.', style: 'Классика' }
];

const CHANY: ChanyModel[] = [
  { name: 'Чан «Лайт»', image: 'light', category: 'Круглый чан', from: 259900, steel304: 290900, facts: ['Ø 200 × 150 см', '1,4 м³', '4–6 человек'], description: 'Восьмигранная чаша с подножником и каменной отделкой. Комплектацию печи и основания уточним при расчёте.', tag: 'Базовая модель' },
  { name: 'Чан с печью-подставкой', image: 'podstavka', category: 'Круглый чан', from: 274900, steel304: 319900, facts: ['Ø 200 × 150 см', '1,4 м³', '4–6 человек', 'Нагрев около 1 часа'], description: 'Печь встроена в основание; в каталоге указаны зольник и поддувало. Каменную отделку можно подобрать по образцам.', tag: 'Быстрый нагрев' },
  { name: 'Чан «Гранд»', image: 'grand', category: 'Круглый чан', from: 349900, steel304: 399900, facts: ['Ø 200 × 150 см', '1,4 м³', '4–6 человек', 'Нагрев около 1 часа'], description: 'Увеличенная печь-подставка и восьмигранная чаша с удобной посадкой — решение для частого отдыха на участке.' },
  { name: 'Чан «Кубок»', image: 'kubok', category: 'Круглый чан', from: 377200, steel304: 399900, facts: ['Ø 200 × 150 см', '1,7 м³', '4–6 человек', 'Нагрев 1,5–2 часа'], description: 'Модель с печью на водяной рубашке. В каталоге отмечены каменная отделка и небольшой расход дров.', tag: 'Популярная модель' },
  { name: 'Чан «Кубок Гранд»', image: 'kubok-grand', category: 'Круглый чан', from: 419900, steel304: 489900, facts: ['Ø 200 × 150 см', '1,7 м³', '4–6 человек', 'Нагрев 1,5–2 часа'], description: 'Расширенная комплектация модели «Кубок» с печью на водяной рубашке и каменной наружной отделкой.' },
  { name: 'Встраиваемый чан в террасу', image: 'terrace', category: 'Купель и терраса', from: 349900, steel304: 389900, facts: ['Ø 200 × 100 см', '1,4 м³', '4–6 человек', 'Нагрев 1,5–2 часа'], description: 'Чаша с низким бортом для интеграции в террасу. До заказа важно согласовать посадочное место и доступ к печи.' },
  { name: 'Ледяная купель', image: 'ice', category: 'Купель и терраса', from: 250000, facts: ['Компактный формат', 'Охлаждение — опция'], description: 'Купель для контрастных процедур. Охладительное оборудование и подключение рассчитываются отдельно.' },
  { name: 'Купель «Квадро»', image: 'quadra', category: 'Купель и терраса', from: 549900, steel304: 659900, facts: ['213 × 200 × 113 см', '1,4 м³', 'До 4–6 человек', 'Нагрев около 2 часов'], description: 'Прямоугольная чаша с наружной каменной отделкой, дровником и печью с водяным контуром.' },
  { name: 'Купель «Квадро XL»', image: 'quadra-xl', category: 'Купель и терраса', from: 664900, steel304: 799900, facts: ['213 × 240 × 113 см', '1,8 м³', 'До 6–8 человек', 'Нагрев около 2 часов'], description: 'Увеличенный прямоугольный формат для компании побольше. Можно дополнить утеплением, подсветкой и другими опциями.', tag: 'Увеличенный размер' }
];

const DOOR_FAQ = [
  ['Сколько стоят межкомнатные двери?', 'Стоимость зависит от выбранной коллекции, отделки, размера, коробки, наличников, фурнитуры и количества проёмов. Оставьте заявку — уточним комплектацию и подготовим расчёт.'],
  ['Можно заказать замер и установку?', 'Да, в заявке можно отметить замер, подбор комплекта или монтаж. Состав работ, выезд и стоимость согласуем после уточнения адреса и состояния проёмов.'],
  ['Какие размеры есть в каталоге?', 'В каталоге представлены стандартные полотна высотой около 2000 мм и шириной 600, 700, 800 или 900 мм. Возможность других размеров и конкретные параметры зависят от выбранной модели.'],
  ['Как выбрать дверь для ванной или кухни?', 'Сначала учитывают влажность, вентиляцию, нужную приватность и ширину проёма. Менеджер поможет подобрать покрытие, остекление, коробку и подходящую фурнитуру под помещение.']
];

const CHANY_FAQ = [
  ['От чего зависит цена банного чана?', 'На итог влияют марка стали, модель, отделка камнем, печь, лестница, крышка и дополнительные функции. В карточках приведены ориентиры из каталога; комплектацию и актуальную цену подтвердим перед заказом.'],
  ['Сколько места нужно для установки?', 'Для круглых моделей диаметром 200 см в каталоге указана площадка примерно 2 × 3 м. Нужно также предусмотреть безопасный проход, место для обслуживания печи и дымохода. Для террасы и купели планирование отличается.'],
  ['Из какой стали выбрать чашу?', 'В каталоге указаны варианты AISI 430 и AISI 304 с разной ценой. Подходящий вариант зависит от условий эксплуатации и комплектации; обсудим это при подборе.'],
  ['Можно установить чан в Пензе и области?', 'Оставьте адрес или населённый пункт в комментарии к заявке. Проверим логистику, возможность монтажа и стоимость доставки для конкретного места.'],
  ['Как долго нагревается чан?', 'Ориентиры из каталога: около часа для моделей с печью-подставкой и 1,5–2 часа для ряда моделей «Кубок» и купелей «Квадро». Реальное время зависит от погоды, объёма воды, дров и начальной температуры.']
];

function asset(apiBase: string, section: 'doors' | 'chany', name: string) {
  return `${apiBase}/api/assets/catalog/${section}/${name}.webp`;
}

function seoExcerpt(value: string, maxLength = 160) {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).replace(/\s+\S*$/, '').trim()}…`;
}

function writeCatalogSEO({ title, description, path, image, schema }: { title: string; description: string; path: string; image: string; schema: unknown }) {
  document.title = title;
  const setMeta = (key: string, content: string, property = false) => {
    const selector = property ? `meta[property="${key}"]` : `meta[name="${key}"]`;
    let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      if (property) tag.setAttribute('property', key); else tag.name = key;
      document.head.appendChild(tag);
    }
    tag.content = content;
  };
  setMeta('description', description);
  setMeta('og:title', title, true);
  setMeta('og:description', description, true);
  setMeta('og:type', 'website', true);
  setMeta('og:url', `${window.location.origin}${path}`, true);
  setMeta('og:image', `${window.location.origin}${image}`, true);
  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = `${window.location.origin}${path}`;
  document.getElementById('catalog-jsonld')?.remove();
  const script = document.createElement('script');
  script.id = 'catalog-jsonld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function CatalogLeadForm({
  apiBase, formatPhone, PrivacyConsent, section, options, initialSelection, sectionTitle
}: {
  apiBase: string;
  formatPhone: (value: string) => string;
  PrivacyConsent: ComponentType;
  section: 'doors' | 'chany';
  options: string[];
  initialSelection: string;
  sectionTitle: string;
}) {
  const [selection, setSelection] = useState(initialSelection);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => setSelection(initialSelection), [initialSelection]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Отправляем заявку…');
    const topic = section === 'doors' ? 'Каталог дверей — Evtenia' : 'Каталог банных чанов и купелей — Evtenia';
    const message = [`Интересует: ${selection || sectionTitle}`, details.trim() ? `Пожелания: ${details.trim()}` : '', `Раздел: ${sectionTitle}; консультация по подбору, комплектации и актуальной стоимости.`].filter(Boolean).join('\n');
    try {
      const response = await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message, sourceTitle: topic })
      });
      if (!response.ok) throw new Error('Не удалось отправить заявку. Попробуйте ещё раз.');
      setDone(true);
      setStatus('Спасибо! Заявка отправлена — мы свяжемся с вами и уточним детали.');
      setName('');
      setPhone('');
      setDetails('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось отправить заявку. Позвоните нам или попробуйте позже.');
    }
  };

  return (
    <form className="catalog-lead-form" onSubmit={submit}>
      <label>Что вас интересует?
        <select value={selection} onChange={(event) => setSelection(event.target.value)}>
          <option value="">Помогите выбрать</option>
          {options.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <div className="catalog-lead-form-row">
        <label>Ваше имя<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Как к вам обращаться" autoComplete="name" required /></label>
        <label>Телефон<input type="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} placeholder="+7 (___) ___-__-__" autoComplete="tel" required /></label>
      </div>
      <label>Комментарий <span className="catalog-optional">необязательно</span>
        <textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder={section === 'doors' ? 'Сколько проёмов, нужен ли замер или монтаж?' : 'Где планируете установить, нужна ли доставка или дополнительные опции?'} rows={3} />
      </label>
      <PrivacyConsent />
      <button type="submit" className="catalog-button" disabled={status.startsWith('Отправляем')}>
        {status.startsWith('Отправляем') ? 'Отправляем…' : section === 'doors' ? 'Запросить подбор и расчёт' : 'Запросить расчёт комплектации'}
      </button>
      <p className={`catalog-form-status${done ? ' is-success' : ''}`} role="status">{status}</p>
    </form>
  );
}

function CatalogBreadcrumb({ current }: { current: string }) {
  return <nav className="catalog-breadcrumb" aria-label="Хлебные крошки"><a href="/">Главная</a><span aria-hidden="true">/</span><span>{current}</span></nav>;
}

export function DoorsCatalogPage({ apiBase, Header, Footer, PrivacyConsent, formatPhone }: CatalogPageProps) {
  const [style, setStyle] = useState('Все коллекции');
  const [selected, setSelected] = useState('');
  const filters = ['Все коллекции', 'Современный стиль', 'Классика', 'Текстура дерева'];
  const visible = style === 'Все коллекции' ? DOORS : DOORS.filter((item) => item.style === style);
  const title = 'Межкомнатные двери в Пензе — каталог и цены | Evtenia';
  const description = 'Подбор межкомнатных дверей в Пензе и Пензенской области: коллекции, размеры, отделка, коробки, фурнитура и монтаж. Рассчитаем цену комплекта под ваши проёмы.';

  useEffect(() => {
    const faq = DOOR_FAQ.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }));
    writeCatalogSEO({
      title, description, path: '/dveri', image: asset(apiBase, 'doors', 'soul'),
      schema: {
        '@context': 'https://schema.org', '@graph': [
          { '@type': 'Service', name: 'Подбор и заказ межкомнатных дверей', serviceType: 'Подбор дверей, комплектации и монтажа', areaServed: ['Пенза', 'Пензенская область'], provider: { '@type': 'Organization', name: 'Evtenia', url: 'https://dom.evtenia.ru/' }, url: 'https://dom.evtenia.ru/dveri' },
          { '@type': 'ItemList', name: 'Коллекции межкомнатных дверей', itemListElement: DOORS.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, url: `https://dom.evtenia.ru/dveri/${item.slug}`, image: `https://dom.evtenia.ru/api/assets/catalog/doors/${item.image}.webp`, description: item.description })) },
          { '@type': 'FAQPage', mainEntity: faq }
        ]
      }
    });
  }, [apiBase]);

  const requestSelection = (collection: string) => {
    setSelected(collection);
    document.getElementById('doors-request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="catalog-page doors-catalog">
      <Header />
      <main>
        <section className="catalog-hero">
          <div className="catalog-container">
            <CatalogBreadcrumb current="Двери" />
            <div className="catalog-hero-grid">
              <div className="catalog-hero-copy">
                <span className="catalog-eyebrow">Подбор • комплектация • установка</span>
                <h1>Межкомнатные двери, которые подходят вашему дому</h1>
                <p>Поможем выбрать модель, покрытие и фурнитуру, проверить размеры проёмов и собрать полный комплект. Работаем с заказами в Пензе и Пензенской области.</p>
                <div className="catalog-hero-actions"><a className="catalog-button" href="#doors-request">Подобрать двери</a><a className="catalog-text-link" href="#door-collections">Смотреть коллекции <span aria-hidden="true">↓</span></a></div>
                <ul className="catalog-proof-list"><li>Подбор под интерьер и бюджет</li><li>Расчёт с коробками и наличниками</li><li>Замер и монтаж — по запросу</li><li>Стоимость — по комплектации</li></ul>
              </div>
              <figure className="catalog-hero-photo"><img src={asset(apiBase, 'doors', 'soul')} alt="Светлая межкомнатная дверь в современном интерьере" width="1000" height="1400" fetchPriority="high" /><figcaption>Подберём полотно, отделку и комплектующие как единое решение</figcaption></figure>
            </div>
          </div>
        </section>

        <section id="door-collections" className="catalog-section">
          <div className="catalog-container">
            <div className="catalog-section-heading"><div><span className="catalog-eyebrow">Каталог</span><h2>Коллекции межкомнатных дверей</h2></div><p>В каталоге — современные гладкие полотна, модели с рельефом и варианты с древесной фактурой. Наличие, цвета и исполнения проверим под ваш запрос.</p></div>
            <div className="catalog-filter-row" role="group" aria-label="Фильтр коллекций">
              {filters.map((item) => <button type="button" key={item} className={style === item ? 'is-active' : ''} onClick={() => setStyle(item)}>{item}</button>)}
            </div>
            <div className="catalog-door-grid">
              {visible.map((item) => <article className="catalog-door-card" key={item.name}>
                <img className={item.productCutout ? 'product-cutout' : ''} src={asset(apiBase, 'doors', item.image)} alt={`Межкомнатная дверь коллекции «${item.name}»`} loading="lazy" width="700" height="1000" />
                <div className="catalog-door-card-copy"><span>{item.style}</span><h3><a href={`/dveri/${item.slug}`}>{item.name}</a></h3><p>{item.description}</p><a className="door-collection-link" href={`/dveri/${item.slug}`}>Смотреть коллекцию <span aria-hidden="true">→</span></a><button type="button" onClick={() => requestSelection(item.name)}>Запросить комплектацию</button></div>
              </article>)}
            </div>
            <p className="catalog-disclaimer">Фотографии показывают варианты исполнения. Оттенок покрытия на экране может отличаться; окончательный выбор делаем по образцам и доступным вариантам выбранной коллекции.</p>
          </div>
        </section>

        <section className="catalog-section catalog-section-muted">
          <div className="catalog-container">
            <div className="catalog-section-heading"><div><span className="catalog-eyebrow">Без сюрпризов в смете</span><h2>Что входит в заказ двери</h2></div><p>Одного дверного полотна обычно недостаточно: чтобы проём выглядел завершённым и дверь работала корректно, заранее учитываем весь комплект.</p></div>
            <div className="catalog-check-grid">
              <article><b>01</b><h3>Полотно и размеры</h3><p>Сверим ширину, высоту, сторону открывания и толщину стены. В каталоге есть стандартные полотна 600–900 мм шириной и около 2000 мм высотой; размеры уточняем для каждой модели.</p></article>
              <article><b>02</b><h3>Коробка и наличники</h3><p>Подберём дверную коробку, доборные элементы для широкой стены и наличники. Телескопические комплектующие помогают аккуратно оформить примыкания.</p></article>
              <article><b>03</b><h3>Стекло и покрытие</h3><p>Обсудим глухое полотно или остекление, оттенок, фактуру и уход. Для ванной отдельно учтём влажность и вентиляцию помещения.</p></article>
              <article><b>04</b><h3>Фурнитура и монтаж</h3><p>Петли, ручка, защёлка и установка влияют на итоговую стоимость. Добавим в расчёт нужный состав работ и заранее согласуем его с вами.</p></article>
            </div>
          </div>
        </section>

        <section className="catalog-section">
          <div className="catalog-container catalog-process-wrap">
            <div><span className="catalog-eyebrow">Понятный процесс</span><h2>От выбора коллекции до аккуратного монтажа</h2><p>Сначала разбираемся в проёмах и задаче, затем фиксируем состав заказа. Вы понимаете, что включено в расчёт, до подтверждения покупки.</p><a className="catalog-button" href="#doors-request">Получить консультацию</a></div>
            <ol className="catalog-process-list"><li><b>1</b><div><h3>Расскажите, что нужно</h3><p>Можно выбрать коллекцию или начать с фото интерьера и примерного количества дверей.</p></div></li><li><b>2</b><div><h3>Уточним размеры и комплект</h3><p>Проверим проёмы, коробки, наличники, фурнитуру, замер и возможный монтаж.</p></div></li><li><b>3</b><div><h3>Подготовим расчёт</h3><p>Согласуем доступные варианты, актуальные цены, сроки поставки и работ.</p></div></li><li><b>4</b><div><h3>Оформим заказ</h3><p>После согласования комплектации подтвердим заказ и согласуем удобный график.</p></div></li></ol>
          </div>
        </section>

        <section className="catalog-section catalog-faq-section">
          <div className="catalog-container"><span className="catalog-eyebrow">Частые вопросы</span><h2>Перед выбором дверей</h2><div className="catalog-faq-grid">{DOOR_FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div>
        </section>

        <section id="doors-request" className="catalog-request-section">
          <div className="catalog-container catalog-request-grid">
            <div><span className="catalog-eyebrow">Заявка на подбор</span><h2>Поможем собрать комплект дверей под ваши проёмы</h2><p>Оставьте телефон и выберите коллекцию или вариант помощи. Менеджер Evtenia уточнит количество дверей, комплектацию и удобный следующий шаг.</p><div className="catalog-phone-card"><span>Можно позвонить напрямую</span><a href="tel:+79022090179">8 902 209-01-79</a><small>Ежедневно с 9:00 до 19:00</small></div></div>
            <CatalogLeadForm key={selected} apiBase={apiBase} formatPhone={formatPhone} PrivacyConsent={PrivacyConsent} section="doors" sectionTitle="Двери" options={DOORS.map((item) => item.name).concat(['Замер и подбор комплекта', 'Монтаж межкомнатных дверей'])} initialSelection={selected} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export function DoorCollectionPage({ slug, apiBase, Header, Footer, PrivacyConsent, formatPhone }: CatalogPageProps & { slug: string }) {
  const collection = DOORS.find((item) => item.slug === slug);
  const [selected, setSelected] = useState(collection?.name || '');
  const title = collection ? `Двери «${collection.name}» в Пензе — коллекция | Evtenia` : 'Коллекция дверей не найдена — Evtenia';
  const description = collection ? seoExcerpt(`${collection.description} Каталог и подбор в Пензе; замер и расчёт заказа.`) : 'Запрошенная коллекция дверей не найдена. Посмотрите каталог межкомнатных дверей Evtenia.';

  useEffect(() => {
    if (!collection) return;
    writeCatalogSEO({
      title,
      description,
      path: `/dveri/${collection.slug}`,
      image: `/api/assets/catalog/doors/${collection.image}.webp`,
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'CollectionPage', name: `Коллекция дверей «${collection.name}»`, description, url: `https://dom.evtenia.ru/dveri/${collection.slug}`, image: `https://dom.evtenia.ru/api/assets/catalog/doors/${collection.image}.webp`, mainEntity: { '@type': 'ItemList', itemListElement: (collection.models || []).map((name, index) => ({ '@type': 'ListItem', position: index + 1, name })) } },
          { '@type': 'Service', name: `Подбор дверей коллекции «${collection.name}»`, areaServed: ['Пенза', 'Пензенская область'], provider: { '@type': 'Organization', name: 'Evtenia', url: 'https://dom.evtenia.ru/' } }
        ]
      }
    });
  }, [apiBase, collection, description, title]);

  if (!collection) return <div className="catalog-page doors-catalog"><Header /><main className="catalog-container page-not-found"><p>404 · Коллекция не найдена</p><h1>Такой коллекции нет в каталоге</h1><a href="/dveri">Посмотреть все двери</a></main><Footer /></div>;

  const images = collection.images?.length ? collection.images : [collection.image];
  const chooseModel = (model: string) => {
    setSelected(model);
    document.getElementById('door-detail-request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="catalog-page doors-catalog door-collection-page">
      <Header />
      <main>
        <section className="catalog-hero door-collection-hero">
          <div className="catalog-container">
            <CatalogBreadcrumb current={collection.name} />
            <div className="door-collection-hero-grid">
              <div>
                <span className="catalog-eyebrow">Коллекция межкомнатных дверей</span>
                <h1>Двери «{collection.name}» в Пензе</h1>
                <p>{collection.description}</p>
                <p>Поможем сверить размеры проёмов, подобрать покрытие и собрать комплект с коробкой, наличниками и фурнитурой. Итоговую стоимость и сроки подтвердим после выбора конкретной модели и параметров объекта.</p>
                <a className="catalog-button" href="#door-detail-request">Узнать стоимость и наличие</a>
              </div>
              <img className={collection.productCutout ? 'product-cutout' : ''} src={asset(apiBase, 'doors', collection.image)} alt={`Межкомнатная дверь коллекции «${collection.name}»`} width="860" height="860" fetchPriority="high" />
            </div>
          </div>
        </section>

        <section className="catalog-section">
          <div className="catalog-container">
            <div className="catalog-section-heading"><div><span className="catalog-eyebrow">Варианты исполнения</span><h2>Модели коллекции «{collection.name}»</h2></div><p>Внешний вид и оттенок на экране могут отличаться от образца. Уточним доступные исполнения, размеры и комплектующие перед заказом.</p></div>
            <div className="door-model-grid">
              {images.map((image, index) => {
                const model = collection.models?.[index] || `Вариант ${index + 1}`;
                return <article className="door-model-card" key={image}><img src={asset(apiBase, 'doors', image)} alt={`Межкомнатная дверь «${collection.name}», модель ${model}`} loading={index === 0 ? 'eager' : 'lazy'} width="860" height="860" /><div><span>{collection.name}</span><h3>{model}</h3><button type="button" onClick={() => chooseModel(`${collection.name} — ${model}`)}>Запросить цену и наличие</button></div></article>;
              })}
            </div>
          </div>
        </section>

        <section className="catalog-section catalog-section-muted">
          <div className="catalog-container">
            <div className="catalog-section-heading"><div><span className="catalog-eyebrow">Комплектация</span><h2>Учтём не только полотно</h2></div><p>Проверим проём и согласуем комплект, чтобы после доставки не пришлось отдельно искать подходящие детали.</p></div>
            <div className="catalog-check-grid"><article><b>01</b><h3>Замер проёма</h3><p>Сверим ширину, высоту, толщину стены и сторону открывания. Замер согласуем отдельно.</p></article><article><b>02</b><h3>Коробка и наличники</h3><p>Подберём комплектующие под толщину стены и способ оформления проёма.</p></article><article><b>03</b><h3>Отделка и фурнитура</h3><p>Уточним доступные цвета и варианты стекла, ручек, петель и защёлок.</p></article><article><b>04</b><h3>Доставка и установка</h3><p>Проверим доступность доставки и монтажа в Пензе или вашем населённом пункте области.</p></article></div>
            <p className="catalog-disclaimer">Ориентир по размерному ряду из каталога — ширина 600, 700, 800 или 900 мм и высота 2000 мм; фактические размеры и доступность проверяются для выбранной модели. Цена зависит от комплекта и работ.</p>
          </div>
        </section>

        <section id="door-detail-request" className="catalog-request-section">
          <div className="catalog-container catalog-request-grid">
            <div><span className="catalog-eyebrow">Расчёт заказа</span><h2>Подберём двери «{collection.name}» под ваши проёмы</h2><p>Оставьте телефон и нужную модель. Специалист Evtenia уточнит размеры, варианты комплектации, актуальную цену и следующий шаг.</p><div className="catalog-phone-card"><span>Можно позвонить напрямую</span><a href="tel:+79022090179">8 902 209-01-79</a><small>Ежедневно с 9:00 до 19:00</small></div></div>
            <CatalogLeadForm key={selected} apiBase={apiBase} formatPhone={formatPhone} PrivacyConsent={PrivacyConsent} section="doors" sectionTitle={`Двери — ${collection.name}`} options={[collection.name, ...(collection.models || []), 'Замер и подбор комплекта', 'Монтаж межкомнатных дверей']} initialSelection={selected} />
          </div>
        </section>

        <section className="catalog-section door-other-collections"><div className="catalog-container"><span className="catalog-eyebrow">Ещё в каталоге</span><h2>Посмотрите другие коллекции</h2><div>{DOORS.filter((item) => item.slug !== collection.slug).map((item) => <a key={item.slug} href={`/dveri/${item.slug}`}>{item.name}<span aria-hidden="true">→</span></a>)}</div></div></section>
      </main>
      <Footer />
    </div>
  );
}

const doorMoney = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

export function ChanyCatalogPage({ apiBase, Header, Footer, PrivacyConsent, formatPhone }: CatalogPageProps) {
  const [category, setCategory] = useState('Все модели');
  const [selected, setSelected] = useState('');
  const filters = ['Все модели', 'Круглые чаны', 'Купели и терраса'];
  const visible = category === 'Все модели' ? CHANY : CHANY.filter((item) => item.category === (category === 'Круглые чаны' ? 'Круглый чан' : 'Купель и терраса'));
  const title = 'Банные чаны в Пензе — модели и цены | Evtenia';
  const description = 'Банные чаны и купели для дачи в Пензе и области: модели от 250 000 ₽, комплектации, сталь, доставка и монтаж. Подбор и расчёт от Evtenia.';
  const extraOptions = [
    ['Лестница', 24900], ['Лестница из нержавеющей стали', 49900], ['Подсветка / хромотерапия', 29900], ['Стол в центр чана', 19900], ['Боковой стол', 19900], ['Термокрышка', 29900], ['Механический термометр', 3900], ['Электронный термометр', 14900], ['Дымоход 3 м', 6900], ['Сэндвич-дымоход', 9900], ['Стеклянная дверца', 9900], ['Защита дымохода', 4900], ['Аэромассаж', 49900], ['Покраска чана по RAL', 4900]
  ] as const;

  useEffect(() => {
    const faq = CHANY_FAQ.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }));
    writeCatalogSEO({
      title, description, path: '/chany', image: asset(apiBase, 'chany', 'ready-4'),
      schema: {
        '@context': 'https://schema.org', '@graph': [
          { '@type': 'Service', name: 'Подбор банного чана или купели', serviceType: 'Подбор комплектации, заказа и установки банного чана', areaServed: ['Пенза', 'Пензенская область'], provider: { '@type': 'Organization', name: 'Evtenia', url: 'https://dom.evtenia.ru/' }, url: 'https://dom.evtenia.ru/chany' },
          { '@type': 'ItemList', name: 'Банные чаны и купели — ориентировочные цены', itemListElement: CHANY.map((item, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'Product', name: item.name, image: `https://dom.evtenia.ru/api/assets/catalog/chany/${item.image}.webp`, description: item.description, offers: { '@type': 'AggregateOffer', priceCurrency: 'RUB', lowPrice: item.from, highPrice: item.steel304 || item.from, offerCount: item.steel304 ? 2 : 1 } } })) },
          { '@type': 'FAQPage', mainEntity: faq }
        ]
      }
    });
  }, [apiBase]);

  const requestSelection = (model: string) => {
    setSelected(model);
    document.getElementById('chany-request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="catalog-page chany-catalog">
      <Header />
      <main>
        <section className="catalog-hero chany-hero">
          <div className="catalog-container">
            <CatalogBreadcrumb current="Банные чаны и купели" />
            <div className="catalog-hero-grid">
              <div className="catalog-hero-copy">
                <span className="catalog-eyebrow">Для дома • дачи • загородной террасы</span>
                <h1>Банный чан для отдыха круглый год</h1>
                <p>Подберём модель по размеру участка, числу гостей и способу нагрева. В каталоге — круглые банные чаны, террасные решения и купели с ориентировочной стоимостью.</p>
                <div className="catalog-hero-actions"><a className="catalog-button" href="#chany-request">Подобрать чан</a><a className="catalog-text-link" href="#chany-models">Сравнить модели <span aria-hidden="true">↓</span></a></div>
                <ul className="catalog-proof-list"><li>Модели на 4–8 человек</li><li>Варианты стали AISI 430 и AISI 304</li><li>Доставка и монтаж — уточним по адресу</li></ul>
                <small className="catalog-price-note">Цены ориентировочные, по каталогу сентября 2026 года. Перед заказом уточним наличие, комплектацию и актуальную стоимость.</small>
              </div>
              <figure className="catalog-hero-photo chany-hero-photo"><img src={asset(apiBase, 'chany', 'ready-4')} alt="Банный чан с печью и каменной отделкой на загородном участке" width="1200" height="900" fetchPriority="high" /><figcaption>Подбор модели начинается с места установки, доступа и удобной посадки</figcaption></figure>
            </div>
          </div>
        </section>

        <section id="chany-models" className="catalog-section">
          <div className="catalog-container">
            <div className="catalog-section-heading"><div><span className="catalog-eyebrow">Каталог моделей</span><h2>Выберите формат отдыха</h2></div><p>Цены указаны как стартовый ориентир для двух вариантов стали из каталога. Цвет камня, печь, опции, доставка и монтаж меняют итоговую смету.</p></div>
            <div className="catalog-filter-row" role="group" aria-label="Фильтр моделей чанов">
              {filters.map((item) => <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <div className="catalog-chany-grid">
              {visible.map((item) => <article className="catalog-chany-card" key={item.name}>
                <div className="catalog-chany-image"><img src={asset(apiBase, 'chany', item.image)} alt={`${item.name} — вариант из каталога банных чанов`} loading="lazy" width="900" height="700" />{item.tag ? <span>{item.tag}</span> : null}</div>
                <div className="catalog-chany-card-copy"><div className="catalog-chany-title"><h3>{item.name}</h3><span>от {doorMoney(item.from)}</span></div><p>{item.description}</p><ul>{item.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul><div className="catalog-steel-prices">{item.steel304 ? <><span>AISI 430 <b>{doorMoney(item.from)}</b></span><span>AISI 304 <b>{doorMoney(item.steel304)}</b></span></> : <><span>Базовый ориентир <b>от {doorMoney(item.from)}</b></span><span>Оборудование <b>по запросу</b></span></>}</div><button type="button" onClick={() => requestSelection(item.name)}>Рассчитать эту модель <span aria-hidden="true">→</span></button></div>
              </article>)}
            </div>
            <p className="catalog-disclaimer">Ориентиры по базовым комплектациям указаны по каталогу, предоставленному Evtenia. Фактическая стоимость на дату заказа подтверждается менеджером; финальная смета зависит от марки стали, отделки, опций и логистики.</p>
          </div>
        </section>

        <section className="catalog-section catalog-section-muted">
          <div className="catalog-container">
            <div className="catalog-section-heading"><div><span className="catalog-eyebrow">Комплектация</span><h2>Соберите чан под себя</h2></div><p>Ниже — ориентиры на популярные дополнительные опции из каталога. Добавим нужное к выбранной модели и отдельно проверим актуальную цену.</p></div>
            <div className="catalog-options-grid">{extraOptions.map(([name, price]) => <div key={name}><span>{name}</span><b>от {doorMoney(price)}</b></div>)}</div>
            <div className="catalog-stone-note"><div><span className="catalog-eyebrow">Внешний вид</span><h3>Отделка под участок и террасу</h3><p>Варианты каменной отделки в каталоге: «Морской бриз», «Антарктида», «Чёрный жемчуг», «Терракот», «Black &amp; White», «Коралл», «Авокадо», «Уральские горы», «Песчаный пляж» и «Голубой океан». Посмотрите образцы и подтвердите доступность нужного цвета перед заказом.</p><a href="#chany-request">Подобрать отделку →</a></div><div className="catalog-stone-gallery"><img src={asset(apiBase, 'chany', 'ready-1')} alt="Вариант каменной отделки и оформление зоны отдыха у чана" loading="lazy" /><img src={asset(apiBase, 'chany', 'ready-5')} alt="Каменная мозаика чаши крупным планом" loading="lazy" /></div></div>
          </div>
        </section>

        <section className="catalog-section">
          <div className="catalog-container catalog-process-wrap">
            <div><span className="catalog-eyebrow">Установка в Пензе и области</span><h2>Заранее проверим, подойдёт ли место</h2><p>Круглой модели диаметром 200 см в каталоге требуется площадка ориентировочно 2 × 3 м. Дополнительно учитываем проход, основание, безопасное расстояние для печи и вывод дымохода.</p><p>Для террасного монтажа, ледяной купели, подключения электрического или газового оборудования предварительно сверяем проект, коммуникации и техническую возможность.</p><a className="catalog-button" href="#chany-request">Обсудить площадку</a></div>
            <ol className="catalog-process-list"><li><b>1</b><div><h3>Выбираем назначение</h3><p>Семейный отдых, банная зона, терраса или контрастные процедуры — от этого зависит тип чаши.</p></div></li><li><b>2</b><div><h3>Сверяем размеры и доступ</h3><p>Учитываем габариты изделия, путь доставки, место для печи, лестницы и обслуживания.</p></div></li><li><b>3</b><div><h3>Согласуем комплектацию</h3><p>Подбираем сталь, цвет отделки, крышку, дымоход, подсветку и другие полезные опции.</p></div></li><li><b>4</b><div><h3>Подтверждаем цену и сроки</h3><p>Рассчитываем доставку и монтаж для вашего населённого пункта до оформления заказа.</p></div></li></ol>
          </div>
        </section>

        <section className="catalog-section catalog-gallery-section">
          <div className="catalog-container"><div className="catalog-section-heading"><div><span className="catalog-eyebrow">Примеры исполнения</span><h2>Как может выглядеть зона отдыха</h2></div><p>Фотографии из каталога показывают варианты оформления и обустройства. Конкретный вид соберём из доступных моделей, отделки и опций.</p></div><div className="catalog-real-photo-grid">{[
            ['ready-1', 'Зона отдыха с каменной отделкой и печью'], ['ready-3', 'Уличный очаг и зона отдыха в каменном оформлении'], ['ready-4', 'Террасное решение с наружным дымоходом']
          ].map(([image, alt]) => <figure key={image}><img src={asset(apiBase, 'chany', image)} alt={alt} loading="lazy" /><figcaption>{alt}</figcaption></figure>)}</div></div>
        </section>

        <section className="catalog-section catalog-faq-section">
          <div className="catalog-container"><span className="catalog-eyebrow">Частые вопросы</span><h2>Что важно знать о чанах</h2><div className="catalog-faq-grid">{CHANY_FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div>
        </section>

        <section id="chany-request" className="catalog-request-section">
          <div className="catalog-container catalog-request-grid">
            <div><span className="catalog-eyebrow">Подбор и расчёт</span><h2>Поможем выбрать чан и учесть нужные опции</h2><p>Укажите модель или задачу. Мы уточним населённый пункт, условия установки и состав комплектации, а затем вернёмся с расчётом.</p><div className="catalog-phone-card"><span>Можно позвонить напрямую</span><a href="tel:+79022090179">8 902 209-01-79</a><small>Ежедневно с 9:00 до 19:00</small></div></div>
            <CatalogLeadForm apiBase={apiBase} formatPhone={formatPhone} PrivacyConsent={PrivacyConsent} section="chany" sectionTitle="Банные чаны и купели" options={CHANY.map((item) => item.name).concat(['Не знаю, нужна помощь с выбором'])} initialSelection={selected} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
