(() => {
  'use strict';
  const BRAND = 'AML';
  const replaceBrand = value => typeof value === 'string'
    ? value.replace(/ani\.pm/gi, BRAND).replace(/ani pm/gi, BRAND)
    : value;

  document.title = replaceBrand(document.title);
  for (const meta of document.querySelectorAll('meta[content]')) {
    const next = replaceBrand(meta.content);
    if (next !== meta.content) meta.content = next;
  }
  for (const link of document.querySelectorAll('link[rel="canonical"]')) link.remove();

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const raw = typeof input === 'string' ? input : input?.url;
    if (raw) {
      try {
        const url = new URL(raw, location.href);
        if (url.origin !== location.origin) {
          console.warn('[AML mock] blocked external request:', url.href);
          return Promise.reject(new Error('AML mock-only mode blocks external network requests'));
        }
      } catch {}
    }
    return originalFetch(input, init);
  };

  const patchNode = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const p = node.parentElement;
      if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(p.tagName)) return;
      const next = replaceBrand(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    for (const attr of ['title','aria-label','alt','placeholder']) {
      if (node.hasAttribute?.(attr)) {
        const old = node.getAttribute(attr);
        const next = replaceBrand(old);
        if (old !== next) node.setAttribute(attr, next);
      }
    }
    for (const child of node.childNodes || []) patchNode(child);
  };

  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') patchNode(record.target);
      for (const node of record.addedNodes || []) patchNode(node);
    }
  });
  observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true});

  addEventListener('DOMContentLoaded', () => {
    patchNode(document.body);
    const badge = document.createElement('div');
    badge.textContent = 'AML · MOCK DATA';
    badge.setAttribute('aria-label','AML mock-data build');
    Object.assign(badge.style,{
      position:'fixed',right:'14px',bottom:'14px',zIndex:'2147483647',
      padding:'7px 10px',border:'1px solid rgba(255,255,255,.16)',
      borderRadius:'999px',background:'rgba(12,12,14,.78)',color:'#fff',
      font:'600 10px/1 system-ui',letterSpacing:'.08em',backdropFilter:'blur(14px)',
      pointerEvents:'none'
    });
    document.body.appendChild(badge);
  });

  console.log('%c AML mock-only extracted frontend ', 'background:#111;color:#fff;padding:6px 10px;border-radius:6px;font-weight:700');
})();