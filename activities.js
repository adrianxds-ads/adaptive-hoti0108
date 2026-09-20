'use strict';

const STORE_KEY='adaptive_hoti0108_activity_hub_v1';
const $=id=>document.getElementById(id);
let course=null,activities=[],selected=null,store=loadStore(),saveTimer=null;
let activitySources=new Map();

const statusLabels={
  not_started:'No iniciada',
  source_captured:'Fuente capturada',
  in_progress:'En trabajo',
  draft_complete:'Borrador completo',
  docs_master:'Docs maestro',
  pdf_final:'PDF final',
  delivered:'Entregada'
};

function loadStore(){
  try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{"version":2,"records":{}}')}
  catch{return {version:2,records:{}}}
}
function saveStore(){localStorage.setItem(STORE_KEY,JSON.stringify(store));}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(v){return v?new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T12:00:00')):'—';}

function blankRecord(){
  return {
    status:'not_started',
    links:{campus:'',chat:'',docs:'',pdf:''},
    work:{introduction:'',answers:[],blog:'',notes:''},
    updatedAt:null
  };
}
function getRecord(seq){
  let r=store.records[seq];
  if(!r)r=store.records[seq]=blankRecord();
  r.links=r.links||{campus:'',chat:'',docs:'',pdf:''};
  r.work=r.work||{};
  r.work.introduction=r.work.introduction||'';
  r.work.blog=r.work.blog||'';
  r.work.notes=r.work.notes||'';
  if(!Array.isArray(r.work.answers)){
    const migrated=(r.official&&Array.isArray(r.official.questions))?r.official.questions.map(q=>q.response||''):[];
    r.work.answers=migrated;
  }
  return r;
}
function sourceFor(seq){return activitySources.get(seq)||null;}

function flattenCourse(data){
  const mod=data.modules.find(m=>m.id===data.activeModule),out=[];
  for(const uf of mod.units||[])for(const ud of uf.didacticUnits||[])for(const a of ud.activities||[]){
    out.push({...a,moduleId:mod.id,moduleName:mod.name,itineraryLabel:mod.itineraryLabel,ufId:uf.id,ufName:uf.name,udId:ud.id,udName:ud.name,due:ud.due,dueTimeDisplay:ud.dueTimeDisplay});
  }
  return out;
}

function activityTitle(a){return a.officialTitle||('Actividad '+a.ordinal);}
function urlField(label,name,value){
  return `<label class="link-field"><span>${label}</span><div><input type="url" data-link="${name}" value="${esc(value)}" placeholder="Pegar enlace"><a data-open="${name}" href="${esc(value||'#')}" target="_blank" rel="noopener">Abrir ↗</a></div></label>`;
}
function sourceBlock(label,text){
  return `<div class="source-block"><span>${esc(label)}</span><div class="source-text">${esc(text||'—')}</div></div>`;
}
function workField(label,name,value,copy=true,cls=''){
  return `<label class="activity-field ${cls}"><span class="field-label-row"><b>${label}</b>${copy?`<button type="button" class="copy-mini" data-copy-field="${name}">Copiar</button>`:''}</span><textarea data-field="${name}" rows="5">${esc(value)}</textarea></label>`;
}
function questionHtml(q,i,response){
  const label=q.label||`Pregunta ${i+1}.`;
  return `<article class="question-pair" data-q="${i}">
    <div class="question-head"><strong>${esc(label)}</strong></div>
    <div class="source-question">${esc(q.text||'')}</div>
    <label class="student-answer">
      <span class="field-label-row"><b>Respuesta del alumno</b><button type="button" class="copy-mini" data-copy-answer="${i}">Copiar</button></span>
      <textarea data-question-answer="${i}" rows="7">${esc(response||'')}</textarea>
    </label>
  </article>`;
}
function manualRefsHtml(s){
  const refs=s?.manualRefs||[];
  if(!refs.length)return '';
  return `<section class="manual-ref-panel">
    <div class="panel-title"><div><span>MANUAL UF0049</span><h2>Referencias para esta actividad</h2></div><a href="./manuals.html" target="_blank" rel="noopener">Abrir manual ↗</a></div>
    <div class="manual-ref-list">${refs.map(r=>`<div><strong>${esc(r.section)}</strong><span>${esc(r.title)}</span></div>`).join('')}</div>
  </section>`;
}

function renderList(){
  const host=$('activityList');host.replaceChildren();const byUd=new Map();
  for(const a of activities){
    const k=`${a.ufId} · ${a.udId}`;
    if(!byUd.has(k))byUd.set(k,[]);
    byUd.get(k).push(a);
  }
  for(const [key,rows] of byUd){
    const group=document.createElement('section');group.className='activity-group';group.innerHTML=`<h2>${esc(key)}</h2>`;
    for(const a of rows){
      const r=store.records[a.sequence]||blankRecord(),s=sourceFor(a.sequence),b=document.createElement('button');
      b.type='button';b.className='activity-list-item'+(selected===a.sequence?' is-active':'');b.dataset.sequence=a.sequence;
      b.innerHTML=`<span>${esc(a.sequence)}</span><strong>${esc(s?.taskTitle||activityTitle(a))}</strong><small>${esc(activityTitle(a))}</small><small>${esc(statusLabels[r.status]||r.status)} · ${fmtDate(a.due)}</small>`;
      group.append(b);
    }
    host.append(group);
  }
  host.querySelectorAll('[data-sequence]').forEach(b=>b.addEventListener('click',()=>openActivity(b.dataset.sequence)));
}

function renderPending(){
  const mod=course.modules.find(m=>m.id===course.activeModule),host=$('pendingUnits');host.replaceChildren();
  for(const uf of mod.units||[]){
    if(uf.activityCountStatus!=='pending_direct_campus_validation')continue;
    const box=document.createElement('div');box.className='pending-unit-card';
    box.innerHTML=`<strong>${esc(uf.sequence)} · ${esc(uf.id)}</strong><span>Actividades pendientes de validación directa en Campus.</span><small>No se crean fichas ni se inventa un total hasta ver el listado real.</small>`;
    host.append(box);
  }
}

function renderDetail(a){
  const r=getRecord(a.sequence),s=sourceFor(a.sequence),host=$('activityDetail');
  const questions=(s?.questions||[]).map((q,i)=>questionHtml(q,i,r.work.answers[i]||'')).join('');
  const external=s?.requiresExternalMaterial?`<span class="external-flag">Requiere material adicional · ${esc((s.externalMaterialTypes||[]).join(', '))}</span>`:'';
  const sourceDue=s?.sourceDueDate?`<small>Ficha de Campus: ${esc(s.sourceDueDate)}</small>`:'';
  host.innerHTML=`<header class="activity-sheet-head">
    <div><span class="sequence-chip">${esc(a.sequence)}</span><p>Secuencia interna · Maqueta 11</p><h1>${esc(s?.taskTitle||activityTitle(a))}</h1><p>${esc(activityTitle(a))}</p><p>${esc(a.moduleId)} → ${esc(a.ufId)} → ${esc(a.udId)}</p></div>
    <div class="sheet-meta"><strong>${fmtDate(a.due)}</strong><small>Cierre operativo · Campus ${esc(a.dueTimeDisplay||'hora no registrada')}</small>${sourceDue}<select id="activityStatus">${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${r.status===v?'selected':''}>${l}</option>`).join('')}</select></div>
  </header>
  <section class="identity-grid"><div><span>MÓDULO</span><strong>${esc(a.moduleId)}</strong><small>${esc(a.moduleName)}</small></div><div><span>UF</span><strong>${esc(a.ufId)}</strong><small>${esc(a.ufName)}</small></div><div><span>UD</span><strong>${esc(a.udId)}</strong><small>${esc(a.udName)}</small></div><div><span>ACTIVIDAD OFICIAL</span><strong>${esc(activityTitle(a))}</strong><small>Secuencia: ${esc(a.sequence)}</small></div></section>
  <section class="link-panel"><h2>Accesos</h2>${urlField('Campus','campus',r.links.campus)}${urlField('Chat principal','chat',r.links.chat)}${urlField('Google Docs maestro','docs',r.links.docs)}${urlField('PDF final','pdf',r.links.pdf)}</section>
  <section class="official-panel"><div class="panel-title"><div><span>FUENTE OFICIAL · SOLO LECTURA</span><h2>Contenido capturado de Formacampus</h2></div><small>${s?'Fuente cargada ✓':'Fuente no disponible'}</small></div>${external}
    ${sourceBlock('Enunciado',s?.statement?.text)}
    ${s?.questionsIntro?sourceBlock('Indicaciones previas a las preguntas',s.questionsIntro):''}
    ${sourceBlock('Orientaciones / información adicional',s?.guidelines?.text)}
    ${sourceBlock('Objetivos',s?.objectives?.text)}
    ${sourceBlock('Criterios de evaluación',s?.criteria?.text)}
  </section>
  ${manualRefsHtml(s)}
  <section class="student-panel"><div class="panel-title"><div><span>TRABAJO DEL ALUMNO</span><h2>Maqueta 11</h2></div><small>ChatGPT redacta; JOTI organiza.</small></div>
    ${workField('1. Introducción','work.introduction',r.work.introduction,true,'work-block')}
    <div class="questions-head"><h3>2. Desarrollo de la actividad</h3><button id="copyDevelopment" type="button">Copiar desarrollo</button></div>
    <p class="development-note">Las preguntas proceden de Campus y no son editables. Solo se edita tu respuesta.</p>
    <div id="questionPairs">${questions||'<p class="empty-questions">No se detectaron preguntas estructuradas.</p>'}</div>
    ${workField('3. El Blog del Informador','work.blog',r.work.blog,true,'work-block')}
    ${workField('Notas rápidas','work.notes',r.work.notes,true,'notes-block')}
  </section>
  <footer class="activity-control"><div><span>Última actualización</span><strong id="lastUpdated">${r.updatedAt?new Date(r.updatedAt).toLocaleString('es-ES'):'Sin guardar'}</strong></div><div class="control-actions"><button id="copyFullActivity" type="button" class="primary-copy">Copiar actividad completa</button><button id="saveActivity" type="button">Guardar ficha</button></div></footer>`;
  bindDetail(a,r,s);
}

function setDeep(obj,path,value){const [root,key]=path.split('.');obj[root][key]=value;}
function scheduleSave(a,r){clearTimeout(saveTimer);saveTimer=setTimeout(()=>commit(a,r),350);}
function commit(a,r){
  r.updatedAt=new Date().toISOString();saveStore();
  const x=$('lastUpdated');if(x)x.textContent=new Date(r.updatedAt).toLocaleString('es-ES');
  renderList();
}

async function copyText(value,button){
  const text=String(value||'');
  try{
    await navigator.clipboard.writeText(text);
    const old=button.textContent;button.textContent='Copiado ✓';button.classList.add('copied');
    setTimeout(()=>{button.textContent=old;button.classList.remove('copied');},1100);
  }catch{
    const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();
  }
}
function developmentText(s,r){
  return (s?.questions||[]).map((q,i)=>`${q.label||`Pregunta ${i+1}.`} ${q.text||''}\n\n${r.work.answers[i]||''}`.trim()).join('\n\n');
}
function fullActivityText(s,r){
  return `INTRODUCCIÓN\n\n${r.work.introduction||''}\n\nDESARROLLO DE LA ACTIVIDAD\n\n${developmentText(s,r)}\n\nEL BLOG DEL INFORMADOR\n\n${r.work.blog||''}`.trim();
}

function bindDetail(a,r,s){
  $('activityStatus').addEventListener('change',e=>{r.status=e.target.value;scheduleSave(a,r);});
  document.querySelectorAll('[data-link]').forEach(i=>i.addEventListener('input',e=>{r.links[e.target.dataset.link]=e.target.value;const open=document.querySelector(`[data-open="${e.target.dataset.link}"]`);open.href=e.target.value||'#';scheduleSave(a,r);}));
  document.querySelectorAll('[data-field]').forEach(t=>t.addEventListener('input',e=>{setDeep(r,e.target.dataset.field,e.target.value);scheduleSave(a,r);}));
  document.querySelectorAll('[data-question-answer]').forEach(t=>t.addEventListener('input',e=>{r.work.answers[+e.target.dataset.questionAnswer]=e.target.value;scheduleSave(a,r);}));
  document.querySelectorAll('[data-copy-field]').forEach(b=>b.addEventListener('click',()=>{const [,key]=b.dataset.copyField.split('.');copyText(r.work[key]||'',b);}));
  document.querySelectorAll('[data-copy-answer]').forEach(b=>b.addEventListener('click',()=>copyText(r.work.answers[+b.dataset.copyAnswer]||'',b)));
  $('copyDevelopment').addEventListener('click',e=>copyText(developmentText(s,r),e.currentTarget));
  $('copyFullActivity').addEventListener('click',e=>copyText(fullActivityText(s,r),e.currentTarget));
  $('saveActivity').addEventListener('click',()=>commit(a,r));
}

function openActivity(seq){
  selected=seq;history.replaceState(null,'','?activity='+encodeURIComponent(seq));renderList();
  const a=activities.find(x=>x.sequence===seq);if(a)renderDetail(a);
}
function exportJson(){
  const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='HOTI0108_actividades_local_'+new Date().toISOString().slice(0,10)+'.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
}

async function init(){
  const [courseRes,sourceRes]=await Promise.all([
    fetch('./data/course-state.json',{cache:'no-store'}),
    fetch('./data/activities-uf0049-source.json',{cache:'no-store'})
  ]);
  course=await courseRes.json();
  const sourcePayload=sourceRes.ok?await sourceRes.json():{activities:[]};
  activitySources=new Map((sourcePayload.activities||[]).map(x=>[x.sequence,x]));
  activities=flattenCourse(course);
  renderList();renderPending();$('exportActivities').addEventListener('click',exportJson);
  const requested=new URLSearchParams(location.search).get('activity');
  if(requested&&activities.some(a=>a.sequence===requested))openActivity(requested);
  else if(activities.length)openActivity(activities[0].sequence);
}
init().catch(e=>{$('activityDetail').innerHTML='<p class="notice">No se pudo cargar el estado del curso.</p>';console.error(e);});
