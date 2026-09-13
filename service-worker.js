const CACHE='adaptive-hoti0108-bootstrap-v1';
const CORE=['./','./index.html','./app.js','./adrian-visual-system.js','./manifest.webmanifest','./icon.svg','./data/manuals-index.json','./data/questions-mf1074.json','./data/progress-schema.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
