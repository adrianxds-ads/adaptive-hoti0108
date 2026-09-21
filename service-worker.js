const CACHE='adaptive-hoti0108-v3.2.0-fullscreen-editor';const PAGE_CACHE='adaptive-hoti0108-manual-pages-v2';
const ASSETS=['./sprint.js','./exam-focus.js','./exam-focus.css','./quiz.css','./quiz-engine.js','./','./index.html','./app.js','./adrian-visual-system.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./data/manuals-index.json','./data/course-state.json','./data/activities-uf0049-source.json','./data/activity-recommendations.json','./data/activity-chat-links.json','./data/uf0049-photo-plan.json','./data/questions-mf1074.json','./data/question-evidence.json','./data/progress-schema.json','./manuals.html','./manuals.css','./manuals.js','./documentation.js','./course-overview.js','./activities.html','./activity.html','./activities.css','./joti-chatgpt.js','./activities-list.js','./activity-detail.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('adaptive-hoti0108-')&&k!==CACHE&&k!==PAGE_CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 const path=new URL(e.request.url).pathname;
 if(path.endsWith('.pdf')){e.respondWith(fetch(e.request));return;}
 if(/\/content\/UF\d{4}\/pages\/\d+\.webp$/.test(path)){
  const response=caches.open(PAGE_CACHE).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;const r=await fetch(e.request);if(r.ok){await c.put(e.request,r.clone());const keys=await c.keys();await Promise.all(keys.slice(0,Math.max(0,keys.length-36)).map(k=>c.delete(k)));}return r;});
  e.respondWith(response);e.waitUntil(response.then(()=>{}).catch(()=>{}));return;
 }
 const response=fetch(e.request).then(async r=>{if(r.ok){const c=await caches.open(CACHE);await c.put(e.request,r.clone());}return r;}).catch(async()=>{const hit=await caches.match(e.request);if(hit)return hit;if(e.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();return Response.error();});
 e.respondWith(response);e.waitUntil(response.then(()=>{}).catch(()=>{}));
});



