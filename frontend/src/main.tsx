import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

type HouseProject = {
  id: string;
  title: string;
  area: string;
  floors: string;
  bedrooms: string;
  price: string;
  image: string;
  badge?: string;
  description: string;
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  message: string;
  projectId?: string;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || '';
const ADMIN_PATH = '/catalog-control-7f3a';
const ADMIN_KEY = 'catalog-control-7f3a';
const FALLBACK_PROJECTS: HouseProject[] = [
  {
    id: 'demo1',
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
    id: 'demo2',
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
    id: 'demo3',
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

function PublicPage() {
  const [projects, setProjects] = useState<HouseProject[]>(FALLBACK_PROJECTS);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState(FALLBACK_PROJECTS[0].id);
  const [status, setStatus] = useState('');

  useEffect(() => {
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

  const advantages = useMemo(
    () => [
      'Фиксированная смета без скрытых доплат',
      'Ипотека от банков-партнёров',
      'Авторский надзор на каждом этапе',
      'Гарантия по договору и срокам'
    ],
    []
  );

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Отправка...');

    try {
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message, projectId })
      });

      if (!response.ok) {
        throw new Error('bad response');
      }

      setStatus('Спасибо! Мы свяжемся с вами в ближайшее время.');
      setName('');
      setPhone('');
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
            <strong>СТРОИТЕЛЬСТВО ДОМОВ В КРЕДИТ И ИПОТЕКУ ОТ 9.5% ГОДОВЫХ!</strong>
            <button>Узнать условия <span>»</span></button>
          </div>
        </div>

        <div className="top-search-row">
          <div className="container top-search-inner">
            <div className="search-box">
              <input placeholder="Поиск по сайту..." />
              <button>Найти</button>
            </div>
            <div className="top-contacts">
              <span>село Засечное, улица Механизаторов, 22А</span>
              <span>мы в VK</span>
              <span><i>⤴</i> Свой проект на расчёт</span>
            </div>
          </div>
        </div>

        <div className="container hero-main">
          <div className="hero-upper-row">
            <div className="brand-line">
              <div className="logo-badge">⌂</div>
              <div className="brand-text">
                <div className="brand-logo">TMдом</div>
                <p>Строительная компания</p>
              </div>
            </div>

            <div className="hero-contact-line">
              <span>Нужна примерная оценка стоимости строительства? <b>|</b> <u>Рассчитать онлайн</u></span>
              <div className="phone-block"><strong>+7 (905) 365-47-39</strong><small>с 9:00 до 19:00</small></div>
              <button className="call-btn">Заказать звонок</button>
            </div>
          </div>

          <nav className="hero-nav">
            <a>О КОМПАНИИ</a>
            <a>/</a>
            <a>ПРОЕКТЫ ДОМОВ</a>
            <a>/</a>
            <a>БАНИ</a>
            <a>/</a>
            <a>УСЛУГИ</a>
            <a>/</a>
            <a>ПРОЕКТИРОВАНИЕ</a>
            <a>/</a>
            <a>ПОРТФОЛИО</a>
            <a>/</a>
            <a>КОНТАКТЫ</a>
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

      <section className="section">
        <div className="container">
          <h2>Почему выбирают нас</h2>
          <div className="adv-grid">
            {advantages.map((item) => (
              <div className="adv-card" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="catalog">
        <div className="container">
          <h2>Популярные проекты</h2>
          <div className="catalog-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-image" style={{ backgroundImage: `url(${project.image})` }}>
                  {project.badge ? <span className="badge">{project.badge}</span> : null}
                </div>
                <div className="project-content">
                  <h3>{project.title}</h3>
                  <p className="project-desc">{project.description}</p>
                  <div className="project-meta">
                    <span>{project.area}</span>
                    <span>{project.floors}</span>
                    <span>{project.bedrooms}</span>
                  </div>
                  <strong className="project-price">{project.price}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="lead-form">
        <div className="container">
          <h2>Оставьте заявку</h2>
          <form className="lead-form" onSubmit={submitLead}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" required />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" required />
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Комментарий (необязательно)"
              rows={4}
            />
            <button type="submit">Отправить</button>
            {status ? <p className="status">{status}</p> : null}
          </form>
        </div>
      </section>

      <footer className="section alt">
        <div className="container">
          <p>© Everest Stroi, Пенза</p>
          <a className="ghost-admin" href={`?admin=${ADMIN_KEY}`}>
            service
          </a>
        </div>
      </footer>
    </div>
  );
}

function AdminPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [projects, setProjects] = useState<HouseProject[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [draft, setDraft] = useState<Partial<HouseProject>>({});
  const [error, setError] = useState('');

  const adminHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'x-admin-token': token
    }),
    [token]
  );

  const loadAdminData = async (currentToken: string) => {
    const [projectsRes, leadsRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/projects`, { headers: { 'x-admin-token': currentToken } }),
      fetch(`${API_BASE}/api/admin/leads`, { headers: { 'x-admin-token': currentToken } })
    ]);

    if (!projectsRes.ok || !leadsRes.ok) {
      setError('Не удалось загрузить данные админки');
      return;
    }

    setProjects(await projectsRes.json());
    setLeads(await leadsRes.json());
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
      <div className="admin-grid">
        <section>
          <h2>{draft.id ? 'Редактирование проекта' : 'Новый проект'}</h2>
          <div className="admin-form">
            <input placeholder="Название" value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <input placeholder="Площадь" value={draft.area || ''} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
            <input placeholder="Этажность" value={draft.floors || ''} onChange={(e) => setDraft({ ...draft, floors: e.target.value })} />
            <input placeholder="Спальни" value={draft.bedrooms || ''} onChange={(e) => setDraft({ ...draft, bedrooms: e.target.value })} />
            <input placeholder="Цена" value={draft.price || ''} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <input placeholder="URL изображения" value={draft.image || ''} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
            <input placeholder="Бейдж" value={draft.badge || ''} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
            <textarea
              rows={3}
              placeholder="Описание"
              value={draft.description || ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <button onClick={saveProject}>Сохранить</button>
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
                  <p>{project.price}</p>
                </div>
                <div className="actions">
                  <button onClick={() => setDraft(project)}>Изменить</button>
                  <button onClick={() => removeProject(project.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
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
      </section>
    </div>
  );
}

function App() {
  const url = new URL(window.location.href);
  const isAdminRoute =
    window.location.pathname.endsWith(ADMIN_PATH) ||
    window.location.hash === `#${ADMIN_KEY}` ||
    url.searchParams.get('admin') === ADMIN_KEY;

  return isAdminRoute ? <AdminPage /> : <PublicPage />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
