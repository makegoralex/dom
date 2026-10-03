import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import multer from 'multer';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { gasblockCatalogProjects } from './gasblockCatalogProjects';
import { bathCatalogProjects } from './bathCatalogProjects';

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

interface HouseProject {
  id: string;
  slug?: string;
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
  catalogProject?: boolean;
  projectCode?: string;
  livingArea?: string;
  buildingFootprint?: string;
  catalogFacade?: string;
  catalogFoundation?: string;
  catalogRoof?: string;
  isIllustrative?: boolean;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  projectId?: string;
  sourceTitle?: string;
  createdAt: string;
  crmRequestId?: number;
  crmSyncedAt?: string;
  crmSyncError?: string;
}

interface LandPlot {
  id: string;
  cadastralNumber: string;
  area: string;
  price: string;
  district: string;
  description?: string;
  images: string[];
  mapUrl?: string;
  purpose?: string;
  landCategory?: string;
  electricity?: string;
  gas?: string;
  waterSupply?: string;
  sewerage?: string;
  accessRoad?: string;
  relief?: string;
  sellerName?: string;
  sellerPhone?: string;
  submissionCreatedAt?: string;
  source?: 'site' | 'crm';
  sourceRealtyId?: string;
}

interface PendingLandPlot extends LandPlot {
  sellerName: string;
  sellerPhone: string;
  createdAt: string;
  source?: 'site' | 'crm';
  sourceRealtyId?: string;
}

type HouseMarketType = 'new' | 'secondary';

interface HouseListing {
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
  livingArea?: string;
  kitchenArea?: string;
  bathrooms?: string;
  wallMaterial?: string;
  renovation?: string;
  heating?: string;
  waterSupply?: string;
  sewerage?: string;
  electricity?: string;
  gas?: string;
  sellerName?: string;
  sellerPhone?: string;
  submissionCreatedAt?: string;
  source?: 'site' | 'crm';
  sourceRealtyId?: string;
}

interface PendingHouseListing extends HouseListing {
  sellerName: string;
  sellerPhone: string;
  createdAt: string;
  source?: 'site' | 'crm';
  sourceRealtyId?: string;
}

type LesnoeOzeroPhase = 'lake' | 'forest';
type LesnoeOzeroPlotStatus = 'available' | 'reserved' | 'sold';

interface LesnoeOzeroPlot {
  id: string;
  phase: LesnoeOzeroPhase;
  areaSotka: number;
  status: LesnoeOzeroPlotStatus;
  price: string;
  cadastralNumber: string;
  description: string;
  position: { x: number; y: number };
  purpose: string;
  electricity: string;
  gas: string;
  access: string;
}

interface ContentPage {
  slug: string;
  title: string;
  content: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  image: string;
  boxPrice: string;
  buildDuration: string;
  rating: number;
  clientName: string;
  review: string;
}

type JournalArticleStatus = 'draft' | 'review' | 'published';

interface JournalCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

interface JournalArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  categoryId: string;
  tags: string[];
  author: string;
  authorRole: string;
  authorBio: string;
  reviewer: string;
  status: JournalArticleStatus;
  featured: boolean;
  relatedProjectIds: string[];
  relatedServiceSlugs: string[];
  ctaTitle: string;
  ctaText: string;
  ctaHref: string;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  source?: 'admin' | 'crm';
  sourceId?: string;
}

interface DataStore {
  projects: HouseProject[];
  lands: LandPlot[];
  pendingLands: PendingLandPlot[];
  homes: HouseListing[];
  pendingHomes: PendingHouseListing[];
  lesnoeOzeroPlots: LesnoeOzeroPlot[];
  portfolio: PortfolioItem[];
  journalCategories: JournalCategory[];
  journalArticles: JournalArticle[];
  leads: Lead[];
  pages: Record<string, ContentPage>;
  menuOrder: string[];
  siteSettings: {
    logoUrl: string;
    contactPhotoUrl: string;
    contactName: string;
    contactPosition: string;
    contactPhone: string;
    contactCityPhone: string;
    contactEmail: string;
  };
}

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
const PROJECTS_ASSETS_DIR = path.join(ASSETS_DIR, 'projects');
const CALLBACK_RECEIVER = process.env.CALLBACK_EMAIL || '89022099279@mail.ru';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || CALLBACK_RECEIVER;
const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN || '';
const MAX_CALLBACK_CHAT_ID = Number(process.env.MAX_CALLBACK_CHAT_ID || '');
const ADMIN_PATH = process.env.ADMIN_PATH || '/admin';
const CRM_API_URL = process.env.CRM_API_URL || 'https://crm.evtenia.ru/site-lead/create';
const CRM_API_SECRET_FILE = process.env.CRM_API_SECRET_FILE || '/var/www/dom/.crm_api_secret';
const CRM_API_SECRET = process.env.CRM_API_SECRET || (() => {
  try {
    return fs.readFileSync(CRM_API_SECRET_FILE, 'utf-8').trim();
  } catch {
    return '';
  }
})();
const CRM_SUBMISSION_SECRET = process.env.CRM_SUBMISSION_SECRET || CRM_API_SECRET;
const CRM_SYNC_TIMEOUT_MS = Number(process.env.CRM_SYNC_TIMEOUT_MS || 8000);

const mailTransport = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

async function sendLeadToMax(lead: Lead, sourceTitle: string) {
  if (!MAX_BOT_TOKEN || !MAX_CALLBACK_CHAT_ID) return;

  const text = [
    `📬 **Новая заявка: ${sourceTitle}**`,
    `👤 Имя: ${lead.name || '-'}`,
    `📞 Телефон: ${lead.phone}`,
    `✉️ Email: ${lead.email || ''}`,
    `💬 Сообщение: ${lead.message || '-'}`,
    `🕒 Дата: ${new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
  ].join('\n');

  const response = await fetch(`https://platform-api.max.ru/messages?chat_id=${MAX_CALLBACK_CHAT_ID}`, {
    method: 'POST',
    headers: {
      Authorization: MAX_BOT_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, format: 'markdown' })
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    throw new Error(`Max API returned ${response.status}: ${responseText}`);
  }
}

function getLeadSourceTitle(lead: Lead, data: DataStore) {
  if (lead.sourceTitle) return lead.sourceTitle;
  if (lead.projectId) {
    const project = [...(data.projects || []), ...seedProjects].find((item) => item.id === lead.projectId);
    if (project) return `Проект дома: ${project.title}`;
  }
  return 'Форма заявки на сайте';
}

type CrmPipeline = 'construction' | 'construction_service';

function getLeadCrmPipeline(lead: Lead, sourceTitle: string): CrmPipeline | null {
  if (sourceTitle === 'Проектирование' || sourceTitle.startsWith('Услуга:')) {
    return 'construction_service';
  }
  if (
    sourceTitle.startsWith('Земельный участок:')
    || sourceTitle.startsWith('Лесное озеро:')
    || sourceTitle.startsWith('Готовый дом:')
    || sourceTitle === 'Подбор готового дома'
    || sourceTitle === 'Персональный подбор участка'
    || sourceTitle === 'Ипотечный калькулятор'
  ) {
    return null;
  }
  if (lead.projectId || sourceTitle.startsWith('Проект дома:') || sourceTitle === 'Заявка на просчет дома') {
    return 'construction';
  }
  return 'construction';
}

async function sendLeadToCrm(lead: Lead, sourceTitle: string): Promise<number | null> {
  const pipeline = getLeadCrmPipeline(lead, sourceTitle);
  if (!pipeline) return null;
  if (!CRM_API_SECRET) throw new Error('CRM integration secret is not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CRM_SYNC_TIMEOUT_MS);
  try {
    const response = await fetch(CRM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Evtenia-Webhook-Token': CRM_API_SECRET
      },
      body: JSON.stringify({
        external_id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        message: lead.message || '',
        source_title: sourceTitle,
        pipeline
      }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({})) as { request_id?: number; message?: string };
    if (!response.ok || !payload.request_id) {
      throw new Error(`CRM returned ${response.status}: ${payload.message || 'unknown error'}`);
    }
    return payload.request_id;
  } finally {
    clearTimeout(timeout);
  }
}

async function retryPendingCrmLeads(): Promise<void> {
  if (!CRM_API_SECRET) return;
  const data = readData();
  const pending = data.leads.filter((lead) => !lead.crmSyncedAt && Boolean(lead.crmSyncError)).slice(0, 20);
  let changed = false;
  for (const lead of pending) {
    const sourceTitle = getLeadSourceTitle(lead, data);
    if (!getLeadCrmPipeline(lead, sourceTitle)) continue;
    try {
      const requestId = await sendLeadToCrm(lead, sourceTitle);
      if (requestId) {
        lead.crmRequestId = requestId;
        lead.crmSyncedAt = new Date().toISOString();
        delete lead.crmSyncError;
        changed = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lead.crmSyncError = message.slice(0, 300);
      changed = true;
      console.error(`Не удалось повторно отправить заявку ${lead.id} в CRM`, message);
    }
  }
  if (changed) writeData(data);
}

const CONSTRUCTION_TYPES = [
  'Из газобетона',
  'Каркасные',
  'Модульные'
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
const NAV_MENU_DEFAULT_ORDER = ['home', 'about', 'projects', 'baths', 'doors', 'chany', 'homes', 'lands', 'settlements', 'services', 'furniture', 'promotions', 'journal', 'contacts'];

function normalizeMenuOrder(order?: string[]) {
  const incoming = Array.isArray(order) ? order.filter((item) => NAV_MENU_DEFAULT_ORDER.includes(item)) : [];
  const normalized = [...incoming, ...NAV_MENU_DEFAULT_ORDER.filter((item) => !incoming.includes(item))];
  for (const key of ['baths', 'doors', 'chany']) {
    if (!incoming.includes(key)) normalized.splice(normalized.indexOf(key), 1);
  }
  let insertAfter = 'projects';
  for (const key of ['baths', 'doors', 'chany']) {
    if (incoming.includes(key)) { insertAfter = key; continue; }
    normalized.splice(normalized.indexOf(insertAfter) + 1, 0, key);
    insertAfter = key;
  }
  return normalized;
}
const DEFAULT_LOGO_URL = '/assets/logo_small.png';
const DEFAULT_CONTACTS = {
  contactPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=80',
  contactName: 'Евгения Смирнова',
  contactPosition: 'Руководитель отдела продаж',
  contactPhone: '8-902-209-01-79',
  contactCityPhone: '8-8412-79-01-79',
  contactEmail: '89022099279@mail.ru'
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '');
}

const transliterate = (value: string): string => {
  const letters: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };
  return value.toLowerCase().split('').map((letter) => letters[letter] ?? letter)
    .join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

const getLegacyProjectSlug = (project: HouseProject, projects: HouseProject[]): string => {
  if (project.slug) return transliterate(project.slug) || `proekt-${project.id}`;
  const base = transliterate(project.title) || 'proekt-doma';
  const sameTitle = projects.filter((item) => (transliterate(item.title) || 'proekt-doma') === base);
  if (sameTitle.length < 2) return base;
  const dimensions = transliterate(`${project.area}-${project.floors}-${project.constructionType}`);
  const withDimensions = `${base}-${dimensions || project.id.slice(-6)}`;
  if (sameTitle.filter((item) => `${base}-${transliterate(`${item.area}-${item.floors}-${item.constructionType}`)}` === withDimensions).length < 2) return withDimensions;
  return `${withDimensions}-${project.id.slice(-6)}`;
};

const projectSlugBase = (project: HouseProject): string => {
  const titleSlug = transliterate(project.slug || project.title) || `proekt-${project.id}`;
  if (project.category === 'bath') return /^ban/.test(titleSlug) ? titleSlug : `proekt-bani-${titleSlug}`;
  return /(^|-)dom(-|$)|(^|-)doma(-|$)|(^|-)house(-|$)/.test(titleSlug) ? titleSlug : `proekt-doma-${titleSlug}`;
};

const getProjectSlug = (project: HouseProject, projects: HouseProject[]): string => {
  const base = projectSlugBase(project);
  const sameSlug = projects.filter((item) => projectSlugBase(item) === base);
  if (sameSlug.length < 2) return base;
  const dimensions = transliterate(`${project.area}-${project.floors}-${project.constructionType}`);
  const withDimensions = `${base}-${dimensions || project.id.slice(-6)}`;
  if (sameSlug.filter((item) => `${base}-${transliterate(`${item.area}-${item.floors}-${item.constructionType}`)}` === withDimensions).length < 2) return withDimensions;
  return `${withDimensions}-${project.id.slice(-6)}`;
};

const enrichHouseProjectCopy = (project: HouseProject): HouseProject => {
  if (project.category === 'bath' || project.catalogProject) return project;
  const title = project.title.replace(/[_-]+/g, ' ').trim();
  const area = project.area?.trim() || 'по запросу';
  const areaLabel = /(?:м2|м²|кв\.?\s*м)$/i.test(area) || area === 'по запросу' ? area : `${area} м²`;
  const floors = project.floors?.trim() || 'по проекту';
  const rooms = project.bedrooms?.trim() || 'состав помещений уточняется';
  const material = project.constructionType?.trim() || 'индивидуальная технология';
  const price = project.priceFrom?.trim() || 'по запросу';
  const shortDescription = project.shortDescription?.trim() && project.shortDescription.trim().length > 35
    ? project.shortDescription.trim()
    : `Проект дома «${title}»: ${areaLabel}, ${floors}, ${material.toLowerCase()}. Планировку и комплектацию адаптируем под участок в Пензе или Пензенской области.`;
  const fullDescription = project.fullDescription?.trim() && project.fullDescription.trim().length >= 120
    ? project.fullDescription.trim()
    : [
        `Проект «${title}» — отправная точка для подбора дома площадью ${areaLabel}. Указанные ${floors.toLowerCase()} и помещения (${rooms.toLowerCase()}) помогают оценить масштаб решения; итоговую планировку сверяем с составом семьи и тем, как вы планируете пользоваться домом.`,
        `Перед расчётом обсуждаем участок, подъезд, рельеф, посадку здания и исходные инженерные условия. Проверяем, какие изменения допустимы для выбранной технологии — ${material.toLowerCase()} — и какие решения потребуют отдельной проработки.`,
        `На странице указана предварительная цена ${price}. Это ориентир для знакомства с проектом, а не публичная оферта или готовая смета: стоимость зависит от основания, комплектации, инженерных систем, отделки, доставки и актуальных цен на материалы.`,
        `После заявки уточним желаемую комплектацию и сроки, подготовим расчёт для Пензы или населённого пункта Пензенской области и перечислим, что включено в стоимость. До согласования работ дополнительные позиции и их цена отдельно обсуждаются.`
      ].join('\n\n');
  return { ...project, shortDescription, fullDescription };
};

const enrichJournalCategoryCopy = (category: JournalCategory): JournalCategory => {
  const description = category.description?.replace(/\s+/g, ' ').trim() || `${category.name}: материалы о строительстве и загородной жизни.`;
  if (description.length >= 100) return { ...category, description };
  return { ...category, description: `${description.replace(/[.!?]+$/, '')}. Практические разборы и рекомендации Evtenia для Пензы и Пензенской области.` };
};

function journalSlugify(value: string) {
  const translit: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };
  return value.toLowerCase().split('').map((letter) => translit[letter] ?? letter).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const furnitureLeafPages = FURNITURE_STRUCTURE.flatMap((category) =>
  category.brands.map((brand) => {
    const slug = `furniture-${slugify(category.title)}-${slugify(brand)}`;
    return {
      slug,
      title: brand,
      content: `<p>Раздел мебели: ${category.title}. Подберем решение под размер помещения, стиль интерьера и бюджет.</p>`
    } satisfies ContentPage;
  })
);

const seedProjects: HouseProject[] = [
  {
    id: 'p1', title: 'Газобетон 118', shortDescription: 'Теплый дом из газобетона для семьи.',
    fullDescription: 'Проект с большой кухней-гостиной, тремя спальнями и отдельной котельной.',
    coverImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1605146768851-eda79da39897?auto=format&fit=crop&w=1200&q=80'],
    area: '118 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 5 200 000 ₽', constructionType: 'Газобетон', category: 'house', badge: 'Хит'
  },
  {
    id: 'p2', title: 'Арболит 126', shortDescription: 'Экологичный проект из арболита.',
    fullDescription: 'Комфортный дом с тремя спальнями и кабинетом.',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'],
    area: '126 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 5 500 000 ₽', constructionType: 'Арболит', category: 'house'
  },
  {
    id: 'p3', title: 'Кирпич 164', shortDescription: 'Надежный кирпичный дом.',
    fullDescription: 'Двухэтажный проект с мастер-спальней и просторной террасой.',
    coverImage: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80'],
    area: '164 м²', floors: '2 этажа', bedrooms: '4 спальни', priceFrom: 'от 7 450 000 ₽', constructionType: 'Кирпич', category: 'house', badge: 'Премиум'
  },
  {
    id: 'p4', title: 'Брус 96', shortDescription: 'Дом из профилированного бруса.',
    fullDescription: 'Компактный загородный дом для круглогодичного проживания.',
    coverImage: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1200&q=80'],
    area: '96 м²', floors: '1 этаж', bedrooms: '2 спальни', priceFrom: 'от 4 300 000 ₽', constructionType: 'Профилированный брус', category: 'house'
  },
  {
    id: 'p5', title: 'Брус 122', shortDescription: 'Клееный брус с панорамным остеклением.',
    fullDescription: 'Современный проект с высокими потолками и выходом на террасу.',
    coverImage: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'],
    area: '122 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 5 900 000 ₽', constructionType: 'Клееный брус', category: 'house'
  },
  {
    id: 'p6', title: 'Бревно 132', shortDescription: 'Классический дом из бревна.',
    fullDescription: 'Традиционный стиль с просторной гостиной и печной зоной.',
    coverImage: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1200&q=80'],
    area: '132 м²', floors: '2 этажа', bedrooms: '3 спальни', priceFrom: 'от 6 100 000 ₽', constructionType: 'Оцилиндрованное бревно', category: 'house'
  },
  {
    id: 'p7', title: 'Каркас 108', shortDescription: 'Быстровозводимый каркасный дом.',
    fullDescription: 'Энергоэффективный проект для постоянного проживания.',
    coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1200&q=80'],
    area: '108 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 4 800 000 ₽', constructionType: 'Каркасные', category: 'house'
  },
  {
    id: 'p8', title: 'SIP 94', shortDescription: 'Компактный дом из SIP панелей.',
    fullDescription: 'Современный проект под дачное и постоянное проживание.',
    coverImage: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'],
    area: '94 м²', floors: '1 этаж', bedrooms: '2 спальни', priceFrom: 'от 4 100 000 ₽', constructionType: 'SIP панели', category: 'house'
  },
  {
    id: 'p9', title: 'Дачный 82', shortDescription: 'Дачный дом под ключ.',
    fullDescription: 'Бюджетный проект с двумя спальнями и кухней-гостиной.',
    coverImage: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1200&q=80'],
    area: '82 м²', floors: '1 этаж', bedrooms: '2 спальни', priceFrom: 'от 3 600 000 ₽', constructionType: 'Строительство дачных домов под ключ', category: 'house'
  },
];

const seedPages: Record<string, ContentPage> = {
  about: {
    slug: 'about',
    title: 'О компании',
    content: 'Строительная компания Evtenia работает с 2014 года. Мы проектируем и строим качественные дома под ключ, помогаем с выбором участка, инженерными решениями, отделкой и благоустройством.'
  },
  furniture: {
    slug: 'furniture',
    title: 'Мебель',
    content: '<p>Изготавливаем корпусную и встроенную мебель под размеры вашего дома, квартиры или бани.</p>'
  },
  'discounts-ipoteka-i-kredit': {
    slug: 'discounts-ipoteka-i-kredit',
    title: 'Ипотека и кредит',
    content: '<p>Подберем комфортную программу ипотеки или кредита на строительство.</p>'
  },
  'discounts-vse-akcii': {
    slug: 'discounts-vse-akcii',
    title: 'Все акции',
    content: '<p>Здесь публикуем актуальные скидки, акции и специальные предложения.</p>'
  },
  'services-fundament': { slug: 'services-fundament', title: 'Фундамент', content: '<p>Проектируем и устраиваем фундаменты под тип грунта и нагрузку дома.</p>' },
  'services-besedki': { slug: 'services-besedki', title: 'Беседки', content: '<p>Строим беседки под ключ: от эскиза до финальной отделки.</p>' },
  'services-septik': { slug: 'services-septik', title: 'Септик', content: '<p>Подбираем и монтируем септики с учетом объема стоков и участка.</p>' },
  'services-zabory': { slug: 'services-zabory', title: 'Заборы', content: '<p>Устанавливаем заборы разных типов: профлист, евроштакетник, дерево.</p>' },
  'services-skvazhiny': { slug: 'services-skvazhiny', title: 'Скважины', content: '<p>Бурим и обустраиваем скважины под дом и баню с подбором оборудования.</p>' },
  'services-elektromontazh': {
    slug: 'services-elektromontazh',
    title: 'Электромонтаж',
    content: '<p>Продуманная электрика начинается с задач семьи: где будут светильники, техника, рабочие места и уличное освещение. Согласуем расположение точек, состав линий и оборудование перед монтажом.</p><h2>Что входит в услугу</h2><ul><li>Планирование электросети с учетом планировки и будущих нагрузок.</li><li>Подбор кабеля, защитных устройств, розеток, выключателей и освещения.</li><li>Прокладка линий, сборка электрощита и монтаж электроточек.</li><li>Проверка соединений и работы установленного оборудования.</li></ul><p>Состав работ и стоимость определяем после изучения объекта и фиксируем в смете.</p>'
  },
  'services-umnyy-dom': {
    slug: 'services-umnyy-dom',
    title: 'Умный дом',
    content: '<p>Автоматизация помогает управлять привычными системами дома из одного интерфейса и запускать удобные сценарии без лишних действий. Подберем решение под планировку, готовую электрику и ваши повседневные задачи.</p><h2>Что можно автоматизировать</h2><ul><li>Освещение: группы света, расписания и сценарии для разных комнат.</li><li>Климат: управление отоплением и температурой по выбранным зонам.</li><li>Другие совместимые устройства и уведомления — после оценки оборудования и сети.</li></ul><p>Сначала согласуем нужные функции и совместимость устройств, затем выполним монтаж, настройку и покажем, как пользоваться системой.</p>'
  },
  'services-vyvoz-musora': { slug: 'services-vyvoz-musora', title: 'Вывоз мусора', content: '<p>Организуем оперативный вывоз строительного и бытового мусора с объекта.</p>' },
  'services-styazhka-pola': { slug: 'services-styazhka-pola', title: 'Стяжка пола', content: '<p>Делаем полусухую и бетонную стяжку с соблюдением уровня и сроков набора прочности.</p>' },
  'services-konditsionery': { slug: 'services-konditsionery', title: 'Кондиционеры', content: '<p>Подбираем, устанавливаем и обслуживаем кондиционеры для дома и бани.</p>' },
  'services-interernoe-ozelenenie': { slug: 'services-interernoe-ozelenenie', title: 'Интерьерное озеленение', content: '<p>Создаем проекты озеленения интерьера и подбираем растения под условия помещения.</p>' },
  'services-otsenka-nedvizhimosti': { slug: 'services-otsenka-nedvizhimosti', title: 'Оценка недвижимости', content: '<p>Проводим профессиональную оценку недвижимости для продажи, ипотеки и юридических задач.</p>' },
  'services-plastikovye-okna': { slug: 'services-plastikovye-okna', title: 'Пластиковые окна', content: '<p>Подбираем и устанавливаем ПВХ-окна с учетом теплопотерь и дизайна.</p>' },
  'services-dveri': { slug: 'services-dveri', title: 'Двери', content: '<p>Входные и межкомнатные двери с монтажом и фурнитурой.</p>' },
  'services-remont': { slug: 'services-remont', title: 'Ремонт', content: '<p>Выполняем внутренний ремонт и отделку домов под ключ.</p>' },
  'services-lestnitsy': { slug: 'services-lestnitsy', title: 'Лестницы', content: '<p>Проектируем и изготавливаем деревянные и комбинированные лестницы.</p>' },
  'services-svai': { slug: 'services-svai', title: 'Сваи', content: '<p>Монтаж винтовых и железобетонных свай под разные типы грунта.</p>' },
  'services-dizainer': { slug: 'services-dizainer', title: 'Дизайнер', content: '<p>Разрабатываем дизайн-концепцию интерьеров и экстерьеров.</p>' },
  'services-landshaftnyy-dizayn': { slug: 'services-landshaftnyy-dizayn', title: 'Ландшафтный дизайн', content: '<p>Проектируем благоустройство участка и озеленение территории.</p>' },
  'services-mezhevanie': { slug: 'services-mezhevanie', title: 'Межевание', content: '<p>Готовим документы и выполняем межевание земельных участков.</p>' },
  'services-ipoteka-oformlenie': { slug: 'services-ipoteka-oformlenie', title: 'Ипотека. Оформление', content: '<p>Помогаем с подбором банка, программой, пакетом документов и сопровождением сделки.</p>' },
  'services-strahovanie': { slug: 'services-strahovanie', title: 'Страхование', content: '<p>Помогаем сравнить варианты страхования дома, квартиры, дачи, имущества и гражданской ответственности от ведущих страховых компаний, с которыми работаем.</p><h2>Подбор условий под объект</h2><p>Уточняем задачу, собираем исходные данные, сопоставляем страховые суммы, выбранные риски, исключения, лимиты и франшизу. Доступность программы и окончательную стоимость подтверждает страховая компания.</p><h2>Что можно обсудить</h2><ul><li>страхование частного дома, дачи или квартиры;</li><li>отделку, инженерное оборудование и домашнее имущество;</li><li>гражданскую ответственность и требования по ипотеке.</li></ul><p>Перед оплатой проверяйте договор и правила страхования: они определяют покрытие, исключения, срок и порядок обращения при страховом событии.</p>' },
  ...Object.fromEntries(furnitureLeafPages.map((page) => [page.slug, page]))
};

const seedPortfolio: PortfolioItem[] = [
  {
    id: 'portfolio_1',
    title: 'Дом из двойного бруса 69 кв.м.',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    boxPrice: 'от 2 449 500 руб',
    buildDuration: '2 месяца',
    rating: 5,
    clientName: 'Юлия Александровна',
    review: 'Купила участок недалеко от города, сразу решила строиться. Ребята помогли выбрать проект и сделали всё в срок.'
  },
  {
    id: 'portfolio_2',
    title: 'Дом из профилированного бруса 131 кв.м.',
    image: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80',
    boxPrice: 'от 4 847 000 руб',
    buildDuration: '2 месяца',
    rating: 5,
    clientName: 'Ирина Савельева',
    review: 'Сбылась мечта о новом уютном доме. Организация работ и обратная связь с прорабом были отличными.'
  },
  {
    id: 'portfolio_3',
    title: 'Каркасный дом 104 кв.м.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    boxPrice: 'от 3 950 000 руб',
    buildDuration: '1.5 месяца',
    rating: 5,
    clientName: 'Андрей Петров',
    review: 'Дом построили быстро и аккуратно, тепло держит отлично. Результат полностью устроил.'
  },
  {
    id: 'portfolio_4',
    title: 'Кирпичный дом 156 кв.м.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    boxPrice: 'от 7 100 000 руб',
    buildDuration: '4 месяца',
    rating: 5,
    clientName: 'Наталья Ефремова',
    review: 'Сложный рельеф участка, но команда всё продумала. Получилось красиво и надежно.'
  },
  {
    id: 'portfolio_5',
    title: 'Дом из газобетона 118 кв.м.',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
    boxPrice: 'от 5 200 000 руб',
    buildDuration: '3 месяца',
    rating: 5,
    clientName: 'Евгений Климов',
    review: 'Прозрачная смета, адекватные сроки и отличная работа бригады. Рекомендуем.'
  },
  {
    id: 'portfolio_6',
    title: 'Дачный дом 82 кв.м.',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    boxPrice: 'от 3 600 000 руб',
    buildDuration: '1 месяц',
    rating: 5,
    clientName: 'Олег и Марина',
    review: 'Нужен был удобный дом для выходных — получили именно то, что хотели, без лишних затрат.'
  }
];

const seedJournalCategories: JournalCategory[] = [
  { id: 'journal-category-technologies', name: 'Технологии домов', slug: 'tekhnologii-domov', description: 'Каркасные, модульные и газобетонные дома: сравнения и выбор технологии.', order: 10 },
  { id: 'journal-category-projects', name: 'Проекты и планировки', slug: 'proekty-i-planirovki', description: 'Как выбрать площадь, этажность, комнаты и подходящий проект дома.', order: 20 },
  { id: 'journal-category-foundation', name: 'Фундамент и участок', slug: 'fundament-i-uchastok', description: 'Грунты, фундаменты, посадка дома и подготовка участка к строительству.', order: 30 },
  { id: 'journal-category-construction', name: 'Строительство и инженерия', slug: 'stroitelstvo-i-inzheneriya', description: 'Этапы работ, материалы, утепление, кровля, скважины и коммуникации.', order: 40 },
  { id: 'journal-category-finance', name: 'Ипотека, цены и документы', slug: 'ipoteka-tseny-i-dokumenty', description: 'Смета, ипотека на строительство, договоры, земля и межевание.', order: 50 },
  { id: 'journal-category-finishing', name: 'Отделка и благоустройство', slug: 'otdelka-i-blagoustroystvo', description: 'Ремонт, двери, мебель, заборы, дизайн и благоустройство участка.', order: 60 },
  { id: 'journal-category-cases', name: 'Объекты и опыт Evtenia', slug: 'obekty-i-opyt', description: 'Разборы построенных домов, практические решения и опыт команды.', order: 70 }
];

const seedJournalArticles: JournalArticle[] = [];

const seedLands: LandPlot[] = [
  { id: 'land1', cadastralNumber: '58:29:1003001:254', area: '10 соток', price: '1 250 000 ₽', district: 'Пензенский район', images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'], mapUrl: '' },
  { id: 'land2', cadastralNumber: '58:29:1003001:255', area: '12 соток', price: '1 480 000 ₽', district: 'Бессоновский район', images: ['https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80'], mapUrl: '' },
  { id: 'land3', cadastralNumber: '58:29:1003001:256', area: '8 соток', price: '980 000 ₽', district: 'Железнодорожный район', images: ['https://images.unsplash.com/photo-1493815793585-d94ccbc86df8?auto=format&fit=crop&w=1200&q=80'], mapUrl: '' }
];

const seedHomes: HouseListing[] = [
  {
    id: 'home-sosnovy-128',
    title: 'Новый дом в Сосновом квартале',
    marketType: 'new',
    area: '128 м²',
    landArea: '8 соток',
    price: '9 850 000 ₽',
    district: 'Пензенский район',
    address: 'с. Засечное, Сосновый квартал',
    floors: '1 этаж',
    bedrooms: '3 спальни',
    yearBuilt: '2026',
    description: 'Готовый одноэтажный дом с просторной кухней-гостиной, мастер-спальней и террасой. Предчистовая отделка, газ и электричество заведены в дом.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85'
    ]
  },
  {
    id: 'home-arbekovo-174',
    title: 'Семейный дом в Арбеково',
    marketType: 'secondary',
    area: '174 м²',
    landArea: '10 соток',
    price: '13 400 000 ₽',
    district: 'Октябрьский район',
    address: 'Пенза, район Арбеково',
    floors: '2 этажа',
    bedrooms: '4 спальни',
    yearBuilt: '2018',
    description: 'Кирпичный дом с ремонтом, мебелью и благоустроенным участком. На первом этаже кухня-гостиная и гостевая спальня, на втором — три спальни.',
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85'
    ]
  }
];

const seedLesnoeOzeroPlots: LesnoeOzeroPlot[] = [
  { id: '899', phase: 'lake', areaSotka: 8.6, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 72, y: 24 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Компактный участок рядом с озером. Подойдёт для постоянного дома или дачи.' },
  { id: '939', phase: 'lake', areaSotka: 8.9, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 59, y: 30 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Участок у воды с удобным выходом к внутренней дороге.' },
  { id: '875', phase: 'lake', areaSotka: 10.1, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 57, y: 40 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Универсальная площадь и живописное природное окружение.' },
  { id: '876', phase: 'lake', areaSotka: 10.8, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 53, y: 49 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Просторный участок с хорошей формой для посадки дома.' },
  { id: '877', phase: 'lake', areaSotka: 13.3, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 52, y: 57 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Увеличенная площадь для дома, террасы и дополнительных строений.' },
  { id: '878', phase: 'lake', areaSotka: 10.1, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 53, y: 65 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Отдельный участок в центральной части первой очереди.' },
  { id: '879', phase: 'lake', areaSotka: 10.5, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 56, y: 73 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Участок рядом с лесным массивом и разворотной площадкой.' },
  { id: '900', phase: 'lake', areaSotka: 10.2, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 77, y: 36 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Ровный участок на противоположной стороне основной дороги.' },
  { id: '902', phase: 'lake', areaSotka: 7.2, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 82, y: 53 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Компактный вариант для дачного дома или инвестиции.' },
  { id: '903', phase: 'lake', areaSotka: 7.1, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 84, y: 63 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Доступный по площади участок у лесной границы.' },
  { id: '1394', phase: 'forest', areaSotka: 6, status: 'available', price: '550 000 ₽', cadastralNumber: '', position: { x: 68, y: 28 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Компактный лесной участок: под дом, дачу или инвестицию.' },
  { id: '1388', phase: 'forest', areaSotka: 8.5, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 69, y: 38 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Участок хорошей формы с удобным расположением у дороги.' },
  { id: '849', phase: 'forest', areaSotka: 16, status: 'available', price: 'По запросу', cadastralNumber: '', position: { x: 58, y: 67 }, purpose: 'ИЖС', electricity: '15 кВт вдоль земельного участка', gas: 'вдоль земельного участка', access: 'круглогодичный', description: 'Редкий крупный участок рядом с водой — под усадьбу или банный комплекс.' }
];

function normalizeLesnoeOzeroPlot(incoming: Partial<LesnoeOzeroPlot>, fallbackId = `plot_${Date.now()}`): LesnoeOzeroPlot {
  const phase: LesnoeOzeroPhase = incoming.phase === 'forest' ? 'forest' : 'lake';
  const status: LesnoeOzeroPlotStatus = incoming.status === 'reserved' || incoming.status === 'sold' ? incoming.status : 'available';
  return {
    id: String(incoming.id || fallbackId).trim(),
    phase,
    areaSotka: Math.max(0, Number(incoming.areaSotka) || 0),
    status,
    price: String(incoming.price || 'По запросу').trim(),
    cadastralNumber: String(incoming.cadastralNumber || '').trim(),
    description: String(incoming.description || '').trim(),
    position: {
      x: Math.min(100, Math.max(0, Number(incoming.position?.x) || 50)),
      y: Math.min(100, Math.max(0, Number(incoming.position?.y) || 50))
    },
    purpose: String(incoming.purpose || 'ИЖС').trim(),
    electricity: String(incoming.electricity || '15 кВт вдоль земельного участка').trim(),
    gas: String(incoming.gas || 'вдоль земельного участка').trim(),
    access: String(incoming.access || 'круглогодичный').trim()
  };
}

function normalizeLandPlot(incoming: Partial<LandPlot> & { image?: string }, fallbackId = `land_${Date.now()}`): LandPlot {
  const images = Array.isArray(incoming.images)
    ? incoming.images.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  if (!images.length && incoming.image) images.push(String(incoming.image).trim());
  return {
    id: incoming.id || fallbackId,
    cadastralNumber: incoming.cadastralNumber || '',
    area: incoming.area || '',
    price: incoming.price || '',
    district: incoming.district || '',
    description: incoming.description || '',
    images,
    mapUrl: incoming.mapUrl || '',
    purpose: String(incoming.purpose || '').trim(),
    landCategory: String(incoming.landCategory || '').trim(),
    electricity: String(incoming.electricity || '').trim(),
    gas: String(incoming.gas || '').trim(),
    waterSupply: String(incoming.waterSupply || '').trim(),
    sewerage: String(incoming.sewerage || '').trim(),
    accessRoad: String(incoming.accessRoad || '').trim(),
    relief: String(incoming.relief || '').trim(),
    sellerName: String(incoming.sellerName || '').trim() || undefined,
    sellerPhone: String(incoming.sellerPhone || '').trim() || undefined,
    submissionCreatedAt: String(incoming.submissionCreatedAt || '').trim() || undefined,
    source: incoming.source,
    sourceRealtyId: String(incoming.sourceRealtyId || '').trim() || undefined
  };
}

function normalizeHouseListing(incoming: Partial<HouseListing> & { image?: string }, fallbackId = `home_${Date.now()}`): HouseListing {
  const images = Array.isArray(incoming.images) ? incoming.images.map((item) => String(item || '').trim()).filter(Boolean) : [];
  if (!images.length && incoming.image) images.push(String(incoming.image).trim());
  return {
    id: String(incoming.id || fallbackId),
    title: String(incoming.title || 'Готовый дом').trim(),
    marketType: incoming.marketType === 'secondary' ? 'secondary' : 'new',
    area: String(incoming.area || '').trim(),
    landArea: String(incoming.landArea || '').trim(),
    price: String(incoming.price || '').trim(),
    district: String(incoming.district || '').trim(),
    address: String(incoming.address || '').trim(),
    floors: String(incoming.floors || '').trim(),
    bedrooms: String(incoming.bedrooms || '').trim(),
    yearBuilt: String(incoming.yearBuilt || '').trim(),
    description: String(incoming.description || '').trim(),
    images,
    livingArea: String(incoming.livingArea || '').trim(),
    kitchenArea: String(incoming.kitchenArea || '').trim(),
    bathrooms: String(incoming.bathrooms || '').trim(),
    wallMaterial: String(incoming.wallMaterial || '').trim(),
    renovation: String(incoming.renovation || '').trim(),
    heating: String(incoming.heating || '').trim(),
    waterSupply: String(incoming.waterSupply || '').trim(),
    sewerage: String(incoming.sewerage || '').trim(),
    electricity: String(incoming.electricity || '').trim(),
    gas: String(incoming.gas || '').trim(),
    sellerName: String(incoming.sellerName || '').trim() || undefined,
    sellerPhone: String(incoming.sellerPhone || '').trim() || undefined,
    submissionCreatedAt: String(incoming.submissionCreatedAt || '').trim() || undefined,
    source: incoming.source,
    sourceRealtyId: String(incoming.sourceRealtyId || '').trim() || undefined
  };
}

/** Keep internal seller/submission data in storage, but never expose it publicly. */
function toPublicLandPlot(land: LandPlot): LandPlot {
  const { sellerName: _sellerName, sellerPhone: _sellerPhone, submissionCreatedAt: _submissionCreatedAt, source: _source, sourceRealtyId: _sourceRealtyId, ...publicLand } = land;
  return { ...publicLand, cadastralNumber: 'По запросу' };
}

function toPublicHouseListing(home: HouseListing): HouseListing {
  const { sellerName: _sellerName, sellerPhone: _sellerPhone, submissionCreatedAt: _submissionCreatedAt, source: _source, sourceRealtyId: _sourceRealtyId, ...publicHome } = home;
  return publicHome;
}

const ensureDataFile = (): void => {
  if (!fs.existsSync(DATA_FILE)) {
    const initial: DataStore = {
      projects: [...seedProjects, ...gasblockCatalogProjects, ...bathCatalogProjects],
      lands: seedLands,
      pendingLands: [],
      homes: seedHomes,
      pendingHomes: [],
      lesnoeOzeroPlots: seedLesnoeOzeroPlots,
      portfolio: seedPortfolio,
      journalCategories: seedJournalCategories,
      journalArticles: seedJournalArticles,
      leads: [],
      pages: seedPages,
      menuOrder: [...NAV_MENU_DEFAULT_ORDER],
      siteSettings: { logoUrl: DEFAULT_LOGO_URL, ...DEFAULT_CONTACTS }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
};

const readData = (): DataStore => {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(content) as Partial<DataStore>;
  const projects = [...(parsed.projects || seedProjects)];
  const projectIds = new Set(projects.map((project) => project.id));
  for (const project of gasblockCatalogProjects) {
    const existingIndex = projects.findIndex((existing) => existing.id === project.id);
    if (existingIndex >= 0 && project.catalogProject) {
      projects[existingIndex] = {
        ...projects[existingIndex],
        coverImage: project.coverImage,
        images: project.images
      };
    } else if (!projectIds.has(project.id)) {
      projects.push(project);
      projectIds.add(project.id);
    }
  }
  for (const project of bathCatalogProjects) {
    const existingIndex = projects.findIndex((existing) => existing.id === project.id);
    if (existingIndex >= 0 && projects[existingIndex].category === 'bath' && projects[existingIndex].isIllustrative) {
      projects[existingIndex] = { ...projects[existingIndex], ...project };
    } else if (!projectIds.has(project.id)) {
      projects.push(project);
      projectIds.add(project.id);
    }
  }
  return {
    projects: projects.map(enrichHouseProjectCopy),
    lands: Array.isArray(parsed.lands) && parsed.lands.length
      ? parsed.lands.map((land) => normalizeLandPlot(land as Partial<LandPlot> & { image?: string }, (land as Partial<LandPlot>)?.id || `land_${Date.now()}`))
      : seedLands,
    pendingLands: Array.isArray(parsed.pendingLands)
      ? parsed.pendingLands.map((land) => ({
          ...normalizeLandPlot(land as Partial<LandPlot> & { image?: string }, (land as Partial<LandPlot>)?.id || `pending_land_${Date.now()}`),
          sellerName: String((land as Partial<PendingLandPlot>)?.sellerName || ''),
          sellerPhone: String((land as Partial<PendingLandPlot>)?.sellerPhone || ''),
          createdAt: String((land as Partial<PendingLandPlot>)?.createdAt || new Date().toISOString()),
          source: (land as Partial<PendingLandPlot>)?.source,
          sourceRealtyId: String((land as Partial<PendingLandPlot>)?.sourceRealtyId || '')
        }))
      : [],
    homes: Array.isArray(parsed.homes)
      ? parsed.homes.map((home) => normalizeHouseListing(home, home.id))
      : seedHomes,
    pendingHomes: Array.isArray(parsed.pendingHomes)
      ? parsed.pendingHomes.map((home) => ({
          ...normalizeHouseListing(home, home.id || `pending_home_${Date.now()}`),
          sellerName: String(home.sellerName || ''),
          sellerPhone: String(home.sellerPhone || ''),
          createdAt: String(home.createdAt || new Date().toISOString()),
          source: home.source,
          sourceRealtyId: String(home.sourceRealtyId || '')
        }))
      : [],
    lesnoeOzeroPlots: Array.isArray(parsed.lesnoeOzeroPlots) && parsed.lesnoeOzeroPlots.length
      ? parsed.lesnoeOzeroPlots.map((plot) => normalizeLesnoeOzeroPlot(plot, plot.id))
      : seedLesnoeOzeroPlots,
    portfolio: parsed.portfolio || seedPortfolio,
    journalCategories: (Array.isArray(parsed.journalCategories) && parsed.journalCategories.length
      ? parsed.journalCategories
      : seedJournalCategories).map(enrichJournalCategoryCopy),
    journalArticles: Array.isArray(parsed.journalArticles) ? parsed.journalArticles : seedJournalArticles,
    leads: parsed.leads || [],
    pages: { ...seedPages, ...(parsed.pages || {}) },
    menuOrder: normalizeMenuOrder(parsed.menuOrder),
    siteSettings: {
      logoUrl: typeof parsed.siteSettings?.logoUrl === 'string' && parsed.siteSettings.logoUrl.trim()
        ? parsed.siteSettings.logoUrl
        : DEFAULT_LOGO_URL,
      contactPhotoUrl: typeof parsed.siteSettings?.contactPhotoUrl === 'string' && parsed.siteSettings.contactPhotoUrl.trim()
        ? parsed.siteSettings.contactPhotoUrl
        : DEFAULT_CONTACTS.contactPhotoUrl,
      contactName: typeof parsed.siteSettings?.contactName === 'string' && parsed.siteSettings.contactName.trim()
        ? parsed.siteSettings.contactName
        : DEFAULT_CONTACTS.contactName,
      contactPosition: typeof parsed.siteSettings?.contactPosition === 'string' && parsed.siteSettings.contactPosition.trim()
        ? parsed.siteSettings.contactPosition
        : DEFAULT_CONTACTS.contactPosition,
      contactPhone: typeof parsed.siteSettings?.contactPhone === 'string' && parsed.siteSettings.contactPhone.trim()
        ? parsed.siteSettings.contactPhone
        : DEFAULT_CONTACTS.contactPhone,
      contactCityPhone: typeof parsed.siteSettings?.contactCityPhone === 'string' && parsed.siteSettings.contactCityPhone.trim()
        ? parsed.siteSettings.contactCityPhone
        : DEFAULT_CONTACTS.contactCityPhone,
      contactEmail: typeof parsed.siteSettings?.contactEmail === 'string' && parsed.siteSettings.contactEmail.trim()
        ? parsed.siteSettings.contactEmail
        : DEFAULT_CONTACTS.contactEmail
    }
  };
};

const writeData = (data: DataStore): void => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const syncManagedJournalArticles = (): void => {
  const data = readData();
  const draftsDir = path.join(__dirname, '..', '..', 'seo-agent', 'drafts');
  const managed = [
    { slug: 'modulnye-doma-otzyvy-i-minusy', repairMalformed: true },
    { slug: 'kakuyu-tekhnologiyu-doma-vybrat', repairMalformed: false },
    { slug: 'dostavka-i-montazh-modulnogo-doma', repairMalformed: false },
    { slug: 'modulnyy-dom-s-kommunikaciyami', repairMalformed: false },
    { slug: 'modulnyy-ili-karkasnyy-dom', repairMalformed: false }
  ];
  let changed = false;

  for (const item of managed) {
    const jsonPath = path.join(draftsDir, `${item.slug}.json`);
    const htmlPath = path.join(draftsDir, `${item.slug}.html`);
    if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) continue;

    const draft = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as Partial<JournalArticle>;
    const content = fs.readFileSync(htmlPath, 'utf-8');
    const existing = data.journalArticles.find((article) => article.slug === item.slug);

    if (!existing) {
      data.journalArticles.unshift(normalizeJournalArticle({ ...draft, content }));
      changed = true;
      console.log(`Managed Journal article created: ${item.slug}`);
      continue;
    }

    if (item.repairMalformed && !existing.content.includes('<h2')) {
      existing.content = content;
      existing.authorRole = existing.authorRole || String(draft.authorRole || '');
      existing.authorBio = existing.authorBio || String(draft.authorBio || '');
      existing.updatedAt = new Date().toISOString();
      changed = true;
      console.log(`Managed Journal article formatting repaired: ${item.slug}`);
    }
  }

  if (changed) writeData(data);
};

const deleteAssetByUrl = (rawUrl: string): boolean => {
  if (!rawUrl) return false;
  try {
    const parsed = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? new URL(rawUrl)
      : new URL(rawUrl, 'http://localhost');
    const pathname = parsed.pathname;
    const normalized = pathname.startsWith('/api/assets/')
      ? pathname.replace('/api/assets/', '')
      : pathname.startsWith('/assets/')
        ? pathname.replace('/assets/', '')
        : '';
    if (!normalized) return false;
    const targetPath = path.resolve(ASSETS_DIR, normalized);
    if (!targetPath.startsWith(path.resolve(ASSETS_DIR))) return false;
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const ensureAssetsDirs = (): void => {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_ASSETS_DIR)) fs.mkdirSync(PROJECTS_ASSETS_DIR, { recursive: true });
};

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.header('x-admin-token') !== ADMIN_TOKEN) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
};

const crmSubmissionAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!CRM_SUBMISSION_SECRET) {
    res.status(503).json({ message: 'CRM submission integration is not configured' });
    return;
  }
  if (req.header('x-evtenia-webhook-token') !== CRM_SUBMISSION_SECRET) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
};

app.use(cors());
app.use(express.json());
ensureAssetsDirs();

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path === '/' || req.path.startsWith('/api/') || !req.path.endsWith('/')) return next();
  const cleanPath = req.path.replace(/\/+$/, '');
  return res.redirect(301, `${cleanPath}${req.url.slice(req.path.length)}`);
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error(`Недопустимый формат файла: ${file.originalname}. Разрешены только изображения.`));
      return;
    }
    cb(null, true);
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/construction-types', (_req, res) => res.json(CONSTRUCTION_TYPES));

app.get('/api/projects', (_req, res) => {
  const data = readData();
  res.json(data.projects.map((project) => ({ ...project, slug: getProjectSlug(project, data.projects) })));
});
app.get('/api/lands', (_req, res) => res.json((readData().lands || seedLands).map(toPublicLandPlot)));
app.get('/api/lands/:id', (req, res) => {
  const land = (readData().lands || seedLands).find((item) => item.id === req.params.id);
  if (!land) return res.status(404).json({ message: 'Участок не найден' });
  return res.json(toPublicLandPlot(land));
});
app.get('/api/homes', (_req, res) => res.json((readData().homes || seedHomes).map(toPublicHouseListing)));
app.get('/api/homes/:id', (req, res) => {
  const home = (readData().homes || seedHomes).find((item) => item.id === req.params.id);
  if (!home) return res.status(404).json({ message: 'Дом не найден' });
  return res.json(toPublicHouseListing(home));
});
app.post('/api/crm/realty-submissions', crmSubmissionAuthMiddleware, (req, res) => {
  const incoming = req.body as Record<string, unknown>;
  const kind = incoming.kind === 'land' ? 'land' : incoming.kind === 'home' ? 'home' : '';
  const sourceRealtyId = String(incoming.sourceRealtyId || '').trim();
  const sellerName = String(incoming.sellerName || '').trim();
  const sellerPhone = String(incoming.sellerPhone || '').trim();
  const images = Array.isArray(incoming.images)
    ? incoming.images.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  if (!kind || !sourceRealtyId || !sellerName || !sellerPhone) {
    return res.status(400).json({ message: 'Не указан тип, ID объекта или контакт ответственного' });
  }
  if (!images.length) {
    return res.status(400).json({ message: 'Добавьте хотя бы одну фотографию объекта' });
  }

  const data = readData();
  const createdAt = new Date().toISOString();
  if (kind === 'land') {
    const existingIndex = data.pendingLands.findIndex(
      (item) => item.source === 'crm' && item.sourceRealtyId === sourceRealtyId
    );
    const id = existingIndex >= 0
      ? data.pendingLands[existingIndex].id
      : `pending_land_crm_${sourceRealtyId}_${Date.now()}`;
    const pendingLand: PendingLandPlot = {
      ...normalizeLandPlot({ ...(incoming as Partial<LandPlot>), images }, id),
      sellerName,
      sellerPhone,
      createdAt: existingIndex >= 0 ? data.pendingLands[existingIndex].createdAt : createdAt,
      source: 'crm',
      sourceRealtyId
    };
    if (existingIndex >= 0) data.pendingLands[existingIndex] = pendingLand;
    else data.pendingLands.unshift(pendingLand);
    writeData(data);
    return res.status(existingIndex >= 0 ? 200 : 201).json({ ok: true, id, updated: existingIndex >= 0 });
  }

  const existingIndex = data.pendingHomes.findIndex(
    (item) => item.source === 'crm' && item.sourceRealtyId === sourceRealtyId
  );
  const id = existingIndex >= 0
    ? data.pendingHomes[existingIndex].id
    : `pending_home_crm_${sourceRealtyId}_${Date.now()}`;
  const pendingHome: PendingHouseListing = {
    ...normalizeHouseListing({ ...(incoming as Partial<HouseListing>), images }, id),
    sellerName,
    sellerPhone,
    createdAt: existingIndex >= 0 ? data.pendingHomes[existingIndex].createdAt : createdAt,
    source: 'crm',
    sourceRealtyId
  };
  if (existingIndex >= 0) data.pendingHomes[existingIndex] = pendingHome;
  else data.pendingHomes.unshift(pendingHome);
  writeData(data);
  return res.status(existingIndex >= 0 ? 200 : 201).json({ ok: true, id, updated: existingIndex >= 0 });
});
app.get('/api/lesnoe-ozero/plots', (_req, res) => res.json(readData().lesnoeOzeroPlots));
app.post('/api/land-submissions', upload.array('images', 20), async (req, res) => {
  const { sellerName, sellerPhone, cadastralNumber, area, price, district, description, mapUrl } = req.body as Record<string, string>;
  if (!sellerName || !sellerPhone || !cadastralNumber || !area || !price || !district || !description) {
    return res.status(400).json({ message: 'Заполните все обязательные поля участка' });
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) return res.status(400).json({ message: 'Добавьте хотя бы одно фото участка' });

  try {
    const images: string[] = [];
    for (const file of files) {
      const filename = `land_submission_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
      const outputPath = path.join(PROJECTS_ASSETS_DIR, filename);
      await sharp(file.buffer)
        .rotate()
        .resize(1200, 900, { fit: 'cover', position: 'attention' })
        .webp({ lossless: true, nearLossless: true, quality: 100 })
        .toFile(outputPath);
      images.push(`${req.protocol}://${req.get('host')}/api/assets/projects/${filename}`);
    }

    const data = readData();
    const pendingLand: PendingLandPlot = {
      id: `pending_land_${Date.now()}`,
      sellerName,
      sellerPhone,
      cadastralNumber,
      area,
      price,
      district,
      description,
      images,
      mapUrl: mapUrl || '',
      createdAt: new Date().toISOString()
    };
    data.pendingLands.unshift(pendingLand);
    data.leads.unshift({
      id: `lead_${Date.now()}`,
      name: sellerName,
      phone: sellerPhone,
      message: `Новый участок ожидает модерации в админке: ${req.protocol}://${req.get('host')}${ADMIN_PATH}. Кадастровый номер: ${cadastralNumber}. Площадь: ${area}. Район: ${district}. Цена: ${price}. Описание: ${description}`,
      sourceTitle: `Участок на модерацию: ${cadastralNumber}`,
      createdAt: pendingLand.createdAt
    });
    writeData(data);
    let maxNotified = true;
    try {
      await sendLeadToMax(data.leads[0], `Участок на модерацию: ${cadastralNumber}`);
    } catch (error) {
      maxNotified = false;
      console.error('Не удалось отправить заявку на землю в Max', error);
    }
    res.status(201).json({ ok: true, maxNotified });
  } catch (error) {
    console.error('Не удалось обработать заявку на землю', error);
    return res.status(500).json({ message: 'Не удалось обработать заявку' });
  }
});
app.post('/api/home-submissions', upload.array('images', 20), async (req, res) => {
  const { sellerName, sellerPhone, title, marketType, area, landArea, price, district, address, floors, bedrooms, yearBuilt, description } = req.body as Record<string, string>;
  if (!sellerName || !sellerPhone || !title || !area || !landArea || !price || !district || !address || !description) {
    return res.status(400).json({ message: 'Заполните все обязательные поля дома' });
  }
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) return res.status(400).json({ message: 'Добавьте хотя бы одно фото дома' });

  try {
    const images: string[] = [];
    for (const file of files) {
      const filename = `home_submission_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
      const outputPath = path.join(PROJECTS_ASSETS_DIR, filename);
      await sharp(file.buffer).rotate().resize(1400, 1000, { fit: 'cover', position: 'attention' }).webp({ quality: 88 }).toFile(outputPath);
      images.push(`${req.protocol}://${req.get('host')}/api/assets/projects/${filename}`);
    }

    const data = readData();
    const pendingHome: PendingHouseListing = {
      ...normalizeHouseListing({ title, marketType: marketType === 'secondary' ? 'secondary' : 'new', area, landArea, price, district, address, floors, bedrooms, yearBuilt, description, images }, `pending_home_${Date.now()}`),
      sellerName,
      sellerPhone,
      createdAt: new Date().toISOString()
    };
    data.pendingHomes.unshift(pendingHome);
    const lead: Lead = {
      id: `lead_${Date.now()}`,
      name: sellerName,
      phone: sellerPhone,
      message: `Новый дом ожидает модерации в админке: ${req.protocol}://${req.get('host')}${ADMIN_PATH}. ${title}, ${area}, ${district}, ${price}. Адрес: ${address}.`,
      sourceTitle: `Дом на модерацию: ${title}`,
      createdAt: pendingHome.createdAt
    };
    data.leads.unshift(lead);
    writeData(data);
    let maxNotified = true;
    try {
      await sendLeadToMax(lead, `Дом на модерацию: ${title}`);
    } catch (error) {
      maxNotified = false;
      console.error('Не удалось отправить заявку на дом в Max', error);
    }
    return res.status(201).json({ ok: true, maxNotified });
  } catch (error) {
    console.error('Не удалось обработать заявку на дом', error);
    return res.status(500).json({ message: 'Не удалось обработать заявку' });
  }
});
app.get('/api/portfolio', (_req, res) => res.json(readData().portfolio));

app.get('/api/journal/categories', (_req, res) => {
  const data = readData();
  const published = data.journalArticles.filter((article) => article.status === 'published');
  res.json([...data.journalCategories]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({ ...category, articleCount: published.filter((article) => article.categoryId === category.id).length })));
});

app.get('/api/journal/articles', (req, res) => {
  const data = readData();
  const categorySlug = String(req.query.category || '').trim();
  const category = categorySlug ? data.journalCategories.find((item) => item.slug === categorySlug) : undefined;
  const articles = data.journalArticles
    .filter((article) => article.status === 'published' && (!categorySlug || article.categoryId === category?.id))
    .sort((a, b) => String(b.publishedAt || b.updatedAt).localeCompare(String(a.publishedAt || a.updatedAt)));
  res.json(articles);
});

app.get('/api/journal/articles/:slug', (req, res) => {
  const data = readData();
  const article = data.journalArticles.find((item) => item.slug === req.params.slug && item.status === 'published');
  if (!article) return res.status(404).json({ message: 'Статья не найдена' });
  return res.json(article);
});

const escapeXml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

app.get('/sitemap.xml', (req, res) => {
  const data = readData();
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const entries: Array<{ path: string; lastmod?: string }> = [
    { path: '/' },
    { path: '/dveri' },
    ...['soul', 'siciliya', 'solo', 'line', 'yukon', 'erika', 'dizayn', 'modern', 'neoklassika', 'klassika', 'eko', 'ekogrand', 'kaliforniya', 'minimal', 'notte', 'smart', 'toskana'].map((slug) => ({ path: `/dveri/${slug}` })),
    { path: '/chany' },
    { path: '/projects' },
    { path: '/baths' },
    { path: '/design' },
    { path: '/homes' },
    { path: '/lands' },
    { path: '/about' },
    { path: '/journal' },
    ...[
      'fundament', 'besedki', 'septik', 'zabory', 'skvazhiny', 'elektromontazh', 'umnyy-dom',
      'vyvoz-musora', 'styazhka-pola', 'konditsionery', 'interernoe-ozelenenie', 'otsenka-nedvizhimosti',
      'plastikovye-okna', 'dveri', 'remont', 'lestnitsy', 'svai', 'dizainer', 'landshaftnyy-dizayn',
      'mezhevanie', 'ipoteka-oformlenie', 'strahovanie'
    ].map((slug) => ({ path: `/services/${slug}` })),
    ...data.projects.map((project) => ({ path: `/project/${encodeURIComponent(getProjectSlug(project, data.projects))}` })),
    ...data.homes.map((home) => ({ path: `/homes/${encodeURIComponent(home.id)}` })),
    ...data.lands.map((land) => ({ path: `/lands/${encodeURIComponent(land.id)}` })),
    ...data.journalCategories.map((category) => ({ path: `/journal/category/${encodeURIComponent(category.slug)}` })),
    ...data.journalArticles
      .filter((article) => article.status === 'published')
      .map((article) => ({ path: `/journal/${encodeURIComponent(article.slug)}`, lastmod: article.updatedAt }))
  ];
  const urls = entries.map((entry) => {
    const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod.slice(0, 10))}</lastmod>` : '';
    return `<url><loc>${escapeXml(`${origin}${entry.path}`)}</loc>${lastmod}</url>`;
  }).join('');
  res.set('Cache-Control', 'public, max-age=900');
  return res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  res.set('Cache-Control', 'public, max-age=3600');
  return res.type('text/plain').send(`User-agent: Yandex\nAllow: /\nDisallow: /catalog-control-7f3a\nClean-param: type&page\nClean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&utm_id&yclid&gclid\nSitemap: ${origin}/sitemap.xml\n\nUser-agent: *\nAllow: /\nDisallow: /catalog-control-7f3a\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get('/api/pages/:slug', (req, res) => {
  const page = readData().pages[req.params.slug];
  if (!page) return res.status(404).json({ message: 'Страница не найдена' });
  res.json(page);
});
app.get('/api/menu-order', (_req, res) => res.json({ order: readData().menuOrder || NAV_MENU_DEFAULT_ORDER }));
app.get('/api/site-settings', (_req, res) => res.json(readData().siteSettings));

app.post('/api/leads', async (req, res) => {
  const { name, phone, email, message, projectId, sourceTitle } = req.body as Partial<Lead>;
  if (!name || !phone) return res.status(400).json({ message: 'Укажите имя и телефон' });
  const data = readData();
  const lead: Lead = { id: `lead_${Date.now()}`, name, phone, email: email || '', message: message || '', projectId, sourceTitle: sourceTitle || '', createdAt: new Date().toISOString(), crmSyncError: 'pending' };
  const leadSourceTitle = getLeadSourceTitle(lead, data);
  data.leads.unshift(lead);
  writeData(data);

  try {
    await sendLeadToMax(lead, leadSourceTitle);
  } catch (error) {
    console.error('Не удалось отправить заявку в Max', error);
  }

  try {
    const requestId = await sendLeadToCrm(lead, leadSourceTitle);
    if (requestId) {
      lead.crmRequestId = requestId;
      lead.crmSyncedAt = new Date().toISOString();
      delete lead.crmSyncError;
      writeData(data);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    lead.crmSyncError = errorMessage.slice(0, 300);
    writeData(data);
    console.error('Не удалось отправить заявку в CRM; будет выполнена повторная попытка', errorMessage);
  }

  if (mailTransport) {
    try {
      await mailTransport.sendMail({
        from: SMTP_FROM,
        to: CALLBACK_RECEIVER,
        subject: `Новая заявка с сайта: ${name}`,
        text: `Имя: ${name}\nТелефон: ${phone}\nEmail: ${email || '-'}\nПроект: ${projectId || '-'}\nСообщение: ${message || '-'}`
      });
    } catch (error) {
      console.error('Не удалось отправить email по заявке', error);
    }
  }

  res.status(201).json({ ok: true });
});

app.post('/api/admin/login', (req, res) => {
  const { login, password } = req.body as { login?: string; password?: string };
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) return res.json({ token: ADMIN_TOKEN });
  res.status(401).json({ message: 'Неверный логин или пароль' });
});

app.get('/api/admin/projects', authMiddleware, (_req, res) => res.json(readData().projects));
app.get('/api/admin/lands', authMiddleware, (_req, res) => res.json(readData().lands || []));
app.get('/api/admin/pending-lands', authMiddleware, (_req, res) => res.json(readData().pendingLands || []));
app.get('/api/admin/homes', authMiddleware, (_req, res) => res.json(readData().homes || []));
app.get('/api/admin/pending-homes', authMiddleware, (_req, res) => res.json(readData().pendingHomes || []));
app.get('/api/admin/lesnoe-ozero/plots', authMiddleware, (_req, res) => res.json(readData().lesnoeOzeroPlots));

app.post('/api/admin/lesnoe-ozero/plots', authMiddleware, (req, res) => {
  const incoming = req.body as Partial<LesnoeOzeroPlot>;
  const id = String(incoming.id || '').trim();
  if (!id) return res.status(400).json({ message: 'Укажите номер участка' });
  const data = readData();
  if (data.lesnoeOzeroPlots.some((plot) => plot.id === id)) return res.status(409).json({ message: 'Участок с таким номером уже существует' });
  const plot = normalizeLesnoeOzeroPlot({ ...incoming, id }, id);
  data.lesnoeOzeroPlots.push(plot);
  writeData(data);
  res.status(201).json(plot);
});

app.put('/api/admin/lesnoe-ozero/plots/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const index = data.lesnoeOzeroPlots.findIndex((plot) => plot.id === id);
  if (index === -1) return res.status(404).json({ message: 'Участок не найден' });
  data.lesnoeOzeroPlots[index] = normalizeLesnoeOzeroPlot({ ...data.lesnoeOzeroPlots[index], ...(req.body as Partial<LesnoeOzeroPlot>), id }, id);
  writeData(data);
  res.json(data.lesnoeOzeroPlots[index]);
});

app.delete('/api/admin/lesnoe-ozero/plots/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.lesnoeOzeroPlots = data.lesnoeOzeroPlots.filter((plot) => plot.id !== id);
  writeData(data);
  res.json({ ok: true });
});
app.post('/api/admin/projects', authMiddleware, (req, res) => {
  const incoming = req.body as Partial<HouseProject>;
  const data = readData();
  const project: HouseProject = {
    id: `project_${Date.now()}`,
    title: incoming.title || 'Новый проект',
    shortDescription: incoming.shortDescription || '',
    fullDescription: incoming.fullDescription || '',
    coverImage: incoming.coverImage || '',
    images: incoming.images || [],
    area: incoming.area || '',
    floors: incoming.floors || '',
    bedrooms: incoming.bedrooms || '',
    priceFrom: incoming.priceFrom || '',
    constructionType: incoming.constructionType || CONSTRUCTION_TYPES[0],
    category: incoming.category === 'bath' ? 'bath' : 'house',
    badge: incoming.badge || '',
    style: incoming.style || ''
  };
  data.projects.unshift(project);
  writeData(data);
  res.status(201).json(project);
});

app.post('/api/admin/lands', authMiddleware, (req, res) => {
  const incoming = req.body as Partial<LandPlot> & { image?: string };
  const data = readData();
  const land: LandPlot = normalizeLandPlot(incoming);
  data.lands.unshift(land);
  writeData(data);
  res.status(201).json(land);
});

app.post('/api/admin/homes', authMiddleware, (req, res) => {
  const data = readData();
  const home = normalizeHouseListing(req.body as Partial<HouseListing>, `home_${Date.now()}`);
  data.homes.unshift(home);
  writeData(data);
  res.status(201).json(home);
});

app.put('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const idx = data.projects.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Проект не найден' });
  data.projects[idx] = { ...data.projects[idx], ...(req.body as Partial<HouseProject>), id };
  writeData(data);
  res.json(data.projects[idx]);
});

app.put('/api/admin/lands/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const idx = data.lands.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Участок не найден' });
  const merged = { ...data.lands[idx], ...(req.body as Partial<LandPlot> & { image?: string }), id };
  data.lands[idx] = normalizeLandPlot(merged, id);
  writeData(data);
  res.json(data.lands[idx]);
});

app.put('/api/admin/homes/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const index = data.homes.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ message: 'Дом не найден' });
  data.homes[index] = normalizeHouseListing({ ...data.homes[index], ...(req.body as Partial<HouseListing>), id }, id);
  writeData(data);
  res.json(data.homes[index]);
});

app.delete('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.projects = data.projects.filter((i) => i.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.delete('/api/admin/lands/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.lands = data.lands.filter((i) => i.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.delete('/api/admin/homes/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.homes = data.homes.filter((item) => item.id !== id);
  writeData(data);
  res.json({ ok: true });
});


app.put('/api/admin/pending-lands/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const idx = data.pendingLands.findIndex((item) => item.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Заявка не найдена' });
  const incoming = req.body as Partial<PendingLandPlot> & { image?: string };
  const normalizedLand = normalizeLandPlot({ ...data.pendingLands[idx], ...incoming, id }, id);
  data.pendingLands[idx] = {
    ...normalizedLand,
    sellerName: incoming.sellerName || data.pendingLands[idx].sellerName,
    sellerPhone: incoming.sellerPhone || data.pendingLands[idx].sellerPhone,
    createdAt: data.pendingLands[idx].createdAt,
    source: data.pendingLands[idx].source,
    sourceRealtyId: data.pendingLands[idx].sourceRealtyId
  };
  writeData(data);
  res.json(data.pendingLands[idx]);
});

app.post('/api/admin/pending-lands/:id/approve', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const pending = data.pendingLands.find((item) => item.id === id);
  if (!pending) return res.status(404).json({ message: 'Заявка не найдена' });
  const land = normalizeLandPlot({
    ...pending,
    id: `land_${Date.now()}`,
    sellerName: pending.sellerName,
    sellerPhone: pending.sellerPhone,
    submissionCreatedAt: pending.createdAt,
    source: pending.source || 'site',
    sourceRealtyId: pending.sourceRealtyId
  });
  data.lands.unshift(land);
  data.pendingLands = data.pendingLands.filter((item) => item.id !== id);
  writeData(data);
  res.status(201).json(land);
});

app.delete('/api/admin/pending-lands/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.pendingLands = data.pendingLands.filter((item) => item.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.put('/api/admin/pending-homes/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const index = data.pendingHomes.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ message: 'Заявка не найдена' });
  const incoming = req.body as Partial<PendingHouseListing>;
  data.pendingHomes[index] = {
    ...normalizeHouseListing({ ...data.pendingHomes[index], ...incoming, id }, id),
    sellerName: String(incoming.sellerName || data.pendingHomes[index].sellerName),
    sellerPhone: String(incoming.sellerPhone || data.pendingHomes[index].sellerPhone),
    createdAt: data.pendingHomes[index].createdAt,
    source: data.pendingHomes[index].source,
    sourceRealtyId: data.pendingHomes[index].sourceRealtyId
  };
  writeData(data);
  res.json(data.pendingHomes[index]);
});

app.post('/api/admin/pending-homes/:id/approve', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const pending = data.pendingHomes.find((item) => item.id === id);
  if (!pending) return res.status(404).json({ message: 'Заявка не найдена' });
  const home = normalizeHouseListing({
    ...pending,
    id: `home_${Date.now()}`,
    sellerName: pending.sellerName,
    sellerPhone: pending.sellerPhone,
    submissionCreatedAt: pending.createdAt,
    source: pending.source || 'site',
    sourceRealtyId: pending.sourceRealtyId
  });
  data.homes.unshift(home);
  data.pendingHomes = data.pendingHomes.filter((item) => item.id !== id);
  writeData(data);
  res.status(201).json(home);
});

app.delete('/api/admin/pending-homes/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.pendingHomes = data.pendingHomes.filter((item) => item.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.get('/api/admin/pages', authMiddleware, (_req, res) => res.json(Object.values(readData().pages)));
app.get('/api/admin/journal/categories', authMiddleware, (_req, res) => res.json([...readData().journalCategories].sort((a, b) => a.order - b.order)));
app.get('/api/admin/journal/articles', authMiddleware, (_req, res) => res.json(readData().journalArticles));

app.post('/api/admin/journal/categories', authMiddleware, (req, res) => {
  const data = readData();
  const name = String(req.body?.name || '').trim();
  const slug = journalSlugify(String(req.body?.slug || name));
  if (!name || !slug) return res.status(400).json({ message: 'Укажите название рубрики' });
  if (data.journalCategories.some((item) => item.slug === slug)) return res.status(409).json({ message: 'Рубрика с таким адресом уже есть' });
  const category: JournalCategory = {
    id: `journal_category_${Date.now()}`,
    name,
    slug,
    description: String(req.body?.description || '').trim(),
    order: Number(req.body?.order || (data.journalCategories.length + 1) * 10)
  };
  data.journalCategories.push(category);
  writeData(data);
  return res.status(201).json(category);
});

app.put('/api/admin/journal/categories/:id', authMiddleware, (req, res) => {
  const data = readData();
  const index = data.journalCategories.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Рубрика не найдена' });
  const name = String(req.body?.name || data.journalCategories[index].name).trim();
  const slug = journalSlugify(String(req.body?.slug || data.journalCategories[index].slug));
  if (!name || !slug) return res.status(400).json({ message: 'Укажите название рубрики' });
  if (data.journalCategories.some((item, itemIndex) => itemIndex !== index && item.slug === slug)) return res.status(409).json({ message: 'Рубрика с таким адресом уже есть' });
  data.journalCategories[index] = {
    ...data.journalCategories[index],
    name,
    slug,
    description: String(req.body?.description ?? data.journalCategories[index].description).trim(),
    order: Number(req.body?.order ?? data.journalCategories[index].order)
  };
  writeData(data);
  return res.json(data.journalCategories[index]);
});

app.delete('/api/admin/journal/categories/:id', authMiddleware, (req, res) => {
  const data = readData();
  if (data.journalArticles.some((article) => article.categoryId === req.params.id)) return res.status(409).json({ message: 'Сначала перенесите статьи из этой рубрики' });
  data.journalCategories = data.journalCategories.filter((item) => item.id !== req.params.id);
  writeData(data);
  return res.json({ ok: true });
});

function normalizeJournalArticle(incoming: Partial<JournalArticle>, existing?: JournalArticle): JournalArticle {
  const now = new Date().toISOString();
  const status: JournalArticleStatus = incoming.status === 'published' || incoming.status === 'review' ? incoming.status : 'draft';
  const title = String(incoming.title ?? existing?.title ?? '').trim();
  return {
    id: existing?.id || `journal_article_${Date.now()}`,
    title,
    slug: journalSlugify(String(incoming.slug || existing?.slug || title)),
    excerpt: String(incoming.excerpt ?? existing?.excerpt ?? '').trim(),
    content: String(incoming.content ?? existing?.content ?? ''),
    coverImage: String(incoming.coverImage ?? existing?.coverImage ?? '').trim(),
    categoryId: String(incoming.categoryId ?? existing?.categoryId ?? '').trim(),
    tags: Array.isArray(incoming.tags) ? incoming.tags.map(String).map((item) => item.trim()).filter(Boolean) : (existing?.tags || []),
    author: String(incoming.author ?? existing?.author ?? 'Команда Evtenia').trim(),
    authorRole: String(incoming.authorRole ?? existing?.authorRole ?? '').trim(),
    authorBio: String(incoming.authorBio ?? existing?.authorBio ?? '').trim(),
    reviewer: String(incoming.reviewer ?? existing?.reviewer ?? '').trim(),
    status,
    featured: Boolean(incoming.featured ?? existing?.featured),
    relatedProjectIds: Array.isArray(incoming.relatedProjectIds) ? incoming.relatedProjectIds.map(String) : (existing?.relatedProjectIds || []),
    relatedServiceSlugs: Array.isArray(incoming.relatedServiceSlugs) ? incoming.relatedServiceSlugs.map(String) : (existing?.relatedServiceSlugs || []),
    ctaTitle: String(incoming.ctaTitle ?? existing?.ctaTitle ?? 'Поможем выбрать решение').trim(),
    ctaText: String(incoming.ctaText ?? existing?.ctaText ?? 'Обсудим участок, бюджет и задачи вашей семьи.').trim(),
    ctaHref: String(incoming.ctaHref ?? existing?.ctaHref ?? '/#lead-form').trim(),
    seoTitle: String(incoming.seoTitle ?? existing?.seoTitle ?? title).trim(),
    seoDescription: String(incoming.seoDescription ?? existing?.seoDescription ?? incoming.excerpt ?? existing?.excerpt ?? '').trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    publishedAt: status === 'published' ? (existing?.publishedAt || now) : existing?.publishedAt,
    source: incoming.source === 'crm' ? 'crm' : (existing?.source || 'admin'),
    sourceId: String(incoming.sourceId ?? existing?.sourceId ?? '').trim() || undefined
  };
}

app.get('/api/crm/journal/categories', crmSubmissionAuthMiddleware, (_req, res) => {
  return res.json([...readData().journalCategories].sort((a, b) => a.order - b.order));
});

app.put('/api/crm/journal/articles/:sourceId', crmSubmissionAuthMiddleware, (req, res) => {
  const sourceId = String(req.params.sourceId || '').trim();
  if (!sourceId) return res.status(400).json({ message: 'Не указан ID статьи в CRM' });

  const data = readData();
  const index = data.journalArticles.findIndex(
    (item) => item.source === 'crm' && item.sourceId === sourceId
  );
  const article = normalizeJournalArticle(
    { ...(req.body as Partial<JournalArticle>), source: 'crm', sourceId },
    index >= 0 ? data.journalArticles[index] : undefined
  );
  if (!article.title || !article.slug || !article.categoryId) {
    return res.status(400).json({ message: 'Укажите заголовок, URL и рубрику' });
  }
  if (!data.journalCategories.some((item) => item.id === article.categoryId)) {
    return res.status(400).json({ message: 'Выберите существующую рубрику' });
  }
  if (data.journalArticles.some((item, itemIndex) => itemIndex !== index && item.slug === article.slug)) {
    return res.status(409).json({ message: 'Статья с таким URL уже есть' });
  }

  if (index >= 0) data.journalArticles[index] = article;
  else data.journalArticles.unshift(article);
  writeData(data);
  return res.status(index >= 0 ? 200 : 201).json(article);
});

app.post('/api/admin/journal/articles', authMiddleware, (req, res) => {
  const data = readData();
  const article = normalizeJournalArticle(req.body as Partial<JournalArticle>);
  if (!article.title || !article.slug || !article.categoryId) return res.status(400).json({ message: 'Укажите заголовок, URL и рубрику' });
  if (!data.journalCategories.some((item) => item.id === article.categoryId)) return res.status(400).json({ message: 'Выберите существующую рубрику' });
  if (data.journalArticles.some((item) => item.slug === article.slug)) return res.status(409).json({ message: 'Статья с таким URL уже есть' });
  data.journalArticles.unshift(article);
  writeData(data);
  return res.status(201).json(article);
});

app.put('/api/admin/journal/articles/:id', authMiddleware, (req, res) => {
  const data = readData();
  const index = data.journalArticles.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Статья не найдена' });
  const article = normalizeJournalArticle(req.body as Partial<JournalArticle>, data.journalArticles[index]);
  if (!article.title || !article.slug || !article.categoryId) return res.status(400).json({ message: 'Укажите заголовок, URL и рубрику' });
  if (data.journalArticles.some((item, itemIndex) => itemIndex !== index && item.slug === article.slug)) return res.status(409).json({ message: 'Статья с таким URL уже есть' });
  data.journalArticles[index] = article;
  writeData(data);
  return res.json(article);
});

app.delete('/api/admin/journal/articles/:id', authMiddleware, (req, res) => {
  const data = readData();
  data.journalArticles = data.journalArticles.filter((item) => item.id !== req.params.id);
  writeData(data);
  return res.json({ ok: true });
});
app.get('/api/admin/menu-order', authMiddleware, (_req, res) => res.json({ order: readData().menuOrder || NAV_MENU_DEFAULT_ORDER }));
app.get('/api/admin/site-settings', authMiddleware, (_req, res) => res.json(readData().siteSettings));
app.put('/api/admin/site-settings', authMiddleware, (req, res) => {
  const data = readData();
  const incomingLogo = typeof req.body?.logoUrl === 'string' ? req.body.logoUrl.trim() : '';
  data.siteSettings = {
    logoUrl: incomingLogo || DEFAULT_LOGO_URL,
    contactPhotoUrl: typeof req.body?.contactPhotoUrl === 'string' && req.body.contactPhotoUrl.trim() ? req.body.contactPhotoUrl.trim() : DEFAULT_CONTACTS.contactPhotoUrl,
    contactName: typeof req.body?.contactName === 'string' && req.body.contactName.trim() ? req.body.contactName.trim() : DEFAULT_CONTACTS.contactName,
    contactPosition: typeof req.body?.contactPosition === 'string' && req.body.contactPosition.trim() ? req.body.contactPosition.trim() : DEFAULT_CONTACTS.contactPosition,
    contactPhone: typeof req.body?.contactPhone === 'string' && req.body.contactPhone.trim() ? req.body.contactPhone.trim() : DEFAULT_CONTACTS.contactPhone,
    contactCityPhone: typeof req.body?.contactCityPhone === 'string' && req.body.contactCityPhone.trim() ? req.body.contactCityPhone.trim() : DEFAULT_CONTACTS.contactCityPhone,
    contactEmail: typeof req.body?.contactEmail === 'string' && req.body.contactEmail.trim() ? req.body.contactEmail.trim() : DEFAULT_CONTACTS.contactEmail
  };
  writeData(data);
  res.json(data.siteSettings);
});
app.put('/api/admin/menu-order', authMiddleware, (req, res) => {
  const data = readData();
  const incomingOrder: string[] = Array.isArray(req.body?.order) ? req.body.order.map(String) : [];
  const normalizedOrder = incomingOrder.filter((item: string) => NAV_MENU_DEFAULT_ORDER.includes(item));
  for (const item of NAV_MENU_DEFAULT_ORDER) {
    if (!normalizedOrder.includes(item)) normalizedOrder.push(item);
  }
  data.menuOrder = normalizeMenuOrder(normalizedOrder);
  writeData(data);
  res.json({ order: data.menuOrder });
});
app.put('/api/admin/pages/:slug', authMiddleware, (req, res) => {
  const slug = String(req.params.slug);
  const data = readData();
  const incoming = req.body as Partial<ContentPage>;
  const existing = data.pages[slug] || { slug, title: '', content: '' };
  data.pages[slug] = { slug, title: incoming.title || existing.title, content: incoming.content || existing.content };
  writeData(data);
  res.json(data.pages[slug]);
});

app.get('/api/admin/leads', authMiddleware, (_req, res) => res.json(readData().leads));
app.get('/api/admin/portfolio', authMiddleware, (_req, res) => res.json(readData().portfolio));
app.post('/api/admin/portfolio', authMiddleware, (req, res) => {
  const incoming = req.body as Partial<PortfolioItem>;
  const data = readData();
  const entry: PortfolioItem = {
    id: `portfolio_${Date.now()}`,
    title: incoming.title || 'Новый кейс',
    image: incoming.image || '',
    boxPrice: incoming.boxPrice || '',
    buildDuration: incoming.buildDuration || '',
    rating: typeof incoming.rating === 'number' ? incoming.rating : 5,
    clientName: incoming.clientName || '',
    review: incoming.review || ''
  };
  data.portfolio.unshift(entry);
  writeData(data);
  res.status(201).json(entry);
});
app.put('/api/admin/portfolio/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const idx = data.portfolio.findIndex((item) => item.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Кейс не найден' });
  data.portfolio[idx] = { ...data.portfolio[idx], ...(req.body as Partial<PortfolioItem>), id };
  writeData(data);
  res.json(data.portfolio[idx]);
});
app.delete('/api/admin/portfolio/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.portfolio = data.portfolio.filter((item) => item.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.post('/api/admin/upload/project-image', authMiddleware, upload.array('images', 20), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    return res.status(400).json({ message: 'Файл не передан' });
  }

  const target = req.query.target === 'thumb' ? 'thumb' : req.query.target === 'gallery' ? 'gallery' : 'cover';
  const dimensions = target === 'thumb'
    ? { width: 500, height: 500 }
    : target === 'gallery'
      ? { width: 1200, height: 900 }
      : { width: 900, height: 600 };
  try {
    const urls: string[] = [];
    for (const file of files) {
      const filename = `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
      const outputPath = path.join(PROJECTS_ASSETS_DIR, filename);
      await sharp(file.buffer)
        .rotate()
        .resize(dimensions.width, dimensions.height, { fit: 'cover', position: 'attention' })
        .webp({ lossless: true, nearLossless: true, quality: 100 })
        .toFile(outputPath);
      urls.push(`${req.protocol}://${req.get('host')}/api/assets/projects/${filename}`);
    }

    return res.status(201).json({ urls, width: dimensions.width, height: dimensions.height });
  } catch (error) {
    console.error('Не удалось обработать изображение проекта', error);
    return res.status(500).json({ message: 'Не удалось обработать изображение' });
  }
});


app.post('/api/admin/upload/page-image', authMiddleware, upload.array('images', 10), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    return res.status(400).json({ message: 'Файл не передан' });
  }

  try {
    const urls: string[] = [];
    for (const file of files) {
      const filename = `page_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
      const outputPath = path.join(PROJECTS_ASSETS_DIR, filename);
      await sharp(file.buffer)
        .rotate()
        .resize(1400, 900, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outputPath);
      urls.push(`${req.protocol}://${req.get('host')}/api/assets/projects/${filename}`);
    }
    return res.status(201).json({ urls });
  } catch (error) {
    console.error('Не удалось обработать изображение страницы', error);
    return res.status(500).json({ message: 'Не удалось обработать изображение' });
  }
});

app.post('/api/admin/upload/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'Файл не передан' });
  }

  try {
    const filename = `logo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
    const outputPath = path.join(ASSETS_DIR, filename);
    await sharp(file.buffer)
      .rotate()
      .resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 92 })
      .toFile(outputPath);
    return res.status(201).json({ url: `${req.protocol}://${req.get('host')}/api/assets/${filename}` });
  } catch (error) {
    console.error('Не удалось обработать логотип', error);
    return res.status(500).json({ message: 'Не удалось обработать логотип' });
  }
});

app.delete('/api/admin/upload/project-image', authMiddleware, (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url) return res.status(400).json({ message: 'URL не передан' });
  const deleted = deleteAssetByUrl(url);
  if (!deleted) return res.status(404).json({ message: 'Файл не найден' });
  return res.json({ ok: true });
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  const isImageUpload = req.path.startsWith('/api/admin/upload/') || req.path === '/api/land-submissions' || req.path === '/api/home-submissions';
  if (!isImageUpload) return next(error);
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Файл слишком большой. Максимальный размер — 12 МБ.' });
    }
    return res.status(400).json({ message: `Ошибка загрузки файла (${error.code}).` });
  }

  if (error instanceof Error) {
    return res.status(400).json({ message: error.message || 'Ошибка при загрузке файла.' });
  }

  return res.status(500).json({ message: 'Неизвестная ошибка загрузки файла.' });
});

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderSeoDocument = (html: string, title: string, description: string, canonicalUrl: string, schema?: unknown, imageUrl?: string): string => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonicalUrl);
  let result = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  result = result.replace(/<meta\s+name=["']description["'][^>]*\/?\s*>/i, `<meta name="description" content="${safeDescription}" />`);
  if (!/<meta\s+name=["']description["']/i.test(result)) {
    result = result.replace(/<\/head>/i, `<meta name="description" content="${safeDescription}" /></head>`);
  }
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(result)) {
    result = result.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${safeCanonical}" />`);
  } else {
    result = result.replace(/<\/head>/i, `<link rel="canonical" href="${safeCanonical}" /></head>`);
  }
  const socialTags = [
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDescription}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${safeCanonical}" />`,
    `<meta property="og:site_name" content="Evtenia" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDescription}" />`,
    imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" /><meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : '',
    schema ? `<script id="catalog-jsonld" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''
  ].join('');
  return result.replace(/<\/head>/i, `${socialTags}</head>`);
};

app.get(['/dveri', '/chany'], (req, res, next) => {
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  const doorsPage = req.path.replace(/\/+$/, '') === '/dveri';
  const pagePath = doorsPage ? '/dveri' : '/chany';
  const title = doorsPage
    ? 'Межкомнатные двери в Пензе — каталог и цены | Evtenia'
    : 'Банные чаны в Пензе — модели и цены | Evtenia';
  const description = doorsPage
    ? 'Подбор межкомнатных дверей в Пензе и Пензенской области: коллекции, размеры, отделка, коробки, фурнитура и монтаж. Рассчитаем цену комплекта под ваши проёмы.'
    : 'Банные чаны и купели для дачи в Пензе и области: модели от 250 000 ₽, комплектации, сталь, доставка и монтаж. Подбор и расчёт от Evtenia.';
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const itemNames = doorsPage
    ? ['Соул', 'Сицилия', 'Соло', 'Лайн', 'Юкон', 'Эрика', 'Дизайн', 'Модерн', 'Неоклассика', 'Классика', 'Эко', 'ЭкоГранд']
    : ['Чан «Лайт»', 'Чан с печью-подставкой', 'Чан «Гранд»', 'Чан «Кубок»', 'Чан «Кубок Гранд»', 'Встраиваемый чан в террасу', 'Ледяная купель', 'Купель «Квадро»', 'Купель «Квадро XL»'];
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: doorsPage ? 'Подбор и заказ межкомнатных дверей' : 'Подбор банного чана или купели',
        serviceType: doorsPage ? 'Подбор дверей, комплектации и монтажа' : 'Подбор комплектации, заказа и установки банного чана',
        areaServed: ['Пенза', 'Пензенская область'],
        provider: { '@type': 'Organization', name: 'Evtenia', url: `${origin}/` },
        url: `${origin}${pagePath}`
      },
      {
        '@type': 'ItemList',
        name: doorsPage ? 'Коллекции межкомнатных дверей' : 'Банные чаны и купели',
        itemListElement: itemNames.map((name, index) => ({ '@type': 'ListItem', position: index + 1, name }))
      }
    ]
  };
  const heroImage = `${origin}/api/assets/catalog/${doorsPage ? 'doors/soul' : 'chany/ready-4'}.webp`;
  const html = renderSeoDocument(fs.readFileSync(indexPath, 'utf8'), title, description, `${origin}${pagePath}`, schema, heroImage);
  res.set('Cache-Control', 'public, max-age=300');
  return res.type('html').send(html);
});

const doorCollectionSeo: Record<string, { name: string; description: string; image: string; models: string[] }> = {
  soul: { name: 'Соул', description: 'Гладкое полотно с лаконичным геометрическим рисунком для современного интерьера. Подберём отделку, фурнитуру и комплект под размеры проёмов.', image: 'soul', models: [] },
  siciliya: { name: 'Сицилия', description: 'Межкомнатные двери «Сицилия» с мягкой филёнчатой геометрией для классических и спокойных современных интерьеров.', image: 'sicily', models: [] },
  solo: { name: 'Соло', description: 'Лаконичная коллекция дверей с ровной поверхностью. Обсудим цвета и комплектацию для квартиры или загородного дома.', image: 'solo', models: [] },
  line: { name: 'Лайн', description: 'Современные межкомнатные двери с линейным рисунком. Подбор полотна, коробки, наличников и фурнитуры в Пензе.', image: 'line', models: [] },
  yukon: { name: 'Юкон', description: 'Двери «Юкон» с выразительной древесной текстурой. Уточним доступные оттенки, размеры и состав комплекта.', image: 'yukon', models: [] },
  erika: { name: 'Эрика', description: 'Коллекция межкомнатных дверей с декоративной филёнкой и спокойными классическими пропорциями.', image: 'erika', models: [] },
  dizayn: { name: 'Дизайн', description: 'Межкомнатные двери коллекции «Дизайн»: выразительная геометрия и варианты отделки для индивидуального интерьера.', image: 'design', models: [] },
  modern: { name: 'Модерн', description: 'Современные двери с лаконичными декоративными элементами. Подберём вариант с глухим полотном или остеклением.', image: 'modern', models: [] },
  neoklassika: { name: 'Неоклассика', description: 'Коллекция дверей с симметричным рельефом и сдержанным классическим рисунком.', image: 'neoclassic', models: [] },
  klassika: { name: 'Классика', description: 'Классические межкомнатные двери с рельефными панелями. Поможем подобрать цвет, фурнитуру и размеры.', image: 'classic', models: [] },
  eko: { name: 'Эко', description: 'Двери с древесной фактурой для тёплых и натуральных интерьеров. Уточним сочетания оттенков и покрытий.', image: 'eco', models: [] },
  ekogrand: { name: 'ЭкоГранд', description: 'Коллекция дверей с заметным древесным рисунком. Подберём оттенок и комплектующие под отделку помещения.', image: 'eco-grand', models: [] },
  kaliforniya: { name: 'Калифорния', description: 'Двери «Калифорния» с рельефной фрезеровкой, повторяющей силуэт арок. Модели M451, M452 и M453; поможем выбрать цвет и комплектацию.', image: 'california-1', models: ['M451', 'M452', 'M453'] },
  minimal: { name: 'Минимал', description: 'Лаконичные межкомнатные двери с гладким полотном для жилых и коммерческих помещений. В каталоге представлены варианты Минимал 1, 2 и 4.', image: 'minimal-1', models: ['Минимал 1', 'Минимал 2', 'Минимал 4'] },
  notte: { name: 'Ноттэ', description: 'Двери «Ноттэ» с выразительной вертикальной фрезеровкой. Варианты M371 и M372; возможны декоративные вставки — уточним отделку и наличие.', image: 'notte-1', models: ['M371', 'M372'] },
  smart: { name: 'Смарт', description: 'Каркасно-щитовые межкомнатные двери с современным рисунком и практичным подходом к комплектации. В коллекции представлены модели 01–05.', image: 'smart-1', models: ['Смарт 01', 'Смарт 02', 'Смарт 03', 'Смарт 04', 'Смарт 05'] },
  toskana: { name: 'Тоскана', description: 'Коллекция «Тоскана» с выразительными линиями и классическим настроением. Варианты M411, M412, M421 и M422; подбор цвета и комплекта — по запросу.', image: 'toscana-1', models: ['M411', 'M412', 'M421', 'M422'] }
};

app.get('/dveri/:slug', (req, res, next) => {
  const collection = doorCollectionSeo[req.params.slug];
  if (!collection) return next();
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const canonical = `${origin}/dveri/${req.params.slug}`;
  const title = `Двери «${collection.name}» в Пензе — коллекция | Evtenia`;
  const description = composeSeoDescription(collection.description, 'Каталог и подбор в Пензе; замер и расчёт заказа.');
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: `Коллекция межкомнатных дверей «${collection.name}»`, description, url: canonical, inLanguage: 'ru-RU', mainEntity: { '@type': 'ItemList', itemListElement: collection.models.map((name, index) => ({ '@type': 'ListItem', position: index + 1, name })) } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Главная', item: `${origin}/` }, { '@type': 'ListItem', position: 2, name: 'Двери', item: `${origin}/dveri` }, { '@type': 'ListItem', position: 3, name: collection.name, item: canonical }] }
    ]
  };
  const html = renderSeoDocument(fs.readFileSync(indexPath, 'utf8'), title, description, canonical, schema, `${origin}/api/assets/catalog/doors/${collection.image}.webp`);
  res.set('Cache-Control', 'public, max-age=300');
  return res.type('html').send(html);
});

app.get('/about', (req, res, next) => {
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const image = `${origin}/api/assets/about/director-evgeniya.webp`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'О компании Evtenia',
    url: `${origin}/about`,
    about: {
      '@type': 'Organization',
      name: 'Evtenia',
      url: origin,
      foundingDate: '2014',
      image,
      telephone: DEFAULT_CONTACTS.contactPhone,
      email: DEFAULT_CONTACTS.contactEmail,
      address: { '@type': 'PostalAddress', addressLocality: 'Пенза', streetAddress: 'ул. Гоголя, 41', addressCountry: 'RU' },
      areaServed: { '@type': 'AdministrativeArea', name: 'Пенза и Пензенская область' }
    }
  };
  const html = renderSeoDocument(
    fs.readFileSync(indexPath, 'utf8'),
    'О компании Evtenia — строительство домов в Пензе с 2014 года',
    'Строительная компания Evtenia в Пензе и области: проектирование и строительство домов, фундаменты, инженерные системы и отделка. Узнайте о подходе компании и руководителе.',
    `${origin}/about`,
    schema,
    image
  );
  res.set('Cache-Control', 'public, max-age=300');
  return res.type('html').send(html);
});

app.get('/services/:slug', (req, res, next) => {
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  const slug = String(req.params.slug || '');
  const page = readData().pages[`services-${slug}`];
  if (!page) return next();
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const canonical = `${origin}/services/${encodeURIComponent(slug)}`;
  const isInsurance = slug === 'strahovanie';
  const title = isInsurance
    ? 'Страхование дома и квартиры в Пензе — подбор полиса | Evtenia'
    : `${page.title} в Пензе — стоимость и сроки | Evtenia`;
  const description = isInsurance
    ? 'Подбор страхования дома, дачи, квартиры, имущества и ответственности в Пензе и области. Сравним предложения ведущих страховых компаний, объясним покрытие и поможем оформить полис.'
    : `Услуга «${page.title}» в Пензе и Пензенской области: описание работ, ориентировочные цены и сроки. Оставьте заявку на предварительный расчет от Evtenia.`;
  const schema = isInsurance ? {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Подбор страхования недвижимости в Пензе',
    serviceType: 'Сопоставление предложений страхования жилья и имущества',
    description,
    areaServed: { '@type': 'AdministrativeArea', name: 'Пенза и Пензенская область' },
    provider: { '@type': 'Organization', name: 'Evtenia', url: origin, telephone: DEFAULT_CONTACTS.contactPhone },
    url: canonical
  } : undefined;
  const image = isInsurance ? `${origin}/api/assets/services/project-consultation.jpg` : undefined;
  const html = renderSeoDocument(fs.readFileSync(indexPath, 'utf8'), title, description, canonical, schema, image);
  res.set('Cache-Control', 'public, max-age=300');
  return res.type('html').send(html);
});

app.get('/design', (req, res, next) => {
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const html = renderSeoDocument(
    fs.readFileSync(indexPath, 'utf8'),
    'Проектирование домов в Пензе — архитектура и конструктив | Evtenia',
    'Проектирование частных домов и коттеджей в Пензе и области. Эскизные, архитектурные и конструктивные решения; состав и сроки согласуем по задаче.',
    `${origin}/design`
  );
  res.set('Cache-Control', 'public, max-age=300');
  return res.type('html').send(html);
});

app.get('/index.html', (_req, res) => res.redirect(301, '/'));

app.get('/', (req, res, next) => {
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const html = renderSeoDocument(
    fs.readFileSync(indexPath, 'utf8'),
    'Строительство домов под ключ в Пензе — Evtenia',
    'Строим каркасные и газобетонные дома в Пензе и Пензенской области. Подберём проект, рассчитаем комплектацию и сроки, поможем с фундаментом, инженерией и ипотекой.',
    `${origin}/`,
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Evtenia',
      url: `${origin}/`,
      inLanguage: 'ru-RU',
      publisher: { '@type': 'Organization', name: 'Evtenia', url: `${origin}/`, telephone: DEFAULT_CONTACTS.contactPhone }
    }
  );
  res.set('Cache-Control', 'public, max-age=300');
  return res.type('html').send(html);
});

const formatSeoArea = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const decimal = (text: string) => text.replace(/(\d)\.(\d)/g, '$1,$2');
  if (/^\d+(?:[.,]\d+)?$/.test(raw)) return `${decimal(raw)} м²`;
  return decimal(raw).replace(/\bм2\b/gi, 'м²').replace(/кв\.?\s*м/gi, 'м²');
};

const formatSeoFloors = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return 'этажность уточняется';
  if (!/^\d+$/.test(raw)) return raw;
  const count = Number(raw);
  if (count % 10 === 1 && count % 100 !== 11) return `${count} этаж`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return `${count} этажа`;
  return `${count} этажей`;
};

const formatSeoPrice = (value: unknown, startsFrom = false): string => {
  const raw = String(value ?? '').trim();
  if (!raw || /по\s+запросу/i.test(raw)) return 'по запросу';
  const amount = Number(raw.replace(/\D/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return raw;
  const prefix = startsFrom || /^от\b/i.test(raw) ? 'от ' : '';
  return `${prefix}${amount.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} ₽`;
};

const formatSeoPriceCompact = (value: unknown, startsFrom = false): string => {
  const raw = String(value ?? '').trim();
  if (!raw || /по\s+запросу/i.test(raw)) return 'по запросу';
  const amount = Number(raw.replace(/\D/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return raw;
  const prefix = startsFrom || /^от\b/i.test(raw) ? 'от ' : '';
  if (amount >= 1_000_000) return `${prefix}${(amount / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`;
  if (amount >= 100_000) return `${prefix}${Math.round(amount / 1_000).toLocaleString('ru-RU')} тыс. ₽`;
  return `${prefix}${amount.toLocaleString('ru-RU')} ₽`;
};

const composeSeoDescription = (summary: string, details: string, maxLength = 160): string => {
  const clean = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanSummary = clean(summary);
  const cleanDetails = clean(details);
  if (!cleanDetails) return cleanSummary.slice(0, maxLength);
  const available = maxLength - cleanDetails.length - 1;
  if (available >= 28) {
    const excerpt = cleanSummary.length > available
      ? `${cleanSummary.slice(0, Math.max(1, available - 1)).replace(/\s+\S*$/, '').trim()}…`
      : cleanSummary;
    return `${excerpt} ${cleanDetails}`.trim().slice(0, maxLength);
  }
  const detailLimit = Math.max(32, maxLength - 36);
  const detailExcerpt = cleanDetails.length > detailLimit
    ? `${cleanDetails.slice(0, detailLimit - 1).replace(/\s+\S*$/, '').trim()}…`
    : cleanDetails;
  const summaryLimit = Math.max(1, maxLength - detailExcerpt.length - 1);
  const summaryExcerpt = cleanSummary.length > summaryLimit
    ? `${cleanSummary.slice(0, Math.max(1, summaryLimit - 1)).replace(/\s+\S*$/, '').trim()}…`
    : cleanSummary;
  return `${summaryExcerpt} ${detailExcerpt}`.trim().slice(0, maxLength);
};

app.get('/project/:slug', (req, res, next) => {
  const data = readData();
  const project = data.projects.find((item) => item.id === req.params.slug || getProjectSlug(item, data.projects) === req.params.slug || getLegacyProjectSlug(item, data.projects) === req.params.slug);
  if (!project) return next();

  const slug = getProjectSlug(project, data.projects);
  if (req.params.slug !== slug) return res.redirect(301, `/project/${encodeURIComponent(slug)}`);

  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
  const canonical = `${origin}/project/${encodeURIComponent(slug)}`;
  const material = project.constructionType || 'частного дома';
  const materialClause = /каркас/i.test(material) ? 'по каркасной технологии'
    : /модул/i.test(material) ? 'по модульной технологии'
      : /газобетон/i.test(material) ? 'из газобетона'
        : /профилирован/i.test(material) ? 'из профилированного бруса'
          : /клеен/i.test(material) ? 'из клеёного бруса'
            : /оцилиндр/i.test(material) ? 'из оцилиндрованного бревна'
              : /деревн/i.test(material) || /деревян/i.test(material) ? 'из дерева'
                : `из ${material.toLowerCase()}`;
  const isBathProject = project.category === 'bath';
  const projectKind = isBathProject ? 'бани' : 'дома';
  const parentSection = isBathProject ? 'baths' : 'projects';
  const areaLabel = formatSeoArea(project.area);
  const priceLabel = formatSeoPrice(project.priceFrom, true);
  const titleKind = isBathProject ? 'баня' : 'дом';
  const cleanTitle = project.title.replace(/[_-]+/g, ' ').trim();
  const titleBase = isBathProject
    ? (/бан/i.test(cleanTitle) ? cleanTitle : `Баня «${cleanTitle}»`)
    : (/дом/i.test(cleanTitle) ? cleanTitle : `Проект дома «${cleanTitle}»`);
  const seoTitle = `${titleBase}${areaLabel ? `, ${areaLabel}` : ''} — ${formatSeoPriceCompact(project.priceFrom, true)} | Evtenia`;
  const description = composeSeoDescription(
    `${titleKind === 'баня' ? 'Баня' : 'Дом'} «${cleanTitle}»`,
    `${areaLabel || 'площадь уточняется'}, ${formatSeoFloors(project.floors)}; ${material.toLowerCase()}; цена ${priceLabel}. Пенза и область — расчёт комплектации.`
  );
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${project.title} — проект ${projectKind}`,
        description,
        url: canonical,
        inLanguage: 'ru-RU',
        primaryImageOfPage: project.coverImage || undefined,
        about: {
          '@type': 'Service',
          name: `Строительство ${isBathProject ? 'бани' : 'дома'} «${project.title}»`,
          serviceType: `${isBathProject ? 'Строительство бань' : 'Строительство домов'} ${materialClause}`,
          areaServed: { '@type': 'AdministrativeArea', name: 'Пенза и Пензенская область' },
          provider: { '@type': 'Organization', name: 'Evtenia', url: `${origin}/`, telephone: DEFAULT_CONTACTS.contactPhone }
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: isBathProject ? 'Проекты бань' : 'Проекты домов', item: `${origin}/${parentSection}` },
          { '@type': 'ListItem', position: 3, name: project.title, item: canonical }
        ]
      }
    ]
  };
  const image = project.coverImage?.startsWith('http') ? project.coverImage.replace(/^http:/, 'https:') : `${origin}${project.coverImage || ''}`;
  const html = renderSeoDocument(
    fs.readFileSync(indexPath, 'utf8'),
    seoTitle,
    description,
    canonical,
    schema,
    image
  );
  res.set('Cache-Control', 'public, max-age=300');
  return res.type('html').send(html);
});

app.use('/assets', express.static(ASSETS_DIR));
app.use('/api/assets', express.static(ASSETS_DIR));
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (req, res) => {
    const pathname = decodeURIComponent(req.path).replace(/\/+$/, '') || '/';
    const data = readData();
    const exactPages: Record<string, { title: string; description: string }> = {
      '/projects': { title: 'Проекты домов в Пензе — каталог планировок и цен | Evtenia', description: 'Каталог проектов частных домов для строительства в Пензе и Пензенской области: каркасные, модульные и газобетонные решения. Подберите площадь и получите индивидуальный расчёт.' },
      '/baths': { title: 'Проекты бань в Пензе — планировки и строительство | Evtenia', description: 'Проекты бань для участка в Пензе и области: варианты планировок, комплектаций и строительства. Подберём решение и рассчитаем стоимость под задачу.' },
      '/homes': { title: 'Готовые дома в Пензе и области — каталог объявлений | Evtenia', description: 'Готовые дома и коттеджи в Пензе и Пензенской области. Сравните площадь, расположение и цену, задайте вопрос и договоритесь о просмотре.' },
      '/lands': { title: 'Земельные участки в Пензе и области — каталог | Evtenia', description: 'Земельные участки в Пензе и Пензенской области: подбор по площади, району и назначению. Поможем уточнить коммуникации и организовать просмотр.' },
      '/journal': { title: 'Журнал о строительстве и загородной жизни — Evtenia', description: 'Практические статьи о строительстве домов, выборе проектов, фундаментах, инженерных системах, отделке и загородной жизни в Пензенской области.' },
      '/contacts': { title: 'Контакты Evtenia — строительство домов в Пензе', description: `Свяжитесь с Evtenia в Пензе: ${DEFAULT_CONTACTS.contactPhone}. Обсудим строительство дома, проект, услуги и ориентировочную смету.` },
      '/portfolio': { title: 'Портфолио домов и объектов Evtenia — Пенза', description: 'Примеры проектов и выполненных работ Evtenia в Пензе и Пензенской области. Посмотрите решения и обсудите подходящий вариант с командой.' },
      '/privacy-policy': { title: 'Политика конфиденциальности — Evtenia', description: 'Информация об обработке персональных данных пользователей сайта Evtenia.' },
      '/mortgage-calculator': { title: 'Ипотечный калькулятор на дом — рассчитать платёж | Evtenia', description: 'Рассчитайте ориентировочный ипотечный платёж на строительство или покупку дома. Условия зависят от банка, программы и параметров заявки.' },
      '/furniture': { title: 'Мебель для дома в Пензе — подбор и заказ | Evtenia', description: 'Подбор мебели для дома и квартиры в Пензе: кухни, гостиные, спальни и решения под размеры помещения и стиль интерьера.' }
    };
    let page = exactPages[pathname];
    let valid = Boolean(page);
    const contentPage = data.pages[pathname.replace(/^\//, '')]
      || (pathname.startsWith('/furniture/') ? data.pages[`furniture-${pathname.slice('/furniture/'.length).replace(/\//g, '-')}`] : undefined);
    if (!valid && pathname.startsWith('/services/')) {
      const service = data.pages[`services-${pathname.slice('/services/'.length)}`];
      if (service) {
        valid = true;
        page = { title: `${service.title} в Пензе — стоимость и сроки | Evtenia`, description: `Услуга «${service.title}» в Пензе и Пензенской области: состав работ, ориентиры по цене и срокам. Оставьте заявку на предварительный расчёт.` };
      }
    }
    if (!valid && pathname.startsWith('/discounts/')) {
      const promotion = data.pages[`discounts-${pathname.slice('/discounts/'.length)}`];
      if (promotion) {
        valid = true;
        page = { title: `${promotion.title} — Evtenia`, description: promotion.title };
      }
    }
    if (!valid && contentPage && pathname.startsWith('/furniture/')) {
      valid = true;
      page = { title: `${contentPage.title} — мебель в Пензе | Evtenia`, description: `Подбор мебели ${contentPage.title} для дома и квартиры в Пензе. Уточните размеры, варианты исполнения и комплектацию у специалистов Evtenia.` };
    }
    if (!valid && /^\/homes\/[^/]+$/.test(pathname)) {
      const home = data.homes.find((item) => item.id === pathname.slice('/homes/'.length));
      if (home) {
        const area = formatSeoArea(home.area) || 'уточняется';
        const price = formatSeoPrice(home.price);
        const place = home.district?.trim() || 'Пензе и области';
        valid = true;
        page = {
          title: `Готовый дом, ${area} — ${formatSeoPriceCompact(home.price)} | Evtenia`,
          description: composeSeoDescription(`Готовый дом в ${place}.`, `Площадь ${area}; ${formatSeoFloors(home.floors)}; цена ${price}. Уточните наличие и запишитесь на просмотр.`)
        };
      }
    }
    if (!valid && /^\/lands\/[^/]+$/.test(pathname)) {
      const land = data.lands.find((item) => item.id === pathname.slice('/lands/'.length));
      if (land) {
        const rawArea = land.area.trim();
        const areaLabel = /^\d+(?:[.,]\d+)?$/.test(rawArea) ? `${rawArea.replace(',', '.')} соток` : rawArea;
        const landText = land.description || '';
        const purpose = land.purpose?.trim() || land.landCategory?.trim() || (/лпх/i.test(landText) ? 'ЛПХ' : /500\s*кв\.?\s*м/i.test(landText) ? '500 м²' : '');
        const landPrice = formatSeoPrice(land.price);
        const qualifier = purpose ? ` ${purpose}` : '';
        valid = true;
        page = {
          title: `Участок ${areaLabel}${qualifier} в ${land.district} — ${landPrice} | Evtenia`,
          description: composeSeoDescription(landText || 'Земельный участок в Пензе и Пензенской области.', `Участок ${areaLabel}; назначение ${purpose || 'уточняется'}; цена ${landPrice}. Уточните актуальность перед просмотром.`)
        };
      }
    }
    if (!valid && pathname.startsWith('/journal/category/')) {
      const slug = pathname.slice('/journal/category/'.length);
      const category = data.journalCategories.find((item) => item.slug === slug);
      if (category) { valid = true; page = { title: `${category.name} — журнал Evtenia`, description: category.description }; }
    }
    if (!valid && pathname.startsWith('/journal/')) {
      const slug = pathname.slice('/journal/'.length);
      const article = data.journalArticles.find((item) => item.slug === slug && item.status === 'published');
      if (article) { valid = true; page = { title: article.seoTitle || `${article.title} — журнал Evtenia`, description: article.seoDescription || article.excerpt }; }
    }
    const isAdminPage = pathname.endsWith(ADMIN_PATH);
    if (!valid && isAdminPage) { valid = true; page = { title: 'Администрирование — Evtenia', description: 'Панель управления сайтом Evtenia.' }; }

    const indexPath = path.join(FRONTEND_DIST, 'index.html');
    if (!fs.existsSync(indexPath)) return res.status(valid ? 200 : 404).send('Not found');
    const origin = `https://${req.get('host') || 'dom.evtenia.ru'}`;
    const canonical = `${origin}${pathname === '/' ? '/' : pathname}`;
    if (!valid || !page) {
      const notFoundHtml = renderSeoDocument(fs.readFileSync(indexPath, 'utf8'), 'Страница не найдена — Evtenia', 'Запрошенная страница не найдена. Перейдите в каталог проектов или на главную страницу Evtenia.', canonical)
        .replace('</head>', '<meta name="robots" content="noindex,follow" /></head>');
      return res.status(404).type('html').send(notFoundHtml);
    }
    const bathProjects = pathname === '/baths' ? data.projects.filter((project) => project.category === 'bath') : [];
    const schema = pathname === '/baths' ? {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', name: page.title, description: page.description, url: canonical, inLanguage: 'ru-RU' },
        { '@type': 'ItemList', name: 'Типовые проекты бань для Пензы и Пензенской области', itemListElement: bathProjects.map((project, index) => ({ '@type': 'ListItem', position: index + 1, name: project.title, url: `${origin}/project/${encodeURIComponent(getProjectSlug(project, data.projects))}` })) }
      ]
    } : undefined;
    const rendered = renderSeoDocument(fs.readFileSync(indexPath, 'utf8'), page.title, page.description, canonical, schema, schema ? `${origin}/api/assets/projects/catalog/bath-family.webp` : undefined);
    res.set('Cache-Control', 'public, max-age=300');
    return res.type('html').send(rendered);
  });
}

syncManagedJournalArticles();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  void retryPendingCrmLeads();
  setInterval(() => void retryPendingCrmLeads(), 60_000).unref();
});
