/* A-16: registra o service worker para offline real.
   Externalizado da tag inline do index.html (auditoria 5, 2026-07-08) para permitir
   CSP com script-src 'self' — sem 'unsafe-inline'. Silencioso: o app funciona sem SW
   (jsdom/test-ui e file:// não têm serviceWorker). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* silencioso */ });
  });
}
