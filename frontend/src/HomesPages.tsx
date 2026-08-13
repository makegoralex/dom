import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import './homes.css';

export type HouseMarketType = 'new' | 'secondary';

export type HouseListing = {
  id: string;
  title: string;
  marketType: HouseMarketType;
  area: string;
  landArea: string;
  price: string;
  district: string;
  address: string;
  floors: string;
  bedrooms: string;
  yearBuilt: string;
  description: string;
  images: string[];
};

type SharedProps = {
  apiBase: string;
  Header: React.ComponentType;
  Footer: React.ComponentType;
  LeadModal: React.ComponentType<any>;
  formatPhone: (value: string) => string;
  resolveMedia: (value: string) => string;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85';
const MARKET_LABELS: Record<HouseMarketType, string> = { new: 'Новый дом', secondary: 'Вторичное жильё' };
const parseNumber = (value: string) => Number(String(value || '').replace(/[^\d]/g, '') || 0);

function declension(count: number, forms: [string, string, string]) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

async function compressPhoto(file: File, index: number) {
  if (!file.type.startsWith('image/')) throw new Error(`Файл «${file.name}» не является изображением.`);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new Image();
    const url = URL.createObjectURL(file);
    node.onload = () => { URL.revokeObjectURL(url); resolve(node); };
    node.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Не удалось прочитать «${file.name}».`)); };
    node.src = url;
  });
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Не удалось подготовить фотографию.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', .82));
  if (!blob) throw new Error('Не удалось подготовить фотографию.');
  return new File([blob], `home-${index + 1}.jpg`, { type: 'image/jpeg' });
}

function HouseGallery({ home, resolveMedia }: { home: HouseListing; resolveMedia: (value: string) => string }) {
  const images = home.images?.length ? home.images : [FALLBACK_IMAGE];
  const [active, setActive] = useState(0);
  return (
    <div className="home-gallery">
      <img src={resolveMedia(images[active] || FALLBACK_IMAGE)} alt={`${home.title}, фото ${active + 1}`} />
      <span className={`home-market-badge ${home.marketType}`}>{MARKET_LABELS[home.marketType]}</span>
      <span className="home-photo-count">▧ {images.length}</span>
      {images.length > 1 ? <div className="home-gallery-controls"><button type="button" onClick={() => setActive((active - 1 + images.length) % images.length)}>←</button><button type="button" onClick={() => setActive((active + 1) % images.length)}>→</button></div> : null}
    </div>
  );
}

export function HomesPage({ apiBase, Header, Footer, LeadModal, formatPhone, resolveMedia }: SharedProps) {
  const [homes, setHomes] = useState<HouseListing[]>([]);
  const [market, setMarket] = useState<'all' | HouseMarketType>('all');
  const [district, setDistrict] = useState('Все районы');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [floors, setFloors] = useState('Все');
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState({ sellerName: '', sellerPhone: '', title: '', marketType: 'secondary' as HouseMarketType, area: '', landArea: '', price: '', district: '', address: '', floors: '', bedrooms: '', yearBuilt: '', description: '' });

  useEffect(() => {
    document.title = 'Готовые дома в Пензе — Evtenia';
    fetch(`${apiBase}/api/homes`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setHomes(Array.isArray(data) ? data : [])).catch(() => setHomes([]));
  }, [apiBase]);

  useEffect(() => {
    if (!sellOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSellOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [sellOpen]);

  const districts = useMemo(() => ['Все районы', ...Array.from(new Set(homes.map((home) => home.district).filter(Boolean)))], [homes]);
  const floorOptions = useMemo(() => ['Все', ...Array.from(new Set(homes.map((home) => home.floors).filter(Boolean)))], [homes]);
  const filtered = useMemo(() => homes.filter((home) => {
    const price = parseNumber(home.price);
    return (market === 'all' || home.marketType === market)
      && (district === 'Все районы' || home.district === district)
      && (!minPrice || price >= Number(minPrice))
      && (!maxPrice || price <= Number(maxPrice))
      && (!minArea || parseNumber(home.area) >= Number(minArea))
      && (floors === 'Все' || home.floors === floors);
  }).sort((left, right) => sort === 'price-asc' ? parseNumber(left.price) - parseNumber(right.price) : sort === 'price-desc' ? parseNumber(right.price) - parseNumber(left.price) : 0), [homes, market, district, minPrice, maxPrice, minArea, floors, sort]);

  const reset = () => { setMarket('all'); setDistrict('Все районы'); setMinPrice(''); setMaxPrice(''); setMinArea(''); setFloors('Все'); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus('Подготавливаем фотографии…');
    try {
      if (!photos.length) throw new Error('Добавьте хотя бы одну фотографию дома.');
      if (photos.length > 10) throw new Error('Можно добавить не более 10 фотографий.');
      const prepared = await Promise.all(photos.map(compressPhoto));
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      prepared.forEach((photo) => data.append('images', photo));
      setStatus('Отправляем заявку…');
      const response = await fetch(`${apiBase}/api/home-submissions`, { method: 'POST', body: data });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Не удалось отправить заявку.');
      setStatus('Дом отправлен на модерацию. Мы свяжемся с вами после проверки.');
      setPhotos([]);
      setForm({ sellerName: '', sellerPhone: '', title: '', marketType: 'secondary', area: '', landArea: '', price: '', district: '', address: '', floors: '', bedrooms: '', yearBuilt: '', description: '' });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось отправить заявку.');
    } finally { setSubmitting(false); }
  };

  return <div className="homes-page">
    <Header />
    <main className="internal-body">
      <div className="container">
        <div className="homes-breadcrumbs"><a href="/">Главная</a><span>•</span><span>Готовые дома</span></div>
        <section className="homes-hero">
          <div><span className="homes-eyebrow">Недвижимость от Evtenia</span><h1>Готовые дома для жизни</h1><p>Новые дома от застройщиков и проверенное вторичное жильё в Пензе и области. Поможем с просмотром, документами и ипотекой.</p><div className="homes-hero-actions"><a href="#homes-catalog">Выбрать дом</a><button type="button" onClick={() => setSellOpen(true)}>Предложить свой дом</button></div></div>
          <div className="homes-hero-card"><strong>{homes.length}</strong><span>{declension(homes.length, ['дом', 'дома', 'домов'])} в продаже</span><small>Все объявления проходят модерацию</small></div>
        </section>

        <section className="homes-catalog" id="homes-catalog">
          <div className="homes-heading"><div><span>Каталог недвижимости</span><h2>Найдите свой дом</h2></div><button type="button" onClick={() => setSelectionOpen(true)}>Помочь с выбором</button></div>
          <div className="homes-market-tabs" role="group" aria-label="Тип жилья">
            <button className={market === 'all' ? 'active' : ''} onClick={() => setMarket('all')}>Все дома</button>
            <button className={market === 'new' ? 'active' : ''} onClick={() => setMarket('new')}>Новые</button>
            <button className={market === 'secondary' ? 'active' : ''} onClick={() => setMarket('secondary')}>Вторичное жильё</button>
          </div>
          <div className="homes-layout">
            <aside className="homes-filters">
              <div className="homes-filter-title"><h3>Фильтры</h3><button type="button" onClick={reset}>Сбросить</button></div>
              <label>Район<select value={district} onChange={(event) => setDistrict(event.target.value)}>{districts.map((item) => <option key={item}>{item}</option>)}</select></label>
              <fieldset><legend>Цена, ₽</legend><div className="homes-paired-inputs"><input inputMode="numeric" placeholder="от" value={minPrice} onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ''))} /><input inputMode="numeric" placeholder="до" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ''))} /></div></fieldset>
              <label>Площадь дома от, м²<input inputMode="numeric" placeholder="например, 100" value={minArea} onChange={(event) => setMinArea(event.target.value.replace(/\D/g, ''))} /></label>
              <label>Этажность<select value={floors} onChange={(event) => setFloors(event.target.value)}>{floorOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <div className="homes-filter-note"><strong>Нужен особый вариант?</strong><p>Расскажите о пожеланиях — подберём дом из открытой и закрытой базы.</p><button type="button" onClick={() => setSelectionOpen(true)}>Оставить заявку</button></div>
            </aside>
            <div className="homes-results">
              <div className="homes-toolbar"><p>Найдено <strong>{filtered.length} {declension(filtered.length, ['объявление', 'объявления', 'объявлений'])}</strong></p><select aria-label="Сортировка" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="default">Сначала актуальные</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option></select></div>
              <div className="homes-grid">{filtered.map((home) => <article className="home-card" key={home.id}><a href={`/homes/${encodeURIComponent(home.id)}`}><HouseGallery home={home} resolveMedia={resolveMedia} /></a><div className="home-card-body"><div className="home-card-meta"><span>{home.area}</span><span>{home.landArea}</span><span>{home.floors}</span></div><h3><a href={`/homes/${encodeURIComponent(home.id)}`}>{home.title}</a></h3><p className="home-address">⌖ {home.address || home.district}</p><strong className="home-price">{home.price}</strong><a className="home-card-link" href={`/homes/${encodeURIComponent(home.id)}`}>Подробнее о доме <span>→</span></a></div></article>)}</div>
              {!filtered.length ? <div className="homes-empty"><h3>Подходящих домов пока нет</h3><p>Измените параметры или оставьте заявку — мы найдём варианты под ваш запрос.</p><button type="button" onClick={reset}>Сбросить фильтры</button></div> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer />
    <LeadModal open={selectionOpen} onClose={() => setSelectionOpen(false)} title="Подобрать готовый дом" promoText="Учтём бюджет, район и пожелания к дому" messagePrefix="Заявка на подбор готового дома" sourceTitle="Подбор готового дома" />
    {sellOpen ? <div className="modal-backdrop" onMouseDown={() => setSellOpen(false)}><div className="modal-card sell-home-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="modal-card-header"><div><span>Публикация бесплатна</span><h3>Предложить свой дом</h3></div><button className="modal-close-button" type="button" onClick={() => setSellOpen(false)}>×</button></div><form className="sell-home-form" onSubmit={submit}>
      <label>Ваше имя<input required value={form.sellerName} onChange={(event) => setForm({ ...form, sellerName: event.target.value })} /></label><label>Телефон<input required type="tel" placeholder="+7 (___) ___-__-__" value={form.sellerPhone} onChange={(event) => setForm({ ...form, sellerPhone: formatPhone(event.target.value) })} /></label>
      <label className="sell-home-wide">Название объявления<input required placeholder="Дом с ремонтом в Арбеково" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Тип жилья<select value={form.marketType} onChange={(event) => setForm({ ...form, marketType: event.target.value as HouseMarketType })}><option value="new">Новый дом</option><option value="secondary">Вторичное жильё</option></select></label><label>Площадь дома<input required placeholder="120 м²" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /></label><label>Площадь участка<input required placeholder="8 соток" value={form.landArea} onChange={(event) => setForm({ ...form, landArea: event.target.value })} /></label><label>Цена<input required placeholder="8 900 000 ₽" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Район<input required value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></label><label>Адрес<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label><label>Этажность<input placeholder="2 этажа" value={form.floors} onChange={(event) => setForm({ ...form, floors: event.target.value })} /></label><label>Спальни<input placeholder="3 спальни" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} /></label><label>Год постройки<input inputMode="numeric" value={form.yearBuilt} onChange={(event) => setForm({ ...form, yearBuilt: event.target.value })} /></label><label className="sell-home-wide">Описание<textarea required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="sell-home-wide sell-home-photos">Фотографии дома<input required multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhotos(Array.from(event.target.files || []))} /><small>{photos.length ? `Выбрано: ${photos.length} фото` : 'От 1 до 10 фотографий'}</small></label><p className="sell-home-consent">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</p><button className="sell-home-submit" disabled={submitting}>{submitting ? 'Отправляем…' : 'Отправить на модерацию'}</button>{status ? <p className="sell-home-status" role="status">{status}</p> : null}
    </form></div></div> : null}
  </div>;
}

export function HomeDetailPage({ apiBase, Header, Footer, LeadModal, resolveMedia }: SharedProps) {
  const id = decodeURIComponent(window.location.pathname.replace('/homes/', ''));
  const [home, setHome] = useState<HouseListing | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  useEffect(() => { fetch(`${apiBase}/api/homes/${encodeURIComponent(id)}`).then((response) => response.ok ? response.json() : Promise.reject()).then(setHome).catch(() => setNotFound(true)); }, [apiBase, id]);
  useEffect(() => { if (home) document.title = `${home.title} — ${home.price} | Evtenia`; }, [home]);
  if (notFound) return <><Header /><main className="internal-body"><div className="container homes-not-found"><h1>Дом не найден</h1><a href="/homes">Вернуться в каталог</a></div></main><Footer /></>;
  if (!home) return <><Header /><main className="internal-body"><div className="container"><p>Загружаем дом…</p></div></main><Footer /></>;
  const schema = { '@context': 'https://schema.org', '@type': 'SingleFamilyResidence', name: home.title, description: home.description, image: home.images, address: home.address, floorSize: home.area, offers: { '@type': 'Offer', priceCurrency: 'RUB', price: parseNumber(home.price), availability: 'https://schema.org/InStock' } };
  return <><Header /><main className="internal-body home-detail-page"><div className="container"><div className="homes-breadcrumbs"><a href="/">Главная</a><span>•</span><a href="/homes">Готовые дома</a><span>•</span><span>{home.title}</span></div><div className="home-detail-heading"><div><span className={`home-market-badge ${home.marketType}`}>{MARKET_LABELS[home.marketType]}</span><h1>{home.title}</h1><p>⌖ {home.address}</p></div><strong>{home.price}</strong></div><div className="home-detail-layout"><section><HouseGallery home={home} resolveMedia={resolveMedia} /><div className="home-detail-description"><h2>О доме</h2><p>{home.description}</p></div></section><aside className="home-detail-side"><h2>Характеристики</h2><dl><div><dt>Площадь дома</dt><dd>{home.area}</dd></div><div><dt>Участок</dt><dd>{home.landArea}</dd></div><div><dt>Этажность</dt><dd>{home.floors || 'Уточняется'}</dd></div><div><dt>Спальни</dt><dd>{home.bedrooms || 'Уточняется'}</dd></div><div><dt>Год постройки</dt><dd>{home.yearBuilt || 'Уточняется'}</dd></div><div><dt>Район</dt><dd>{home.district}</dd></div></dl><button type="button" onClick={() => setRequestOpen(true)}>Записаться на просмотр</button><small>Ответим на вопросы и согласуем удобное время</small></aside></div></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></main><Footer /><LeadModal open={requestOpen} onClose={() => setRequestOpen(false)} title="Записаться на просмотр" promoText={`${home.title}, ${home.price}`} messagePrefix={`Заявка на просмотр дома ${home.id}`} sourceTitle={`Готовый дом: ${home.title}`} /></>;
}
