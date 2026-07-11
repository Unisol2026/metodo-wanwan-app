/* A-16: registra o service worker para offline real.
   Externalizado da tag inline do index.html (auditoria 5, 2026-07-08) para permitir
   CSP com script-src 'self' — sem 'unsafe-inline'. Silencioso: o app funciona sem SW
   (jsdom/test-ui e file:// não têm serviceWorker).
   10/07/2026 — auto-update: força a checagem do sw.js a cada abertura e recarrega a
   página UMA vez quando um SW novo assume o controle (senão o cache-first segura o
   visual antigo até a 2ª reabertura — visto no celular do Wanderson). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js')
      .then(function (reg) { if (reg && reg.update) reg.update().catch(function () {}); })
      .catch(function () { /* silencioso */ });
    var reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloaded) return; // nunca em loop
      reloaded = true;
      window.location.reload();
    });
  });
}
