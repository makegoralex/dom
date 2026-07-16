import { ComponentType, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  formatSotka,
  LESNOE_OZERO_PHASES,
  LESNOE_OZERO_PLOTS,
  LesnoeOzeroPhase,
  LesnoeOzeroPlot
} from './lesnoeOzeroPlots';
import './lesnoe-ozero.css';

type LesnoeOzeroPageProps = {
  Header: ComponentType;
  Footer: ComponentType;
  PrivacyConsent: ComponentType;
  apiBase: string;
  formatPhone: (value: string) => string;
};

type LeadFormProps = {
  apiBase: string;
  formatPhone: (value: string) => string;
  PrivacyConsent: ComponentType;
  sourceTitle: string;
  messagePrefix: string;
  includeComment?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
};

const LEAD_PRICE = '550 000 ₽';

function assetUrl(apiBase: string, filename: string) {
  return `${apiBase.replace(/\/$/, '')}/api/assets/lesnoe-ozero/${filename}`;
}

function emitAnalytics(name: string, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent('evtenia:analytics', { detail: { name, ...detail } }));
}

function LeadForm({
  apiBase,
  formatPhone,
  PrivacyConsent,
  sourceTitle,
  messagePrefix,
  includeComment = false,
  submitLabel = 'Отправить заявку',
  onSuccess
}: LeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setStatus('Отправка...');
    try {
      const query = new URLSearchParams(window.location.search);
      const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
        .map((key) => query.get(key) ? `${key}=${query.get(key)}` : '')
        .filter(Boolean)
        .join(', ');
      const message = [
        messagePrefix,
        comment.trim() ? `Комментарий: ${comment.trim()}` : '',
        utm ? `UTM: ${utm}` : ''
      ].filter(Boolean).join('\n');
      const response = await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: '',
          message,
          sourceTitle
        })
      });
      if (!response.ok) throw new Error('lead request failed');
      setStatus('Спасибо! Мы свяжемся с вами в ближайшее время.');
      setName('');
      setPhone('');
      setComment('');
      emitAnalytics('viewing_form_submit', { sourceTitle });
      onSuccess?.();
    } catch {
      setStatus('Не удалось отправить заявку. Позвоните нам или попробуйте ещё раз.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="lo-lead-form" onSubmit={submit} onFocus={() => emitAnalytics('viewing_form_start', { sourceTitle })}>
      <label>
        Имя
        <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
      </label>
      <label>
        Телефон*
        <input
          type="tel"
          placeholder="+7 (___) ___-__-__"
          value={phone}
          onChange={(event) => setPhone(formatPhone(event.target.value))}
          autoComplete="tel"
          required
        />
      </label>
      {includeComment ? (
        <label>
          Комментарий
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
        </label>
      ) : null}
      <PrivacyConsent />
      <button className="lo-button lo-button--orange" type="submit" disabled={sending}>{submitLabel}</button>
      {status ? <p className="lo-form-status" role="status">{status}</p> : null}
    </form>
  );
}

function LeadDialog({
  open,
  interest,
  onClose,
  apiBase,
  formatPhone,
  PrivacyConsent
}: {
  open: boolean;
  interest: string;
  onClose: () => void;
  apiBase: string;
  formatPhone: (value: string) => string;
  PrivacyConsent: ComponentType;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLeadOffer = interest.includes(LEAD_PRICE);
  return (
    <div className="lo-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="lo-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="lo-dialog-title">
        <button className="lo-dialog-close" type="button" onClick={onClose} aria-label="Закрыть">×</button>
        <p className="lo-eyebrow">ЖК «Лесное озеро»</p>
        <h2 id="lo-dialog-title">{isLeadOffer ? 'Узнать условия спецпредложения' : interest}</h2>
        <p>Оставьте телефон — менеджер расскажет об актуальном предложении и согласует удобное время просмотра.</p>
        <LeadForm
          apiBase={apiBase}
          formatPhone={formatPhone}
          PrivacyConsent={PrivacyConsent}
          sourceTitle={`Лесное озеро: ${interest}`}
          messagePrefix={`Заявка со спецстраницы ЖК «Лесное озеро». Интерес: ${interest}.`}
          submitLabel="Отправить заявку"
        />
      </div>
    </div>
  );
}

export function LesnoeOzeroPage({ Header, Footer, PrivacyConsent, apiBase, formatPhone }: LesnoeOzeroPageProps) {
  const initialPlot = useMemo(() => {
    const requestedId = new URLSearchParams(window.location.search).get('plot');
    return LESNOE_OZERO_PLOTS.find((plot) => plot.id === requestedId) || LESNOE_OZERO_PLOTS[0];
  }, []);
  const [phase, setPhase] = useState<LesnoeOzeroPhase>(initialPlot.phase);
  const [selectedPlot, setSelectedPlot] = useState<LesnoeOzeroPlot>(initialPlot);
  const [showAll, setShowAll] = useState(false);
  const [dialogInterest, setDialogInterest] = useState('');
  const mapSectionRef = useRef<HTMLElement>(null);

  const phasePlots = useMemo(() => LESNOE_OZERO_PLOTS.filter((plot) => plot.phase === phase), [phase]);
  const visibleCatalog = showAll ? LESNOE_OZERO_PLOTS : LESNOE_OZERO_PLOTS.slice(0, 6);
  const phaseDetails = LESNOE_OZERO_PHASES[phase];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Участки ИЖС в ЖК «Лесное озеро» — Evtenia, Пенза';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    if (description) description.content = 'Участки ИЖС у соснового леса и озера в 15 минутах от Пензы. Интерактивная схема и запись на просмотр.';
    emitAnalytics('lesnoe_ozero_view');
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, []);

  const choosePlot = (plot: LesnoeOzeroPlot, scrollToMap = false) => {
    setPhase(plot.phase);
    setSelectedPlot(plot);
    const params = new URLSearchParams(window.location.search);
    params.set('plot', plot.id);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    emitAnalytics('plot_select', { plotId: plot.id, phase: plot.phase, area: plot.areaSotka, status: plot.status });
    if (scrollToMap) requestAnimationFrame(() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const choosePhase = (nextPhase: LesnoeOzeroPhase) => {
    setPhase(nextPhase);
    const firstPlot = LESNOE_OZERO_PLOTS.find((plot) => plot.phase === nextPhase);
    if (firstPlot) choosePlot(firstPlot);
    emitAnalytics('plot_map_phase_change', { phase: nextPhase });
  };

  const openDialog = (interest: string) => {
    setDialogInterest(interest);
    if (interest.includes(LEAD_PRICE)) emitAnalytics('lead_offer_open');
  };

  return (
    <div className="lo-page">
      <Header />

      <main>
        <section
          className="lo-hero"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(4, 28, 20, .92), rgba(4, 28, 20, .48) 58%, rgba(4, 28, 20, .12)), url('${assetUrl(apiBase, 'hero.jpg')}')` }}
        >
          <div className="container lo-hero-content">
            <div className="lo-exclusive">Эксклюзивные продажи от Evtenia</div>
            <h1>ЖК <span>«Лесное озеро»</span></h1>
            <p className="lo-hero-lead">Участки ИЖС среди соснового леса и рядом с озером — в 15 минутах от Пензы.</p>
            <div className="lo-actions">
              <a className="lo-button" href="#lesnoe-map">Выбрать участок на карте</a>
              <button className="lo-button lo-button--outline" type="button" onClick={() => openDialog('Записаться на просмотр')}>Записаться на просмотр</button>
            </div>
            <div className="lo-hero-stats" aria-label="Ключевые характеристики">
              <div><strong>15 минут</strong><span>от Пензы на автомобиле</span></div>
              <div><strong>ИЖС</strong><span>для дома и постоянного проживания</span></div>
              <div><strong>6–16 сот.</strong><span>участки разной площади и формы</span></div>
            </div>
          </div>
        </section>

        <nav className="lo-quick-nav" aria-label="Навигация по спецпроекту">
          <div className="container">
            <a href="#lesnoe-about">О посёлке</a>
            <a href="#lesnoe-map">Карта участков</a>
            <a href="#lesnoe-catalog">Каталог</a>
            <a href="#lesnoe-gallery">Фотографии</a>
            <a href="#lesnoe-contacts">Записаться на просмотр</a>
          </div>
        </nav>

        <section className="lo-promo" aria-label="Специальное предложение">
          <div className="container lo-promo-grid">
            <div><span>Входной лот</span><h2>Один участок по специальной цене</h2></div>
            <strong>{LEAD_PRICE}<small>предложение действует на один участок</small></strong>
            <button className="lo-button lo-button--dark" type="button" onClick={() => openDialog(`Участок за ${LEAD_PRICE}`)}>Получить подробности</button>
          </div>
        </section>

        <section className="lo-about" id="lesnoe-about">
          <div className="container lo-about-grid">
            <div className="lo-about-photo">
              <img src={assetUrl(apiBase, 'lifestyle.jpg')} alt="Дом среди соснового леса" loading="lazy" />
              <div><strong>15 минут</strong><span>и городской ритм остаётся позади</span></div>
            </div>
            <div>
              <p className="lo-eyebrow">Место, где хочется остаться</p>
              <h2>Не просто земля — готовое окружение для загородной жизни</h2>
              <p className="lo-section-lead">«Лесное озеро» — развивающийся посёлок у соснового массива. Здесь уже строятся дома, есть подъездные пути и электричество, а прогулка к воде занимает несколько минут.</p>
              <div className="lo-benefits">
                <article><span>♧</span><h3>Сосновый лес</h3><p>Чистый воздух, естественная тень и природное окружение.</p></article>
                <article><span>≈</span><h3>Озеро рядом</h3><p>Вода и живописные маршруты в шаговой доступности.</p></article>
                <article><span>⌁</span><h3>Подъезд к участкам</h3><p>Щебёночные дороги и круглогодичный подъезд.</p></article>
                <article><span>ϟ</span><h3>Коммуникации</h3><p>Электричество 15 кВт вдоль земельного участка; газ также вдоль земельного участка.</p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="lo-map-section" id="lesnoe-map" ref={mapSectionRef}>
          <div className="container">
            <div className="lo-section-head">
              <div><p className="lo-eyebrow">Интерактивный выбор</p><h2>Найдите свой участок на схеме</h2><p className="lo-section-lead">Нажмите на номер — характеристики выбранного участка появятся справа.</p></div>
              <div className="lo-map-tabs" role="tablist" aria-label="Очереди посёлка">
                {(Object.keys(LESNOE_OZERO_PHASES) as LesnoeOzeroPhase[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={phase === key}
                    className={phase === key ? 'active' : ''}
                    onClick={() => choosePhase(key)}
                  >
                    {LESNOE_OZERO_PHASES[key].shortLabel}
                  </button>
                ))}
              </div>
            </div>
            <div className="lo-map-layout">
              <div className="lo-map-canvas" role="group" aria-label={phaseDetails.mapAlt}>
                <img src={assetUrl(apiBase, phaseDetails.mapImage)} alt={phaseDetails.mapAlt} />
                <div className="lo-hotspots">
                  {phasePlots.map((plot) => (
                    <button
                      key={plot.id}
                      type="button"
                      className={selectedPlot.id === plot.id ? 'active' : ''}
                      style={{ left: `${plot.position.x}%`, top: `${plot.position.y}%` }}
                      aria-label={`Выбрать участок №${plot.id}, ${formatSotka(plot.areaSotka)} соток`}
                      onClick={() => choosePlot(plot)}
                    >
                      {plot.id}
                    </button>
                  ))}
                </div>
                <div className="lo-map-legend"><span>В продаже</span><span>Выбран</span></div>
              </div>
              <aside className="lo-plot-detail" aria-live="polite">
                <span className="lo-status">В продаже</span>
                <h3>Участок №{selectedPlot.id}</h3>
                <strong className="lo-plot-area">{formatSotka(selectedPlot.areaSotka)} сот.</strong>
                <small>{LESNOE_OZERO_PHASES[selectedPlot.phase].label}</small>
                <dl>
                  <dt>Назначение</dt><dd>ИЖС</dd>
                  <dt>Электричество</dt><dd>15 кВт вдоль земельного участка</dd>
                  <dt>Газ</dt><dd>вдоль земельного участка</dd>
                  <dt>Подъезд</dt><dd>круглогодичный</dd>
                  <dt>Цена</dt><dd>по запросу</dd>
                </dl>
                <p>{selectedPlot.description}</p>
                <button className="lo-button lo-button--orange" type="button" onClick={() => openDialog(`Участок №${selectedPlot.id}`)}>Узнать цену и записаться на просмотр</button>
              </aside>
            </div>
          </div>
        </section>

        <section className="lo-catalog" id="lesnoe-catalog">
          <div className="container">
            <div className="lo-section-head"><div><p className="lo-eyebrow">Каталог</p><h2>Участки в продаже</h2></div><p>13 вариантов · от 6 до 16 соток</p></div>
            <div className="lo-cards">
              {visibleCatalog.map((plot) => (
                <article className="lo-plot-card" key={plot.id}>
                  <div className="lo-plot-card-top"><strong>№{plot.id}</strong><span>В продаже</span></div>
                  <div className="lo-plot-card-body">
                    <h3>{formatSotka(plot.areaSotka)} сот.</h3>
                    <p>{LESNOE_OZERO_PHASES[plot.phase].shortLabel} · ИЖС · электричество</p>
                    <div><strong>Цена по запросу</strong><button type="button" onClick={() => choosePlot(plot, true)}>На карте</button><button type="button" onClick={() => openDialog(`Участок №${plot.id}`)}>Подробнее</button></div>
                  </div>
                </article>
              ))}
            </div>
            {!showAll ? <div className="lo-more"><button className="lo-button lo-button--dark" type="button" onClick={() => setShowAll(true)}>Показать все участки</button></div> : null}
          </div>
        </section>

        <section className="lo-living">
          <div className="lo-living-image" style={{ backgroundImage: `url('${assetUrl(apiBase, 'cabin.jpg')}')` }} role="img" aria-label="Дом среди соснового леса" />
          <div className="lo-living-content">
            <p className="lo-eyebrow">Сценарии жизни</p>
            <h2>Дом, дача или инвестиция в землю</h2>
            <p>Участки подходят для разных задач — от первого загородного дома до банного комплекса и долгосрочного владения землёй.</p>
            <ol><li>Дом для постоянного проживания</li><li>Семейная дача у леса и воды</li><li>Банный или гостевой комплекс</li><li>Земля в развивающемся посёлке</li></ol>
            <button className="lo-button lo-button--orange" type="button" onClick={() => openDialog('Подбор участка под задачу')}>Подобрать участок под мою задачу</button>
          </div>
        </section>

        <section className="lo-gallery" id="lesnoe-gallery">
          <div className="container">
            <p className="lo-eyebrow">Атмосфера посёлка</p><h2>Лес начинается за порогом</h2>
            <div className="lo-gallery-grid">
              <figure><img src={assetUrl(apiBase, 'lifestyle.jpg')} alt="А-фрейм дом и отдых в гамаке" loading="lazy" /><figcaption>Сосновый массив</figcaption></figure>
              <figure><img src={assetUrl(apiBase, 'neighborhood.jpg')} alt="Современный дом в посёлке" loading="lazy" /><figcaption>Посёлок развивается</figcaption></figure>
              <figure><img src={assetUrl(apiBase, 'cabin.jpg')} alt="Дом среди сосен" loading="lazy" /><figcaption>Тишина и приватность</figcaption></figure>
              <figure><img src={assetUrl(apiBase, 'spa.jpg')} alt="Возможный сценарий зоны отдыха" loading="lazy" /><figcaption>Визуализация возможного благоустройства</figcaption></figure>
            </div>
          </div>
        </section>

        <section className="lo-steps">
          <div className="container"><p className="lo-eyebrow">Простой путь к участку</p><h2>От выбора до сделки</h2><div className="lo-steps-grid">
            <article><strong>01</strong><h3>Оставьте заявку</h3><p>Менеджер уточнит задачу, бюджет и желаемую площадь.</p></article>
            <article><strong>02</strong><h3>Получите подборку</h3><p>Покажем актуальные варианты, цены и расположение.</p></article>
            <article><strong>03</strong><h3>Приезжайте на просмотр</h3><p>Проведём по территории и покажем границы участков.</p></article>
            <article><strong>04</strong><h3>Оформите сделку</h3><p>Сопроводим покупку и при желании рассчитаем строительство.</p></article>
          </div></div>
        </section>

        <section
          className="lo-final-cta"
          id="lesnoe-contacts"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(5, 37, 27, .96), rgba(5, 37, 27, .65)), url('${assetUrl(apiBase, 'forest.jpg')}')` }}
        >
          <div className="container lo-final-grid">
            <div><p className="lo-eyebrow">Эксклюзивные продажи</p><h2>Увидеть «Лесное озеро» лучше вживую</h2><p>Оставьте телефон — менеджер Evtenia расскажет об актуальных участках и согласует удобное время просмотра.</p></div>
            <div className="lo-final-form"><h3>Записаться на просмотр</h3><LeadForm apiBase={apiBase} formatPhone={formatPhone} PrivacyConsent={PrivacyConsent} sourceTitle="Лесное озеро: финальная форма" messagePrefix="Запись на просмотр ЖК «Лесное озеро»." includeComment /></div>
          </div>
        </section>
      </main>

      <Footer />
      <LeadDialog open={Boolean(dialogInterest)} interest={dialogInterest} onClose={() => setDialogInterest('')} apiBase={apiBase} formatPhone={formatPhone} PrivacyConsent={PrivacyConsent} />
    </div>
  );
}
