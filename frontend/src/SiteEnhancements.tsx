import { useEffect, useRef, useState } from 'react';

export const PRICE_NOTICE = 'Цены на сайте ориентировочные и не являются публичной офертой. Актуальную стоимость, наличие, комплектацию и условия уточняйте у менеджера. Итоговая цена фиксируется в договоре после согласования объёма работ и материалов.';

// Annotate text in place, including CMS content and asynchronously loaded prices.
// Keep React's text nodes intact so filters and calculators can update them safely.
export function PriceAnnotations() {
  useEffect(() => {
    const annotate = (root: Node) => {
      const visit = (node: Node) => {
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,input,textarea,select,option,[contenteditable],#price-notice')) return;
        const original = node.nodeValue || '';
        const updated = original.replace(/(?:₽|руб(?:лей|ля|ль|\.)?)(?![а-яё]|\*)/gi, (currency, offset) => {
          const preceding = original.slice(0, offset);
          return /\d/.test(preceding) || /\d[\d\s.,–—-]*(?:млн|тыс\.?)?\s*(?:₽|руб)/i.test(parent.textContent || '') ? `${currency}*` : currency;
        });
        if (updated !== original) { node.nodeValue = updated; parent.title = PRICE_NOTICE; parent.dataset.priceNotice = 'true'; }
      };
      if (root.nodeType === Node.TEXT_NODE) visit(root);
      else { const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let node; while ((node = walker.nextNode())) visit(node); }
    };
    annotate(document.body);
    const observer = new MutationObserver((records) => {
      observer.disconnect();
      for (const record of records) {
        if (record.type === 'characterData') annotate(record.target);
        else record.addedNodes.forEach(annotate);
      }
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

export function GiftOffer({ onRequest }: { onRequest: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('evtenia-gift-dismissed') === '1'; } catch { /* storage optional */ }
    if (dismissed) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started < 14000 || document.querySelector('[role="dialog"],dialog[open],.mobile-menu-overlay')) return;
      setVisible(true);
      window.clearInterval(timer);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);
  const dismiss = () => { setVisible(false); try { sessionStorage.setItem('evtenia-gift-dismissed', '1'); } catch { /* storage optional */ } };
  const request = () => { dismiss(); onRequest(); };
  return <>
    <button type="button" className="gift-offer-tab" onClick={request}><span>🎁</span><span>10 соток в подарок<small>При строительстве дома →</small></span></button>
    {visible ? <aside className="gift-offer-popup" aria-label="Акция: участок в подарок">
      <button type="button" className="gift-offer-close" aria-label="Закрыть предложение" onClick={dismiss}>×</button>
      <span className="gift-offer-kicker">Горячее предложение · Evtenia</span>
      <strong>Дом — ваш.<br />10 соток — в подарок!</strong>
      <p>Закажите строительство дома и получите земельный участок. Подберём доступные варианты и расскажем об условиях акции.</p>
      <button type="button" className="gift-offer-cta" onClick={request}>Хочу участок в подарок →</button>
      <a href="/discounts/vse-akcii">Посмотреть все условия и предложения</a>
    </aside> : null}
  </>;
}

type Photo = { src: string; alt: string; caption: string };
export function PortfolioAlbum({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const change = (direction: number) => setIndex((current) => (current + direction + photos.length) % photos.length);
  const photo = photos[index] || photos[0];
  useEffect(() => {
    const el = dialog.current;
    const close = () => { document.body.style.overflow = previousOverflow.current; };
    el?.addEventListener('close', close);
    return () => { el?.removeEventListener('close', close); if (el?.open) document.body.style.overflow = previousOverflow.current; };
  }, []);
  const previousOverflow = useRef('');
  const open = () => { previousOverflow.current = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.current?.showModal(); };
  const swipe = (end: number) => { if (touchStart.current !== null && Math.abs(end - touchStart.current) > 45) change(end < touchStart.current ? 1 : -1); touchStart.current = null; };
  if (!photo) return null;
  return <div className="portfolio-album">
    <div className="portfolio-album-stage" onTouchStart={(e) => { touchStart.current = e.changedTouches[0].clientX; }} onTouchEnd={(e) => swipe(e.changedTouches[0].clientX)}>
      <button type="button" className="portfolio-album-open" onClick={open} aria-label={`Увеличить фото: ${title}`}><img src={photo.src} alt={photo.alt} loading="lazy" width="1200" height="800" /><span>Смотреть крупнее ↗</span></button>
      {photos.length > 1 ? <><button className="album-prev" type="button" onClick={() => change(-1)} aria-label={`Предыдущее фото: ${title}`}>‹</button><button className="album-next" type="button" onClick={() => change(1)} aria-label={`Следующее фото: ${title}`}>›</button></> : null}
      <span className="album-count" aria-live="polite">{index + 1} / {photos.length}</span>
    </div>
    <p className="album-caption">{photo.caption}</p>
    {photos.length > 1 ? <div className="album-thumbnails" aria-label={`Фотографии: ${title}`}>{photos.map((item, number) => <button type="button" key={item.src} aria-label={`Фото ${number + 1}: ${item.caption}`} aria-pressed={number === index} onClick={() => setIndex(number)}><img src={item.src} alt="" loading="lazy" width="100" height="75" /></button>)}</div> : null}
    <dialog ref={dialog} className="portfolio-lightbox" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }} onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); change(e.key === 'ArrowLeft' ? -1 : 1); } }}>
      <div className="portfolio-lightbox-content" onTouchStart={(e) => { touchStart.current = e.changedTouches[0].clientX; }} onTouchEnd={(e) => swipe(e.changedTouches[0].clientX)}>
        <button type="button" className="album-close" onClick={() => dialog.current?.close()} aria-label="Закрыть просмотр">×</button>
        <img src={photo.src} alt={photo.alt} />
        {photos.length > 1 ? <><button type="button" className="album-prev" onClick={() => change(-1)} aria-label="Предыдущее фото">‹</button><button type="button" className="album-next" onClick={() => change(1)} aria-label="Следующее фото">›</button></> : null}
        <p aria-live="polite">{title} · {index + 1} / {photos.length}<small>{photo.caption}</small></p>
      </div>
    </dialog>
  </div>;
}
