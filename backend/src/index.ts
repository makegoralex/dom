import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import multer from 'multer';
import sharp from 'sharp';

interface HouseProject {
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
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  projectId?: string;
  createdAt: string;
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

interface DataStore {
  projects: HouseProject[];
  portfolio: PortfolioItem[];
  leads: Lead[];
  pages: Record<string, ContentPage>;
  menuOrder: string[];
}

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin_dom';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DomPenza2026!';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hidden-admin-token-penza';
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
const PROJECTS_ASSETS_DIR = path.join(ASSETS_DIR, 'projects');
const CALLBACK_RECEIVER = process.env.CALLBACK_EMAIL || '89022099279@mail.ru';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || CALLBACK_RECEIVER;

const mailTransport = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

const CONSTRUCTION_TYPES = [
  'Из газобетона',
  'Каркасные',
  'Модульные'
];
const NAV_MENU_DEFAULT_ORDER = ['about', 'projects', 'services', 'design', 'portfolio', 'furniture', 'promotions', 'contacts'];

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
  {
    id: 'b1', title: 'Баня Б-36', shortDescription: 'Компактная баня из бруса с террасой.',
    fullDescription: 'Функциональная парная, моечная и комната отдыха в одном проекте.',
    coverImage: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600585154154-7125d447f3d9?auto=format&fit=crop&w=1200&q=80'],
    area: '36 м²', floors: '1 этаж', bedrooms: '1 спальня', priceFrom: 'от 1 650 000 ₽', constructionType: 'Профилированный брус', category: 'bath', badge: 'Баня'
  },
  {
    id: 'b2', title: 'Баня Б-52', shortDescription: 'Баня с гостевой комнатой и большой верандой.',
    fullDescription: 'Проект для семьи: парная, душевая, санузел и уютная зона отдыха.',
    coverImage: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=80'],
    area: '52 м²', floors: '1 этаж', bedrooms: '2 спальни', priceFrom: 'от 2 240 000 ₽', constructionType: 'Клееный брус', category: 'bath', badge: 'Хит'
  },
  {
    id: 'b3', title: 'Баня Б-74', shortDescription: 'Двухэтажная баня-дом с мансардой.',
    fullDescription: 'Полноценный загородный формат: банный блок, кухня-гостиная и спальни на втором уровне.',
    coverImage: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1571055107559-3e67626fa8be?auto=format&fit=crop&w=1200&q=80'],
    area: '74 м²', floors: '2 этажа', bedrooms: '2 спальни', priceFrom: 'от 3 480 000 ₽', constructionType: 'Оцилиндрованное бревно', category: 'bath', badge: 'Премиум'
  }
];

const seedPages: Record<string, ContentPage> = {
  about: {
    slug: 'about',
    title: 'О компании',
    content: 'Строительная компания «TMдом» открыта в 2014 году. Мы строим качественные дома под ключ.'
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
  'services-vyvoz-musora': { slug: 'services-vyvoz-musora', title: 'Вывоз мусора', content: '<p>Организуем оперативный вывоз строительного и бытового мусора с объекта.</p>' },
  'services-styazhka-pola': { slug: 'services-styazhka-pola', title: 'Стяжка пола', content: '<p>Делаем полусухую и бетонную стяжку с соблюдением уровня и сроков набора прочности.</p>' },
  'services-konditsionery': { slug: 'services-konditsionery', title: 'Кондиционеры', content: '<p>Подбираем, устанавливаем и обслуживаем кондиционеры для дома и бани.</p>' },
  'services-interernoe-ozelenenie': { slug: 'services-interernoe-ozelenenie', title: 'Интерьерное озеленение', content: '<p>Создаем проекты озеленения интерьера и подбираем растения под условия помещения.</p>' },
  'services-plastikovye-okna': { slug: 'services-plastikovye-okna', title: 'Пластиковые окна', content: '<p>Подбираем и устанавливаем ПВХ-окна с учетом теплопотерь и дизайна.</p>' },
  'services-dveri': { slug: 'services-dveri', title: 'Двери', content: '<p>Входные и межкомнатные двери с монтажом и фурнитурой.</p>' },
  'services-remont': { slug: 'services-remont', title: 'Ремонт', content: '<p>Выполняем внутренний ремонт и отделку домов под ключ.</p>' },
  'services-lestnitsy': { slug: 'services-lestnitsy', title: 'Лестницы', content: '<p>Проектируем и изготавливаем деревянные и комбинированные лестницы.</p>' },
  'services-svai': { slug: 'services-svai', title: 'Сваи', content: '<p>Монтаж винтовых и железобетонных свай под разные типы грунта.</p>' },
  'services-dizainer': { slug: 'services-dizainer', title: 'Дизайнер', content: '<p>Разрабатываем дизайн-концепцию интерьеров и экстерьеров.</p>' },
  'services-landshaftnyy-dizayn': { slug: 'services-landshaftnyy-dizayn', title: 'Ландшафтный дизайн', content: '<p>Проектируем благоустройство участка и озеленение территории.</p>' },
  'services-mezhevanie': { slug: 'services-mezhevanie', title: 'Межевание', content: '<p>Готовим документы и выполняем межевание земельных участков.</p>' }
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

const ensureDataFile = (): void => {
  if (!fs.existsSync(DATA_FILE)) {
    const initial: DataStore = { projects: seedProjects, portfolio: seedPortfolio, leads: [], pages: seedPages, menuOrder: NAV_MENU_DEFAULT_ORDER };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
};

const readData = (): DataStore => {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(content) as Partial<DataStore>;
  return {
    projects: parsed.projects || seedProjects,
    portfolio: parsed.portfolio || seedPortfolio,
    leads: parsed.leads || [],
    pages: { ...seedPages, ...(parsed.pages || {}) },
    menuOrder: Array.isArray(parsed.menuOrder) && parsed.menuOrder.length ? parsed.menuOrder : NAV_MENU_DEFAULT_ORDER
  };
};

const writeData = (data: DataStore): void => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
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

app.use(cors());
app.use(express.json());
ensureAssetsDirs();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/construction-types', (_req, res) => res.json(CONSTRUCTION_TYPES));

app.get('/api/projects', (_req, res) => {
  const data = readData();
  res.json(data.projects);
});
app.get('/api/portfolio', (_req, res) => res.json(readData().portfolio));

app.get('/api/pages/:slug', (req, res) => {
  const page = readData().pages[req.params.slug];
  if (!page) return res.status(404).json({ message: 'Страница не найдена' });
  res.json(page);
});
app.get('/api/menu-order', (_req, res) => res.json({ order: readData().menuOrder || NAV_MENU_DEFAULT_ORDER }));

app.post('/api/leads', async (req, res) => {
  const { name, phone, email, message, projectId } = req.body as Partial<Lead>;
  if (!name || !phone) return res.status(400).json({ message: 'Укажите имя и телефон' });
  const data = readData();
  const lead = { id: `lead_${Date.now()}`, name, phone, email: email || '', message: message || '', projectId, createdAt: new Date().toISOString() };
  data.leads.unshift(lead);
  writeData(data);

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

app.put('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  const idx = data.projects.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Проект не найден' });
  data.projects[idx] = { ...data.projects[idx], ...(req.body as Partial<HouseProject>), id };
  writeData(data);
  res.json(data.projects[idx]);
});

app.delete('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.projects = data.projects.filter((i) => i.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.get('/api/admin/pages', authMiddleware, (_req, res) => res.json(Object.values(readData().pages)));
app.get('/api/admin/menu-order', authMiddleware, (_req, res) => res.json({ order: readData().menuOrder || NAV_MENU_DEFAULT_ORDER }));
app.put('/api/admin/menu-order', authMiddleware, (req, res) => {
  const data = readData();
  const incomingOrder = Array.isArray(req.body?.order) ? req.body.order.map(String) : [];
  const normalizedOrder = NAV_MENU_DEFAULT_ORDER.filter((item) => incomingOrder.includes(item));
  for (const item of NAV_MENU_DEFAULT_ORDER) {
    if (!normalizedOrder.includes(item)) normalizedOrder.push(item);
  }
  data.menuOrder = normalizedOrder;
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

app.delete('/api/admin/upload/project-image', authMiddleware, (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url) return res.status(400).json({ message: 'URL не передан' });
  const deleted = deleteAssetByUrl(url);
  if (!deleted) return res.status(404).json({ message: 'Файл не найден' });
  return res.json({ ok: true });
});

app.use('/assets', express.static(ASSETS_DIR));
app.use('/api/assets', express.static(ASSETS_DIR));
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
