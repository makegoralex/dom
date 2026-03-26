import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

interface HouseProject {
  id: string;
  title: string;
  area: string;
  floors: string;
  bedrooms: string;
  price: string;
  image: string;
  badge?: string;
  description: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  message: string;
  projectId?: string;
  createdAt: string;
}

interface DataStore {
  projects: HouseProject[];
  leads: Lead[];
}

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin_dom';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DomPenza2026!';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hidden-admin-token-penza';

const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');

const seedProjects: HouseProject[] = [
  {
    id: 'p1',
    title: 'Проект Эверест 92',
    area: '92 м²',
    floors: '1 этаж',
    bedrooms: '3 спальни',
    price: 'от 4 150 000 ₽',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    badge: 'Хит продаж',
    description: 'Компактный дом с просторной кухней-гостиной и выходом на террасу.'
  },
  {
    id: 'p2',
    title: 'Проект Эверест 128',
    area: '128 м²',
    floors: '1 этаж',
    bedrooms: '4 спальни',
    price: 'от 5 730 000 ₽',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    badge: 'Для семьи',
    description: 'Функциональная планировка для семьи: мастер-спальня, кладовая и большая гостиная.'
  },
  {
    id: 'p3',
    title: 'Проект Эверест 164',
    area: '164 м²',
    floors: '2 этажа',
    bedrooms: '5 спален',
    price: 'от 7 450 000 ₽',
    image: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80',
    badge: 'Премиум',
    description: 'Двухэтажный дом с кабинетом, гардеробными и полноценной террасой.'
  }
];

const ensureDataFile = (): void => {
  if (!fs.existsSync(DATA_FILE)) {
    const initial: DataStore = { projects: seedProjects, leads: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
};

const readData = (): DataStore => {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(content) as DataStore;
};

const writeData = (data: DataStore): void => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('x-admin-token');
  if (!token || token !== ADMIN_TOKEN) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/projects', (_req, res) => {
  const data = readData();
  res.json(data.projects);
});

app.post('/api/leads', (req, res) => {
  const { name, phone, message, projectId } = req.body as Partial<Lead>;

  if (!name || !phone) {
    res.status(400).json({ message: 'Укажите имя и телефон' });
    return;
  }

  const data = readData();
  const lead: Lead = {
    id: `lead_${Date.now()}`,
    name,
    phone,
    message: message || '',
    projectId,
    createdAt: new Date().toISOString()
  };

  data.leads.unshift(lead);
  writeData(data);
  res.status(201).json({ ok: true });
});

app.post('/api/admin/login', (req, res) => {
  const { login, password } = req.body as { login?: string; password?: string };

  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_TOKEN });
    return;
  }

  res.status(401).json({ message: 'Неверный логин или пароль' });
});

app.get('/api/admin/projects', authMiddleware, (_req, res) => {
  const data = readData();
  res.json(data.projects);
});

app.post('/api/admin/projects', authMiddleware, (req, res) => {
  const incoming = req.body as Partial<HouseProject>;
  const data = readData();

  const project: HouseProject = {
    id: `project_${Date.now()}`,
    title: incoming.title || 'Новый проект',
    area: incoming.area || '',
    floors: incoming.floors || '',
    bedrooms: incoming.bedrooms || '',
    price: incoming.price || '',
    image: incoming.image || '',
    badge: incoming.badge || '',
    description: incoming.description || ''
  };

  data.projects.unshift(project);
  writeData(data);
  res.status(201).json(project);
});

app.put('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const incoming = req.body as Partial<HouseProject>;
  const data = readData();

  const index = data.projects.findIndex((item) => item.id === id);
  if (index === -1) {
    res.status(404).json({ message: 'Проект не найден' });
    return;
  }

  data.projects[index] = {
    ...data.projects[index],
    ...incoming,
    id
  };

  writeData(data);
  res.json(data.projects[index]);
});

app.delete('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const id = String(req.params.id);
  const data = readData();
  data.projects = data.projects.filter((item) => item.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.get('/api/admin/leads', authMiddleware, (_req, res) => {
  const data = readData();
  res.json(data.leads);
});


if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
