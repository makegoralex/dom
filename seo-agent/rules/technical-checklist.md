# Technical SEO checklist

## Release blockers

- [ ] `/robots.txt` returns plain-text directives, not the SPA HTML shell.
- [ ] `/sitemap.xml` returns XML and includes canonical public pages, Journal categories and published articles.
- [ ] Journal pages are discoverable without relying only on client-side JavaScript.
- [ ] Every indexable page has a stable 200 response; missing articles return a real 404.
- [ ] No admin, draft, review or API-management URLs are indexable.

## Page checks

- [ ] One H1.
- [ ] Unique title and description.
- [ ] Self-canonical without tracking parameters.
- [ ] Lowercase Latin slug with hyphens.
- [ ] Canonical pagination/filter policy is explicit.
- [ ] Breadcrumbs are visible and marked up.
- [ ] Correct structured data validates without critical errors.
- [ ] Images have dimensions, useful alt text and efficient formats.
- [ ] Internal links use canonical URLs and have meaningful anchor text.
- [ ] No broken links, mixed content or JavaScript URLs.
- [ ] Mobile layout and Core Web Vitals are checked.

## Journal templates

- Journal index: CollectionPage + ItemList when articles exist.
- Category: CollectionPage + BreadcrumbList + unique description.
- Article: Article/BlogPosting + BreadcrumbList + author + dates + ImageObject when a cover exists.
- Tag: indexable only when it has a useful description and enough distinct material; otherwise `noindex,follow`.

## Current known issues

1. Production `/robots.txt` and `/sitemap.xml` return the Vite application shell.
2. Technology catalogue filters use `?type=` URLs rather than static landing pages.
3. The Journal has tags in article data but no public tag route.
4. The frontend is an SPA; server-rendering or pre-rendering should be evaluated before scale.
5. Existing image URLs in project data may use `http://`; public rendering must normalize them to HTTPS.

