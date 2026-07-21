import { ComponentType, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  formatSotka,
  LESNOE_OZERO_PHASES,
  LESNOE_OZERO_PLOTS,
  LESNOE_OZERO_STATUS_LABELS,
  LesnoeOzeroPhase,
  LesnoeOzeroPlot
} from './lesnoeOzeroPlots';
import { MortgageCalculation, MortgageCalculator } from './MortgageCalculator';
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

type CatalogProject = {
  id: string;
  title: string;
  coverImage: string;
  area: string;
  constructionType: string;
};

type TurnkeyScenario = 'life' | 'business' | 'dacha';

const TURNKEY_SCENARIOS: Record<TurnkeyScenario, {
  tab: string;
  title: string;
  description: string;
  accent: string;
  projects: Array<{ projectId: string; fallbackTitle: string; fallbackImage: string; type: string; area: string; packagePrice: string }>;
}> = {
  life: {
    tab: 'Дом для жизни',
    title: 'Переехать в готовый загородный дом',
    description: 'Полноценный дом для постоянного проживания: тёплый контур, чистовая отделка и благоустроенный участок.',
    accent: 'Семейный сценарий',
    projects: [
      { projectId: 'project_1775029736038', fallbackTitle: 'Barus-4M-100', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775029705859_48njq1.webp', type: 'Модульный', area: '85 м²', packagePrice: 'от 8,9 млн ₽' },
      { projectId: 'project_1775024865005', fallbackTitle: 'Барнхаус 105', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775024839358_nxy8nq.webp', type: 'Каркасный', area: '105 м²', packagePrice: 'от 10,4 млн ₽' },
      { projectId: 'project_1775029178114', fallbackTitle: 'Исидор', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775029170850_ius60g.webp', type: 'Газобетонный', area: '126 м²', packagePrice: 'от 9,6 млн ₽' }
    ]
  },
  business: {
    tab: 'Бизнес под сдачу',
    title: 'Запустить объект и сразу принимать гостей',
    description: 'Дом, участок и базовое оснащение под посуточную аренду. Поможем подобрать планировку и посадку нескольких объектов.',
    accent: 'Потенциал выручки от 200 000 ₽/мес.*',
    projects: [
      { projectId: 'project_1775030183021', fallbackTitle: 'Арго 3МУ.49-70', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775030176447_hp8z5l.webp', type: 'Модульный', area: '69 м²', packagePrice: 'от 7,4 млн ₽' },
      { projectId: 'project_1775026915614', fallbackTitle: 'Афрейм', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775026890566_vzbg7z.webp', type: 'Каркасный', area: '62 м²', packagePrice: 'от 8,5 млн ₽' },
      { projectId: 'project_1775027956740', fallbackTitle: 'Питиус', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775027937701_magwdo.webp', type: 'Газобетонный', area: '77 м²', packagePrice: 'от 7,9 млн ₽' }
    ]
  },
  dacha: {
    tab: 'Дача для отдыха',
    title: 'Приезжать на выходные в своё место',
    description: 'Компактный дом, терраса и всё необходимое для сезонного отдыха у леса и озера без лишних расходов.',
    accent: 'Самый доступный старт',
    projects: [
      { projectId: 'project_1775030773434', fallbackTitle: '2М25-30-42', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775030762673_07a2nr.webp', type: 'Модульный', area: '30 м²', packagePrice: 'от 4,3 млн ₽' },
      { projectId: 'project_1775025373144', fallbackTitle: 'Барнхаус 42', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775025340756_osi2bi.webp', type: 'Каркасный', area: '42 м²', packagePrice: 'от 6 млн ₽' },
      { projectId: 'project_1775030609631', fallbackTitle: '3М59-69-116', fallbackImage: 'https://dom.evtenia.ru/api/assets/projects/project_1775030604817_qqeby6.webp', type: 'Газобетонный', area: '70 м²', packagePrice: 'от 6,4 млн ₽' }
    ]
  }
};

const TURNKEY_INCLUDED = [
  'участок ИЖС', 'проект и посадка дома', 'фундамент и дом с отделкой',
  'подключение коммуникаций', 'забор и въездная группа', 'подъезд и базовое благоустройство'
];

function assetUrl(apiBase: string, filename: string) {
  return `${apiBase.replace(/\/$/, '')}/api/assets/lesnoe-ozero/${filename}`;
}

function projectImageUrl(value: string) {
  if (!value) return '';
  if (value.startsWith('http://dom.evtenia.ru')) return value.replace('http://', 'https://');
  return value;
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
  const [plots, setPlots] = useState<LesnoeOzeroPlot[]>(LESNOE_OZERO_PLOTS);
  const [catalogProjects, setCatalogProjects] = useState<CatalogProject[]>([]);
  const [turnkeyScenario, setTurnkeyScenario] = useState<TurnkeyScenario>('life');
  const [showAll, setShowAll] = useState(false);
  const [dialogInterest, setDialogInterest] = useState('');
  const mapSectionRef = useRef<HTMLElement>(null);

  const phasePlots = useMemo(() => plots.filter((plot) => plot.phase === phase), [phase, plots]);
  const availablePlots = useMemo(() => plots.filter((plot) => plot.status === 'available'), [plots]);
  const visibleCatalog = showAll ? plots : plots.slice(0, 6);
  const phaseDetails = LESNOE_OZERO_PHASES[phase];
  const scenario = TURNKEY_SCENARIOS[turnkeyScenario];
  const catalogAreas = availablePlots.length ? availablePlots.map((plot) => plot.areaSotka) : plots.map((plot) => plot.areaSotka);

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

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/lesnoe-ozero/plots`).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch(`${apiBase}/api/projects`).then((response) => response.ok ? response.json() : Promise.reject())
    ]).then(([plotPayload, projectPayload]: [LesnoeOzeroPlot[], CatalogProject[]]) => {
      if (Array.isArray(plotPayload) && plotPayload.length) {
        setPlots(plotPayload);
        const requestedId = new URLSearchParams(window.location.search).get('plot');
        const nextSelected = plotPayload.find((plot) => plot.id === requestedId)
          || plotPayload.find((plot) => plot.id === selectedPlot.id)
          || plotPayload[0];
        setSelectedPlot(nextSelected);
        setPhase(nextSelected.phase);
      }
      if (Array.isArray(projectPayload)) setCatalogProjects(projectPayload);
    }).catch(() => {
      fetch(`${apiBase}/api/projects`).then((response) => response.ok ? response.json() : []).then(setCatalogProjects).catch(() => undefined);
    });
  }, [apiBase]);

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
    const firstPlot = plots.find((plot) => plot.phase === nextPhase);
    if (firstPlot) choosePlot(firstPlot);
    emitAnalytics('plot_map_phase_change', { phase: nextPhase });
  };

  const openDialog = (interest: string) => {
    setDialogInterest(interest);
    if (interest.includes(LEAD_PRICE)) emitAnalytics('lead_offer_open');
  };

  const requestMortgage = (calculation: MortgageCalculation) => {
    openDialog(`Ипотечный расчёт: ${Math.round(calculation.monthlyPayment).toLocaleString('ru-RU')} ₽ в месяц`);
    emitAnalytics('mortgage_request', { source: 'lesnoe_ozero', ...calculation });
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
            <a href="#lesnoe-turnkey">Под ключ</a>
            <a href="#lesnoe-mortgage">Ипотека</a>
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
                      className={`${selectedPlot.id === plot.id ? 'active' : ''} status-${plot.status}`}
                      style={{ left: `${plot.position.x}%`, top: `${plot.position.y}%` }}
                      aria-label={`Выбрать участок №${plot.id}, ${formatSotka(plot.areaSotka)} соток`}
                      onClick={() => choosePlot(plot)}
                    >
                      {plot.id}
                    </button>
                  ))}
                </div>
                <div className="lo-map-legend"><span>В продаже</span><span>Выбран</span><span>Бронь / продан</span></div>
              </div>
              <aside className="lo-plot-detail" aria-live="polite">
                <span className={`lo-status status-${selectedPlot.status}`}>{LESNOE_OZERO_STATUS_LABELS[selectedPlot.status]}</span>
                <h3>Участок №{selectedPlot.id}</h3>
                <strong className="lo-plot-area">{formatSotka(selectedPlot.areaSotka)} сот.</strong>
                <small>{LESNOE_OZERO_PHASES[selectedPlot.phase].label}</small>
                <dl>
                  <dt>Назначение</dt><dd>{selectedPlot.purpose || 'ИЖС'}</dd>
                  <dt>Электричество</dt><dd>{selectedPlot.electricity || '15 кВт вдоль участка'}</dd>
                  <dt>Газ</dt><dd>{selectedPlot.gas || 'вдоль участка'}</dd>
                  <dt>Подъезд</dt><dd>{selectedPlot.access || 'круглогодичный'}</dd>
                  {selectedPlot.cadastralNumber ? <><dt>Кадастровый №</dt><dd>{selectedPlot.cadastralNumber}</dd></> : null}
                  <dt>Цена</dt><dd>{selectedPlot.price || 'по запросу'}</dd>
                </dl>
                <p>{selectedPlot.description}</p>
                <button className="lo-button lo-button--orange" type="button" disabled={selectedPlot.status === 'sold'} onClick={() => openDialog(`Участок №${selectedPlot.id}`)}>{selectedPlot.status === 'sold' ? 'Участок продан' : 'Узнать цену и записаться на просмотр'}</button>
              </aside>
            </div>
          </div>
        </section>

        <section className="lo-catalog" id="lesnoe-catalog">
          <div className="container">
            <div className="lo-section-head"><div><p className="lo-eyebrow">Каталог</p><h2>Участки в продаже</h2></div><p>{availablePlots.length} вариантов{catalogAreas.length ? ` · от ${formatSotka(Math.min(...catalogAreas))} до ${formatSotka(Math.max(...catalogAreas))} соток` : ''}</p></div>
            <div className="lo-cards">
              {visibleCatalog.map((plot) => (
                <article className="lo-plot-card" key={plot.id}>
                  <div className="lo-plot-card-top"><strong>№{plot.id}</strong><span className={`status-${plot.status}`}>{LESNOE_OZERO_STATUS_LABELS[plot.status]}</span></div>
                  <div className="lo-plot-card-body">
                    <h3>{formatSotka(plot.areaSotka)} сот.</h3>
                    <p>{LESNOE_OZERO_PHASES[plot.phase].shortLabel} · ИЖС · электричество</p>
                    <div><strong>{plot.price || 'Цена по запросу'}</strong><button type="button" onClick={() => choosePlot(plot, true)}>На карте</button><button type="button" disabled={plot.status === 'sold'} onClick={() => openDialog(`Участок №${plot.id}`)}>Подробнее</button></div>
                  </div>
                </article>
              ))}
            </div>
            {!showAll ? <div className="lo-more"><button className="lo-button lo-button--dark" type="button" onClick={() => setShowAll(true)}>Показать все участки</button></div> : null}
          </div>
        </section>

        <section className="lo-turnkey" id="lesnoe-turnkey">
          <div className="container">
            <div className="lo-section-head">
              <div><p className="lo-eyebrow">Готовые решения</p><h2>Дом и участок под ключ</h2><p className="lo-section-lead">Один договор и понятный результат: от выбора участка до готового дома, забора и подключённых коммуникаций.</p></div>
              <span className="lo-turnkey-note">Предварительный бюджет — уточним после выбора участка и комплектации</span>
            </div>
            <div className="lo-turnkey-included" aria-label="Что входит в предложение">
              {TURNKEY_INCLUDED.map((item) => <span key={item}>✓ {item}</span>)}
            </div>
            <div className="lo-scenario-tabs" role="tablist" aria-label="Сценарий покупки">
              {(Object.keys(TURNKEY_SCENARIOS) as TurnkeyScenario[]).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={turnkeyScenario === key} className={turnkeyScenario === key ? 'active' : ''} onClick={() => setTurnkeyScenario(key)}>{TURNKEY_SCENARIOS[key].tab}</button>
              ))}
            </div>
            <div className="lo-scenario-intro">
              <div><p>{scenario.accent}</p><h3>{scenario.title}</h3><span>{scenario.description}</span></div>
              {turnkeyScenario === 'business' ? <small>*Потенциальная выручка зависит от тарифа, загрузки, сезона, расходов и управления объектом. Не является гарантией дохода.</small> : null}
            </div>
            <div className="lo-turnkey-cards">
              {scenario.projects.map((offer) => {
                const project = catalogProjects.find((item) => item.id === offer.projectId)
                  || catalogProjects.find((item) => item.title.toLowerCase() === offer.fallbackTitle.toLowerCase());
                return (
                  <article key={`${turnkeyScenario}-${offer.projectId}`}>
                    <a className="lo-turnkey-image" href={`/project/${project?.id || offer.projectId}`}>
                      <img src={projectImageUrl(project?.coverImage || offer.fallbackImage)} alt={`Проект ${project?.title || offer.fallbackTitle}`} loading="lazy" />
                    </a>
                    <div className="lo-turnkey-card-body">
                      <span>{offer.type} · {project?.area || offer.area}</span>
                      <h3>{project?.title || offer.fallbackTitle}</h3>
                      <p>Участок, дом с отделкой, коммуникации, ограждение и подготовка территории.</p>
                      <strong>{offer.packagePrice}<small>за комплекс под ключ</small></strong>
                      <div><a href={`/project/${project?.id || offer.projectId}`}>Посмотреть проект</a><button type="button" onClick={() => openDialog(`${scenario.tab}: ${project?.title || offer.fallbackTitle}, ${offer.packagePrice}`)}>Рассчитать</button></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lo-mortgage" id="lesnoe-mortgage">
          <div className="container">
            <div className="lo-section-head">
              <div><p className="lo-eyebrow">Финансирование</p><h2>Дом и участок — примерно от 20 000 ₽ в месяц</h2><p className="lo-section-lead">Стартовый пример рассчитан для доступного дачного комплекса. Измените цену, взнос, срок и ставку — результат пересчитается сразу.</p></div>
              <a className="lo-button lo-button--dark" href="/mortgage-calculator">Открыть полный калькулятор</a>
            </div>
            <MortgageCalculator compact onRequest={requestMortgage} />
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
