import React, { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { LesnoeOzeroPage } from './LesnoeOzeroPage';
import { MortgageCalculatorPage } from './MortgageCalculatorPage';
import { LESNOE_OZERO_PHASES, LesnoeOzeroPlot } from './lesnoeOzeroPlots';
import { HomeDetailPage, HomesPage, HouseListing } from './HomesPages';

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
  description?: string;
  images?: string[];
  mapUrl?: string;
};

type PendingLandPlot = LandPlot & {
  sellerName: string;
  sellerPhone: string;
  createdAt: string;
};

type PendingHouseListing = HouseListing & {
  sellerName: string;
  sellerPhone: string;
  createdAt: string;
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  message: string;
  projectId?: string;
  sourceTitle?: string;
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
type AdminTab = 'projects' | 'homes' | 'homeRequests' | 'lands' | 'lesnoeOzero' | 'landRequests' | 'pages' | 'portfolio' | 'leads' | 'settings';

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
  max: 'https://max.ru/channel_dom_evtenia',
  rutube: 'https://rutube.ru/plst/1224190/'
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
const CONTACT_PAGE_PHOTO_URL = 'https://s6.iimage.su/s/01/g1cKW9hxDJrMROPHFjBAYozo9BaKvKsjsH0luvHyJ.png';
const DEFAULT_CONTACT_PROFILE = {
  contactPhotoUrl: CONTACT_PAGE_PHOTO_URL,
  contactName: 'Кислякова Евгения Викторовна',
  contactPosition: 'Генеральный директор',
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

const NAV_MENU_DEFAULT_ORDER = ['home', 'about', 'projects', 'homes', 'lands', 'settlements', 'services', 'furniture', 'promotions', 'contacts'] as const;
type NavMenuKey = (typeof NAV_MENU_DEFAULT_ORDER)[number];

function normalizeMenuOrder(order?: string[]) {
  const incoming = Array.isArray(order) ? order.filter((item): item is NavMenuKey => NAV_MENU_DEFAULT_ORDER.includes(item as NavMenuKey)) : [];
  return [...incoming, ...NAV_MENU_DEFAULT_ORDER.filter((item) => !incoming.includes(item))];
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

const SELL_LAND_MAX_PHOTOS = 5;
const SELL_LAND_PHOTO_TARGET_BYTES = 160 * 1024;

function loadPhotoForCompression(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Не удалось прочитать «${file.name}». Используйте JPG, PNG или WebP.`));
    };
    image.src = objectUrl;
  });
}

async function prepareLandPhoto(file: File, index: number): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error(`Формат «${file.name}» не поддерживается. Используйте JPG, PNG или WebP.`);
  }

  const image = await loadPhotoForCompression(file);
  const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let quality = 0.78;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Браузер не смог подготовить фотографию к отправке.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error(`Не удалось подготовить «${file.name}» к отправке.`);
    if (blob.size <= SELL_LAND_PHOTO_TARGET_BYTES) {
      return new File([blob], `land-${index + 1}.jpg`, { type: 'image/jpeg' });
    }

    if (quality > 0.5) quality -= 0.08;
    else {
      width = Math.max(640, Math.round(width * 0.82));
      height = Math.max(480, Math.round(height * 0.82));
      quality = 0.68;
    }
  }

  throw new Error(`Фотография «${file.name}» слишком большая. Попробуйте выбрать другое фото.`);
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
      { label: 'Каркасные', href: `/baths?type=${encodeURIComponent('Каркасн…46163 tokens truncated…<button type="button" onClick={() => movePendingLandImage(index, 1)}>→</button>
                        <button type="button" onClick={() => removePendingLandImage(index)}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <button onClick={savePendingLand}>Сохранить изменения</button>
            <button onClick={approvePendingLand}>Одобрить и опубликовать</button>
            <button onClick={() => rejectPendingLand(pendingLandDraft.id)}>Отклонить</button>
            <button onClick={() => setPendingLandDraft(null)}>Закрыть</button>
          </div>
        ) : <p>Нажмите «Подробнее / изменить» у нужной заявки, чтобы увидеть все поля и фотографии.</p>}
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
  if (pathname === '/lands/lesnoe-ozero') {
    return (
      <AppLayout>
        <LesnoeOzeroPage
          Header={InternalHeader}
          Footer={SiteFooter}
          PrivacyConsent={PrivacyConsent}
          apiBase={API_BASE}
          formatPhone={formatPhoneMask}
        />
      </AppLayout>
    );
  }
  if (pathname === '/lands') return <AppLayout><LandsPage /></AppLayout>;
  if (pathname.startsWith('/lands/')) return <AppLayout><LandDetailPage /></AppLayout>;
  if (pathname === '/homes') return <AppLayout><HomesPage apiBase={API_BASE} Header={InternalHeader} Footer={SiteFooter} LeadModal={PromoLeadModal} formatPhone={formatPhoneMask} resolveMedia={resolveMediaUrl} /></AppLayout>;
  if (pathname.startsWith('/homes/')) return <AppLayout><HomeDetailPage apiBase={API_BASE} Header={InternalHeader} Footer={SiteFooter} LeadModal={PromoLeadModal} formatPhone={formatPhoneMask} resolveMedia={resolveMediaUrl} /></AppLayout>;
  if (pathname === '/mortgage-calculator') {
    return <AppLayout><MortgageCalculatorPage Header={InternalHeader} Footer={SiteFooter} PrivacyConsent={PrivacyConsent} apiBase={API_BASE} formatPhone={formatPhoneMask} /></AppLayout>;
  }
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

