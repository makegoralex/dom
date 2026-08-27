import React, { ComponentType, useEffect, useMemo, useState } from 'react';

export type JournalCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  articleCount?: number;
};

export type JournalArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  categoryId: string;
  tags: string[];
  author: string;
  status: 'draft' | 'review' | 'published';
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
};

type ProjectSummary = {
  id: string;
  title: string;
  shortDescription: string;
  coverImage: string;
  area: string;
  priceFrom: string;
};

type SharedProps = {
  apiBase: string;
  Header: ComponentType;
  Footer: ComponentType;
  resolveMedia: (value: string) => string;
};

const SERVICE_NAMES: Record<string, string> = {
  fundament: 'Фундамент',
  svai: 'Сваи',
  skvazhiny: 'Скважины',
  septik: 'Септик',
  zabory: 'Заборы',
  mezhevanie: 'Межевание',
  dveri: 'Двери',
  remont: 'Ремонт и отделка',
  dizainer: 'Дизайн интерьера',
  'landshaftnyy-dizayn': 'Ландшафтный дизайн',
  'ipoteka-oformlenie': 'Оформление ипотеки'
};

function formatDate(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function sanitizeArticleHtml(html: string) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed, form').forEach((node) => node.remove());
  doc.body.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || (['href', 'src'].includes(name) && value.startsWith('javascript:'))) node.removeAttribute(attribute.name);
    });
  });
  return doc.body.innerHTML;
}

function JournalCard({ article, category, resolveMedia }: { article: JournalArticle; category?: JournalCategory; resolveMedia: (value: string) => string }) {
  return (
    <article className="journal-card">
      <a className="journal-card-cover" href={`/journal/${article.slug}`}>
        {article.coverImage ? <img src={resolveMedia(article.coverImage)} alt="" /> : <span>EVTENIA · ЖУРНАЛ</span>}
      </a>
      <div className="journal-card-body">
        {category ? <a className="journal-category-label" href={`/journal/category/${category.slug}`}>{category.name}</a> : null}
        <h2><a href={`/journal/${article.slug}`}>{article.title}</a></h2>
        <p>{article.excerpt}</p>
        <div className="journal-card-meta"><span>{formatDate(article.publishedAt || article.updatedAt)}</span><a href={`/journal/${article.slug}`}>Читать →</a></div>
      </div>
    </article>
  );
}

export function JournalIndexPage({ apiBase, Header, Footer, resolveMedia, categorySlug = '' }: SharedProps & { categorySlug?: string }) {
  const [categories, setCategories] = useState<JournalCategory[]>([]);
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${apiBase}/api/journal/categories`).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch(`${apiBase}/api/journal/articles${categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ''}`).then((response) => response.ok ? response.json() : Promise.reject())
    ])
      .then(([categoryItems, articleItems]) => {
        setCategories(categoryItems as JournalCategory[]);
        setArticles(articleItems as JournalArticle[]);
      })
      .finally(() => setLoading(false));
  }, [apiBase, categorySlug]);

  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const featured = articles.find((article) => article.featured) || articles[0];
  const rest = featured ? articles.filter((article) => article.id !== featured.id) : articles;

  useEffect(() => {
    document.title = activeCategory ? `${activeCategory.name} — Журнал Evtenia` : 'Журнал о строительстве домов — Evtenia';
  }, [activeCategory]);

  return (
    <>
      <Header />
      <main className="journal-page">
        <section className="journal-hero">
          <div className="container">
            <nav className="journal-breadcrumbs"><a href="/">Главная</a><span>/</span>{activeCategory ? <><a href="/journal">Журнал</a><span>/</span><span>{activeCategory.name}</span></> : <span>Журнал</span>}</nav>
            <p className="journal-eyebrow">База знаний Evtenia</p>
            <h1>{activeCategory?.name || 'Журнал о строительстве дома'}</h1>
            <p>{activeCategory?.description || 'Разбираем технологии, проекты, фундамент, ипотеку и инженерные решения простым языком — чтобы вы принимали решения без дорогих ошибок.'}</p>
            <div className="journal-hero-actions"><a className="journal-primary-button" href="/projects">Подобрать проект</a><a className="journal-secondary-button" href="/#lead-form">Обсудить строительство</a></div>
          </div>
        </section>

        <section className="journal-categories-section">
          <div className="container">
            <div className="journal-category-pills">
              <a className={!categorySlug ? 'active' : ''} href="/journal">Все материалы</a>
              {categories.map((category) => <a className={category.slug === categorySlug ? 'active' : ''} key={category.id} href={`/journal/category/${category.slug}`}>{category.name}{typeof category.articleCount === 'number' ? <small>{category.articleCount}</small> : null}</a>)}
            </div>
          </div>
        </section>

        <section className="journal-feed-section">
          <div className="container">
            {loading ? <div className="journal-empty"><strong>Загружаем материалы…</strong></div> : null}
            {!loading && !articles.length ? (
              <div className="journal-empty"><span>Ж</span><h2>Готовим первые материалы</h2><p>Рубрики уже собраны. Скоро здесь появятся практические разборы о строительстве, проектах и ипотеке.</p><a href="/projects">Пока посмотреть проекты домов →</a></div>
            ) : null}
            {featured ? (
              <article className="journal-featured">
                <a className="journal-featured-cover" href={`/journal/${featured.slug}`}>{featured.coverImage ? <img src={resolveMedia(featured.coverImage)} alt="" /> : <span>Главный материал</span>}</a>
                <div><span className="journal-category-label">{categories.find((category) => category.id === featured.categoryId)?.name}</span><h2><a href={`/journal/${featured.slug}`}>{featured.title}</a></h2><p>{featured.excerpt}</p><a className="journal-read-link" href={`/journal/${featured.slug}`}>Читать материал →</a></div>
              </article>
            ) : null}
            {rest.length ? <div className="journal-grid">{rest.map((article) => <JournalCard key={article.id} article={article} category={categories.find((category) => category.id === article.categoryId)} resolveMedia={resolveMedia} />)}</div> : null}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function JournalArticlePage({ apiBase, Header, Footer, resolveMedia, slug }: SharedProps & { slug: string }) {
  const [article, setArticle] = useState<JournalArticle | null>(null);
  const [categories, setCategories] = useState<JournalCategory[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/journal/articles/${encodeURIComponent(slug)}`),
      fetch(`${apiBase}/api/journal/categories`),
      fetch(`${apiBase}/api/projects`)
    ]).then(async ([articleResponse, categoryResponse, projectResponse]) => {
      if (!articleResponse.ok) { setMissing(true); return; }
      const articlePayload = await articleResponse.json() as JournalArticle;
      setArticle(articlePayload);
      if (categoryResponse.ok) setCategories(await categoryResponse.json());
      if (projectResponse.ok) setProjects(await projectResponse.json());
    });
  }, [apiBase, slug]);

  const category = categories.find((item) => item.id === article?.categoryId);
  const relatedProjects = useMemo(() => projects.filter((project) => article?.relatedProjectIds.includes(project.id)), [article, projects]);

  useEffect(() => {
    if (!article) return;
    document.title = article.seoTitle || `${article.title} — Evtenia`;
    let description = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.appendChild(description); }
    description.content = article.seoDescription || article.excerpt;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${window.location.origin}/journal/${article.slug}`;
    const previous = document.getElementById('journal-article-schema');
    previous?.remove();
    const schema = document.createElement('script');
    schema.id = 'journal-article-schema';
    schema.type = 'application/ld+json';
    schema.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.excerpt, image: article.coverImage ? [resolveMedia(article.coverImage)] : undefined, datePublished: article.publishedAt, dateModified: article.updatedAt, author: { '@type': 'Organization', name: article.author || 'Evtenia' }, publisher: { '@type': 'Organization', name: 'Evtenia' }, mainEntityOfPage: canonical.href });
    document.head.appendChild(schema);
    return () => schema.remove();
  }, [article, resolveMedia]);

  if (missing) return <><Header /><main className="journal-page"><div className="container journal-empty"><h1>Материал не найден</h1><a href="/journal">Вернуться в Журнал</a></div></main><Footer /></>;
  if (!article) return <><Header /><main className="journal-page"><div className="container journal-empty"><strong>Загружаем материал…</strong></div></main><Footer /></>;

  return (
    <>
      <Header />
      <main className="journal-article-page">
        <div className="container journal-article-shell">
          <nav className="journal-breadcrumbs"><a href="/">Главная</a><span>/</span><a href="/journal">Журнал</a>{category ? <><span>/</span><a href={`/journal/category/${category.slug}`}>{category.name}</a></> : null}</nav>
          <header className="journal-article-header">
            {category ? <a className="journal-category-label" href={`/journal/category/${category.slug}`}>{category.name}</a> : null}
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            <div className="journal-article-meta"><span>{article.author}</span><span>Обновлено {formatDate(article.updatedAt)}</span></div>
          </header>
          {article.coverImage ? <figure className="journal-article-cover"><img src={resolveMedia(article.coverImage)} alt={article.title} /></figure> : null}
          <div className="journal-article-layout">
            <article className="journal-article-content" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }} />
            <aside className="journal-article-aside"><strong>Планируете строительство?</strong><p>Подберём технологию и проект под участок, бюджет и ипотечную программу.</p><a href={article.ctaHref || '/#lead-form'}>Получить консультацию</a></aside>
          </div>
          {article.tags.length ? <div className="journal-tags">{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
          {relatedProjects.length ? <section className="journal-related"><div className="journal-section-heading"><p>Подходящие решения</p><h2>Проекты по теме</h2></div><div className="journal-project-grid">{relatedProjects.map((project) => <a href={`/project/${project.id}`} key={project.id}><div>{project.coverImage ? <img src={resolveMedia(project.coverImage)} alt="" /> : null}</div><strong>{project.title}</strong><span>{project.area} · {project.priceFrom}</span></a>)}</div></section> : null}
          {article.relatedServiceSlugs.length ? <section className="journal-related"><div className="journal-section-heading"><p>Можно заказать в Evtenia</p><h2>Услуги по теме</h2></div><div className="journal-service-links">{article.relatedServiceSlugs.map((service) => <a href={`/services/${service}`} key={service}>{SERVICE_NAMES[service] || service.replace(/-/g, ' ')}<span>→</span></a>)}</div></section> : null}
          <section className="journal-final-cta"><div><p>Следующий шаг</p><h2>{article.ctaTitle || 'Поможем выбрать решение'}</h2><span>{article.ctaText}</span></div><a href={article.ctaHref || '/#lead-form'}>Обсудить строительство</a></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
