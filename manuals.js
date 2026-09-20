'use strict';
const $=id=>document.getElementById(id),KEY='adaptive_hoti_manual_reader_v1';
let modules=[],units=[],current=null,page=1,zoom=100,request=0,saved={},readerMode=false,evidence={};
const params=new URLSearchParams(location.search),evidenceId=params.get('evidence'),evidenceVariant=params.get('variant'),returnView=params.get('returnView'),returnQ=params.get('returnQ');
try{saved=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{}}
function state(id){const s=saved[id];return s&&typeof s==='object'?s:{};}
function validPage(value,total){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=total?n:1;}
function setHash(){history.replaceState(null,'',`#${current.id}/${page}`);}
function setupReturnContext(){const b=$('returnContext');if(!b||!returnView)return;const labels={flash:'Flashcards',study:'Modo estudio',conflicts:'Discrepancias',game:'Modo test',results:'Resultados',exam:'Examen',examResults:'Resultado del examen',statistics:'Estadísticas',setup:'Modo test'};b.textContent=`← Volver a ${labels[returnView]||'la aplicación'}`;b.hidden=false;}
function returnToContext(){if(!returnView){location.href='./';return;}const p=new URLSearchParams({returnView});if(returnQ)p.set('returnQ',returnQ);location.href=`./?${p.toString()}`;}

function renderBooks(){
 $('books').replaceChildren();
 modules.forEach((m,mi)=>{
  const group=document.createElement('section');group.className='manual-module';
  const head=document.createElement('div');head.className='manual-module-head';
  const meta=document.createElement('span');meta.textContent=m.status==='active'?'MÓDULO ACTIVO':'MÓDULO ANTERIOR';
  const h=document.createElement('h2');h.textContent=`${m.id} · ${m.name}`;
  head.append(meta,h);group.append(head);
  (m.units||[]).forEach((u,i)=>{
   const ready=Boolean(u.manual&&u.pageCount&&u.pageImages&&u.readerType!=='pending');
   const button=document.createElement('button');button.className='book'+(ready?'':' is-pending');button.disabled=!ready;
   const number=document.createElement('span');number.className='book-number';number.textContent=String(i+1).padStart(2,'0');
   const body=document.createElement('span'),id=document.createElement('small'),title=document.createElement('strong'),info=document.createElement('small'),arrow=document.createElement('span');
   id.textContent=u.id;title.textContent=u.name;
   info.textContent=ready?`${u.pageCount} páginas · ${state(u.id).page?'Continuar en la página '+validPage(state(u.id).page,u.pageCount):'Abrir manual'}`:'Manual pendiente de importar y validar';
   arrow.textContent=ready?'→':'···';arrow.className='book-arrow';
   body.append(id,title,info);button.append(number,body,arrow);
   if(ready)button.onclick=()=>openManual(u.id,state(u.id).page);group.append(button);
  });
  $('books').append(group);
 });
}

function renderSections(){
 const query=$('sectionQuery').value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 $('sections').replaceChildren();
 current.sections
  .filter(s=>s.title.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(query))
  .forEach(s=>{
   const b=document.createElement('button');b.textContent=s.title;
   const sub=document.createElement('small');sub.textContent=`PDF ${s.page}${s.printedPage?' · manual p. '+s.printedPage:''}`;
   b.append(sub);b.onclick=()=>{$('contents').open=false;showPage(s.page);};$('sections').append(b);
  });
 if(!$('sections').children.length)$('sections').textContent='No hay apartados con ese nombre.';
}

function renderBookmark(){
 const mark=state(current.id).bookmark,atMark=mark===page;
 $('goBookmark').hidden=!Number.isInteger(mark);
 $('goBookmark').textContent=Number.isInteger(mark)?`↗ Marcador · pág. ${mark}`:'Ir al marcador';
 $('bookmark').textContent=atMark?`✓ Marcador · página ${page}`:'🔖 Guardar esta página';
 $('bookmark').classList.toggle('is-saved',atMark);
}

function updateZoom(){
 $('pageLayer').style.width=`${zoom}%`;
 $('zoomLabel').textContent=`${zoom} %`;
 $('zoomOut').disabled=zoom<=100;$('zoomIn').disabled=zoom>=300;
}

function renderEvidenceHighlight(){const h=$('evidenceHighlight'),status=$('evidenceStatus'),base=evidenceId?evidence[evidenceId]:null;let e=base;if(evidenceVariant==='conflict'&&base?.conflictEvidence)e=base.conflictEvidence;else{const match=(evidenceVariant||'').match(/^additional(\d+)$/);if(match)e=base?.additionalEvidence?.[Number(match[1])-1]||base;}h.hidden=true;status.hidden=true;if(!e||!current||e.unit!==current.id||Number(e.page)!==page||!e.highlight)return;const r=e.highlight;h.style.left=`${r.x*100}%`;h.style.top=`${r.y*100}%`;h.style.width=`${r.w*100}%`;h.style.height=`${r.h*100}%`;h.hidden=false;const verified=String(base?.status||'').startsWith('verified_');status.textContent=(verified?'✓ VERIFICADA · ':'⚠ REVISAR · ')+(e.section||'Fragmento del manual');status.className='evidence-status '+(verified?'verified':'conflict');status.hidden=false;requestAnimationFrame(()=>{$('viewport').scrollTo({top:Math.max(0,$('pageLayer').offsetHeight*r.y-70),left:Math.max(0,$('pageLayer').offsetWidth*r.x-30),behavior:'smooth'});});}

function applyReaderMode(on){
 readerMode=Boolean(on);
 $('reader').classList.toggle('reader-fullscreen',readerMode);
 document.documentElement.classList.toggle('reader-lock',readerMode);
 document.body.classList.toggle('reader-lock',readerMode);
 $('fullscreen').setAttribute('aria-pressed',String(readerMode));
 $('fullscreen').textContent=readerMode?'✕ Salir de pantalla completa':'⛶ Pantalla completa';
 if(readerMode)requestAnimationFrame(()=>{try{$('viewport').focus({preventScroll:true});}catch{}});
}
async function enterReaderMode(){
 applyReaderMode(true);
 if(document.fullscreenEnabled&&!document.fullscreenElement){
  try{await $('reader').requestFullscreen({navigationUI:'hide'});}catch{}
 }
}
async function exitReaderMode(){
 if(document.fullscreenElement){try{await document.exitFullscreen();}catch{}}
 applyReaderMode(false);
}

function showPage(value){
 page=validPage(value,current.pageCount);
 saved[current.id]={...state(current.id),page};persist();setHash();
 $('pageNumber').value=page;$('pageNumber').max=current.pageCount;$('totalPages').textContent=`/ ${current.pageCount}`;
 $('previous').disabled=page===1;$('next').disabled=page===current.pageCount;
 $('imageError').hidden=true;$('pageImage').hidden=true;$('evidenceHighlight').hidden=true;$('evidenceStatus').hidden=true;
 $('pageStatus').textContent=`Cargando página PDF ${page} de ${current.pageCount}…`;
 const token=++request,src=`${current.pageImages}${String(page).padStart(3,'0')}.webp`,im=new Image();
 im.onload=()=>{
  if(token!==request)return;
  $('pageImage').src=src;$('pageImage').alt=`${current.id}, página PDF ${page}. Original escaneado.`;$('pageImage').hidden=false;
  $('pageStatus').textContent=`${current.id} · Página PDF ${page} de ${current.pageCount} · Zoom ${zoom} %`;
  $('viewport').scrollTo(0,0);renderEvidenceHighlight();
 };
 im.onerror=()=>{if(token!==request)return;$('imageError').hidden=false;$('pageStatus').textContent=`Página PDF ${page} no disponible.`;};
 im.src=src;renderBookmark();
}

function openManual(id,value){
 current=units.find(u=>u.id===id);if(!current||!current.manual||!current.pageCount||!current.pageImages)return;
 zoom=100;updateZoom();document.body.classList.add('reader-open');
 $('library').hidden=true;$('reader').hidden=false;$('title').textContent=current.name;$('unit').textContent=current.id;
 $('sectionQuery').value='';renderSections();showPage(value);window.scrollTo(0,0);
}

$('returnContext').onclick=returnToContext;
$('back').onclick=async()=>{
 request++;if(readerMode)await exitReaderMode();current=null;
 $('reader').hidden=true;$('library').hidden=false;document.body.classList.remove('reader-open');
 history.replaceState(null,'',location.pathname);renderBooks();window.scrollTo(0,0);
};
$('sectionQuery').oninput=renderSections;
$('previous').onclick=()=>showPage(page-1);$('next').onclick=()=>showPage(page+1);
$('pageForm').onsubmit=e=>{e.preventDefault();if($('pageForm').reportValidity())showPage($('pageNumber').value);};
$('retry').onclick=()=>showPage(page);
$('zoomIn').onclick=()=>{zoom=Math.min(300,zoom+25);updateZoom();if(current)$('pageStatus').textContent=`${current.id} · Página PDF ${page} de ${current.pageCount} · Zoom ${zoom} %`;};
$('zoomOut').onclick=()=>{zoom=Math.max(100,zoom-25);updateZoom();if(current)$('pageStatus').textContent=`${current.id} · Página PDF ${page} de ${current.pageCount} · Zoom ${zoom} %`;};
$('fit').onclick=()=>{zoom=100;updateZoom();if(current)$('pageStatus').textContent=`${current.id} · Página PDF ${page} de ${current.pageCount} · Zoom 100 %`;};
$('bookmark').onclick=()=>{saved[current.id]={...state(current.id),bookmark:page};persist();renderBookmark();};
$('goBookmark').onclick=()=>showPage(state(current.id).bookmark);
$('fullscreen').onclick=()=>readerMode?exitReaderMode():enterReaderMode();

document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&readerMode)applyReaderMode(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&readerMode)exitReaderMode();});

async function boot(){
 const [r,er]=await Promise.all([fetch('./data/manuals-index.json'),fetch('./data/question-evidence.json').catch(()=>null)]);if(!r.ok)throw Error('index');
 const data=await r.json();modules=data.modules||[data.module].filter(Boolean);units=modules.flatMap(m=>(m.units||[]).map(u=>({...u,moduleId:m.id,moduleName:m.name,moduleStatus:m.status})));window.HotiManualCatalog={modules,units};if(er&&er.ok){const ed=await er.json();evidence=ed.questions||ed||{};}setupReturnContext();renderBooks();window.dispatchEvent(new CustomEvent('hoti:catalog-ready',{detail:{modules,units}}));
 const match=location.hash.match(/^#([A-Z]{2}\d{4})\/(\d+)$/);if(match)openManual(match[1],match[2]);
}
boot().catch(()=>{$('books').textContent='No se pudieron cargar los manuales. Comprueba la conexión y vuelve a abrir esta página.';});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
