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

function PublicPage() {
  const [projects, setProjects] = useState<HouseProject[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`)
      .then((res) => res.json())
      .then((data: HouseProject[]) => {
        setProjects(data);
        if (data[0]) {
          setProjectId(data[0].id);
        }
      })
      .catch(() => setProjects([]));
  }, []);

  const advantages = useMemo(
    () => [
      'Фиксированная смета без скрытых доплат',
      'Ипотечные программы и рассрочка',
      'Подбор участка и геологии',
      'Сопровождение до передачи ключей'
    ],
    []
  );

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Отправка...');

    const response = await fetch(`${API_BASE}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, message, projectId })
    });

    if (!response.ok) {
      setStatus('Ошибка отправки. Проверьте данные и попробуйте снова.');
      return;
    }

    setStatus('Спасибо! Мы свяжемся с вами в ближайшее время.');
    setName('');
    setPhone('');
    setMessage('');
  };

  return (
    <div>
      <header className="hero">
        <div className="container">
          <div className="hero-top">
            <div className="logo">EVEREST STROI</div>
            <a href="#catalog" className="hero-link">
              Каталог проектов
            </a>
          </div>
          <h1>Строительство домов в Пензе под ключ</h1>
          <p>
            Каталог готовых проектов с прозрачной стоимостью. Подберем дом под ваш бюджет и участок, поможем с
            ипотекой и сопровождением сделки.
          </p>
          <a href="#lead-form" className="cta-btn">
            Получить консультацию
          </a>
        </div>
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
  const isAdminRoute = window.location.pathname === ADMIN_PATH;
  return isAdminRoute ? <AdminPage /> : <PublicPage />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
