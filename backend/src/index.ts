import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

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
  badge?: string;
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

interface DataStore {
  projects: HouseProject[];
  leads: Lead[];
  pages: Record<string, ContentPage>;
}

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin_dom';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DomPenza2026!';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hidden-admin-token-penza';
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');

const CONSTRUCTION_TYPES = [
  'Газобетон',
  'Арболит',
  'Керамзитобетонные блоки',
  'Кирпич',
  'Оцилиндрованное бревно',
  'Рубленное бревно',
  'Лафет',
  'Профилированный брус',
  'Клееный брус',
  'Двойной брус',
  'Каркасные',
  'SIP панели',
  'Строительство дачных домов под ключ'
];

const seedProjects: HouseProject[] = [
  {
    id: 'p1', title: 'Газобетон 118', shortDescription: 'Теплый дом из газобетона для семьи.',
    fullDescription: 'Проект с большой кухней-гостиной, тремя спальнями и отдельной котельной.',
    coverImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1605146768851-eda79da39897?auto=format&fit=crop&w=1200&q=80'],
    area: '118 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 5 200 000 ₽', constructionType: 'Газобетон', badge: 'Хит'
  },
  {
    id: 'p2', title: 'Арболит 126', shortDescription: 'Экологичный проект из арболита.',
    fullDescription: 'Комфортный дом с тремя спальнями и кабинетом.',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'],
    area: '126 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 5 500 000 ₽', constructionType: 'Арболит'
  },
  {
    id: 'p3', title: 'Кирпич 164', shortDescription: 'Надежный кирпичный дом.',
    fullDescription: 'Двухэтажный проект с мастер-спальней и просторной террасой.',
    coverImage: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80'],
    area: '164 м²', floors: '2 этажа', bedrooms: '4 спальни', priceFrom: 'от 7 450 000 ₽', constructionType: 'Кирпич', badge: 'Премиум'
  },
  {
    id: 'p4', title: 'Брус 96', shortDescription: 'Дом из профилированного бруса.',
    fullDescription: 'Компактный загородный дом для круглогодичного проживания.',
    coverImage: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1200&q=80'],
    area: '96 м²', floors: '1 этаж', bedrooms: '2 спальни', priceFrom: 'от 4 300 000 ₽', constructionType: 'Профилированный брус'
  },
  {
    id: 'p5', title: 'Брус 122', shortDescription: 'Клееный брус с панорамным остеклением.',
    fullDescription: 'Современный проект с высокими потолками и выходом на террасу.',
    coverImage: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'],
    area: '122 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 5 900 000 ₽', constructionType: 'Клееный брус'
  },
  {
    id: 'p6', title: 'Бревно 132', shortDescription: 'Классический дом из бревна.',
    fullDescription: 'Традиционный стиль с просторной гостиной и печной зоной.',
    coverImage: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1200&q=80'],
    area: '132 м²', floors: '2 этажа', bedrooms: '3 спальни', priceFrom: 'от 6 100 000 ₽', constructionType: 'Оцилиндрованное бревно'
  },
  {
    id: 'p7', title: 'Каркас 108', shortDescription: 'Быстровозводимый каркасный дом.',
    fullDescription: 'Энергоэффективный проект для постоянного проживания.',
    coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1200&q=80'],
    area: '108 м²', floors: '1 этаж', bedrooms: '3 спальни', priceFrom: 'от 4 800 000 ₽', constructionType: 'Каркасные'
  },
  {
    id: 'p8', title: 'SIP 94', shortDescription: 'Компактный дом из SIP панелей.',
    fullDescription: 'Современный проект под дачное и постоянное проживание.',
    coverImage: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'],
    area: '94 м²', floors: '1 этаж', bedrooms: '2 спальни', priceFrom: 'от 4 100 000 ₽', constructionType: 'SIP панели'
  },
  {
    id: 'p9', title: 'Дачный 82', shortDescription: 'Дачный дом под ключ.',
    fullDescription: 'Бюджетный проект с двумя спальнями и кухней-гостиной.',
    coverImage: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1200&q=80'],
    area: '82 м²', floors: '1 этаж', bedrooms: '2 спальни', priceFrom: 'от 3 600 000 ₽', constructionType: 'Строительство дачных домов под ключ'
  }
];

const seedPages: Record<string, ContentPage> = {
  about: {
    slug: 'about',
    title: 'О компании',
    content: 'Строительная компания «TMдом» открыта в 2014 году. Мы строим качественные дома под ключ.'
  }
};

const ensureDataFile = (): void => {
  if (!fs.existsSync(DATA_FILE)) {
    const initial: DataStore = { projects: seedProjects, leads: [], pages: seedPages };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
};

const readData = (): DataStore => {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(content) as Partial<DataStore>;
  return { projects: parsed.projects || seedProjects, leads: parsed.leads || [], pages: parsed.pages || seedPages };
};

const writeData = (data: DataStore): void => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
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

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/construction-types', (_req, res) => res.json(CONSTRUCTION_TYPES));

app.get('/api/projects', (_req, res) => {
  const data = readData();
  res.json(data.projects);
});

app.get('/api/pages/:slug', (req, res) => {
  const page = readData().pages[req.params.slug];
  if (!page) return res.status(404).json({ message: 'Страница не найдена' });
  res.json(page);
});

app.post('/api/leads', (req, res) => {
  const { name, phone, email, message, projectId } = req.body as Partial<Lead>;
  if (!name || !phone) return res.status(400).json({ message: 'Укажите имя и телефон' });
  const data = readData();
  data.leads.unshift({ id: `lead_${Date.now()}`, name, phone, email: email || '', message: message || '', projectId, createdAt: new Date().toISOString() });
  writeData(data);
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
    badge: incoming.badge || ''
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

if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
