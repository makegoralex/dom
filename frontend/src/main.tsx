import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

type HouseProject = {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  images: string[];
  area: string;
  floors: string;
  bedrooms: string;
  priceFrom: string;
  constructionType: string;
  category: 'house' | 'bath';
  badge?: string;
  style?: string;
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  message: string;
  projectId?: string;
  createdAt: string;
};

type ContentPage = {
  slug: string;
  title: string;
  content: string;
};

type PortfolioItem = {
  id: string;
  title: string;
  image: string;
  boxPrice: string;
  buildDuration: string;
  rating: number;
  clientName: string;
  review: string;
};

type ProjectGroupColumn = {
  title: string;
  groups: Array<{
    label?: string;
    items: string[];
  }>;
};
type AdminTab = 'projects' | 'pages' | 'portfolio' | 'leads';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const ADMIN_PATH = '/catalog-control-7f3a';
const ADMIN_KEY = 'catalog-control-7f3a';
const CONTACTS = {
  mainPhoneDisplay: '8-902-209-01-79',
  mainPhoneHref: 'tel:+79022090179',
  extraPhoneDisplay: '8-841-419-01-79',
  extraPhoneHref: 'tel:+78414190179',
  email: '89022099279@mail.ru',
  emailHref: 'mailto:89022099279@mail.ru',
  vk: 'https://vk.ru/evtenia_house',
  max: 'https://max.ru/join/1zjkiv7Ex8ofTgGHuB212RBgUa_GcPjKokLeHSRDj0w',
  telegram: 'https://t.me/evtenia_realty'
};
const PROJECT_GROUPS: ProjectGroupColumn[] = [
  { title: 'Проекты домов', groups: [{ items: ['Модульные', 'Каркасные', 'Из газобетона'] }] }
];
const BATHS_MENU_ITEMS = ['Модульные', 'Каркасные'];

const SERVICES_MENU = [
  { slug: 'fundament', title: 'Фундамент', text: 'Проектируем и устраиваем фундаменты под тип грунта и нагрузку дома.' },
  { slug: 'besedki', title: 'Беседки', text: 'Строим беседки под ключ: от эскиза до финальной отделки.' },
  { slug: 'septik', title: 'Септик', text: 'Подбираем и монтируем септики с учетом объема стоков и участка.' },
  { slug: 'zabory', title: 'Заборы', text: 'Устанавливаем заборы разных типов: профлист, евроштакетник, дерево.' },
  { slug: 'mebel', title: 'Мебель', text: 'Делаем встроенную и корпусную мебель под размеры вашего дома.' },
  { slug: 'podbor-uchastka', title: 'Подбор участка', text: 'Помогаем выбрать участок с проверкой рельефа, подъезда и коммуникаций.' },
  { slug: 'skvazhiny', title: 'Скважины', text: 'Бурим и обустраиваем скважины под дом и баню с подбором оборудования.' },
  { slug: 'plastikovye-okna', title: 'Пластиковые окна', text: 'Подбираем и устанавливаем ПВХ-окна с учетом теплопотерь и дизайна.' },
  { slug: 'dveri', title: 'Двери', text: 'Входные и межкомнатные двери с монтажом и фурнитурой.' },
  { slug: 'remont', title: 'Ремонт', text: 'Выполняем внутренний ремонт и отделку домов под ключ.' },
  { slug: 'lestnitsy', title: 'Лестницы', text: 'Проектируем и изготавливаем деревянные и комбинированные лестницы.' },
  { slug: 'svai', title: 'Сваи', text: 'Монтаж винтовых и железобетонных свай под разные типы грунта.' },
  { slug: 'dizainer', title: 'Дизайнер', text: 'Разрабатываем дизайн-концепцию интерьеров и экстерьеров.' },
  { slug: 'landshaftnyy-dizayn', title: 'Ландшафтный дизайн', text: 'Проектируем благоустройство участка и озеленение территории.' },
  { slug: 'mezhevanie', title: 'Межевание', text: 'Готовим документы и выполняем межевание земельных участков.' }
];

const PROMOTIONS_MENU = [
  { slug: 'ipoteka-i-kredit', title: 'Ипотека и кредит', text: 'Подберем комфортную программу ипотеки или кредита на строительство.' },
  { slug: 'vse-akcii', title: 'Все акции', text: 'Здесь публикуем актуальные скидки, акции и специальные предложения.' }
];

function chunkBy<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
const FALLBACK_PROJECTS: HouseProject[] = [
  {
    id: 'demo1',
    title: 'Проект Эверест 92',
    area: '92 м²',
    floors: '1 этаж',
    bedrooms: '3 спальни',
    badge: 'Хит продаж',
    shortDescription: 'Компактный дом с просторной кухней-гостиной и выходом на террасу.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    images: [],
    priceFrom: 'от 4 150 000 ₽',
    constructionType: 'Из газобетона',
    style: 'Современный',
    category: 'house'
  },
  {
    id: 'demo2',
    title: 'Проект Эверест 128',
    area: '128 м²',
    floors: '1 этаж',
    bedrooms: '4 спальни',
    badge: 'Для семьи',
    shortDescription: 'Функциональная планировка для семьи: мастер-спальня, кладовая и большая гостиная.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    images: [],
    priceFrom: 'от 5 730 000 ₽',
    constructionType: 'Каркасные',
    style: 'Скандинавский',
    category: 'house'
  },
  {
    id: 'demo3',
    title: 'Проект Эверест 164',
    area: '164 м²',
    floors: '2 этажа',
    bedrooms: '5 спален',
    badge: 'Премиум',
    shortDescription: 'Двухэтажный дом с кабинетом, гардеробными и полноценной террасой.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80',
    images: [],
    priceFrom: 'от 7 450 000 ₽',
    constructionType: 'Модульные',
    style: 'Барнхаус',
    category: 'house'
  },
  {
    id: 'demo4',
    title: 'Проект Норд 118',
    area: '118 м²',
    floors: '2 этажа',
    bedrooms: '4 спальни',
    badge: 'Новинка',
    shortDescription: 'Дом из газобетона с вторым светом, навесом и кухней-гостиной.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80'],
    priceFrom: '6 180 000 ₽',
    constructionType: 'Из газобетона',
    style: 'Классический',
    category: 'house'
  },
  {
    id: 'demo5',
    title: 'Баня Ладога 36',
    area: '36 м²',
    floors: '1 этаж',
    bedrooms: '2 комнаты',
    shortDescription: 'Модульная баня с комнатой отдыха и панорамным остеклением.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80'],
    priceFrom: '2 190 000 ₽',
    constructionType: 'Модульные',
    style: 'Современный',
    category: 'bath'
  },
  {
    id: 'demo6',
    title: 'Баня Вологда 48',
    area: '48 м²',
    floors: '1 этаж',
    bedrooms: '3 комнаты',
    shortDescription: 'Каркасная баня с террасой, парной и большой зоной отдыха.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1200&q=80'],
    priceFrom: '2 840 000 ₽',
    constructionType: 'Каркасные',
    style: 'Русский',
    category: 'bath'
  },
  {
    id: 'demo7',
    title: 'Баня Тихвин 54',
    area: '54 м²',
    floors: '2 этажа',
    bedrooms: '3 комнаты',
    shortDescription: 'Двухэтажная баня с гостевой комнатой и балконом.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1200&q=80'],
    priceFrom: '3 160 000 ₽',
    constructionType: 'Каркасные',
    style: 'Классический',
    category: 'bath'
  },
  {
    id: 'demo8',
    title: 'Проект Модум 78',
    area: '78 м²',
    floors: '1 этаж',
    bedrooms: '3 спальни',
    shortDescription: 'Компактный модульный дом для постоянного проживания.',
    fullDescription: 'Полное описание проекта.',
    coverImage: 'https://images.unsplash.com/photo-1570129476815-ba7d0c6f2d3f?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1570129476815-ba7d0c6f2d3f?auto=format&fit=crop&w=1200&q=80'],
    priceFrom: '4 420 000 ₽',
    constructionType: 'Модульные',
    style: 'Минимализм',
    category: 'house'
  }
];

function normalizePrice(price: unknown) {
  const value = String(price ?? '').trim();
  if (!value) return 'Цена по запросу';
  return value.toLowerCase().startsWith('от') ? value : `от ${value}`;
}

function resolveMediaUrl(url?: string) {
  const value = (url || '').trim();
  if (!value) return '';
  if (value.startsWith('/assets/') && API_BASE) return `${API_BASE}${value}`;
  return value;
}

function SearchBox() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get('q') || '');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
  };

  return (
    <form className="search-box" onSubmit={onSubmit}>
      <input placeholder="Поиск по сайту..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="submit">Найти</button>
    </form>
  );
}

function CallbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Отправка...');
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: CONTACTS.email,
          message: 'Заказ звонка с сайта'
        })
      });
      if (!res.ok) throw new Error('bad');
      setStatus('Заявка отправлена.');
      setName('');
      setPhone('');
    } catch {
      setStatus('Не удалось отправить заявку. Попробуйте позже.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Заказать звонок</h3>
        <form onSubmit={submit}>
          <label>Имя<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Телефон<input value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
          <button type="submit">Отправить</button>
        </form>
        <a className="modal-policy" href="/about">Политика конфиденциальности</a>
        {status ? <p>{status}</p> : null}
      </div>
    </div>
  );
}

function ProjectTile({ project }: { project: HouseProject }) {
  const imageUrl = resolveMediaUrl(project.coverImage || project.images?.[0] || '');
  return (
    <article className="project-card">
      <a className="project-card-link" href={`/project/${project.id}`}>
      <div className="project-image" style={{ backgroundImage: `url(${imageUrl})` }} />
      <div className="project-content">
        <p className="project-desc">{project.shortDescription}</p>
        <h3>{project.title}</h3>
        <div className="project-meta">
          <span><small>Площадь:</small><strong>{project.area}</strong></span>
          <span><small>Габариты:</small><strong>{project.floors}</strong></span>
          <span><small>Комнат:</small><strong>{project.bedrooms}</strong></span>
        </div>
        <strong className="project-price">{normalizePrice(project.priceFrom)}</strong>
      </div>
      </a>
    </article>
  );
}

function PublicPage() {
  const [projects, setProjects] = useState<HouseProject[]>(FALLBACK_PROJECTS);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState(FALLBACK_PROJECTS[0].id);
  const [status, setStatus] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [constructionTypes, setConstructionTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState('Все типы');
  const [openCallback, setOpenCallback] = useState(false);
  const serviceColumns = useMemo(() => chunkBy(SERVICES_MENU, 6), []);

  useEffect(() => {
    document.title = "Evtenia — строительство домов";
    fetch(`${API_BASE}/api/construction-types`).then((r) => r.ok ? r.json() : []).then((t:string[]) => setConstructionTypes(['Все типы', ...t])).catch(() => setConstructionTypes(['Все типы']));

    fetch(`${API_BASE}/api/projects`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no api'))))
      .then((data: HouseProject[]) => {
        if (!Array.isArray(data) || !data.length) {
          return;
        }
        setProjects(data);
        setProjectId(data[0].id);
      })
      .catch(() => {
        setProjects(FALLBACK_PROJECTS);
        setProjectId(FALLBACK_PROJECTS[0].id);
      });
  }, []);


  const filteredProjects = useMemo(() => selectedType === 'Все типы' ? projects : projects.filter((p) => p.constructionType === selectedType), [projects, selectedType]);

  const catalogProjects = useMemo(() => filteredProjects.slice(0, 9), [filteredProjects]);

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Отправка...');

    try {
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message, projectId })
      });

      if (!response.ok) {
        throw new Error('bad response');
      }

      setStatus('Спасибо! Мы свяжемся с вами в ближайшее время.');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      return;
    } catch (_error) {
      setStatus('Заявка сохранена локально. Подключим CRM на следующем этапе.');
    }
  };

  return (
    <div>
      <header className="hero hero-exact">
        <div className="promo-strip">
          <div className="container promo-inner">
            <strong><a href="/discounts/ipoteka-i-kredit">СТРОИТЕЛЬСТВО ДОМОВ В КРЕДИТ И ИПОТЕКУ ОТ 9.5% ГОДОВЫХ!</a></strong>
            <a className="promo-btn" href="/discounts/ipoteka-i-kredit">Узнать условия <span>»</span></a>
          </div>
        </div>

        <div className="top-search-row">
          <div className="container top-search-inner">
            <SearchBox />
            <div className="top-contacts">
              <a href={CONTACTS.vk} target="_blank" rel="noreferrer">VK</a>
              <a href={CONTACTS.telegram} target="_blank" rel="noreferrer">Telegram</a>
              <a href={CONTACTS.max} target="_blank" rel="noreferrer">MAX</a>
              <span><i>⤴</i> Свой проект на расчёт</span>
            </div>
          </div>
        </div>

        <div className="container hero-main">
          <div className="hero-upper-row">
            <a href="/" className="brand-line">
              <div className="logo-badge"><img src="/assets/logo_small.png" alt="Evtenia" /></div>
              <div className="brand-text">
                <div className="brand-logo">Evtenia</div>
                <p>Строительная компания</p>
              </div>
            </a>

            <div className="hero-contact-line">
              <span>Нужна примерная оценка стоимости строительства? <b>|</b> <u>Рассчитать онлайн</u></span>
              <div className="phone-block"><strong><a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a></strong><small>с 9:00 до 19:00</small></div>
              <button className="call-btn" onClick={() => setOpenCallback(true)}>Заказать звонок</button>
            </div>
          </div>

          <nav className="hero-nav">
            <a href="/about" className="menu-link">О КОМПАНИИ</a>
            <a>/</a>
            <div className="menu-projects">
              <a href="/projects" className="menu-link">ПРОЕКТЫ ДОМОВ ▾</a>
              <div className="projects-dropdown">
                {PROJECT_GROUPS.map((column) => (
                  <div key={column.title}>
                    {column.groups.map((group) => (
                      <div key={`${column.title}_${group.label}`}>
                        {group.items.map((item) => (
                          <a key={item} href={`/projects?type=${encodeURIComponent(item)}`} className="dropdown-link">{item}</a>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <a>/</a>
            <div className="menu-services">
              <a href="/baths" className="menu-link">БАНИ ▾</a>
              <div className="services-dropdown">
                {BATHS_MENU_ITEMS.map((item) => (
                  <a key={item} href={`/baths?type=${encodeURIComponent(item)}`} className="dropdown-link">{item}</a>
                ))}
              </div>
            </div>
            <a>/</a>
            <div className="menu-services">
              <a className="menu-link">УСЛУГИ ▾</a>
              <div className="services-dropdown">
                {serviceColumns.map((column, index) => (
                  <div className="dropdown-col" key={`service-col-${index}`}>
                    {column.map((item) => (
                      <a key={item.slug} href={`/services/${item.slug}`} className="dropdown-link">{item.title}</a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <a>/</a><a href="/design" className="menu-link">ПРОЕКТИРОВАНИЕ</a><a>/</a><a href="/portfolio" className="menu-link">ПОРТФОЛИО</a><a>/</a>
            <div className="menu-promotions">
              <a className="menu-link">СКИДКИ И АКЦИИ ▾</a>
              <div className="services-dropdown">
                {PROMOTIONS_MENU.map((item) => (
                  <a key={item.slug} href={`/discounts/${item.slug}`} className="dropdown-link">{item.title}</a>
                ))}
              </div>
            </div>
            <a>/</a><a href="/contacts" className="menu-link">КОНТАКТЫ</a>
          </nav>

          <div className="hero-content">
            <h1>Строительство домов под ключ в Пензе</h1>
            <div className="hero-stats">
              <div><strong>10 лет</strong><span>Строим дома и бани полностью под ключ</span></div>
              <div><strong>Более 200</strong><span>Построенных объектов по всей области</span></div>
              <div><strong>Более 400</strong><span>Проектов под любой бюджет</span></div>
            </div>
            <div className="hero-buttons">
              <a href="#catalog" className="btn-green"><i>▣</i> ПОСМОТРЕТЬ ПРОЕКТЫ</a>
              <a href="#lead-form" className="btn-yellow"><i>⌂</i> ЗАКАЗАТЬ ДОМ</a>
            </div>
          </div>
        </div>

        <button className="floating-call">☎</button>
      </header>

      <section className="offer-section">
        <div className="container">
          <h2 className="offer-title">Мы предлагаем</h2>
          <div className="offer-grid">
            <article className="offer-card wide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1000&q=80')" }}>
              <div className="offer-overlay">
                <h3>Проекты домов</h3>
                <a href="/projects?type=Из%20газобетона">Из газобетона</a>
                <a href="/projects?type=Каркасные">Каркасные</a>
                <a href="/projects?type=Модульные">Модульные</a>
              </div>
            </article>
            <article className="offer-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1000&q=80')" }}>
              <div className="offer-overlay">
                <h3>Бани</h3>
                <a href="/baths?type=Модульные">Модульные</a>
                <a href="/baths?type=Каркасные">Каркасные</a>
              </div>
            </article>
            <article className="offer-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80')" }}>
              <div className="offer-overlay">
                <h3><a href="/design">Проектирование</a></h3>
              </div>
            </article>
            <article className="offer-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1000&q=80')" }}>
              <div className="offer-overlay">
                <h3>Услуги</h3>
                <a href="/services/fundament">Фундамент</a>
                <a href="/services/skvazhiny">Скважины</a>
                <a href="/services/remont">Ремонт</a>
              </div>
            </article>
            <article className="offer-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1000&q=80')" }}>
              <div className="offer-overlay">
                <h3><a href="/discounts/vse-akcii">Скидки и акции</a></h3>
              </div>
            </article>
            <article className="offer-card wide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80')" }}>
              <div className="offer-overlay">
                <h3><a href="/portfolio">Портфолио проектов</a></h3>
                <a href="/projects">Смотреть все проекты домов</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section alt" id="catalog">
        <div className="container">
          <h2>Популярные проекты</h2>
          <select className="type-filter" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {constructionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="catalog-grid home-project-grid">
            {catalogProjects.map((project) => <ProjectTile project={project} key={project.id} />)}
          </div>
          <div className="show-all-wrap"><a href="/projects" className="show-all-link">Показать все проекты</a></div>
        </div>
      </section>

      <section className="steps-section">
        <div className="container">
          <h2 className="steps-title">Этапы работы</h2>
          <div className="steps-grid">
            <article className="step-card">
              <div className="step-number">1</div>
              <div>
                <h3>Подбор проекта</h3>
                <small>1-3 дня</small>
                <p>Подбираем подходящий проект, согласовываем планировку и бюджет.</p>
              </div>
            </article>
            <article className="step-card">
              <div className="step-number">2</div>
              <div>
                <h3>Проектирование</h3>
                <small>10-15 дней</small>
                <p>Готовим архитектурные и инженерные решения под ваш участок.</p>
              </div>
            </article>
            <article className="step-card wide">
              <div className="step-number">3</div>
              <div>
                <h3>Доставка материалов и оплата</h3>
                <small>1 день</small>
                <p>Подписываем договор и организуем поставку материалов в назначенную дату.</p>
              </div>
            </article>
            <article className="step-card">
              <div className="step-number">4</div>
              <div>
                <h3>Строительство коробки</h3>
                <small>10-20 дней</small>
                <p>Выполняем фундамент, стены и кровлю по согласованному графику.</p>
              </div>
            </article>
            <article className="step-card">
              <div className="step-number">5</div>
              <div>
                <h3>Сдача дома</h3>
                <small>2 дня</small>
                <p>Проверяем качество, подписываем акты и передаем ключи.</p>
              </div>
            </article>
          </div>
        </div>
      </section>


      <section className="why-section">
        <div className="container">
          <h2 className="why-title">Почему выбирают нас</h2>
          <div className="why-grid">
            <article className="why-card">
              <div className="why-icon">🛠</div>
              <div><h3>Ответственное строительство</h3><p>Опытные инженеры и прорабы с большим практическим опытом.</p></div>
            </article>
            <article className="why-card">
              <div className="why-icon">🧾</div>
              <div><h3>Понятная смета</h3><p>Под каждый проект готовим прозрачную смету без скрытых пунктов.</p></div>
            </article>
            <article className="why-card">
              <div className="why-icon">📌</div>
              <div><h3>Фиксированная стоимость работ</h3><p>Цена фиксируется в договоре и не меняется в ходе строительства.</p></div>
            </article>
            <article className="why-card">
              <div className="why-icon">🤝</div>
              <div><h3>Человеческое отношение</h3><p>Всегда готовы обсудить пожелания и предложить лучший вариант.</p></div>
            </article>
            <article className="why-card">
              <div className="why-icon">🏦</div>
              <div><h3>Помощь с ипотекой</h3><p>Подбираем оптимальные программы кредитования под ваш бюджет.</p></div>
            </article>
            <article className="why-card">
              <div className="why-icon">✅</div>
              <div><h3>Гарантия по договору</h3><p>Закрепляем сроки и качество работ в официальных документах.</p></div>
            </article>
          </div>
          <div className="why-badges">
            <span>✔ Работаем с материнским капиталом</span>
            <span>✔ Помогаем экономить на строительстве</span>
            <span>✔ Строим в кредит и ипотеку</span>
            <span>✔ Даем скидки на страхование дома</span>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <h2 className="faq-title">Вопросы и ответы по строительству домов</h2>
          <div className="faq-grid">
            {[
              { q: 'Сколько будет стоить строительство дома?', a: 'Цена зависит от площади, материала и комплектации. Для точной оценки подготовим детальную смету.' },
              { q: 'В какое время года лучше всего начинать строительство?', a: 'Старт возможен круглый год, но чаще выбирают весну и лето для ускорения сроков.' },
              { q: 'Можно ли обойтись без внешней отделки дома первое время?', a: 'Да, можно. Мы подскажем безопасную временную схему без рисков для конструкции.' },
              { q: 'Какой фундамент лучше всего подойдет для загородного коттеджа?', a: 'Тип фундамента определяем после геологии и анализа грунта на вашем участке.' },
              { q: 'Почему частные бригады часто выходят дороже?', a: 'Из-за переделок, срывов сроков и неполных смет. В компании эти риски закрываются договором.' },
              { q: 'Какой материал выбрать для круглогодичного проживания?', a: 'Зависит от бюджета и задач. Часто выбирают газоблок или кирпич с эффективным утеплением.' },
              { q: 'Кто будет контролировать ход строительства?', a: 'За объект отвечает прораб и инженер технадзора, отчетность отправляем клиенту по этапам.' },
              { q: 'Что дороже: типовой проект или индивидуальный?', a: 'Индивидуальный проект обычно дороже, но позволяет полностью учесть пожелания семьи.' }
            ].map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div className={`faq-item ${isOpen ? 'active' : ''}`} key={item.q}>
                  <button className="faq-question" onClick={() => setOpenFaq(isOpen ? null : index)}>
                    <span>{item.q}</span>
                    <b className="faq-arrow">⌄</b>
                  </button>
                  {isOpen ? <p className="faq-answer">{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lead-bg-section" id="lead-form">
        <div className="container lead-layout">
          <aside className="lead-side">
            <h2>Стать клиентом</h2>
            <p>Заполните форму и наш менеджер вам перезвонит</p>
          </aside>

          <form className="lead-form" onSubmit={submitLead}>
            <div className="lead-top-row">
              <label>
                Имя
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Телефон*
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>
              <label>
                E-mail
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>
            <label>
              Сообщение
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
            </label>
            <button type="submit" className="lead-submit">✉ ОТПРАВИТЬ ДАННЫЕ</button>
            <p className="lead-consent">Заполняя форму, вы даете согласие на обработку персональных данных.</p>
            {status ? <p className="status">{status}</p> : null}
          </form>
        </div>
      </section>

      <SiteFooter />
      <CallbackModal open={openCallback} onClose={() => setOpenCallback(false)} />
    </div>
  );
}


function Breadcrumbs({ items }: { items: string[] }) {
  return <div className="breadcrumbs">{items.join(' / ')}</div>;
}

function InternalTextBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="internal-body">
      <div className="container">
        <Breadcrumbs items={["Главная", title]} />
        <h1>{title}</h1>
        <div className="internal-text-box">
          <p>{content}</p>
        </div>
      </div>
    </section>
  );
}

function InternalHeader() {
  const serviceColumns = chunkBy(SERVICES_MENU, 6);
  const [openCallback, setOpenCallback] = useState(false);
  return (
    <header className="hero hero-exact internal-header">
      <div className="promo-strip">
        <div className="container promo-inner">
          <strong><a href="/discounts/ipoteka-i-kredit">СТРОИТЕЛЬСТВО ДОМОВ В КРЕДИТ И ИПОТЕКУ ОТ 9.5% ГОДОВЫХ!</a></strong>
          <a className="promo-btn" href="/discounts/ipoteka-i-kredit">Узнать условия <span>»</span></a>
        </div>
      </div>
      <div className="top-search-row">
        <div className="container top-search-inner">
          <SearchBox />
          <div className="top-contacts"><a href={CONTACTS.vk} target="_blank" rel="noreferrer">VK</a><a href={CONTACTS.telegram} target="_blank" rel="noreferrer">Telegram</a><a href={CONTACTS.max} target="_blank" rel="noreferrer">MAX</a><span><i>⤴</i> Свой проект на расчёт</span></div>
        </div>
      </div>
      <div className="container hero-main">
        <div className="hero-upper-row">
          <a href="/" className="brand-line"><div className="logo-badge"><img src="/assets/logo_small.png" alt="Evtenia" /></div><div className="brand-text"><div className="brand-logo">Evtenia</div><p>Строительная компания</p></div></a>
          <div className="hero-contact-line"><span>Нужна примерная оценка стоимости строительства? <b>|</b> <u>Рассчитать онлайн</u></span><div className="phone-block"><strong><a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a></strong><small>с 9:00 до 19:00</small></div><button className="call-btn" onClick={() => setOpenCallback(true)}>Заказать звонок</button></div>
        </div>
        <nav className="hero-nav">
          <a href="/about" className={`menu-link ${window.location.pathname === '/about' ? 'active' : ''}`}>О КОМПАНИИ</a><a>/</a>
          <div className="menu-projects">
            <a href="/projects" className={`menu-link ${window.location.pathname === '/projects' ? 'active' : ''}`}>ПРОЕКТЫ ДОМОВ ▾</a>
            <div className="projects-dropdown">
              {PROJECT_GROUPS.map((column) => (
                <div key={column.title}>
                  {column.groups.map((group) => (
                    <div key={`${column.title}_${group.label}`}>
                      {group.items.map((item) => (
                        <a key={item} href={`/projects?type=${encodeURIComponent(item)}`} className="dropdown-link">{item}</a>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <a>/</a>
          <div className="menu-services">
            <a href="/baths" className={`menu-link ${window.location.pathname === '/baths' ? 'active' : ''}`}>БАНИ ▾</a>
            <div className="services-dropdown">
              {BATHS_MENU_ITEMS.map((item) => (
                <a key={item} href={`/baths?type=${encodeURIComponent(item)}`} className="dropdown-link">{item}</a>
              ))}
            </div>
          </div>
          <a>/</a>
          <div className="menu-services">
            <a className={`menu-link ${window.location.pathname.startsWith('/services/') ? 'active' : ''}`}>УСЛУГИ ▾</a>
            <div className="services-dropdown">
              {serviceColumns.map((column, index) => (
                <div className="dropdown-col" key={`service-col-${index}`}>
                  {column.map((item) => (
                    <a key={item.slug} href={`/services/${item.slug}`} className="dropdown-link">{item.title}</a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <a>/</a>
          <a href="/design" className={`menu-link ${window.location.pathname === '/design' ? 'active' : ''}`}>ПРОЕКТИРОВАНИЕ</a><a>/</a>
          <a href="/portfolio" className={`menu-link ${window.location.pathname === '/portfolio' ? 'active' : ''}`}>ПОРТФОЛИО</a><a>/</a>
          <div className="menu-promotions">
            <a className={`menu-link ${window.location.pathname.startsWith('/discounts/') ? 'active' : ''}`}>СКИДКИ И АКЦИИ ▾</a>
            <div className="services-dropdown">
              {PROMOTIONS_MENU.map((item) => (
                <a key={item.slug} href={`/discounts/${item.slug}`} className="dropdown-link">{item.title}</a>
              ))}
            </div>
          </div>
          <a>/</a><a href="/contacts" className={`menu-link ${window.location.pathname === '/contacts' ? 'active' : ''}`}>КОНТАКТЫ</a>
        </nav>
      </div>
      <CallbackModal open={openCallback} onClose={() => setOpenCallback(false)} />
    </header>
  );
}

function SearchPage() {
  const query = new URLSearchParams(window.location.search).get('q')?.trim() || '';
  const [projects, setProjects] = useState<HouseProject[]>([]);
  useEffect(() => {
    document.title = `Поиск: ${query || 'запрос пуст'} — Evtenia`;
    fetch(`${API_BASE}/api/projects`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('no api')))).then(setProjects).catch(() => setProjects(FALLBACK_PROJECTS));
  }, [query]);
  const q = query.toLowerCase();
  const results = projects.filter((p) => `${p.title} ${p.shortDescription} ${p.constructionType}`.toLowerCase().includes(q));
  return (
    <div>
      <InternalHeader />
      <section className="internal-body"><div className="container">
        <Breadcrumbs items={["Главная", "Поиск"]} />
        <h1>Результаты поиска</h1>
        {query ? <p>Запрос: <b>{query}</b></p> : <p>Введите запрос в строке поиска.</p>}
        <div className="catalog-grid">{results.map((p) => <ProjectTile key={p.id} project={p} />)}</div>
      </div></section>
      <SiteFooter />
    </div>
  );
}

function AboutPage() {
  const [page, setPage] = useState<ContentPage>({ slug: 'about', title: 'О компании', content: 'Загрузка...' });

  useEffect(() => {
    document.title = 'О компании — Evtenia';
    fetch(`${API_BASE}/api/pages/about`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('not found'))))
      .then((payload: ContentPage) => setPage(payload))
      .catch(() =>
        setPage({
          slug: 'about',
          title: 'О компании',
          content: 'Строительная компания «Evtenia» открыта в 2014 году. Мы строим дома под ключ и сопровождаем клиентов на всех этапах.'
            + ' Evtenia занимается строительством домов и бань под ключ, проектированием, фундаментами, инженерными решениями и благоустройством участка.'
            + ' Работаем по прозрачной смете и договору: от подбора проекта и посадки дома на участок до чистовой отделки и сдачи объекта.'
            + ' В команде — проектировщики, строители, инженеры и дизайнеры, поэтому клиент получает единый центр ответственности, понятные сроки и прогнозируемый результат.'
        })
      );
  }, []);

  return (
    <div>
      <InternalHeader />
      <InternalTextBlock title={page.title} content={page.content} />
      <SiteFooter />
    </div>
  );
}


function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const [openCallback, setOpenCallback] = useState(false);
  return (
    <footer className="site-footer">
      <div className="container footer-layout">
        <div className="footer-main">
          <p className="footer-copy">© 2014-{currentYear}</p>
          <p className="footer-note">Сайт носит информационный характер и не является публичной офертой.</p>
          <div className="footer-links">
            <a href="/about">О компании</a>
            <a href="/contacts">Контакты</a>
            <a href="/portfolio">Портфолио</a>
          </div>
          <div className="footer-columns">
            <div><h4>Проекты домов</h4><a href="/projects?type=Модульные">Модульные</a><a href="/projects?type=Каркасные">Каркасные</a><a href="/projects?type=Из%20газобетона">Из газобетона</a></div>
            <div><h4>Бани</h4><a href="/baths?type=Модульные">Модульные</a><a href="/baths?type=Каркасные">Каркасные</a></div>
            <div><h4>Услуги</h4><a href="/services/fundament">Фундамент</a><a href="/services/skvazhiny">Скважины</a><a href="/services/remont">Ремонт</a><a href="/services/dizainer">Дизайнер</a></div>
            <div><h4>Разделы сайта</h4><a href="/design">Проектирование</a><a href="/portfolio">Портфолио</a><a href="/discounts/vse-akcii">Скидки и акции</a><a href="/contacts">Контакты</a></div>
          </div>
        </div>
        <aside className="footer-side">
          <div className="contact-card"><h4>Контакты</h4><strong><a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a></strong><a className="extra-phone-link" href={CONTACTS.extraPhoneHref}>{CONTACTS.extraPhoneDisplay}</a><button onClick={() => setOpenCallback(true)}>Заказать звонок</button><a href={CONTACTS.vk} target="_blank" rel="noreferrer">VK</a><a href={CONTACTS.telegram} target="_blank" rel="noreferrer">Telegram</a><a href={CONTACTS.max} target="_blank" rel="noreferrer">MAX</a><a href={CONTACTS.emailHref}>{CONTACTS.email}</a></div>
          <div className="social-card"><h4>Мы в соцсетях</h4><div className="social-row"><a href={CONTACTS.vk} target="_blank" rel="noreferrer">VK</a><a href={CONTACTS.telegram} target="_blank" rel="noreferrer">Telegram</a><a href={CONTACTS.max} target="_blank" rel="noreferrer">MAX</a></div></div>
        </aside>
      </div>
      <CallbackModal open={openCallback} onClose={() => setOpenCallback(false)} />
      <a className="ghost-admin" href={`?admin=${ADMIN_KEY}`}>service</a>
    </footer>
  );
}


function CatalogPage({ category, sectionTitle }: { category: 'house' | 'bath'; sectionTitle: string }) {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || 'Все типы';
  const [projects, setProjects] = useState<HouseProject[]>([]);
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [maxArea, setMaxArea] = useState(300);
  const [maxBedrooms, setMaxBedrooms] = useState(6);

  useEffect(() => {
    document.title = `${sectionTitle} — Evtenia`;
    fetch(`${API_BASE}/api/projects`)
      .then((res) => res.json())
      .then((data: HouseProject[]) => setProjects(data))
      .catch(() => setProjects(FALLBACK_PROJECTS));
  }, [sectionTitle]);

  const byCategory = projects.filter((item) => (item.category || 'house') === category);
  const floorOptions = Array.from(new Set(byCategory.map((item) => item.floors))).filter(Boolean);
  const typeOptions = Array.from(new Set(byCategory.map((item) => item.constructionType))).filter(Boolean);
  const styleOptions = [
    'Классический', 'Шале', 'Современный', 'Хай-тек', 'Красивый', 'Скандинавский',
    'Оригинальный', 'Стильный', 'Необычный', 'Европейский', 'Канадский', 'Американский',
    'Немецкий', 'Модерн', 'Фахверк', 'Шведский', 'Простой', 'Барнхаус', 'Финский'
  ];
  const minArea = 20;
  const parseNum = (value: string) => Number((value.match(/\d+/) || ['0'])[0]);

  const filtered = byCategory.filter((item) => {
    const byType = type === 'Все типы' || item.constructionType === type;
    const byFloor = !selectedFloors.length || selectedFloors.includes(item.floors);
    const byArea = parseNum(item.area) <= maxArea;
    const byBedrooms = parseNum(item.bedrooms) <= maxBedrooms;
    const byStyle = !selectedStyles.length || selectedStyles.includes(item.style || '');
    return byType && byFloor && byStyle && byArea && byBedrooms;
  });
  const isTypeLocked = type !== 'Все типы';

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", sectionTitle, type]} />
          <h1>{sectionTitle}</h1>
          <div className="catalog-layout">
            <aside className="catalog-filters">
              <div className="filter-block">
                <h4>Этажность</h4>
                {floorOptions.map((floor) => (
                  <label key={floor}><input type="checkbox" checked={selectedFloors.includes(floor)} onChange={(e) => setSelectedFloors(e.target.checked ? [...selectedFloors, floor] : selectedFloors.filter((f) => f !== floor))} /> {floor}</label>
                ))}
              </div>
              <div className="filter-block filter-block-style">
                <h4>Стиль</h4>
                <div className="style-grid">
                  {styleOptions.map((style) => (
                    <label key={style}>
                      <input
                        type="checkbox"
                        checked={selectedStyles.includes(style)}
                        onChange={(e) => setSelectedStyles(e.target.checked ? [...selectedStyles, style] : selectedStyles.filter((s) => s !== style))}
                      />
                      {' '}{style}
                    </label>
                  ))}
                </div>
              </div>
              <div className="filter-block">
                <h4>Площадь до {maxArea} м²</h4>
                <input type="range" min={minArea} max={300} value={maxArea} onChange={(e) => setMaxArea(Number(e.target.value))} />
              </div>
              <div className="filter-block">
                <h4>Спальни до {maxBedrooms}</h4>
                <input type="range" min={1} max={8} value={maxBedrooms} onChange={(e) => setMaxBedrooms(Number(e.target.value))} />
              </div>
            </aside>

            <div>
              <div className={`type-chips ${isTypeLocked ? 'hidden-type-chips' : ''}`}>
                <button className={type === 'Все типы' ? 'active' : ''} onClick={() => { window.location.href = `${window.location.pathname}?type=${encodeURIComponent('Все типы')}`; }}>Все типы</button>
                {typeOptions.map((option) => (
                  <button key={option} className={type === option ? 'active' : ''} onClick={() => { window.location.href = `${window.location.pathname}?type=${encodeURIComponent(option)}`; }}>{option}</button>
                ))}
              </div>
              <div className="catalog-grid">
                {filtered.map((project) => <ProjectTile project={project} key={project.id} />)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function ProjectTypePage() {
  return <CatalogPage category="house" sectionTitle="Проекты домов" />;
}

function BathsPage() {
  return <CatalogPage category="bath" sectionTitle="Бани" />;
}

function ProjectDetailPage() {
  const projectId = window.location.pathname.replace('/project/', '');
  const [projects, setProjects] = useState<HouseProject[]>(FALLBACK_PROJECTS);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no api'))))
      .then((data: HouseProject[]) => setProjects(data))
      .catch(() => setProjects(FALLBACK_PROJECTS));
  }, []);

  const project = projects.find((item) => item.id === projectId) || FALLBACK_PROJECTS[0];
  const gallery = [project.coverImage, ...(project.images || [])].filter(Boolean).map((img) => resolveMediaUrl(img));

  useEffect(() => {
    document.title = `${project.title} — Evtenia`;
  }, [project.title]);

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", project.category === 'bath' ? "Бани" : "Проекты домов", project.title]} />
          <h1>{project.title}</h1>
          <div className="project-detail-layout">
            <div>
              <div className="project-detail-main-image" style={{ backgroundImage: `url(${gallery[0]})` }} />
              <div className="project-detail-thumbs">
                {gallery.slice(0, 4).map((img) => <span key={img} style={{ backgroundImage: `url(${img})` }} />)}
              </div>
              <div className="project-detail-description">
                <h3>Особенности проекта</h3>
                <p>{project.fullDescription || project.shortDescription}</p>
              </div>
            </div>
            <aside className="project-detail-side">
              <h3>Характеристики</h3>
              <div className="detail-row"><span>Общая площадь</span><b>{project.area}</b></div>
              <div className="detail-row"><span>Комнаты</span><b>{project.bedrooms}</b></div>
              <div className="detail-row"><span>Этажность</span><b>{project.floors}</b></div>
              <div className="detail-row"><span>Тип строительства</span><b>{project.constructionType}</b></div>
              <div className="detail-row"><span>Стиль</span><b>{project.style || 'Современный'}</b></div>
              <strong className="detail-price">{normalizePrice(project.priceFrom)}</strong>
              <button className="detail-btn">Задать вопрос эксперту</button>
            </aside>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function ContactsPage() {
  useEffect(() => {
    document.title = 'Контакты — Evtenia';
  }, []);

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", "Контакты"]} />
          <h1>КОНТАКТЫ</h1>
          <div className="contacts-box">
            <div className="contacts-info">
              <h3>Телефоны:</h3>
              <p><a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a></p>
              <p><a href={CONTACTS.extraPhoneHref}>{CONTACTS.extraPhoneDisplay}</a></p>

              <h3>Время работы:</h3>
              <p>🕘 Без выходных: 9:00–18:00</p>

              <h3>Почта:</h3>
              <p><a href={CONTACTS.emailHref}>{CONTACTS.email}</a></p>

              <div className="contacts-socials">
                <a href={CONTACTS.vk} target="_blank" rel="noreferrer" aria-label="VK">VK</a>
                <a href={CONTACTS.telegram} target="_blank" rel="noreferrer" aria-label="Telegram">TG</a>
                <a href={CONTACTS.max} target="_blank" rel="noreferrer" aria-label="MAX">MAX</a>
              </div>
            </div>
            <div className="contacts-map-wrap">
              <iframe
                title="Карта офиса Evtenia"
                src="https://yandex.ru/map-widget/v1/?um=constructor%3A7f4b7ddad4534e0dbf4fc7174bc0f99384f0186b76310673b5628e6f03ec9552&amp;source=constructor"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    document.title = 'Портфолио — Evtenia';
    fetch(`${API_BASE}/api/portfolio`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('not found'))))
      .then((data: PortfolioItem[]) => setItems(data))
      .catch(() => setItems([]));
  }, []);

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", "Портфолио"]} />
          <h1>ПОРТФОЛИО</h1>
          <div className="portfolio-grid">
            {items.map((item) => (
              <article className="portfolio-card" key={item.id}>
                <div className="portfolio-image" style={{ backgroundImage: `url(${resolveMediaUrl(item.image)})` }}>
                  <h3>{item.title}</h3>
                </div>
                <div className="portfolio-meta-row">
                  <div><strong>Стоимость коробки</strong><span>{item.boxPrice}</span></div>
                  <div><strong>Сроки строительства</strong><span>{item.buildDuration}</span></div>
                  <div><strong>Оценка заказчика</strong><span>{item.rating}</span></div>
                </div>
                <div className="portfolio-review">
                  <div className="avatar">👤</div>
                  <div>
                    <h4>{item.clientName}</h4>
                    <p>{item.review}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function DesignPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    document.title = 'Проектирование — Evtenia';
  }, []);

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Отправка...');
    try {
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message })
      });
      if (!response.ok) {
        throw new Error('bad response');
      }
      setStatus('Спасибо! Мы свяжемся с вами в ближайшее время.');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (_error) {
      setStatus('Заявка сохранена локально. Подключим CRM на следующем этапе.');
    }
  };

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", "Проектирование"]} />
          <h1>ИНДИВИДУАЛЬНОЕ ПРОЕКТИРОВАНИЕ ДОМОВ И КОТТЕДЖЕЙ</h1>

          <div className="internal-text-box design-intro">
            <p>
              Наша компания занимается проектированием домов и коттеджей с продуманной планировкой и внешним видом.
              Даже если у вас нет четкого представления — мы поможем создать идеальный проект будущего дома.
            </p>
            <h3>Что вы получите, заказав проект дома у нас</h3>
            <p>Полный комплекс услуг: разработка концепции дома, проект инженерных коммуникаций и авторский надзор.</p>
            <div className="design-preview-grid">
              <article><img src="https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=900&q=80" alt="Эскизный проект" /><h4>Эскизный проект</h4></article>
              <article><img src="https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=900&q=80" alt="Архитектурный проект" /><h4>Архитектурный проект</h4></article>
              <article><img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80" alt="Конструктивный проект" /><h4>Конструктивный проект</h4></article>
              <article><img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80" alt="Инженерный проект" /><h4>Инженерный проект</h4></article>
            </div>
          </div>

          <section className="design-tariffs">
            <h2>Тарифы</h2>
            <div className="design-tariff-grid">
              <article className="design-tariff-card">
                <h4>Эскизный проект</h4>
                <strong>от 100 руб/м²</strong>
                <p>Общие данные, планы этажей, экспликация помещений и посадка дома на участке.</p>
              </article>
              <article className="design-tariff-card">
                <h4>Архитектурный проект</h4>
                <strong>от 450 руб/м²</strong>
                <p>Фасады, планировочные решения, разрезы, спецификации материалов и визуализация.</p>
              </article>
              <article className="design-tariff-card">
                <h4>Конструктивный проект</h4>
                <strong>от 350 руб/м²</strong>
                <p>Фундамент, схемы армирования, узлы и сечения, ведомости конструктивных элементов.</p>
              </article>
              <article className="design-tariff-card">
                <h4>Инженерный проект</h4>
                <strong>от 450 руб/м²</strong>
                <p>Водоснабжение, канализация, отопление, вентиляция, кондиционирование и электрика.</p>
              </article>
            </div>
          </section>

          <section className="design-order">
            <h2>Для заказа проекта дома — звоните {CONTACTS.mainPhoneDisplay} или отправляйте заявку ↓</h2>
            <form className="lead-form" onSubmit={submitLead}>
              <div className="lead-top-row">
                <label>Имя<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
                <label>Телефон*<input value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
                <label>E-mail<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              </div>
              <label>Сообщение<textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} /></label>
              <button type="submit">✉ ОТПРАВИТЬ ДАННЫЕ</button>
              {status ? <p className="status">{status}</p> : null}
            </form>
          </section>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function SubsectionPage({ sectionTitle, pageTitle, text }: { sectionTitle: string; pageTitle: string; text: string }) {
  useEffect(() => {
    document.title = `${pageTitle} — Evtenia`;
  }, [pageTitle]);

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", sectionTitle, pageTitle]} />
          <h1>{pageTitle}</h1>
          <div className="internal-text-box">
            <p>{text}</p>
            <p>Скоро добавим подробное описание услуги и примеры выполненных работ.</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function AdminPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [projects, setProjects] = useState<HouseProject[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [pageDraft, setPageDraft] = useState<ContentPage | null>(null);
  const [draft, setDraft] = useState<Partial<HouseProject>>({});
  const [portfolioDraft, setPortfolioDraft] = useState<Partial<PortfolioItem>>({});
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('projects');
  const [uploadStatus, setUploadStatus] = useState('');

  const adminHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'x-admin-token': token
    }),
    [token]
  );

  const loadAdminData = async (currentToken: string) => {
    const [projectsRes, leadsRes, pagesRes, portfolioRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/projects`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/leads`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/pages`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/portfolio`, { headers: { 'x-admin-token': currentToken } })
    ]);

    if (!projectsRes.ok || !leadsRes.ok || !pagesRes.ok || !portfolioRes.ok) {
      setError('Не удалось загрузить данные админки');
      return;
    }

    const pagesPayload = (await pagesRes.json()) as ContentPage[];
    setProjects(await projectsRes.json());
    setLeads(await leadsRes.json());
    setPages(pagesPayload);
    setPortfolio(await portfolioRes.json());
    if (!pageDraft && pagesPayload[0]) {
      setPageDraft(pagesPayload[0]);
    }
  };

  const doLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });

    if (!response.ok) {
      setError('Неверный логин или пароль');
      return;
    }

    const payload = (await response.json()) as { token: string };
    setToken(payload.token);
    await loadAdminData(payload.token);
  };

  const saveProject = async () => {
    if (!draft.title) {
      setError('Название проекта обязательно');
      return;
    }

    const method = draft.id ? 'PUT' : 'POST';
    const url = draft.id ? `${API_BASE}/api/admin/projects/${draft.id}` : `${API_BASE}/api/admin/projects`;

    const response = await fetch(url, {
      method,
      headers: adminHeaders,
      body: JSON.stringify(draft)
    });

    if (!response.ok) {
      setError('Не удалось сохранить проект');
      return;
    }

    setDraft({});
    await loadAdminData(token);
  };

  const removeProject = async (id: string) => {
    await fetch(`${API_BASE}/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    await loadAdminData(token);
  };

  const uploadProjectImage = async (file: File, target: 'cover' | 'gallery') => {
    if (!file) return;
    setError('');
    setUploadStatus('Загрузка изображения...');
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_BASE}/api/admin/upload/project-image?target=${target}`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError('Не удалось загрузить изображение');
      return;
    }
    const payload = (await response.json()) as { url: string };
    if (target === 'cover') {
      setDraft((prev) => ({ ...prev, coverImage: payload.url }));
    } else {
      setDraft((prev) => ({ ...prev, images: [...(prev.images || []), payload.url] }));
    }
    setUploadStatus('Изображение загружено и оптимизировано');
  };


  const savePage = async () => {
    if (!pageDraft) return;

    const response = await fetch(`${API_BASE}/api/admin/pages/${pageDraft.slug}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify(pageDraft)
    });

    if (!response.ok) {
      setError('Не удалось сохранить внутреннюю страницу');
      return;
    }

    await loadAdminData(token);
  };

  const savePortfolio = async () => {
    if (!portfolioDraft.title) {
      setError('Название кейса обязательно');
      return;
    }

    const method = portfolioDraft.id ? 'PUT' : 'POST';
    const url = portfolioDraft.id ? `${API_BASE}/api/admin/portfolio/${portfolioDraft.id}` : `${API_BASE}/api/admin/portfolio`;
    const response = await fetch(url, {
      method,
      headers: adminHeaders,
      body: JSON.stringify({ ...portfolioDraft, rating: Number(portfolioDraft.rating || 5) })
    });

    if (!response.ok) {
      setError('Не удалось сохранить кейс портфолио');
      return;
    }

    setPortfolioDraft({});
    await loadAdminData(token);
  };

  const removePortfolio = async (id: string) => {
    await fetch(`${API_BASE}/api/admin/portfolio/${id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    await loadAdminData(token);
  };

  if (!token) {
    return (
      <div className="admin-wrap">
        <h1>Служебный вход</h1>
        <form className="admin-form" onSubmit={doLogin}>
          <input placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} required />
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Войти</button>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <h1>Админка каталога</h1>
      <div className="admin-tabs">
        <button className={activeTab === 'projects' ? 'active' : ''} onClick={() => setActiveTab('projects')}>Проекты</button>
        <button className={activeTab === 'pages' ? 'active' : ''} onClick={() => setActiveTab('pages')}>Страницы</button>
        <button className={activeTab === 'portfolio' ? 'active' : ''} onClick={() => setActiveTab('portfolio')}>Портфолио</button>
        <button className={activeTab === 'leads' ? 'active' : ''} onClick={() => setActiveTab('leads')}>Заявки</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {uploadStatus ? <p>{uploadStatus}</p> : null}

      {activeTab === 'projects' ? <div className="admin-grid"><section>
          <h2>{draft.id ? 'Редактирование проекта' : 'Новый проект'}</h2>
          <div className="admin-form">
            <input placeholder="Название" value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <input placeholder="Площадь" value={draft.area || ''} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
            <input placeholder="Этажность" value={draft.floors || ''} onChange={(e) => setDraft({ ...draft, floors: e.target.value })} />
            <input placeholder="Спальни" value={draft.bedrooms || ''} onChange={(e) => setDraft({ ...draft, bedrooms: e.target.value })} />
            <input placeholder="Цена" value={draft.priceFrom || ''} onChange={(e) => setDraft({ ...draft, priceFrom: e.target.value })} />
            <input placeholder="Бейдж" value={draft.badge || ''} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
            <textarea
              rows={3}
              placeholder="Описание"
              value={draft.shortDescription || ''}
              onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })}
            />
            <button onClick={saveProject}>Сохранить</button>
            
            <textarea
              rows={4}
              placeholder="Полное описание"
              value={draft.fullDescription || ''}
              onChange={(e) => setDraft({ ...draft, fullDescription: e.target.value })}
            />
            <input placeholder="Картинка обложка" value={draft.coverImage || ''} onChange={(e) => setDraft({ ...draft, coverImage: e.target.value })} />
            <label>Загрузить обложку<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadProjectImage(file, 'cover'); e.currentTarget.value = ''; }} /></label>
            <textarea
              rows={2}
              placeholder="Картинки (через запятую)"
              value={Array.isArray(draft.images) ? draft.images.join(', ') : ''}
              onChange={(e) => setDraft({ ...draft, images: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
            />
            <label>Загрузить фото в галерею<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadProjectImage(file, 'gallery'); e.currentTarget.value = ''; }} /></label>
            <input placeholder="Сумма от" value={draft.priceFrom || ''} onChange={(e) => setDraft({ ...draft, priceFrom: e.target.value })} />
            <select value={draft.category || 'house'} onChange={(e) => setDraft({ ...draft, category: e.target.value as 'house' | 'bath' })}>
              <option value="house">Проекты домов</option>
              <option value="bath">Бани</option>
            </select>
            <select value={draft.constructionType || 'Газобетон'} onChange={(e) => setDraft({ ...draft, constructionType: e.target.value })}>
              {["Газобетон","Арболит","Керамзитобетонные блоки","Кирпич","Оцилиндрованное бревно","Рубленное бревно","Лафет","Профилированный брус","Клееный брус","Двойной брус","Каркасные","SIP панели","Строительство дачных домов под ключ"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {draft.id ? <button onClick={() => setDraft({})}>Отменить</button> : null}
          </div>
        </section>

        <section>
          <h2>Проекты ({projects.length})</h2>
          <div className="list">
            {projects.map((project) => (
              <div key={project.id} className="list-item">
                <div>
                  <strong>{project.title}</strong>
                  <p>{project.priceFrom}</p>
                </div>
                <div className="actions">
                  <button onClick={() => setDraft(project)}>Изменить</button>
                  <button onClick={() => removeProject(project.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div> : null}

      {activeTab === 'pages' ? <section>
        <h2>Внутренние страницы</h2>
        <div className="admin-form">
          <select
            value={pageDraft?.slug || ''}
            onChange={(e) => {
              const selected = pages.find((item) => item.slug === e.target.value) || null;
              setPageDraft(selected);
            }}
          >
            {pages.map((page) => (
              <option key={page.slug} value={page.slug}>{page.title}</option>
            ))}
          </select>
          <input
            placeholder="Заголовок"
            value={pageDraft?.title || ''}
            onChange={(e) => setPageDraft(pageDraft ? { ...pageDraft, title: e.target.value } : null)}
          />
          <textarea
            rows={6}
            placeholder="Контент"
            value={pageDraft?.content || ''}
            onChange={(e) => setPageDraft(pageDraft ? { ...pageDraft, content: e.target.value } : null)}
          />
          <button onClick={savePage}>Сохранить страницу</button>
        </div>
      </section> : null}

      {activeTab === 'portfolio' ? <div className="admin-grid"><section>
          <h2>{portfolioDraft.id ? 'Редактирование кейса' : 'Новый кейс портфолио'}</h2>
          <div className="admin-form">
            <input placeholder="Название объекта" value={portfolioDraft.title || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, title: e.target.value })} />
            <input placeholder="Ссылка на фото" value={portfolioDraft.image || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, image: e.target.value })} />
            <input placeholder="Стоимость коробки" value={portfolioDraft.boxPrice || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, boxPrice: e.target.value })} />
            <input placeholder="Срок строительства" value={portfolioDraft.buildDuration || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, buildDuration: e.target.value })} />
            <input placeholder="Оценка заказчика (1-5)" value={String(portfolioDraft.rating || 5)} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, rating: Number(e.target.value) })} />
            <input placeholder="Имя заказчика" value={portfolioDraft.clientName || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, clientName: e.target.value })} />
            <textarea rows={4} placeholder="Отзыв" value={portfolioDraft.review || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, review: e.target.value })} />
            <button onClick={savePortfolio}>Сохранить кейс</button>
            {portfolioDraft.id ? <button onClick={() => setPortfolioDraft({})}>Отменить</button> : null}
          </div>
        </section>

        <section>
          <h2>Портфолио ({portfolio.length})</h2>
          <div className="list">
            {portfolio.map((item) => (
              <div key={item.id} className="list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.boxPrice}</p>
                </div>
                <div className="actions">
                  <button onClick={() => setPortfolioDraft(item)}>Изменить</button>
                  <button onClick={() => removePortfolio(item.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div> : null}

      {activeTab === 'leads' ? <section>
        <h2>Заявки ({leads.length})</h2>
        <div className="list">
          {leads.map((lead) => (
            <div key={lead.id} className="list-item">
              <div>
                <strong>
                  {lead.name} — {lead.phone}
                </strong>
                <p>{lead.message || 'Без комментария'}</p>
              </div>
              <small>{new Date(lead.createdAt).toLocaleString('ru-RU')}</small>
            </div>
          ))}
        </div>
      </section> : null}
    </div>
  );
}

function App() {
  const url = new URL(window.location.href);
  const pathname = window.location.pathname;
  const serviceSlug = pathname.startsWith('/services/') ? pathname.replace('/services/', '') : '';
  const discountSlug = pathname.startsWith('/discounts/') ? pathname.replace('/discounts/', '') : '';
  const servicePage = SERVICES_MENU.find((item) => item.slug === serviceSlug);
  const discountPage = PROMOTIONS_MENU.find((item) => item.slug === discountSlug);
  const isAdminRoute =
    pathname.endsWith(ADMIN_PATH) ||
    window.location.hash === `#${ADMIN_KEY}` ||
    url.searchParams.get('admin') === ADMIN_KEY;

  if (isAdminRoute) return <AdminPage />;
  if (pathname === '/about') return <AboutPage />;
  if (pathname === '/projects') return <ProjectTypePage />;
  if (pathname === '/baths') return <BathsPage />;
  if (pathname.startsWith('/project/')) return <ProjectDetailPage />;
  if (pathname === '/design') return <DesignPage />;
  if (pathname === '/search') return <SearchPage />;
  if (servicePage) return <SubsectionPage sectionTitle="Услуги" pageTitle={servicePage.title} text={servicePage.text} />;
  if (discountPage) return <SubsectionPage sectionTitle="Скидки и акции" pageTitle={discountPage.title} text={discountPage.text} />;
  if (pathname === '/portfolio') return <PortfolioPage />;
  if (pathname === '/contacts') return <ContactsPage />;
  return <PublicPage />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
