import React, { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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

type LandPlot = {
  id: string;
  cadastralNumber: string;
  area: string;
  price: string;
  district: string;
  images?: string[];
  mapUrl?: string;
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

type ManagedPageLink = {
  slug: string;
  title: string;
  sectionTitle: string;
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
type SiteSettings = {
  logoUrl: string;
  contactPhotoUrl?: string;
  contactName?: string;
  contactPosition?: string;
  contactPhone?: string;
  contactCityPhone?: string;
  contactEmail?: string;
};

type ProjectGroupColumn = {
  title: string;
  groups: Array<{
    label?: string;
    items: string[];
  }>;
};
type MenuChildItem = { label: string; href?: string; heading?: boolean; children?: MenuChildItem[] };
type MenuItem = {
  label: string;
  href?: string;
  children?: MenuChildItem[];
  active?: boolean;
};
type AdminTab = 'projects' | 'lands' | 'pages' | 'portfolio' | 'leads' | 'settings';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const API_ORIGIN = API_BASE ? new URL(API_BASE, window.location.origin).origin : '';
const loadMoreRef: { current: HTMLDivElement | null } = { current: null };
const pageNumbers: number[] = [];
const totalPages = 1;
const ADMIN_PATH = '/catalog-control-7f3a';
const ADMIN_KEY = 'catalog-control-7f3a';
const CONTACTS = {
  mainPhoneDisplay: '8-902-209-01-79',
  mainPhoneHref: 'tel:+79022090179',
  extraPhoneDisplay: '8-8412-79-01-79',
  extraPhoneHref: 'tel:+78412790179',
  email: '89022099279@mail.ru',
  emailHref: 'mailto:89022099279@mail.ru',
  vk: 'https://vk.ru/evtenia_house',
  max: 'https://max.ru/join/1zjkiv7Ex8ofTgGHuB212RBgUa_GcPjKokLeHSRDj0w',
  telegram: 'https://t.me/evtenia_realty'
};
const OFFICE_ADDRESS = 'г. Пенза, ул. Гоголя, 41';
const PROJECT_GROUPS: ProjectGroupColumn[] = [
  {
    title: 'Проекты домов',
    groups: [
      { label: 'Дома', items: ['Модульные', 'Каркасные', 'Из газобетона'] },
      { label: 'Бани', items: ['Каркасные', 'Модульные'] }
    ]
  }
];
const ADMIN_CONSTRUCTION_TYPES = ['Из газобетона', 'Каркасные', 'Модульные'];
const HOME_PROJECT_CATEGORY_TABS: Array<{ label: string; value: string }> = [
  { label: 'Каркасные', value: 'Каркасные' },
  { label: 'Модульные', value: 'Модульные' },
  { label: 'Газобетонные', value: 'Из газобетона' }
];
const ADMIN_STYLE_OPTIONS = ['Классический', 'Современный', 'Сканди', 'Барнхаус', 'Минимализм', 'Русский'];
const DEFAULT_LOGO_URL = `${API_ORIGIN || window.location.origin}/api/assets/logo_small.png`;
const DEFAULT_CONTACT_PROFILE = {
  contactPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=80',
  contactName: 'Евгения Смирнова',
  contactPosition: 'Руководитель отдела продаж',
  contactPhone: CONTACTS.mainPhoneDisplay,
  contactCityPhone: CONTACTS.extraPhoneDisplay,
  contactEmail: CONTACTS.email
};
const LAND_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';

const SERVICES_MENU = [
  { slug: 'fundament', title: 'Фундамент', text: 'Проектируем и устраиваем фундаменты под тип грунта и нагрузку дома.' },
  { slug: 'besedki', title: 'Беседки', text: 'Строим беседки под ключ: от эскиза до финальной отделки.' },
  { slug: 'septik', title: 'Септик', text: 'Подбираем и монтируем септики с учетом объема стоков и участка.' },
  { slug: 'zabory', title: 'Заборы', text: 'Устанавливаем заборы разных типов: профлист, евроштакетник, дерево.' },
  { slug: 'skvazhiny', title: 'Скважины', text: 'Бурим и обустраиваем скважины под дом и баню с подбором оборудования.' },
  { slug: 'vyvoz-musora', title: 'Вывоз мусора', text: 'Организуем оперативный вывоз строительного и бытового мусора с объекта.' },
  { slug: 'styazhka-pola', title: 'Стяжка пола', text: 'Делаем полусухую и бетонную стяжку с соблюдением уровня и сроков набора прочности.' },
  { slug: 'konditsionery', title: 'Кондиционеры', text: 'Подбираем, устанавливаем и обслуживаем кондиционеры для дома и бани.' },
  { slug: 'interernoe-ozelenenie', title: 'Интерьерное озеленение', text: 'Создаем проекты озеленения интерьера и подбираем растения под условия помещения.' },
  { slug: 'otsenka-nedvizhimosti', title: 'Оценка недвижимости', text: 'Проводим профессиональную оценку недвижимости для продажи, ипотеки и юридических задач.' },
  { slug: 'plastikovye-okna', title: 'Пластиковые окна', text: 'Подбираем и устанавливаем ПВХ-окна с учетом теплопотерь и дизайна.' },
  { slug: 'dveri', title: 'Двери', text: 'Входные и межкомнатные двери с монтажом и фурнитурой.' },
  { slug: 'remont', title: 'Ремонт', text: 'Выполняем внутренний ремонт и отделку домов под ключ.' },
  { slug: 'lestnitsy', title: 'Лестницы', text: 'Проектируем и изготавливаем деревянные и комбинированные лестницы.' },
  { slug: 'svai', title: 'Сваи', text: 'Монтаж винтовых и железобетонных свай под разные типы грунта.' },
  { slug: 'dizainer', title: 'Дизайнер', text: 'Разрабатываем дизайн-концепцию интерьеров и экстерьеров.' },
  { slug: 'landshaftnyy-dizayn', title: 'Ландшафтный дизайн', text: 'Проектируем благоустройство участка и озеленение территории.' },
  { slug: 'mezhevanie', title: 'Межевание', text: 'Готовим документы и выполняем межевание земельных участков.' },
  { slug: 'ipoteka-oformlenie', title: 'Ипотека. Оформление', text: 'Помогаем с подбором банка, программой, пакетом документов и сопровождением сделки.' }
];

const PROMOTIONS_MENU = [
  { slug: 'ipoteka-i-kredit', title: 'Ипотека и кредит', text: 'Подберем комфортную программу ипотеки или кредита на строительство.' },
  { slug: 'vse-akcii', title: 'Все акции', text: 'Здесь публикуем актуальные скидки, акции и специальные предложения.' }
];

const FURNITURE_STRUCTURE = [
  { title: 'КУХНИ', brands: ['NOBILIA', 'HAECKER'] },
  { title: 'ОБЕДЕННЫЕ ГРУППЫ', brands: ['DRESSY', 'MOBILBERICA', 'FURMAN', 'CAMEL GROUP', 'DRAENERT'] },
  { title: 'СПАЛЬНИ', brands: ['ALF DAFRE', 'CAMEL GROUP', 'FRATELLI BARI', 'RUF BETTEN', 'THIELEMEYER', 'EVANTY'] },
  { title: 'ГОСТИНЫЕ И СТЕНКИ', brands: ['HARTMANN', 'ALF DAFRE', 'CAMEL GROUP', 'FRATELLI BARI', 'EVANTY'] },
  { title: 'МЯГКАЯ МЕБЕЛЬ', brands: ['FURMAN', 'RELOTTI', 'ROLF BENZ', 'FAMA', 'HIMOLLA', 'CAMEL GROUP', 'EVANTY'] },
  { title: 'ДЕТСКИЕ', brands: ['MOLL'] },
  { title: 'КАБИНЕТЫ', brands: ['CAMEL GROUP', 'PROFOFFICE'] },
  { title: 'МАТРАСЫ', brands: ['HUKLA'] }
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '');
}

function normalizePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

const FURNITURE_MENU_CHILDREN: MenuChildItem[] = FURNITURE_STRUCTURE.map((category) => ({
  label: category.title,
  children: category.brands.map((brand) => ({
    label: brand,
    href: `/furniture/${slugify(category.title)}/${slugify(brand)}`
  }))
}));

const FURNITURE_LEAF_PAGES = FURNITURE_STRUCTURE.flatMap((category) =>
  category.brands.map((brand) => ({
    categoryTitle: category.title,
    brandTitle: brand,
    href: `/furniture/${slugify(category.title)}/${slugify(brand)}`
  }))
);

function chunkBy<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

const NAV_MENU_DEFAULT_ORDER = ['home', 'about', 'projects', 'lands', 'services', 'design', 'portfolio', 'furniture', 'promotions', 'contacts'] as const;
type NavMenuKey = (typeof NAV_MENU_DEFAULT_ORDER)[number];

function normalizeMenuOrder(order?: string[]) {
  const incoming = Array.isArray(order) ? order.filter((item): item is NavMenuKey => NAV_MENU_DEFAULT_ORDER.includes(item as NavMenuKey)) : [];
  if (incoming.length === NAV_MENU_DEFAULT_ORDER.length) return incoming;
  return [...NAV_MENU_DEFAULT_ORDER];
}

function formatPhoneMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
  const withCountry = normalized.startsWith('7') ? normalized : `7${normalized}`;
  const d = withCountry.slice(0, 11);
  let result = '+7';
  if (d.length > 1) result += ` (${d.slice(1, 4)}`;
  if (d.length >= 4) result += ')';
  if (d.length > 4) result += ` ${d.slice(4, 7)}`;
  if (d.length > 7) result += `-${d.slice(7, 9)}`;
  if (d.length > 9) result += `-${d.slice(9, 11)}`;
  return result;
}

async function getApiErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string; error?: string };
      return payload.message || payload.error || fallback;
    }
    const text = (await response.text()).trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

function sanitizeCmsHtml(html: string) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.body.querySelectorAll('*').forEach((node) => {
    ['style', 'id', 'width', 'height'].forEach((attr) => node.removeAttribute(attr));
    const className = node.getAttribute('class') || '';
    const allowedClasses = ['cms-gallery', 'single', 'cols-2', 'cols-3', 'align-left', 'align-center', 'align-right', 'size-sm', 'size-md', 'cms-image-grid', 'grid2', 'grid3', 'cms-slider', 'cms-slider-track', 'cms-slider-btn', 'prev', 'next'];
    const normalized = className
      .split(' ')
      .filter((item) => allowedClasses.includes(item))
      .join(' ')
      .trim();
    if (normalized) node.setAttribute('class', normalized);
    else node.removeAttribute('class');
  });
  return doc.body.innerHTML;
}

function CmsHtmlContent({ html }: { html: string }) {
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);

  const closeSlider = () => setSliderImages([]);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  const nextImage = () => setActiveImage((prev) => (prev + 1) % sliderImages.length);

  return (
    <>
      <div
        className="cms-content"
        onClick={(event) => {
          const target = event.target as HTMLElement | null;
          const sliderButton = target?.closest('button.cms-slider-btn') as HTMLButtonElement | null;
          if (sliderButton) {
            event.preventDefault();
            const sliderRoot = sliderButton.closest('.cms-slider');
            const track = sliderRoot?.querySelector('.cms-slider-track') as HTMLElement | null;
            if (!sliderRoot || !track) return;
            const slides = track.querySelectorAll('figure');
            if (!slides.length) return;
            const current = Number(sliderRoot.getAttribute('data-active-index') || '0');
            const direction = sliderButton.classList.contains('next') ? 1 : -1;
            const next = (current + direction + slides.length) % slides.length;
            sliderRoot.setAttribute('data-active-index', String(next));
            track.style.transform = `translateX(-${next * 100}%)`;
            return;
          }
          if (!target || target.tagName !== 'IMG') return;
          const img = target as HTMLImageElement;
          const galleryRoot = img.closest('.cms-gallery, .cms-image-grid, .cms-slider-track');
          const images = galleryRoot
            ? Array.from(galleryRoot.querySelectorAll('img')).map((node) => (node as HTMLImageElement).src).filter(Boolean)
            : [img.src];
          const clickedIndex = Math.max(images.indexOf(img.src), 0);
          setSliderImages(images);
          setActiveImage(clickedIndex);
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {sliderImages.length ? (
        <div className="cms-lightbox" onClick={closeSlider}>
          <div className="cms-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="cms-lightbox-close" onClick={closeSlider}>✕</button>
            {sliderImages.length > 1 ? <button className="cms-lightbox-nav prev" onClick={prevImage}>‹</button> : null}
            <img src={sliderImages[activeImage]} alt={`Изображение ${activeImage + 1}`} />
            {sliderImages.length > 1 ? <button className="cms-lightbox-nav next" onClick={nextImage}>›</button> : null}
            {sliderImages.length > 1 ? <div className="cms-lightbox-count">{activeImage + 1} / {sliderImages.length}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function HeaderNav({
  serviceColumns,
  currentPath,
  menuOrder = [...NAV_MENU_DEFAULT_ORDER]
}: {
  serviceColumns: Array<Array<{ slug: string; title: string }>>;
  currentPath: string;
  menuOrder?: NavMenuKey[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileStack, setMobileStack] = useState<Array<{ title: string; items: MenuChildItem[] }>>([]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileStack([]);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const menuItems: MenuItem[] = useMemo(() => {
    const projectsChildren: MenuChildItem[] = [
      { label: 'Проекты домов', heading: true },
      { label: 'Каркасные', href: `/projects?type=${encodeURIComponent('Каркасные')}` },
      { label: 'Модульные', href: `/projects?type=${encodeURIComponent('Модульные')}` },
      { label: 'Газобетонные', href: `/projects?type=${encodeURIComponent('Из газобетона')}` },
      { label: 'Проекты бань', heading: true },
      { label: 'Модульные', href: `/baths?type=${encodeURIComponent('Модульные')}` },
      { label: 'Каркасные', href: `/baths?type=${encodeURIComponent('Каркасные')}` }
    ];
    const all: Record<NavMenuKey, MenuItem> = {
      home: { label: 'ГЛАВНАЯ', href: '/', active: currentPath === '/' },
      about: { label: 'О КОМПАНИИ', href: '/about', active: currentPath === '/about' },
      projects: { label: 'ПРОЕКТЫ ДОМОВ', href: '/projects', active: currentPath === '/projects' || currentPath === '/baths', children: projectsChildren },
      lands: { label: 'ЗЕМЛЯ', href: '/lands', active: currentPath === '/lands' },
      services: { label: 'УСЛУГИ', active: currentPath.startsWith('/services/'), children: serviceColumns.flatMap((column) => column.map((item) => ({ label: item.title, href: `/services/${item.slug}` }))) },
      design: { label: 'ПРОЕКТИРОВАНИЕ', href: '/design', active: currentPath === '/design' },
      portfolio: { label: 'ПОРТФОЛИО', href: '/portfolio', active: currentPath === '/portfolio' },
      furniture: { label: 'МЕБЕЛЬ', href: '/furniture', active: currentPath === '/furniture' || currentPath.startsWith('/furniture/'), children: FURNITURE_MENU_CHILDREN },
      promotions: { label: 'ИПОТЕКА И АКЦИИ', active: currentPath.startsWith('/discounts/'), children: PROMOTIONS_MENU.map((item) => ({ label: item.title, href: `/discounts/${item.slug}` })) },
      contacts: { label: 'КОНТАКТЫ', href: '/contacts', active: currentPath === '/contacts' }
    };
    return menuOrder.map((key) => all[key]).filter(Boolean);
  }, [currentPath, serviceColumns, menuOrder]);

  const activeMobileLevel = mobileStack[mobileStack.length - 1];

  return (
    <>
      <div className="mobile-nav-trigger-row">
        <button className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(true)} aria-label="Открыть меню">
          ☰
        </button>
      </div>
      <nav className="hero-nav">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.label}>
            {item.children ? (
              <div className={`menu-services ${item.label === 'ПРОЕКТЫ ДОМОВ' ? 'menu-projects' : item.label === 'ИПОТЕКА И АКЦИИ' ? 'menu-promotions' : item.label === 'МЕБЕЛЬ' ? 'menu-furniture' : ''}`}>
                {item.href ? (
                  <a href={item.href} className={`menu-link ${item.active ? 'active' : ''}`}>{item.label} ▾</a>
                ) : (
                  <button type="button" className={`menu-link menu-link-btn ${item.active ? 'active' : ''}`}>{item.label} ▾</button>
                )}
                <div className={item.label === 'ПРОЕКТЫ ДОМОВ' ? 'projects-dropdown' : 'services-dropdown'}>
                  {item.children.map((child, idx) => (
                    child.children ? (
                      <div className="dropdown-col" key={`${child.label}_${idx}`}>
                        <span className="dropdown-heading">{child.label}</span>
                        {child.children.map((nested, nestedIdx) => (
                          <a key={nested.href || `${nested.label}_${nestedIdx}`} href={nested.href} className={`dropdown-link ${nested.href && window.location.pathname === nested.href ? 'active' : ''}`}>{nested.label}</a>
                        ))}
                      </div>
                    ) : child.heading ? (
                      <span key={`${child.label}_${idx}`} className="dropdown-heading">{child.label}</span>
                    ) : (
                      <a key={child.href || `${child.label}_${idx}`} href={child.href} className={`dropdown-link ${child.href && window.location.pathname + window.location.search === child.href ? 'active' : ''}`}>{child.label}</a>
                    )
                  ))}
                </div>
              </div>
            ) : (
              <a href={item.href} className={`menu-link ${item.active ? 'active' : ''}`}>{item.label}</a>
            )}
            {index < menuItems.length - 1 ? <span>/</span> : null}
          </React.Fragment>
        ))}
      </nav>
      {mobileMenuOpen ? (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-head">
              {activeMobileLevel ? (
                <button className="mobile-menu-back" onClick={() => setMobileStack((prev) => prev.slice(0, -1))}>← Назад</button>
              ) : <span />}
              <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Закрыть меню">✕</button>
            </div>
            <h3>{activeMobileLevel ? activeMobileLevel.title : 'Меню'}</h3>
            <div className="mobile-menu-list">
              {activeMobileLevel
                ? activeMobileLevel.items.map((item, idx) => (
                  item.children ? (
                    <button
                      key={`${item.label}_${idx}`}
                      className="mobile-menu-item mobile-menu-item-btn"
                      onClick={() => setMobileStack((prev) => [...prev, { title: item.label, items: item.children || [] }])}
                    >
                      {item.label} →
                    </button>
                  ) : item.heading ? (
                    <strong key={`${item.label}_${idx}`} className="mobile-menu-item">{item.label}</strong>
                  ) : (
                    <a key={item.href || `${item.label}_${idx}`} href={item.href} className={`mobile-menu-item ${item.href && window.location.pathname + window.location.search === item.href ? 'active' : ''}`}>{item.label}</a>
                  )
                ))
                : menuItems.map((item) => (
                  item.children ? (
                    <button
                      key={item.label}
                      className="mobile-menu-item mobile-menu-item-btn"
                      onClick={() => setMobileStack((prev) => [...prev, { title: item.label, items: item.children || [] }])}
                    >
                      {item.label} →
                    </button>
                  ) : (
                    <a key={item.label} href={item.href} className="mobile-menu-item">{item.label}</a>
                  )
                ))}
            </div>
            {!activeMobileLevel ? (
              <div className="mobile-menu-contact">
                <a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a>
                <small>Ежедневно с 9:00 до 19:00</small>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
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
    style: 'Сканди',
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
  const formattedDigits = value.replace(/\d{4,}/g, (chunk) => Number(chunk).toLocaleString('ru-RU'));
  const withPrefix = formattedDigits.toLowerCase().startsWith('от') ? formattedDigits : `от ${formattedDigits}`;
  const hasRuble = /₽|руб\.?/i.test(withPrefix);
  return hasRuble ? withPrefix : `${withPrefix} ₽`;
}

function resolveMediaUrl(url?: string) {
  const value = (url || '').trim();
  if (!value) return '';
  if (value.startsWith('/assets/')) return `${API_ORIGIN || window.location.origin}/api${value}`;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      const safeProtocol = window.location.protocol === 'https:' && parsed.protocol === 'http:' ? 'https:' : parsed.protocol;
      if (parsed.pathname.startsWith('/assets/')) {
        return `${safeProtocol}//${parsed.host}/api${parsed.pathname}`;
      }
      if (safeProtocol !== parsed.protocol) return `${safeProtocol}//${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return value;
    }
  }
  return value;
}

function CallbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Отправка...');
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Клиент',
          phone,
          email: CONTACTS.email,
          message: 'Заказ звонка с сайта'
        })
      });
      if (!res.ok) throw new Error('bad');
      setStatus('');
      setPhone('');
      setSubmitted(true);
    } catch {
      setStatus('Не удалось отправить заявку. Попробуйте позже.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card callback-modal" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="callback-success">
            <h3>Спасибо!</h3>
            <p>Заявка отправлена, мы перезвоним вам в ближайшее время.</p>
            <button type="button" onClick={() => { setSubmitted(false); onClose(); }}>Закрыть</button>
          </div>
        ) : (
          <>
            <h3>Заказать звонок</h3>
            <form onSubmit={submit}>
              <label>
                Телефон
                <input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                  required
                />
              </label>
              <button type="submit">Перезвоните мне</button>
            </form>
            <a className="modal-policy" href="/privacy-policy">Политика конфиденциальности</a>
            {status ? <p>{status}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}

function monthEndLabel() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return end.toLocaleDateString('ru-RU');
}

function PromoLeadModal({
  open,
  onClose,
  title,
  promoText,
  messagePrefix
}: { open: boolean; onClose: () => void; title: string; promoText: string; messagePrefix: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  if (!open) return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Отправка...');
    const message = `${messagePrefix}\n${promoText}`;
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message })
      });
      if (!res.ok) throw new Error('bad');
      setStatus('Спасибо! Заявка отправлена.');
      setName('');
      setPhone('');
    } catch {
      setStatus('Не удалось отправить заявку. Попробуйте позже.');
    }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{promoText}</p>
        <form onSubmit={submit}>
          <label>Имя<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>
            Телефон
            <input
              type="tel"
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
              required
            />
          </label>
          <button type="submit">Отправить заявку</button>
        </form>
        {status ? <p>{status}</p> : null}
      </div>
    </div>
  );
}

function ProjectTile({ project, onRequest }: { project: HouseProject; onRequest?: (project: HouseProject) => void }) {
  const imageUrl = resolveMediaUrl(project.coverImage || project.images?.[0] || '');
  const [openRequest, setOpenRequest] = useState(false);
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
      <button className="project-cta" onClick={() => onRequest?.(project)}>Заявка на просчет дома</button>
    </article>
  );
}

function PublicPage() {
  const [projects, setProjects] = useState<HouseProject[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState(HOME_PROJECT_CATEGORY_TABS[0].value);
  const [openCallback, setOpenCallback] = useState(false);
  const [openGiftPromo, setOpenGiftPromo] = useState(false);
  const [requestProject, setRequestProject] = useState<HouseProject | null>(null);
  const [menuOrder, setMenuOrder] = useState<NavMenuKey[]>([...NAV_MENU_DEFAULT_ORDER]);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const serviceColumns = useMemo(() => chunkBy(SERVICES_MENU, 6), []);

  useEffect(() => {
    document.title = "Evtenia — строительство домов";
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
    fetch(`${API_BASE}/api/menu-order`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no menu order'))))
      .then((payload: { order?: NavMenuKey[] }) => {
        setMenuOrder(normalizeMenuOrder(payload.order));
      })
      .catch(() => setMenuOrder(normalizeMenuOrder()));
    fetch(`${API_BASE}/api/site-settings`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no site settings'))))
      .then((payload: SiteSettings) => setLogoUrl(resolveMediaUrl(payload.logoUrl || DEFAULT_LOGO_URL)))
      .catch(() => setLogoUrl(DEFAULT_LOGO_URL));
  }, []);


  const filteredProjects = useMemo(() => projects.filter((p) => p.constructionType === selectedType), [projects, selectedType]);

  const catalogProjects = useMemo(() => filteredProjects.slice(0, 9), [filteredProjects]);
  const homepageProjects = projects.length ? projects : FALLBACK_PROJECTS;
  const heroImage = resolveMediaUrl(homepageProjects[0]?.coverImage || homepageProjects[0]?.images?.[0] || '');
  const offerImage = (index: number) => resolveMediaUrl(
    homepageProjects[index % homepageProjects.length]?.coverImage ||
    homepageProjects[index % homepageProjects.length]?.images?.[0] ||
    ''
  );

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
      <header
        className="hero hero-exact"
        style={heroImage ? {
          backgroundImage: `linear-gradient(rgba(17, 30, 39, .45), rgba(10, 18, 24, .65)), url('${heroImage}')`
        } : undefined}
      >
        <div className="promo-strip">
          <div className="container promo-inner">
            <strong><a href="/discounts/vse-akcii">🎁 10 СОТОК ЗЕМЛИ В ПОДАРОК ПРИ СТРОИТЕЛЬСТВЕ ДОМА</a></strong>
            <div className="promo-right"><a className="promo-btn" href="/discounts/vse-akcii">Все акции <span>»</span></a><div className="top-contacts"><a href={CONTACTS.vk} target="_blank" rel="noreferrer">VK</a><a href={CONTACTS.telegram} target="_blank" rel="noreferrer">Telegram</a><a href={CONTACTS.max} target="_blank" rel="noreferrer">MAX</a></div></div>
          </div>
        </div>

        <div className="container hero-main">
          <div className="hero-upper-row">
            <a href="/" className="brand-line">
              <div className="logo-badge"><img src={logoUrl} alt="Evtenia" /></div>
              <div className="brand-text">
                <div className="brand-logo">Evtenia</div>
                <p>Строительная компания</p>
              </div>
            </a>

            <div className="hero-contact-line">
              <span className="hero-help-text">Нужен просчет дома? Поможем по телефону за 5 минут.</span>
              <div className="phone-block">
                <span className="phone-icon-wrap"><svg className="phone-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4.5c-.6.2-1.4 1-1.8 2.1-.7 2.1.1 4.9 2.3 7.1 2.2 2.2 5 3 7.1 2.3 1.1-.4 1.9-1.2 2.1-1.8l-2.5-2.4c-.3-.3-.8-.4-1.2-.2l-1.2.6a1 1 0 0 1-1.1-.2L10 10.8a1 1 0 0 1-.2-1.1l.6-1.2c.2-.4.1-.9-.2-1.2L8 4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <div className="phone-lines">
                  <strong><a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a></strong>
                  <strong><a className="city-phone-link" href={CONTACTS.extraPhoneHref}>{CONTACTS.extraPhoneDisplay}</a></strong>
                </div>
                <small>с 9:00 до 19:00</small>
              </div>
              <button className="call-btn" onClick={() => setOpenCallback(true)}>Заказать звонок</button>
            </div>
          </div>

          <HeaderNav serviceColumns={serviceColumns} currentPath={window.location.pathname} menuOrder={menuOrder} />

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
              <button className="btn-gift" onClick={() => setOpenGiftPromo(true)}><i>🎁</i> 10 СОТОК В ПОДАРОК</button>
            </div>
          </div>
        </div>

      </header>

      <section className="offer-section">
        <div className="container">
          <h2 className="offer-title">Мы предлагаем</h2>
          <div className="offer-grid">
            <article className="offer-card wide" style={offerImage(0) ? { backgroundImage: `url('${offerImage(0)}')` } : undefined}>
              <div className="offer-overlay">
                <h3>Проекты домов</h3>
                <a href="/projects?type=Из%20газобетона">Из газобетона</a>
                <a href="/projects?type=Каркасные">Каркасные</a>
                <a href="/projects?type=Модульные">Модульные</a>
              </div>
            </article>
            <article className="offer-card" style={offerImage(1) ? { backgroundImage: `url('${offerImage(1)}')` } : undefined}>
              <div className="offer-overlay">
                <h3>Бани</h3>
                <a href="/baths?type=Модульные">Модульные</a>
                <a href="/baths?type=Каркасные">Каркасные</a>
              </div>
            </article>
            <article className="offer-card" style={offerImage(2) ? { backgroundImage: `url('${offerImage(2)}')` } : undefined}>
              <div className="offer-overlay">
                <h3><a href="/design">Проектирование</a></h3>
              </div>
            </article>
            <article className="offer-card" style={offerImage(3) ? { backgroundImage: `url('${offerImage(3)}')` } : undefined}>
              <div className="offer-overlay">
                <h3>Услуги</h3>
                <a href="/services/fundament">Фундамент</a>
                <a href="/services/skvazhiny">Скважины</a>
                <a href="/services/remont">Ремонт</a>
              </div>
            </article>
            <article className="offer-card" style={offerImage(4) ? { backgroundImage: `url('${offerImage(4)}')` } : undefined}>
              <div className="offer-overlay">
                <h3><a href="/discounts/vse-akcii">Ипотека и акции</a></h3>
              </div>
            </article>
            <article className="offer-card wide" style={offerImage(5) ? { backgroundImage: `url('${offerImage(5)}')` } : undefined}>
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
          <div className="home-category-tabs" role="tablist" aria-label="Категории домов">
            {HOME_PROJECT_CATEGORY_TABS.map((tab) => (
              <button
                type="button"
                key={tab.value}
                role="tab"
                aria-selected={selectedType === tab.value}
                className={selectedType === tab.value ? 'active' : ''}
                onClick={() => setSelectedType(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="catalog-grid home-project-grid">
            {catalogProjects.map((project) => <ProjectTile project={project} key={project.id} onRequest={setRequestProject} />)}
          </div>
          <div className="show-all-wrap"><a href="/projects" className="show-all-link">Показать все проекты</a></div>
        </div>
      </section>

      <section className="steps-section">
        <div className="container">
          <h2 className="steps-title">Этапы работы</h2>
          <div className="steps-grid">
            <article className="step-card">
              <div className="step-number">01</div>
              <div>
                <h3>Подбор проекта</h3>
                <small>1–3 дня</small>
                <p>Подбираем архитектуру, посадку дома и бюджет с учётом участка и задач семьи.</p>
              </div>
            </article>
            <article className="step-card">
              <div className="step-number">02</div>
              <div>
                <h3>Проектирование</h3>
                <small>10–15 дней</small>
                <p>Готовим рабочую документацию и инженерные решения для точной сметы и без переделок.</p>
              </div>
            </article>
            <article className="step-card">
              <div className="step-number">03</div>
              <div>
                <h3>Договор и поставки</h3>
                <small>1 день</small>
                <p>Фиксируем стоимость и сроки в договоре, организуем логистику материалов на объект.</p>
              </div>
            </article>
            <article className="step-card">
              <div className="step-number">04</div>
              <div>
                <h3>Строительство</h3>
                <small>10–20 дней</small>
                <p>Выполняем фундамент, коробку и кровлю по графику с поэтапным контролем качества.</p>
              </div>
            </article>
            <article className="step-card wide">
              <div className="step-number">05</div>
              <div>
                <h3>Сдача и гарантия</h3>
                <small>2 дня</small>
                <p>Проводим финальную приёмку, передаём документы и сопровождаем дом по гарантийным обязательствам.</p>
              </div>
            </article>
          </div>
        </div>
      </section>


      <section className="why-section">
        <div className="container">
          <h2 className="why-title">Почему выбирают нас</h2>
          <div className="why-grid">
            {[
              ['01', 'Фиксируем бюджет', 'Смета и стоимость работ закрепляются в договоре без скрытых пунктов.'],
              ['02', 'Понятные сроки', 'Согласовываем календарный план и ведём объект поэтапно с отчётностью.'],
              ['03', 'Технадзор на объекте', 'Прораб и инженер контролируют качество на каждом этапе строительства.'],
              ['04', 'Комплексный подход', 'От проекта и фундамента до отделки и ввода дома в эксплуатацию.'],
              ['05', 'Ипотека и господдержка', 'Помогаем подобрать оптимальную программу финансирования под бюджет семьи.'],
              ['06', 'Гарантия по договору', 'Официально закрепляем ответственность компании за результат и сроки.']
            ].map(([num, title, text]) => (
              <article className="why-card" key={title}>
                <div className="why-icon">{num}</div>
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
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
                <input value={phone} onChange={(e) => setPhone(formatPhoneMask(e.target.value))} required />
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
            <p className="lead-consent">Заполняя форму, вы даете согласие на обработку персональных данных согласно <a href="/privacy-policy">политике конфиденциальности</a>.</p>
            {status ? <p className="status">{status}</p> : null}
          </form>
        </div>
      </section>

      <SiteFooter />
      <CallbackModal open={openCallback} onClose={() => setOpenCallback(false)} />
      <PromoLeadModal
        open={openGiftPromo}
        onClose={() => setOpenGiftPromo(false)}
        title="Акция: 10 соток в подарок"
        promoText="10 соток в подарок и скидка на любой земельный участок у нас в базе."
        messagePrefix="Заявка по акции: 10 соток в подарок"
      />
      <PromoLeadModal
        open={Boolean(requestProject)}
        onClose={() => setRequestProject(null)}
        title={requestProject ? `Заявка: ${requestProject.title}` : 'Заявка'}
        promoText="🎁 Проект дома в подарок"
        messagePrefix={requestProject ? `Заявка на просчет дома: ${requestProject.title}` : ''}
      />
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
  const [menuOrder, setMenuOrder] = useState<NavMenuKey[]>([...NAV_MENU_DEFAULT_ORDER]);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [headerImage, setHeaderImage] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/menu-order`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no menu order'))))
      .then((payload: { order?: NavMenuKey[] }) => {
        setMenuOrder(normalizeMenuOrder(payload.order));
      })
      .catch(() => setMenuOrder(normalizeMenuOrder()));
    fetch(`${API_BASE}/api/site-settings`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no site settings'))))
      .then((payload: SiteSettings) => setLogoUrl(resolveMediaUrl(payload.logoUrl || DEFAULT_LOGO_URL)))
      .catch(() => setLogoUrl(DEFAULT_LOGO_URL));
    fetch(`${API_BASE}/api/projects`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no projects'))))
      .then((items: HouseProject[]) => {
        const first = Array.isArray(items) && items.length ? items[0] : FALLBACK_PROJECTS[0];
        setHeaderImage(resolveMediaUrl(first?.coverImage || first?.images?.[0] || ''));
      })
      .catch(() => setHeaderImage(resolveMediaUrl(FALLBACK_PROJECTS[0].coverImage)));
  }, []);
  const [openCallback, setOpenCallback] = useState(false);
  return (
    <header
      className="hero hero-exact internal-header"
      style={headerImage ? { backgroundImage: `linear-gradient(rgba(17, 30, 39, .58), rgba(10, 18, 24, .74)), url('${headerImage}')` } : undefined}
    >
      <div className="promo-strip">
        <div className="container promo-inner">
          <strong><a href="/discounts/vse-akcii">🎁 10 СОТОК ЗЕМЛИ В ПОДАРОК ПРИ СТРОИТЕЛЬСТВЕ ДОМА</a></strong>
          <div className="promo-right"><a className="promo-btn" href="/discounts/vse-akcii">Все акции <span>»</span></a><div className="top-contacts"><a href={CONTACTS.vk} target="_blank" rel="noreferrer">VK</a><a href={CONTACTS.telegram} target="_blank" rel="noreferrer">Telegram</a><a href={CONTACTS.max} target="_blank" rel="noreferrer">MAX</a></div></div>
        </div>
      </div>
      <div className="container hero-main">
        <div className="hero-upper-row">
          <a href="/" className="brand-line"><div className="logo-badge"><img src={logoUrl} alt="Evtenia" /></div><div className="brand-text"><div className="brand-logo">Evtenia</div><p>Строительная компания</p></div></a>
          <div className="hero-contact-line"><span className="hero-help-text">Нужен просчет дома? Поможем по телефону за 5 минут.</span><div className="phone-block"><span className="phone-icon-wrap"><svg className="phone-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4.5c-.6.2-1.4 1-1.8 2.1-.7 2.1.1 4.9 2.3 7.1 2.2 2.2 5 3 7.1 2.3 1.1-.4 1.9-1.2 2.1-1.8l-2.5-2.4c-.3-.3-.8-.4-1.2-.2l-1.2.6a1 1 0 0 1-1.1-.2L10 10.8a1 1 0 0 1-.2-1.1l.6-1.2c.2-.4.1-.9-.2-1.2L8 4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span><div className="phone-lines"><strong><a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a></strong><strong><a className="city-phone-link" href={CONTACTS.extraPhoneHref}>{CONTACTS.extraPhoneDisplay}</a></strong></div><small>с 9:00 до 19:00</small></div><button className="call-btn" onClick={() => setOpenCallback(true)}>Заказать звонок</button></div>
        </div>
        <HeaderNav serviceColumns={serviceColumns} currentPath={window.location.pathname} menuOrder={menuOrder} />
      </div>
      <CallbackModal open={openCallback} onClose={() => setOpenCallback(false)} />
    </header>
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
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", page.title]} />
          <h1>{page.title}</h1>
          <div className="about-anchor-menu">
            <a href="#about-company">О компании</a>
            <a href="#about-team">Наша команда</a>
            <a href="#about-partners">Наши партнеры</a>
            <a href="#about-agency">Наше агентство</a>
          </div>
          <div className="internal-text-box">
            <p>{page.content}</p>
          </div>
          <div id="about-company" className="about-slider-block">
            <h3>О компании</h3>
            <div className="about-slider"><img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" alt="О компании" /><img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80" alt="О компании 2" /></div>
          </div>
          <div id="about-team" className="about-slider-block">
            <h3>Наша команда</h3>
            <div className="about-slider"><img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80" alt="Команда" /><img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80" alt="Команда 2" /></div>
          </div>
          <div id="about-partners" className="about-slider-block">
            <h3>Наши партнеры</h3>
            <div className="about-slider"><img src="https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1200&q=80" alt="Партнеры" /><img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80" alt="Партнеры 2" /></div>
          </div>
          <div id="about-agency" className="about-slider-block">
            <h3>Наше агентство</h3>
            <p><a href="https://evtenia.ru/" target="_blank" rel="noreferrer">Перейти на сайт агентства evtenia.ru</a></p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'Политика конфиденциальности — Evtenia';
  }, []);

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", "Политика конфиденциальности"]} />
          <h1>Политика конфиденциальности</h1>
          <div className="internal-text-box privacy-policy-box">
            <p>
              Настоящая политика определяет порядок обработки и защиты персональных данных пользователей сайта.
              Оставляя заявку на сайте, вы соглашаетесь на обработку персональных данных в целях обратной связи,
              консультации и подготовки коммерческого предложения.
            </p>
            <p>
              Мы можем обрабатывать следующие данные: имя, номер телефона, электронную почту и иную информацию,
              которую вы добровольно указываете в формах обратного звонка и заявок.
            </p>
            <p>
              Обработка данных осуществляется законно, добросовестно и только в объеме, необходимом для достижения
              указанных целей. Данные не передаются третьим лицам, за исключением случаев, предусмотренных
              законодательством Российской Федерации.
            </p>
            <p>
              Вы вправе запросить уточнение, блокировку или удаление ваших персональных данных, направив обращение
              по контактам, указанным на странице «Контакты».
            </p>
            <p>
              Оператор персональных данных: ООО «Евтения». ИНН: 5836696238. ОГРН: 1215800005442.
            </p>
          </div>
        </div>
      </section>
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
            <a href="/privacy-policy">Политика конфиденциальности</a>
          </div>
          <div className="footer-columns">
            <div><h4>Проекты домов</h4><a href="/projects?type=Модульные">Модульные</a><a href="/projects?type=Каркасные">Каркасные</a><a href="/projects?type=Из%20газобетона">Из газобетона</a></div>
            <div><h4>Бани</h4><a href="/baths?type=Модульные">Модульные</a><a href="/baths?type=Каркасные">Каркасные</a></div>
            <div><h4>Услуги</h4><a href="/services/fundament">Фундамент</a><a href="/services/skvazhiny">Скважины</a><a href="/services/remont">Ремонт</a><a href="/services/dizainer">Дизайнер</a></div>
            <div><h4>Разделы сайта</h4><a href="/design">Проектирование</a><a href="/portfolio">Портфолио</a><a href="/discounts/vse-akcii">Ипотека и акции</a><a href="/contacts">Контакты</a></div>
          </div>
          <div className="footer-mobile-accordion">
            <details>
              <summary>Проекты домов</summary>
              <a href="/projects?type=Модульные">Модульные</a>
              <a href="/projects?type=Каркасные">Каркасные</a>
              <a href="/projects?type=Из%20газобетона">Из газобетона</a>
            </details>
            <details>
              <summary>Бани</summary>
              <a href="/baths?type=Модульные">Модульные</a>
              <a href="/baths?type=Каркасные">Каркасные</a>
            </details>
            <details>
              <summary>Услуги</summary>
              <a href="/services/fundament">Фундамент</a>
              <a href="/services/skvazhiny">Скважины</a>
              <a href="/services/remont">Ремонт</a>
            </details>
          </div>
          <div className="footer-requisites">
            <h4>Реквизиты</h4>
            <p><strong>ООО «Евтения»</strong></p>
            <p>ИНН: 5836696238</p>
            <p>ОГРН: 1215800005442</p>
          </div>
        </div>
        <aside className="footer-side">
          <div className="contact-card"><h4>Контакты</h4><strong><a href={CONTACTS.mainPhoneHref}>{CONTACTS.mainPhoneDisplay}</a></strong><a className="extra-phone-link" href={CONTACTS.extraPhoneHref}>{CONTACTS.extraPhoneDisplay}</a><p>{OFFICE_ADDRESS}</p><button onClick={() => setOpenCallback(true)}>Заказать звонок</button><a href={CONTACTS.emailHref}>{CONTACTS.email}</a></div>
          <div className="social-card"><h4>Мы в соцсетях</h4><div className="contacts-socials footer-socials"><a href={CONTACTS.vk} target="_blank" rel="noreferrer"><img src="https://cdn.simpleicons.org/vk/FFFFFF" alt="" /> VK</a><a href={CONTACTS.telegram} target="_blank" rel="noreferrer"><img src="https://cdn.simpleicons.org/telegram/FFFFFF" alt="" /> Telegram</a><a href={CONTACTS.max} target="_blank" rel="noreferrer"><img src="https://max.ru/favicon.ico" alt="" /> MAX</a></div></div>
        </aside>
      </div>
      <CallbackModal open={openCallback} onClose={() => setOpenCallback(false)} />
      <a className="ghost-admin" href={`?admin=${ADMIN_KEY}`}>service</a>
    </footer>
  );
}


function DualRangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  disabled
}: {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  disabled?: boolean;
}) {
  const safeMin = Math.min(valueMin, valueMax);
  const safeMax = Math.max(valueMin, valueMax);
  const range = Math.max(max - min, 1);
  const leftPercent = ((safeMin - min) / range) * 100;
  const rightPercent = ((safeMax - min) / range) * 100;

  return (
    <div className={`double-range ${disabled ? 'disabled' : ''}`}>
      <div className="double-range-track" />
      <div className="double-range-fill" style={{ left: `${leftPercent}%`, width: `${Math.max(rightPercent - leftPercent, 0)}%` }} />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeMin}
        onChange={(e) => onChangeMin(Number(e.target.value))}
        disabled={disabled}
        className="double-range-input"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeMax}
        onChange={(e) => onChangeMax(Number(e.target.value))}
        disabled={disabled}
        className="double-range-input"
      />
    </div>
  );
}

function CatalogPage({ category, sectionTitle }: { category: 'house' | 'bath'; sectionTitle: string }) {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || 'Все типы';
  const initialPage = Math.max(1, Number(params.get('page') || '1') || 1);
  const [projects, setProjects] = useState<HouseProject[]>([]);
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [minArea, setMinArea] = useState<number | null>(null);
  const [maxArea, setMaxArea] = useState<number | null>(null);
  const [minRooms, setMinRooms] = useState<number | null>(null);
  const [maxRooms, setMaxRooms] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [requestProject, setRequestProject] = useState<HouseProject | null>(null);
  const [page, setPage] = useState(initialPage);
  const isFirstPageSync = useRef(true);

  useEffect(() => {
    document.title = `${sectionTitle} — Evtenia`;
    fetch(`${API_BASE}/api/projects`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no api'))))
      .then((data: HouseProject[]) => setProjects(Array.isArray(data) && data.length ? data : FALLBACK_PROJECTS))
      .catch(() => setProjects(FALLBACK_PROJECTS));
  }, [sectionTitle]);

  const normalizeCategory = (item: HouseProject): 'house' | 'bath' => {
    const rawCategory = String(item.category || '').trim().toLowerCase();
    if (
      rawCategory === 'bath' ||
      rawCategory === 'baths' ||
      rawCategory === 'баня' ||
      rawCategory === 'бани' ||
      rawCategory.includes('бан') ||
      rawCategory.includes('саун')
    ) {
      return 'bath';
    }
    if (
      rawCategory === 'house' ||
      rawCategory === 'home' ||
      rawCategory === 'дом' ||
      rawCategory === 'дома' ||
      rawCategory.includes('дом')
    ) {
      return 'house';
    }
    const titleHint = `${item.title} ${item.shortDescription} ${item.fullDescription}`.toLowerCase();
    if (titleHint.includes('бан') || titleHint.includes('саун')) return 'bath';
    return 'house';
  };

  const isBathCatalog = category === 'bath';
  const byCategory = isBathCatalog
    ? projects.filter((item) => normalizeCategory(item) === 'bath')
    : projects;
  const categoryScopedProjects = byCategory.length ? byCategory : projects;
  const floorOptions = Array.from(new Set(categoryScopedProjects.map((item) => item.floors))).filter(Boolean);
  const typeOptions = Array.from(new Set(categoryScopedProjects.map((item) => item.constructionType))).filter(Boolean);
  const effectiveType = typeOptions.includes(type) || type === 'Все типы' ? type : 'Все типы';
  const styleOptions = Array.from(new Set(categoryScopedProjects.map((item) => (item.style || '').trim()).filter(Boolean)));
  const parseNum = (value: unknown) => {
    const digits = String(value ?? '').match(/\d+/);
    const parsed = Number(digits?.[0] || '0');
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const parsePrice = (value: unknown) => {
    const parsed = Number(String(value ?? '').replace(/[^\d]/g, '') || '0');
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const areaValues = categoryScopedProjects.map((item) => parseNum(item.area)).filter((value) => value > 0);
  const roomValues = categoryScopedProjects.map((item) => parseNum(item.bedrooms)).filter((value) => value > 0);
  const priceValues = categoryScopedProjects.map((item) => parsePrice(item.priceFrom)).filter((value) => value > 0);
  const minAreaLimit = areaValues.length ? Math.min(...areaValues) : 0;
  const maxAreaLimit = areaValues.length ? Math.max(...areaValues) : 0;
  const minRoomsLimit = roomValues.length ? Math.min(...roomValues) : 0;
  const maxRoomsLimit = roomValues.length ? Math.max(...roomValues) : 0;
  const minPriceLimit = priceValues.length ? Math.min(...priceValues) : 0;
  const maxPriceLimit = priceValues.length ? Math.max(...priceValues) : 0;

  useEffect(() => {
    setSelectedStyles((prev) => prev.filter((style) => styleOptions.includes(style)));
  }, [styleOptions]);
  useEffect(() => {
    setMinArea(minAreaLimit);
    setMaxArea(maxAreaLimit);
    setMinRooms(minRoomsLimit);
    setMaxRooms(maxRoomsLimit);
    setMinPrice(minPriceLimit);
    setMaxPrice(maxPriceLimit);
  }, [minAreaLimit, maxAreaLimit, minRoomsLimit, maxRoomsLimit, minPriceLimit, maxPriceLimit]);

  const byTypeProjects = categoryScopedProjects.filter((item) => effectiveType === 'Все типы' || item.constructionType === effectiveType);
  const filteredStrict = byTypeProjects.filter((item) => {
    const byFloor = !selectedFloors.length || selectedFloors.includes(item.floors);
    const areaValue = parseNum(item.area);
    const roomsValue = parseNum(item.bedrooms);
    const priceValue = parsePrice(item.priceFrom);
    const areaMin = minArea ?? minAreaLimit;
    const areaMax = maxArea ?? maxAreaLimit;
    const roomsMin = minRooms ?? minRoomsLimit;
    const roomsMax = maxRooms ?? maxRoomsLimit;
    const priceMin = minPrice ?? minPriceLimit;
    const priceMax = maxPrice ?? maxPriceLimit;
    const byArea = !maxAreaLimit || areaValue === 0 || (areaValue >= areaMin && areaValue <= areaMax);
    const byRooms = !maxRoomsLimit || roomsValue === 0 || (roomsValue >= roomsMin && roomsValue <= roomsMax);
    const byPrice = !maxPriceLimit || priceValue === 0 || (priceValue >= priceMin && priceValue <= priceMax);
    const byStyle = !selectedStyles.length || selectedStyles.includes(item.style || '');
    return byFloor && byStyle && byArea && byRooms && byPrice;
  });
  const filteredProjects = filteredStrict;

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", sectionTitle, effectiveType]} />
          <h1>{sectionTitle}</h1>
          <div className="catalog-layout">
            <aside className="catalog-filters">
              <div className="filter-block">
                <h4>Этажность</h4>
                {floorOptions.map((floor) => (
                  <label key={floor}><input type="checkbox" checked={selectedFloors.includes(floor)} onChange={(e) => setSelectedFloors(e.target.checked ? [...selectedFloors, floor] : selectedFloors.filter((f) => f !== floor))} /> {floor}</label>
                ))}
              </div>
              {styleOptions.length ? (
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
                        {' '}{style === 'Скандинавский' ? 'Сканди' : style}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="filter-block">
                <h4>Площадь: {(minArea ?? minAreaLimit)} — {(maxArea ?? maxAreaLimit)} м²</h4>
                <DualRangeSlider
                  min={minAreaLimit || 0}
                  max={maxAreaLimit || 0}
                  valueMin={minArea ?? minAreaLimit}
                  valueMax={maxArea ?? maxAreaLimit}
                  onChangeMin={(value) => setMinArea(Math.min(value, maxArea ?? maxAreaLimit))}
                  onChangeMax={(value) => setMaxArea(Math.max(value, minArea ?? minAreaLimit))}
                  disabled={!maxAreaLimit}
                />
              </div>
              <div className="filter-block">
                <h4>Комнаты: {(minRooms ?? minRoomsLimit)} — {(maxRooms ?? maxRoomsLimit)}</h4>
                <DualRangeSlider
                  min={minRoomsLimit || 0}
                  max={maxRoomsLimit || 0}
                  valueMin={minRooms ?? minRoomsLimit}
                  valueMax={maxRooms ?? maxRoomsLimit}
                  onChangeMin={(value) => setMinRooms(Math.min(value, maxRooms ?? maxRoomsLimit))}
                  onChangeMax={(value) => setMaxRooms(Math.max(value, minRooms ?? minRoomsLimit))}
                  disabled={!maxRoomsLimit}
                />
              </div>
              <div className="filter-block">
                <h4>Цена: {(minPrice ?? minPriceLimit).toLocaleString('ru-RU')} — {(maxPrice ?? maxPriceLimit).toLocaleString('ru-RU')} ₽</h4>
                <DualRangeSlider
                  min={minPriceLimit || 0}
                  max={maxPriceLimit || 0}
                  step={100000}
                  valueMin={minPrice ?? minPriceLimit}
                  valueMax={maxPrice ?? maxPriceLimit}
                  onChangeMin={(value) => setMinPrice(Math.min(value, maxPrice ?? maxPriceLimit))}
                  onChangeMax={(value) => setMaxPrice(Math.max(value, minPrice ?? minPriceLimit))}
                  disabled={!maxPriceLimit}
                />
              </div>
            </aside>

            <div>
              <div className="type-chips">
                <button className={effectiveType === 'Все типы' ? 'active' : ''} onClick={() => { window.location.href = `${window.location.pathname}?type=${encodeURIComponent('Все типы')}`; }}>Все типы</button>
                {typeOptions.map((option) => (
                  <button key={option} className={effectiveType === option ? 'active' : ''} onClick={() => { window.location.href = `${window.location.pathname}?type=${encodeURIComponent(option)}`; }}>{option}</button>
                ))}
              </div>
              <div className="catalog-grid">
                {filteredProjects.map((project) => <ProjectTile project={project} key={project.id} onRequest={setRequestProject} />)}
              </div>
              <div className="catalog-pagination">
                {page <= 1 ? <span className="disabled">←</span> : <a href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${Math.max(page - 1, 1)}`}>←</a>}
                {pageNumbers.map((num) => (
                  <a
                    key={num}
                    className={num === page ? 'active' : ''}
                    href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${num}`}
                  >
                    {num}
                  </a>
                ))}
                {page >= totalPages ? <span className="disabled">→</span> : <a href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${Math.min(page + 1, totalPages)}`}>→</a>}
              </div>
              <div className="catalog-pagination">
                {page <= 1 ? <span className="disabled">←</span> : <a href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${Math.max(page - 1, 1)}`}>←</a>}
                {pageNumbers.map((num) => (
                  <a
                    key={num}
                    className={num === page ? 'active' : ''}
                    href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${num}`}
                  >
                    {num}
                  </a>
                ))}
                {page >= totalPages ? <span className="disabled">→</span> : <a href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${Math.min(page + 1, totalPages)}`}>→</a>}
              </div>
              <div className="catalog-pagination">
                <a
                  className={page <= 1 ? 'disabled' : ''}
                  href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${Math.max(page - 1, 1)}`}
                  onClick={(e) => { if (page <= 1) { e.preventDefault(); return; } e.preventDefault(); setPage((prev) => Math.max(prev - 1, 1)); }}
                >←</a>
                {pageNumbers.map((num) => (
                  <a
                    key={num}
                    className={num === page ? 'active' : ''}
                    href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${num}`}
                    onClick={(e) => { e.preventDefault(); setPage(num); }}
                  >
                    {num}
                  </a>
                ))}
                <a
                  className={page >= totalPages ? 'disabled' : ''}
                  href={`${window.location.pathname}?type=${encodeURIComponent(effectiveType)}&page=${Math.min(page + 1, totalPages)}`}
                  onClick={(e) => { if (page >= totalPages) { e.preventDefault(); return; } e.preventDefault(); setPage((prev) => Math.min(prev + 1, totalPages)); }}
                >→</a>
              </div>
              <div className="catalog-pagination">
                <button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page <= 1}>←</button>
                {pageNumbers.map((num) => (
                  <button
                    type="button"
                    key={num}
                    className={num === page ? 'active' : ''}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page >= totalPages}>→</button>
              </div>
              <div className="catalog-pagination">
                <button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page <= 1}>←</button>
                {pageNumbers.map((num) => (
                  <button
                    type="button"
                    key={num}
                    className={num === page ? 'active' : ''}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page >= totalPages}>→</button>
              </div>
              <div className="catalog-pagination">
                <button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page <= 1}>←</button>
                {pageNumbers.map((num) => (
                  <button
                    type="button"
                    key={num}
                    className={num === page ? 'active' : ''}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page >= totalPages}>→</button>
              </div>
              <div ref={loadMoreRef} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
      <PromoLeadModal
        open={Boolean(requestProject)}
        onClose={() => setRequestProject(null)}
        title={requestProject ? `Заявка: ${requestProject.title}` : 'Заявка'}
        promoText="🎁 Проект дома в подарок"
        messagePrefix={requestProject ? `Заявка на просчет дома: ${requestProject.title}` : ''}
      />
    </div>
  );
}

function ProjectTypePage() {
  return <CatalogPage category="house" sectionTitle="Проекты домов" />;
}

function BathsPage() {
  return <CatalogPage category="bath" sectionTitle="Бани" />;
}

const LAND_FALLBACK: LandPlot[] = [
  { id: 'land1', cadastralNumber: '58:29:1003001:254', area: '10 соток', price: '1 250 000 ₽', district: 'Пензенский район', images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'] },
  { id: 'land2', cadastralNumber: '58:29:1003001:255', area: '12 соток', price: '1 480 000 ₽', district: 'Бессоновский район', images: ['https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80'] },
  { id: 'land3', cadastralNumber: '58:29:1003001:256', area: '8 соток', price: '980 000 ₽', district: 'Железнодорожный район', images: ['https://images.unsplash.com/photo-1493815793585-d94ccbc86df8?auto=format&fit=crop&w=1200&q=80'] }
];

function LandCardImageSlider({ land }: { land: LandPlot }) {
  const images = (land.images || []).length ? (land.images || []) : [LAND_IMAGE_FALLBACK];
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImage = resolveMediaUrl(images[activeIndex] || LAND_IMAGE_FALLBACK);
  const hasMultiple = images.length > 1;

  return (
    <div className="land-image-slider">
      <div className="project-image" style={{ backgroundImage: `url(${safeImage})` }} />
      {hasMultiple ? (
        <div className="land-slider-controls">
          <button type="button" onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)} aria-label="Предыдущее фото">←</button>
          <button type="button" onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)} aria-label="Следующее фото">→</button>
        </div>
      ) : null}
    </div>
  );
}

function LandsPage() {
  const [lands, setLands] = useState<LandPlot[]>(LAND_FALLBACK);
  const [district, setDistrict] = useState('Все районы');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [activeLand, setActiveLand] = useState<LandPlot | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerComment, setSellerComment] = useState('');
  const [sellerStatus, setSellerStatus] = useState('');
  const [openSellLand, setOpenSellLand] = useState(false);
  useEffect(() => {
    document.title = 'Земля — Evtenia';
    fetch(`${API_BASE}/api/lands`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no lands'))))
      .then((data: LandPlot[]) => Array.isArray(data) && data.length ? setLands(data) : setLands(LAND_FALLBACK))
      .catch(() => setLands(LAND_FALLBACK));
  }, []);
  const districts = ['Все районы', ...Array.from(new Set(lands.map((item) => item.district)))];
  const parsePrice = (value: string) => Number(value.replace(/[^\d]/g, '') || '0');
  const landPriceValues = lands.map((item) => parsePrice(item.price)).filter((value) => value > 0);
  const minPriceLimit = landPriceValues.length ? Math.min(...landPriceValues) : 0;
  const maxPriceLimit = landPriceValues.length ? Math.max(...landPriceValues) : 0;

  useEffect(() => {
    setMinPrice(minPriceLimit);
    setMaxPrice(maxPriceLimit);
  }, [minPriceLimit, maxPriceLimit]);

  const filtered = lands.filter((item) => {
    const price = parsePrice(item.price);
    const byDistrict = district === 'Все районы' || item.district === district;
    const byPrice = !maxPriceLimit || (price >= minPrice && price <= maxPrice);
    return byDistrict && byPrice;
  });
  const submitSellLand = async (event: FormEvent) => {
    event.preventDefault();
    setSellerStatus('Отправка...');
    try {
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sellerName,
          phone: sellerPhone,
          message: `Продать свою землю. Адрес: ${sellerAddress}. Комментарий: ${sellerComment}`
        })
      });
      if (!response.ok) throw new Error('bad');
      setSellerStatus('Спасибо! Свяжемся с вами.');
      setSellerName('');
      setSellerPhone('');
      setSellerAddress('');
      setSellerComment('');
    } catch {
      setSellerStatus('Не удалось отправить заявку.');
    }
  };
  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", "Земля"]} />
          <h1>ЗЕМЛЯ</h1>
          <div className="lands-top-cta">
            <p>Подберем участок под строительство дома или поможем выгодно реализовать вашу землю через нашу базу покупателей.</p>
            <button className="sell-land-link" onClick={() => setOpenSellLand(true)}>Продать свою землю</button>
          </div>
          <div className="catalog-layout">
            <aside className="catalog-filters">
              <div className="filter-block">
                <h4>Район</h4>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {districts.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="filter-block">
                <h4>Цена: {minPrice.toLocaleString('ru-RU')} — {maxPrice.toLocaleString('ru-RU')} ₽</h4>
                <DualRangeSlider
                  min={minPriceLimit || 0}
                  max={maxPriceLimit || 0}
                  step={100000}
                  valueMin={minPrice}
                  valueMax={maxPrice}
                  onChangeMin={(value) => setMinPrice(Math.min(value, maxPrice))}
                  onChangeMax={(value) => setMaxPrice(Math.max(value, minPrice))}
                  disabled={!maxPriceLimit}
                />
              </div>
            </aside>
            <div className="catalog-grid">
              {filtered.map((item) => (
                <article className="project-card land-card" key={item.id}>
                  <LandCardImageSlider land={item} />
                  <div className="project-content">
                    <h3>{item.cadastralNumber}</h3>
                    <p className="project-desc">Площадь: {item.area}</p>
                    <p className="project-desc">Район: {item.district}</p>
                    {item.mapUrl ? (
                      <p className="project-desc">Карта: <a href={item.mapUrl} target="_blank" rel="noreferrer">Открыть</a></p>
                    ) : null}
                    <div className="land-card-actions">
                      <strong className="project-price">{item.price}</strong>
                      <button className="project-cta" onClick={() => setActiveLand(item)}>Оставить заявку</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
      <PromoLeadModal
        open={Boolean(activeLand)}
        onClose={() => setActiveLand(null)}
        title={activeLand ? `Заявка на участок ${activeLand.cadastralNumber}` : 'Заявка'}
        promoText={activeLand ? `Участок ${activeLand.area}, ${activeLand.district}, ${activeLand.price}` : ''}
        messagePrefix={activeLand ? `Заявка на участок ${activeLand.cadastralNumber}` : ''}
      />
      {openSellLand ? (
        <div className="modal-backdrop" onClick={() => setOpenSellLand(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Продать свою землю</h3>
            <form className="sell-land-form" onSubmit={submitSellLand}>
              <label>Контактное лицо<input value={sellerName} onChange={(e) => setSellerName(e.target.value)} required /></label>
              <label>
                Телефон
                <input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(formatPhoneMask(e.target.value))}
                  required
                />
              </label>
              <label>Адрес участка<input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} required /></label>
              <label>Комментарий<textarea value={sellerComment} onChange={(e) => setSellerComment(e.target.value)} rows={3} /></label>
              <button type="submit">Отправить заявку</button>
              {sellerStatus ? <small>{sellerStatus}</small> : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProjectDetailPage() {
  const projectId = window.location.pathname.replace('/project/', '');
  const [projects, setProjects] = useState<HouseProject[]>(FALLBACK_PROJECTS);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openRequest, setOpenRequest] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no api'))))
      .then((data: HouseProject[]) => setProjects(data))
      .catch(() => setProjects(FALLBACK_PROJECTS));
  }, []);

  const project = projects.find((item) => item.id === projectId) || FALLBACK_PROJECTS[0];
  const gallery = [project.coverImage, ...(project.images || [])].filter(Boolean).map((img) => resolveMediaUrl(img));
  const safeActiveImage = gallery[activeImageIndex] || gallery[0] || '';

  useEffect(() => {
    setActiveImageIndex(0);
  }, [project.id]);

  const showPrevImage = () => {
    if (gallery.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const showNextImage = () => {
    if (gallery.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  };

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
              <div className="project-detail-slider">
                <div className="project-detail-main-image" style={{ backgroundImage: `url(${safeActiveImage})` }} />
                {gallery.length > 1 ? (
                  <div className="project-slider-controls">
                    <button type="button" onClick={showPrevImage} aria-label="Предыдущее фото">‹</button>
                    <span>{activeImageIndex + 1} / {gallery.length}</span>
                    <button type="button" onClick={showNextImage} aria-label="Следующее фото">›</button>
                  </div>
                ) : null}
              </div>
              <div className="project-detail-thumbs">
                {gallery.map((img, index) => (
                  <button
                    type="button"
                    key={`${img}_${index}`}
                    className={`project-thumb ${index === activeImageIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${img})` }}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Фото ${index + 1}`}
                  />
                ))}
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
              <button className="detail-btn" onClick={() => setOpenRequest(true)}>Заявка на просчет дома</button>
            </aside>
          </div>
        </div>
      </section>
      <SiteFooter />
      <PromoLeadModal
        open={openRequest}
        onClose={() => setOpenRequest(false)}
        title={`Заявка: ${project.title}`}
        promoText="🎁 Проект дома в подарок"
        messagePrefix={`Заявка на просчет дома: ${project.title}`}
      />
    </div>
  );
}

function ContactsPage() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ logoUrl: DEFAULT_LOGO_URL, ...DEFAULT_CONTACT_PROFILE });
  useEffect(() => {
    document.title = 'Контакты — Evtenia';
    fetch(`${API_BASE}/api/site-settings`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no site settings'))))
      .then((payload: SiteSettings) => setSiteSettings({ ...DEFAULT_CONTACT_PROFILE, ...payload }))
      .catch(() => setSiteSettings({ logoUrl: DEFAULT_LOGO_URL, ...DEFAULT_CONTACT_PROFILE }));
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
              <div className="contacts-person">
                <img src={resolveMediaUrl(siteSettings.contactPhotoUrl || DEFAULT_CONTACT_PROFILE.contactPhotoUrl)} alt="Менеджер" />
                <div>
                  <strong>{siteSettings.contactName || DEFAULT_CONTACT_PROFILE.contactName}</strong>
                  <small>{siteSettings.contactPosition || DEFAULT_CONTACT_PROFILE.contactPosition}</small>
                </div>
              </div>
              <h3>Телефоны:</h3>
              <p><a href={CONTACTS.mainPhoneHref}>{siteSettings.contactPhone || DEFAULT_CONTACT_PROFILE.contactPhone}</a></p>
              <p><a href={CONTACTS.extraPhoneHref}>{siteSettings.contactCityPhone || DEFAULT_CONTACT_PROFILE.contactCityPhone}</a></p>

              <h3>Время работы:</h3>
              <p>🕘 Без выходных: 9:00–18:00</p>
              <h3>Адрес:</h3>
              <p>{OFFICE_ADDRESS}</p>

              <h3>Почта:</h3>
              <p><a href={CONTACTS.emailHref}>{siteSettings.contactEmail || DEFAULT_CONTACT_PROFILE.contactEmail}</a></p>

              <div className="contacts-socials">
                <a href={CONTACTS.vk} target="_blank" rel="noreferrer" aria-label="VK"><img src="https://cdn.simpleicons.org/vk/FFFFFF" alt="" /> VK</a>
                <a href={CONTACTS.telegram} target="_blank" rel="noreferrer" aria-label="Telegram"><img src="https://cdn.simpleicons.org/telegram/FFFFFF" alt="" /> Telegram</a>
                <a href={CONTACTS.max} target="_blank" rel="noreferrer" aria-label="MAX"><img src="https://max.ru/favicon.ico" alt="" /> MAX</a>
              </div>
            </div>
            <div className="contacts-map-wrap">
              <iframe
                title="Карта офиса Evtenia"
                src="https://yandex.ru/map-widget/v1/?text=%D0%9F%D0%B5%D0%BD%D0%B7%D0%B0%2C%20%D0%93%D0%BE%D0%B3%D0%BE%D0%BB%D1%8F%2041"
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

const DESIGN_PROJECT_VARIANTS = [
  {
    title: 'Планировочное решение',
    accent: 'Быстрый старт для планировки',
    features: [
      'обмерочный план с привязкой инженерных коммуникаций;',
      'план демонтажа стен и перегородок;',
      'план перепланировки;',
      'план расстановки мебели и оборудования.'
    ],
    description:
      'Подходит, если нужна помощь только с планировкой: при ограниченном бюджете, сжатых сроках или если вы планируете самостоятельно разрабатывать дизайн и чертежи. Также часто выбирают при покупке новой квартиры, чтобы понять, подходит ли пространство под задачи семьи.'
  },
  {
    title: 'Технический проект',
    accent: 'Для быстрого выхода в ремонт',
    features: [
      'планировочное решение;',
      'полный пакет рабочих чертежей для строительно-отделочных работ;',
      'консультация по подбору отделочных материалов.'
    ],
    description:
      'Оптимальный вариант без 3D-визуализаций: если вы хорошо представляете будущий интерьер, хотите быстрее начать ремонт или планируете косметические работы без сложных конструктивных решений.'
  },
  {
    title: 'Стандартный проект',
    accent: 'Баланс визуализации и практики',
    features: [
      'планировочное решение;',
      'полный пакет рабочих чертежей для строительно-отделочных работ;',
      '3D-визуализация основных помещений;',
      'подбор основных отделочных материалов (стены и пол) и ключевых предметов мебели.'
    ],
    description:
      'Подходит тем, кому важно увидеть интерьер в объеме, но кто готов самостоятельно подбирать освещение, сантехнику, текстиль и декор.'
  },
  {
    title: 'Полный проект',
    accent: 'Комплексное сопровождение',
    features: [
      'планировочное решение;',
      'полный пакет рабочих чертежей для строительно-отделочных работ;',
      '3D-визуализация основных помещений;',
      'подбор всех отделочных материалов, мебели, света, сантехники, текстиля и декора;',
      'консультация строительной бригады.'
    ],
    description:
      'Для тех, кому нужна полная поддержка в создании интерьера: от функциональной планировки до финальных деталей. Максимально комфортный формат сопровождения на каждом этапе.'
  }
];

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
              Разрабатываем дизайн-проекты интерьеров с учетом ваших привычек, ритма жизни и бюджета.
              Мы собрали удобные форматы работы — от планировочного решения до полного сопровождения.
            </p>
            <h3>Варианты разработки дизайн-проекта</h3>
            <p>Выберите подходящий тариф в зависимости от задач: скорости запуска ремонта, глубины проработки и уровня сопровождения.</p>
          </div>

          <section className="design-tariffs">
            <h2>Тарифы и состав работ</h2>
            <div className="design-tariff-grid">
              {DESIGN_PROJECT_VARIANTS.map((variant) => (
                <article className="design-tariff-card" key={variant.title}>
                  <div className="design-tariff-head">
                    <h4>{variant.title}</h4>
                    <span>{variant.accent}</span>
                  </div>
                  <ul>
                    {variant.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <p>{variant.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="design-order">
            <h2>Для заказа проекта дома — звоните {CONTACTS.mainPhoneDisplay} или отправляйте заявку ↓</h2>
            <form className="lead-form" onSubmit={submitLead}>
              <div className="lead-top-row">
                <label>Имя<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
                <label>Телефон*<input value={phone} onChange={(e) => setPhone(formatPhoneMask(e.target.value))} required /></label>
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

function SubsectionPage({ sectionTitle, pageTitle, text, isHtml = false }: { sectionTitle: string; pageTitle: string; text: string; isHtml?: boolean }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceStatus, setServiceStatus] = useState('');
  useEffect(() => {
    document.title = `${pageTitle} — Evtenia`;
  }, [pageTitle]);
  const isService = sectionTitle === 'Услуги';

  const submitServiceLead = async (event: FormEvent) => {
    event.preventDefault();
    setServiceStatus('Отправка...');
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          message: `Заявка на услугу со скидкой 10%: ${pageTitle}. Действует до ${monthEndLabel()}.`
        })
      });
      if (!res.ok) throw new Error('bad');
      setServiceStatus('Заявка отправлена.');
      setName('');
      setPhone('');
    } catch {
      setServiceStatus('Не удалось отправить заявку.');
    }
  };

  return (
    <div>
      <InternalHeader />
      <section className="internal-body">
        <div className="container">
          <Breadcrumbs items={["Главная", sectionTitle, pageTitle]} />
          <h1>{pageTitle}</h1>
          <div className={`service-page-layout ${isService ? 'is-service' : ''}`}>
            <div className="internal-text-box">
              {isHtml ? <CmsHtmlContent html={text} /> : <><p>{text}</p><p>Скоро добавим подробное описание услуги и примеры выполненных работ.</p></>}
            </div>
            {isService ? (
              <aside className="service-side">
                <form className="service-discount-form" onSubmit={submitServiceLead}>
                  <h3>Скидка 10%</h3>
                  <button type="submit">Заказать услугу со скидкой 10%</button>
                  <small>Скидка действует до {monthEndLabel()}.</small>
                  <label>Имя<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
                  <label>
                    Телефон
                    <input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                      required
                    />
                  </label>
                  {serviceStatus ? <p>{serviceStatus}</p> : null}
                </form>
              </aside>
            ) : null}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}


function ManagedTextPage({ slug, fallbackTitle, fallbackContent, sectionTitle }: { slug: string; fallbackTitle: string; fallbackContent: string; sectionTitle: string }) {
  const [page, setPage] = useState<ContentPage>({ slug, title: fallbackTitle, content: fallbackContent });

  useEffect(() => {
    fetch(`${API_BASE}/api/pages/${slug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('nf'))))
      .then((payload: ContentPage) => setPage(payload))
      .catch(() => setPage({ slug, title: fallbackTitle, content: fallbackContent }));
  }, [slug, fallbackTitle, fallbackContent]);

  return <SubsectionPage sectionTitle={sectionTitle} pageTitle={page.title} text={page.content} isHtml />;
}

function AdminPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [projects, setProjects] = useState<HouseProject[]>([]);
  const [lands, setLands] = useState<LandPlot[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [pageDraft, setPageDraft] = useState<ContentPage | null>(null);
  const [draft, setDraft] = useState<Partial<HouseProject>>({});
  const [landDraft, setLandDraft] = useState<Partial<LandPlot>>({});
  const [portfolioDraft, setPortfolioDraft] = useState<Partial<PortfolioItem>>({});
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('projects');
  const [uploadStatus, setUploadStatus] = useState('');
  const [menuOrderDraft, setMenuOrderDraft] = useState<NavMenuKey[]>([...NAV_MENU_DEFAULT_ORDER]);
  const [menuSaveStatus, setMenuSaveStatus] = useState('');
  const [imageInsertMode, setImageInsertMode] = useState<'cursor' | 'start' | 'end'>('cursor');
  const [imageLayout, setImageLayout] = useState<'single' | 'grid2' | 'grid3'>('single');
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('center');
  const [imageSize, setImageSize] = useState<'sm' | 'md'>('sm');
  const [siteSettingsDraft, setSiteSettingsDraft] = useState<SiteSettings>({ logoUrl: DEFAULT_LOGO_URL, ...DEFAULT_CONTACT_PROFILE });

  const adminHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'x-admin-token': token
    }),
    [token]
  );

  const loadAdminData = async (currentToken: string) => {
    const [projectsRes, landsRes, leadsRes, pagesRes, portfolioRes, menuOrderRes, siteSettingsRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/projects`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/lands`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/leads`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/pages`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/portfolio`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/menu-order`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/site-settings`, { headers: { 'x-admin-token': currentToken } })
    ]);

    if (!projectsRes.ok || !landsRes.ok || !leadsRes.ok || !pagesRes.ok || !portfolioRes.ok || !menuOrderRes.ok || !siteSettingsRes.ok) {
      setError('Не удалось загрузить данные админки');
      return;
    }

    const pagesPayload = (await pagesRes.json()) as ContentPage[];
    setProjects(await projectsRes.json());
    setLands(await landsRes.json());
    setLeads(await leadsRes.json());
    setPages(pagesPayload);
    setPortfolio(await portfolioRes.json());
    setSiteSettingsDraft(await siteSettingsRes.json());
    const orderPayload = (await menuOrderRes.json()) as { order?: NavMenuKey[] };
    if (Array.isArray(orderPayload.order) && orderPayload.order.length) setMenuOrderDraft(orderPayload.order);
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

  const saveLand = async () => {
    if (!landDraft.cadastralNumber) {
      setError('Кадастровый номер обязателен');
      return;
    }
    const method = landDraft.id ? 'PUT' : 'POST';
    const url = landDraft.id ? `${API_BASE}/api/admin/lands/${landDraft.id}` : `${API_BASE}/api/admin/lands`;
    const response = await fetch(url, {
      method,
      headers: adminHeaders,
      body: JSON.stringify(landDraft)
    });
    if (!response.ok) {
      setError('Не удалось сохранить участок');
      return;
    }
    setLandDraft({});
    await loadAdminData(token);
  };

  const uploadLandImages = async (files: File[]) => {
    if (!files.length) return;
    setError('');
    setUploadStatus('Загрузка фото участка...');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await fetch(`${API_BASE}/api/admin/upload/project-image?target=gallery`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError(await getApiErrorMessage(response, 'Не удалось загрузить фото участка'));
      return;
    }
    const payload = (await response.json()) as { urls: string[] };
    setLandDraft((prev) => ({ ...prev, images: [...(prev.images || []), ...(payload.urls || [])] }));
    setUploadStatus('Фото участка загружены');
  };

  const removeLandImageFromDraft = async (index: number) => {
    const currentImages = landDraft.images || [];
    const removed = currentImages[index];
    if (!removed) return;
    setLandDraft((prev) => ({ ...prev, images: (prev.images || []).filter((_, idx) => idx !== index) }));
    await deleteProjectImage(removed);
  };

  const moveLandDraftImage = (index: number, direction: -1 | 1) => {
    const current = [...(landDraft.images || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const [item] = current.splice(index, 1);
    current.splice(targetIndex, 0, item);
    setLandDraft((prev) => ({ ...prev, images: current }));
  };

  const removeProject = async (id: string) => {
    const currentProject = projects.find((item) => item.id === id);
    const projectImages = [currentProject?.coverImage, ...(currentProject?.images || [])].filter(Boolean) as string[];
    for (const imageUrl of projectImages) {
      await deleteProjectImage(imageUrl);
    }
    await fetch(`${API_BASE}/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    await loadAdminData(token);
  };

  const removeLand = async (id: string) => {
    await fetch(`${API_BASE}/api/admin/lands/${id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    await loadAdminData(token);
  };

  const uploadProjectImage = async (files: File[], target: 'cover' | 'gallery') => {
    if (!files.length) return;
    setError('');
    setUploadStatus('Загрузка изображения...');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await fetch(`${API_BASE}/api/admin/upload/project-image?target=${target}`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError(await getApiErrorMessage(response, 'Не удалось загрузить изображение'));
      return;
    }
    const payload = (await response.json()) as { urls: string[] };
    const urls = payload.urls || [];
    if (target === 'cover') {
      setDraft((prev) => ({ ...prev, coverImage: urls[0] || prev.coverImage || '' }));
    } else {
      setDraft((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
    }
    setUploadStatus('Изображения загружены и оптимизированы');
  };

  const deleteProjectImage = async (url: string) => {
    await fetch(`${API_BASE}/api/admin/upload/project-image`, {
      method: 'DELETE',
      headers: adminHeaders,
      body: JSON.stringify({ url })
    });
  };

  const removeImageFromDraft = async (index: number) => {
    const currentImages = draft.images || [];
    const removed = currentImages[index];
    if (!removed) return;
    setDraft((prev) => ({ ...prev, images: (prev.images || []).filter((_, idx) => idx !== index) }));
    await deleteProjectImage(removed);
    if (draft.coverImage === removed) {
      setDraft((prev) => ({ ...prev, coverImage: '' }));
    }
  };

  const moveDraftImage = (index: number, direction: -1 | 1) => {
    const current = [...(draft.images || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const [item] = current.splice(index, 1);
    current.splice(targetIndex, 0, item);
    setDraft((prev) => ({ ...prev, images: current }));
  };

  const setCoverFromGallery = (url: string) => {
    setDraft((prev) => ({ ...prev, coverImage: url }));
  };


  const savePage = async () => {
    if (!pageDraft) return;
    const sanitizedPageDraft = { ...pageDraft, content: sanitizeCmsHtml(pageDraft.content || '') };

    const response = await fetch(`${API_BASE}/api/admin/pages/${sanitizedPageDraft.slug}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify(sanitizedPageDraft)
    });

    if (!response.ok) {
      setError('Не удалось сохранить внутреннюю страницу');
      return;
    }

    await loadAdminData(token);
  };

  const uploadPageImage = async (files: File[]) => {
    if (!files.length || !pageDraft) return;
    setUploadStatus('Загрузка изображения для страницы...');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await fetch(`${API_BASE}/api/admin/upload/page-image`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError(await getApiErrorMessage(response, 'Не удалось загрузить фото для страницы'));
      return;
    }
    const payload = (await response.json()) as { urls: string[] };
    const imageUrls = payload.urls || [];
    if (!imageUrls.length) return;
    const imagesHtml = imageLayout === 'single'
      ? `<div class="cms-gallery single align-${imageAlign} size-${imageSize}">${imageUrls.map((url) => `<figure><img src="${url}" alt="Изображение страницы" /></figure>`).join('')}</div>`
      : `<div class="cms-gallery ${imageLayout === 'grid2' ? 'cols-2' : 'cols-3'} align-${imageAlign} size-${imageSize}">${imageUrls.map((url) => `<figure><img src="${url}" alt="Изображение страницы" /></figure>`).join('')}</div>`;

    if (imageInsertMode === 'cursor') {
      const editor = document.getElementById('cms-page-editor');
      if (editor) {
        editor.focus();
        document.execCommand('insertHTML', false, imagesHtml);
        setPageDraft({ ...pageDraft, content: sanitizeCmsHtml(editor.innerHTML) });
      }
    } else if (imageInsertMode === 'start') {
      setPageDraft({ ...pageDraft, content: sanitizeCmsHtml(`${imagesHtml}${pageDraft.content || ''}`) });
    } else {
      setPageDraft({ ...pageDraft, content: sanitizeCmsHtml(`${pageDraft.content || ''}${imagesHtml}`) });
    }
    setUploadStatus('Фото-блок добавлен в страницу');
  };

  const uploadPageSlider = async (files: File[]) => {
    if (!files.length || !pageDraft) return;
    setUploadStatus('Загрузка изображений для слайдера...');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await fetch(`${API_BASE}/api/admin/upload/page-image`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError(await getApiErrorMessage(response, 'Не удалось загрузить фото для слайдера'));
      return;
    }
    const payload = (await response.json()) as { urls: string[] };
    const imageUrls = payload.urls || [];
    if (!imageUrls.length) return;
    const sliderHtml = `<div class="cms-slider" data-active-index="0"><button class="cms-slider-btn prev" type="button" aria-label="Предыдущее фото">‹</button><div class="cms-slider-track">${imageUrls.map((url) => `<figure><img src="${url}" alt="Слайд страницы" /></figure>`).join('')}</div><button class="cms-slider-btn next" type="button" aria-label="Следующее фото">›</button></div>`;

    if (imageInsertMode === 'cursor') {
      const editor = document.getElementById('cms-page-editor');
      if (editor) {
        editor.focus();
        document.execCommand('insertHTML', false, sliderHtml);
        setPageDraft({ ...pageDraft, content: sanitizeCmsHtml(editor.innerHTML) });
      }
    } else if (imageInsertMode === 'start') {
      setPageDraft({ ...pageDraft, content: sanitizeCmsHtml(`${sliderHtml}${pageDraft.content || ''}`) });
    } else {
      setPageDraft({ ...pageDraft, content: sanitizeCmsHtml(`${pageDraft.content || ''}${sliderHtml}`) });
    }
    setUploadStatus('Слайдер добавлен в страницу');
  };

  const applyPageFormat = (command: string) => {
    document.execCommand(command);
    const editor = document.getElementById('cms-page-editor');
    if (editor && pageDraft) {
      setPageDraft({ ...pageDraft, content: editor.innerHTML });
    }
  };

  const moveMenuItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= menuOrderDraft.length) return;
    const next = [...menuOrderDraft];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setMenuOrderDraft(next);
  };

  const saveMenuOrder = async () => {
    setMenuSaveStatus('Сохраняем порядок меню...');
    const response = await fetch(`${API_BASE}/api/admin/menu-order`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ order: menuOrderDraft })
    });
    if (!response.ok) {
      setError('Не удалось сохранить порядок меню');
      setMenuSaveStatus('');
      return;
    }
    setMenuSaveStatus('Порядок меню сохранен');
    await loadAdminData(token);
  };

  const saveSiteSettings = async () => {
    const response = await fetch(`${API_BASE}/api/admin/site-settings`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify(siteSettingsDraft)
    });
    if (!response.ok) {
      setError('Не удалось сохранить настройки сайта');
      return;
    }
    setUploadStatus('Настройки сайта сохранены');
    await loadAdminData(token);
  };

  const uploadLogo = async (file: File) => {
    setError('');
    setUploadStatus('Загрузка логотипа...');
    const formData = new FormData();
    formData.append('logo', file);
    const response = await fetch(`${API_BASE}/api/admin/upload/logo`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError(await getApiErrorMessage(response, 'Не удалось загрузить логотип'));
      return;
    }
    const payload = (await response.json()) as { url: string };
    setSiteSettingsDraft((prev) => ({ ...prev, logoUrl: payload.url || prev.logoUrl }));
    setUploadStatus('Логотип загружен');
  };

  const uploadContactPhoto = async (file: File) => {
    setError('');
    setUploadStatus('Загрузка фото контакта...');
    const formData = new FormData();
    formData.append('images', file);
    const response = await fetch(`${API_BASE}/api/admin/upload/project-image?target=cover`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError(await getApiErrorMessage(response, 'Не удалось загрузить фото контакта'));
      return;
    }
    const payload = (await response.json()) as { urls: string[] };
    const url = payload.urls?.[0];
    if (!url) return;
    setSiteSettingsDraft((prev) => ({ ...prev, contactPhotoUrl: url }));
    setUploadStatus('Фото контакта загружено');
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
    const currentItem = portfolio.find((item) => item.id === id);
    if (currentItem?.image) {
      await deleteProjectImage(currentItem.image);
    }
    await fetch(`${API_BASE}/api/admin/portfolio/${id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    await loadAdminData(token);
  };

  const uploadPortfolioImage = async (files: File[]) => {
    if (!files.length) return;
    setError('');
    setUploadStatus('Загрузка изображения портфолио...');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await fetch(`${API_BASE}/api/admin/upload/project-image?target=cover`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: formData
    });
    if (!response.ok) {
      setUploadStatus('');
      setError(await getApiErrorMessage(response, 'Не удалось загрузить изображение портфолио'));
      return;
    }
    const payload = (await response.json()) as { urls: string[] };
    const url = payload.urls?.[0];
    if (!url) {
      setUploadStatus('');
      setError('Сервер не вернул URL изображения');
      return;
    }
    if (portfolioDraft.image && portfolioDraft.image !== url) {
      await deleteProjectImage(portfolioDraft.image);
    }
    setPortfolioDraft((prev) => ({ ...prev, image: url }));
    setUploadStatus('Изображение портфолио загружено');
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
        <button className={activeTab === 'lands' ? 'active' : ''} onClick={() => setActiveTab('lands')}>Земля</button>
        <button className={activeTab === 'pages' ? 'active' : ''} onClick={() => setActiveTab('pages')}>Страницы</button>
        <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Настройки</button>
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
            <label>Загрузить обложку<input type="file" accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) uploadProjectImage(files, 'cover'); e.currentTarget.value = ''; }} /></label>
            <textarea
              rows={2}
              placeholder="Картинки (через запятую)"
              value={Array.isArray(draft.images) ? draft.images.join(', ') : ''}
              onChange={(e) => setDraft({ ...draft, images: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
            />
            <label>Загрузить фото в галерею (можно несколько)<input type="file" multiple accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) uploadProjectImage(files, 'gallery'); e.currentTarget.value = ''; }} /></label>
            {draft.coverImage ? (
              <div className="admin-media-preview">
                <p>Текущая обложка</p>
                <div className="admin-image-card">
                  <img src={resolveMediaUrl(draft.coverImage)} alt="Обложка проекта" />
                  <div className="admin-image-actions">
                    <button type="button" onClick={async () => {
                      const image = draft.coverImage || '';
                      setDraft((prev) => ({ ...prev, coverImage: '' }));
                      if (image) await deleteProjectImage(image);
                    }}>Удалить обложку</button>
                  </div>
                </div>
              </div>
            ) : null}
            {(draft.images || []).length ? (
              <div className="admin-media-preview">
                <p>Фотографии проекта</p>
                <div className="admin-images-grid">
                  {(draft.images || []).map((img, index) => (
                    <div key={`${img}_${index}`} className="admin-image-card">
                      <img src={resolveMediaUrl(img)} alt={`Фото проекта ${index + 1}`} />
                      <div className="admin-image-actions">
                        <button type="button" onClick={() => moveDraftImage(index, -1)}>←</button>
                        <button type="button" onClick={() => moveDraftImage(index, 1)}>→</button>
                        <button type="button" onClick={() => setCoverFromGallery(img)}>Сделать обложкой</button>
                        <button type="button" onClick={() => removeImageFromDraft(index)}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <input placeholder="Сумма от" value={draft.priceFrom || ''} onChange={(e) => setDraft({ ...draft, priceFrom: e.target.value })} />
            <select value={draft.category || 'house'} onChange={(e) => setDraft({ ...draft, category: e.target.value as 'house' | 'bath' })}>
              <option value="house">Проекты домов</option>
              <option value="bath">Бани</option>
            </select>
            <select value={draft.constructionType || 'Из газобетона'} onChange={(e) => setDraft({ ...draft, constructionType: e.target.value })}>
              {ADMIN_CONSTRUCTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={draft.style || ''} onChange={(e) => setDraft({ ...draft, style: e.target.value })}>
              <option value="">Стиль не выбран</option>
              {ADMIN_STYLE_OPTIONS.map((style) => (
                <option key={style} value={style}>{style}</option>
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
                  <p>{normalizePrice(project.priceFrom)}</p>
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

      {activeTab === 'lands' ? <div className="admin-grid"><section>
        <h2>{landDraft.id ? 'Редактирование участка' : 'Новый участок'}</h2>
        <div className="admin-form">
          <input placeholder="Кадастровый номер" value={landDraft.cadastralNumber || ''} onChange={(e) => setLandDraft({ ...landDraft, cadastralNumber: e.target.value })} />
          <input placeholder="Площадь" value={landDraft.area || ''} onChange={(e) => setLandDraft({ ...landDraft, area: e.target.value })} />
          <input placeholder="Цена" value={landDraft.price || ''} onChange={(e) => setLandDraft({ ...landDraft, price: e.target.value })} />
          <input placeholder="Район" value={landDraft.district || ''} onChange={(e) => setLandDraft({ ...landDraft, district: e.target.value })} />
          <input placeholder="Карта: ссылка" value={landDraft.mapUrl || ''} onChange={(e) => setLandDraft({ ...landDraft, mapUrl: e.target.value })} />
          <textarea
            rows={2}
            placeholder="Ссылки на фото (через запятую)"
            value={Array.isArray(landDraft.images) ? landDraft.images.join(', ') : ''}
            onChange={(e) => setLandDraft({ ...landDraft, images: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
          />
          <label>Загрузить фото участка (можно несколько)<input type="file" multiple accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) uploadLandImages(files); e.currentTarget.value = ''; }} /></label>
          {(landDraft.images || []).length ? (
            <div className="admin-media-preview">
              <p>Фотографии участка</p>
              <div className="admin-images-grid">
                {(landDraft.images || []).map((img, index) => (
                  <div key={`${img}_${index}`} className="admin-image-card">
                    <img src={resolveMediaUrl(img)} alt={`Фото участка ${index + 1}`} />
                    <div className="admin-image-actions">
                      <button type="button" onClick={() => moveLandDraftImage(index, -1)}>←</button>
                      <button type="button" onClick={() => moveLandDraftImage(index, 1)}>→</button>
                      <button type="button" onClick={() => removeLandImageFromDraft(index)}>Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <button onClick={saveLand}>{landDraft.id ? 'Сохранить изменения' : 'Добавить участок'}</button>
          {landDraft.id ? <button onClick={() => setLandDraft({})}>Отменить</button> : null}
        </div>
      </section>
      <section>
        <h2>Участки ({lands.length})</h2>
        <div className="list">
          {lands.map((item) => (
            <div key={item.id} className="list-item">
              <div>
                <strong>{item.cadastralNumber}</strong>
                <p>{item.area} • {item.district} • {item.price}</p>
                {item.mapUrl ? <small>Карта: {item.mapUrl}</small> : null}
              </div>
              <div className="actions">
                <button onClick={() => setLandDraft(item)}>Изменить</button>
                <button onClick={() => removeLand(item.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </section></div> : null}

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
          <div className="cms-toolbar">
            <button type="button" onClick={() => applyPageFormat('bold')}>Жирный</button>
            <button type="button" onClick={() => applyPageFormat('italic')}>Курсив</button>
            <button type="button" onClick={() => applyPageFormat('insertUnorderedList')}>Список</button>
            <select value={imageInsertMode} onChange={(e) => setImageInsertMode(e.target.value as 'cursor' | 'start' | 'end')}>
              <option value="cursor">Фото в позицию курсора</option>
              <option value="start">Фото в начало страницы</option>
              <option value="end">Фото в конец страницы</option>
            </select>
            <select value={imageLayout} onChange={(e) => setImageLayout(e.target.value as 'single' | 'grid2' | 'grid3')}>
              <option value="single">Одиночные фото</option>
              <option value="grid2">Сетка 2 колонки</option>
              <option value="grid3">Сетка 3 колонки</option>
            </select>
            <select value={imageAlign} onChange={(e) => setImageAlign(e.target.value as 'left' | 'center' | 'right')}>
              <option value="left">Блок слева</option>
              <option value="center">Блок по центру</option>
              <option value="right">Блок справа</option>
            </select>
            <select value={imageSize} onChange={(e) => setImageSize(e.target.value as 'sm' | 'md')}>
              <option value="sm">Компактный размер</option>
              <option value="md">Стандартный размер</option>
            </select>
            <label>Фото-блок<input type="file" multiple accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) uploadPageImage(files); e.currentTarget.value = ''; }} /></label>
            <label>Слайдер<input type="file" multiple accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length > 1) uploadPageSlider(files); else setError('Для слайдера нужно минимум 2 изображения'); e.currentTarget.value = ''; }} /></label>
          </div>
          <div
            id="cms-page-editor"
            className="cms-editor"
            contentEditable
            suppressContentEditableWarning
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData('text/plain');
              document.execCommand('insertText', false, text);
            }}
            onInput={(e) => setPageDraft(pageDraft ? { ...pageDraft, content: sanitizeCmsHtml((e.target as HTMLDivElement).innerHTML) } : null)}
            dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(pageDraft?.content || '') }}
          />
          <button onClick={savePage}>Сохранить страницу</button>
          <div className="cms-preview">
            <p>Порядок меню</p>
            <div className="list">
              {menuOrderDraft.map((item, index) => (
                <div key={item} className="list-item">
                  <strong>{item}</strong>
                  <div className="actions">
                    <button type="button" onClick={() => moveMenuItem(index, -1)}>↑</button>
                    <button type="button" onClick={() => moveMenuItem(index, 1)}>↓</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={saveMenuOrder}>Сохранить порядок меню</button>
            {menuSaveStatus ? <p>{menuSaveStatus}</p> : null}
          </div>
          <div className="cms-preview">
            <p>Предпросмотр</p>
            <CmsHtmlContent html={sanitizeCmsHtml(pageDraft?.content || '')} />
          </div>
        </div>
      </section> : null}

      {activeTab === 'settings' ? <section>
        <h2>Настройки сайта</h2>
        <div className="admin-form">
          <input
            placeholder="URL логотипа"
            value={siteSettingsDraft.logoUrl || ''}
            onChange={(e) => setSiteSettingsDraft({ ...siteSettingsDraft, logoUrl: e.target.value })}
          />
          <label>Загрузить логотип<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadLogo(file); e.currentTarget.value = ''; }} /></label>
          <input placeholder="ФИО контакта" value={siteSettingsDraft.contactName || ''} onChange={(e) => setSiteSettingsDraft({ ...siteSettingsDraft, contactName: e.target.value })} />
          <input placeholder="Должность" value={siteSettingsDraft.contactPosition || ''} onChange={(e) => setSiteSettingsDraft({ ...siteSettingsDraft, contactPosition: e.target.value })} />
          <input placeholder="Основной телефон" value={siteSettingsDraft.contactPhone || ''} onChange={(e) => setSiteSettingsDraft({ ...siteSettingsDraft, contactPhone: formatPhoneMask(e.target.value) })} />
          <input placeholder="Городской телефон" value={siteSettingsDraft.contactCityPhone || ''} onChange={(e) => setSiteSettingsDraft({ ...siteSettingsDraft, contactCityPhone: formatPhoneMask(e.target.value) })} />
          <input placeholder="Email контакта" value={siteSettingsDraft.contactEmail || ''} onChange={(e) => setSiteSettingsDraft({ ...siteSettingsDraft, contactEmail: e.target.value })} />
          <input placeholder="URL фото контакта" value={siteSettingsDraft.contactPhotoUrl || ''} onChange={(e) => setSiteSettingsDraft({ ...siteSettingsDraft, contactPhotoUrl: e.target.value })} />
          <label>Загрузить фото контакта<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadContactPhoto(file); e.currentTarget.value = ''; }} /></label>
          {siteSettingsDraft.logoUrl ? (
            <div className="admin-media-preview">
              <p>Предпросмотр логотипа</p>
              <div className="admin-image-card logo-preview-card">
                <img src={resolveMediaUrl(siteSettingsDraft.logoUrl)} alt="Логотип сайта" />
              </div>
            </div>
          ) : null}
          {siteSettingsDraft.contactPhotoUrl ? (
            <div className="admin-media-preview">
              <p>Фото контакта</p>
              <div className="admin-image-card logo-preview-card">
                <img src={resolveMediaUrl(siteSettingsDraft.contactPhotoUrl)} alt="Контакт" />
              </div>
            </div>
          ) : null}
          <button type="button" onClick={saveSiteSettings}>Сохранить настройки</button>
        </div>
      </section> : null}

      {activeTab === 'portfolio' ? <div className="admin-grid"><section>
          <h2>{portfolioDraft.id ? 'Редактирование кейса' : 'Новый кейс портфолио'}</h2>
          <div className="admin-form">
            <input placeholder="Название объекта" value={portfolioDraft.title || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, title: e.target.value })} />
            <input placeholder="Ссылка на фото" value={portfolioDraft.image || ''} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, image: e.target.value })} />
            <label>Загрузить фото портфолио<input type="file" accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) uploadPortfolioImage(files); e.currentTarget.value = ''; }} /></label>
            {portfolioDraft.image ? (
              <div className="admin-media-preview">
                <p>Превью обложки портфолио</p>
                <div className="admin-image-card">
                  <img src={resolveMediaUrl(portfolioDraft.image)} alt="Обложка портфолио" />
                  <div className="admin-image-actions">
                    <button type="button" onClick={async () => {
                      const image = portfolioDraft.image || '';
                      setPortfolioDraft((prev) => ({ ...prev, image: '' }));
                      if (image) await deleteProjectImage(image);
                    }}>Удалить фото</button>
                  </div>
                </div>
              </div>
            ) : null}
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


function CookieNotice() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(localStorage.getItem('cookie-consent-v1') === 'accepted');
  }, []);

  if (accepted) return null;

  return (
    <div className="cookie-notice" role="dialog" aria-live="polite">
      <p>Мы используем cookie для корректной работы сайта и аналитики. Продолжая пользоваться сайтом, вы соглашаетесь с их использованием.</p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem('cookie-consent-v1', 'accepted');
          setAccepted(true);
        }}
      >
        Принять
      </button>
    </div>
  );
}

function AppLayout({ children }: { children: ReactNode }) {
  const [showToTop, setShowToTop] = useState(false);
  const [openCallback, setOpenCallback] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowToTop(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {children}
      <div className="floating-actions">
        {showToTop ? <button className="to-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Наверх">↑</button> : null}
        <button className="floating-call-fixed" onClick={() => setOpenCallback(true)} aria-label="Заказать звонок">
          <svg className="floating-call-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7.8 5.2c-.5.4-1.1 1.1-1.3 2.1-.5 2.5 1 6.1 4 9 2.9 3 6.5 4.5 9 4 1-.2 1.7-.8 2.1-1.3l-2.9-2.9c-.3-.3-.8-.4-1.2-.2l-1.7.8c-.4.2-.9.1-1.3-.2l-2.4-2.4c-.3-.3-.4-.8-.2-1.3l.8-1.7c.2-.4.1-.9-.2-1.2L10 6.5c-.6-.6-1.5-.7-2.2-.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <CookieNotice />
      <CallbackModal open={openCallback} onClose={() => setOpenCallback(false)} />
    </>
  );
}

function App() {
  const url = new URL(window.location.href);
  const pathname = normalizePathname(window.location.pathname);
  const serviceSlug = pathname.startsWith('/services/') ? pathname.replace('/services/', '') : '';
  const discountSlug = pathname.startsWith('/discounts/') ? pathname.replace('/discounts/', '') : '';
  const furniturePage = FURNITURE_LEAF_PAGES.find((item) => item.href === pathname);
  const servicePage = SERVICES_MENU.find((item) => item.slug === serviceSlug);
  const discountPage = PROMOTIONS_MENU.find((item) => item.slug === discountSlug);
  const isAdminRoute =
    pathname.endsWith(ADMIN_PATH) ||
    window.location.hash === `#${ADMIN_KEY}` ||
    url.searchParams.get('admin') === ADMIN_KEY;

  useEffect(() => {
    const applyFavicon = (href: string) => {
      const iconHref = resolveMediaUrl(href || DEFAULT_LOGO_URL);
      let icon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = iconHref;
    };

    fetch(`${API_BASE}/api/site-settings`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no site settings'))))
      .then((payload: SiteSettings) => applyFavicon(payload.logoUrl))
      .catch(() => applyFavicon(DEFAULT_LOGO_URL));
  }, []);

  if (isAdminRoute) return <AdminPage />;
  if (pathname === '/about') return <AppLayout><AboutPage /></AppLayout>;
  if (pathname === '/privacy-policy') return <AppLayout><PrivacyPolicyPage /></AppLayout>;
  if (pathname === '/projects') return <AppLayout><ProjectTypePage /></AppLayout>;
  if (pathname === '/baths') return <AppLayout><BathsPage /></AppLayout>;
  if (pathname === '/lands') return <AppLayout><LandsPage /></AppLayout>;
  if (pathname.startsWith('/project/')) return <AppLayout><ProjectDetailPage /></AppLayout>;
  if (pathname === '/design') return <AppLayout><DesignPage /></AppLayout>;
  if (servicePage) return <AppLayout><ManagedTextPage slug={`services-${servicePage.slug}`} fallbackTitle={servicePage.title} fallbackContent={servicePage.text} sectionTitle="Услуги" /></AppLayout>;
  if (discountPage) return <AppLayout><ManagedTextPage slug={`discounts-${discountPage.slug}`} fallbackTitle={discountPage.title} fallbackContent={discountPage.text} sectionTitle="Ипотека и акции" /></AppLayout>;
  if (furniturePage) {
    return (
      <AppLayout>
        <ManagedTextPage
          slug={`furniture-${slugify(furniturePage.categoryTitle)}-${slugify(furniturePage.brandTitle)}`}
          fallbackTitle={furniturePage.brandTitle}
          fallbackContent={`Раздел мебели: ${furniturePage.categoryTitle}. Подберем решение под размер помещения, стиль интерьера и бюджет.`}
          sectionTitle="Мебель"
        />
      </AppLayout>
    );
  }
  if (pathname === '/furniture') return <AppLayout><ManagedTextPage slug="furniture" fallbackTitle="Мебель" fallbackContent="Изготавливаем корпусную и встроенную мебель под ваши размеры и стиль интерьера." sectionTitle="Каталог" /></AppLayout>;
  if (pathname === '/portfolio') return <AppLayout><PortfolioPage /></AppLayout>;
  if (pathname === '/contacts') return <AppLayout><ContactsPage /></AppLayout>;
  return <AppLayout><PublicPage /></AppLayout>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
