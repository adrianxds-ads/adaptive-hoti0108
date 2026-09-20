'use strict';
const STORE_KEY='adaptive_hoti0108_activity_hub_v1';
const $=id=>document.getElementById(id);
let course=null,activities=[],selected=null,store=loadStore(),saveTimer=null;
const statusLabels={not_started:'No iniciada',source_captured:'Fuente capturada',in_progress:'En trabajo',draft_complete:'Borrador completo',docs_master:'Docs maestro',pdf_final:'PDF final',delivered:'Entregada'};
function loadStore(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{"version":1,"records":{}}')}catch{return {version:1,records:{}}}}
function saveStore(){localStorage.setItem(STORE_KEY,JSON.stringify(store));}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(v){return v?new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T12:00:00')):'—';}
function blankRecord(){return {status:'not_started',links:{campus:'',chat:'',docs:'',pdf:''},official:{statement:'',guidelines:'',objectives:'',criteria:'',questions:[]},work:{introduction:'',blog:'',notes:''},updatedAt:null};}
function getRecord(seq){return store.records[seq]||(store.records[seq]=blankRecord());}
function flattenCourse(data){
 const mod=data.modules.find(m=>m.id===data.activeModule);const out=[];
 for(const uf of mod.units||[])for(const ud of uf.didacticUnits||[])for(const a of ud.activities||[])out.push({...a,moduleId:mod.id,moduleName:mod.name,itineraryLabel:mod.itineraryLabel,ufId:uf.id,ufName:uf.name,udId:ud.id,udName:ud.name,due:ud.due,dueTimeDisplay:ud.dueTimeDisplay});
 return out;
}
function field(label,name,value,cls=''){return `<label class="activity-field ${cls}"><span>${label}</span><textarea data-field="${name}" rows="4">${esc(value)}</textarea></label>`;}
function urlField(label,name,value){return `<label class="link-field"><span>${label}</span><div><input type="url" data-link="${name}" value="${esc(value)}" placeholder="Pegar enlace"><a data-open="${name}" href="${esc(value||'#')}" target="_blank" rel="noopener">Abrir ↗</a></div></label>`;}
function activityTitle(a){return a.officialTitle||('Actividad '+a.ordinal);}
function renderList(){
 const host=$('activityList');host.replaceChildren();const byUd=new Map();
 for(const a of activities){const k=`${a.ufId} · ${a.udId}`;if(!byUd.has(k))byUd.set(k,[]);byUd.get(k).push(a);}
 for(const [key,rows] of byUd){const group=document.createElement('section');group.className='activity-group';group.innerHTML=`<h2>${esc(key)}</h2>`;
 for(const a of rows){const r=store.records[a.sequence]||blankRecord(),b=document.createElement('button');b.type='button';b.className='activity-list-item'+(selected===a.sequence?' is-active':'');b.dataset.sequence=a.sequence;b.innerHTML=`<span>${esc(a.sequence)}</span><strong>${esc(activityTitle(a))}</strong><small>${esc(statusLabels[r.status]||r.status)} · ${fmtDate(a.due)}</small>`;group.append(b);}host.append(group);}
 host.querySelectorAll('[data-sequence]').forEach(b=>b.addEventListener('click',()=>openActivity(b.dataset.sequence)));
}function renderPending(){
 const mod=course.modules.find(m=>m.id===course.activeModule),host=$('pendingUnits');host.replaceChildren();
 for(const uf of mod.units||[]){if(uf.activityCountStatus!=='pending_direct_campus_validation')continue;const box=document.createElement('div');box.className='pending-unit-card';box.innerHTML=`<strong>${esc(uf.sequence)} · ${esc(uf.id)}</strong><span>Actividades pendientes de validación directa en Campus.</span><small>No se crean fichas ni se inventa un total hasta ver el listado real.</small>`;host.append(box);}
}
function questionHtml(q,i){return `<article class="question-pair" data-q="${i}"><div class="question-head"><strong>Pregunta ${i+1}</strong><button type="button" data-remove-question="${i}">Eliminar</button></div><label><span>Texto literal de la pregunta</span><textarea data-question-text="${i}" rows="3">${esc(q.text||'')}</textarea></label><label class="student-answer"><span>Respuesta del alumno</span><textarea data-question-answer="${i}" rows="6">${esc(q.response||'')}</textarea></label></article>`;}
function renderDetail(a){
 const r=getRecord(a.sequence),host=$('activityDetail');
 const questions=r.official.questions.map(questionHtml).join('');
 host.innerHTML=`<header class="activity-sheet-head"><div><span class="sequence-chip">${esc(a.sequence)}</span><p>Secuencia interna · Maqueta 11</p><h1>${esc(activityTitle(a))}</h1><p>${esc(a.moduleId)} → ${esc(a.ufId)} → ${esc(a.udId)}</p></div><div class="sheet-meta"><strong>${fmtDate(a.due)}</strong><small>Campus muestra ${esc(a.dueTimeDisplay||'hora no registrada')}</small><select id="activityStatus">${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${r.status===v?'selected':''}>${l}</option>`).join('')}</select></div></header>
<section class="identity-grid"><div><span>MÓDULO</span><strong>${esc(a.moduleId)}</strong><small>${esc(a.moduleName)}</small></div><div><span>UF</span><strong>${esc(a.ufId)}</strong><small>${esc(a.ufName)}</small></div><div><span>UD</span><strong>${esc(a.udId)}</strong><small>${esc(a.udName)}</small></div><div><span>ACTIVIDAD OFICIAL</span><strong>${esc(activityTitle(a))}</strong><small>Secuencia separada: ${esc(a.sequence)}</small></div></section>
<section class="link-panel"><h2>Accesos</h2>${urlField('Campus','campus',r.links.campus)}${urlField('Chat principal','chat',r.links.chat)}${urlField('Google Docs maestro','docs',r.links.docs)}${urlField('PDF final','pdf',r.links.pdf)}</section>
<section class="official-panel"><div class="panel-title"><div><span>FUENTE OFICIAL</span><h2>Copiar literalmente desde Campus.</h2></div><small>No resumir ni reescribir aquí.</small></div>${field('Enunciado','official.statement',r.official.statement)}${field('Orientaciones','official.guidelines',r.official.guidelines)}${field('Objetivos','official.objectives',r.official.objectives)}${field('Criterios de evaluación','official.criteria',r.official.criteria)}</section>
<section class="student-panel"><div class="panel-title"><div><span>TRABAJO DEL ALUMNO</span><h2>Maqueta 11.</h2></div><small>ChatGPT redacta; la app organiza.</small></div>${field('1. Introducción','work.introduction',r.work.introduction,'work-block')}<div class="questions-head"><h3>2. Desarrollo de la actividad</h3><button id="addQuestion" type="button">+ Añadir pregunta</button></div><p class="development-note">Cada pregunta conserva por separado el texto literal del Campus y la respuesta del alumno.</p><div id="questionPairs">${questions||'<p class="empty-questions">Todavía no hay preguntas copiadas del Campus.</p>'}</div>${field('3. El Blog del Informador','work.blog',r.work.blog,'work-block')}${field('Notas rápidas','work.notes',r.work.notes,'notes-block')}</section>
<footer class="activity-control"><div><span>Última actualización</span><strong id="lastUpdated">${r.updatedAt?new Date(r.updatedAt).toLocaleString('es-ES'):'Sin guardar'}</strong></div><button id="saveActivity" type="button">Guardar ficha</button></footer>`;
 bindDetail(a,r);
}function setDeep(obj,path,value){const [root,key]=path.split('.');obj[root][key]=value;}
function scheduleSave(a,r){clearTimeout(saveTimer);saveTimer=setTimeout(()=>commit(a,r),350);}
function commit(a,r){r.updatedAt=new Date().toISOString();saveStore();const x=$('lastUpdated');if(x)x.textContent=new Date(r.updatedAt).toLocaleString('es-ES');renderList();}
function bindDetail(a,r){
 $('activityStatus').addEventListener('change',e=>{r.status=e.target.value;scheduleSave(a,r);});
 document.querySelectorAll('[data-link]').forEach(i=>i.addEventListener('input',e=>{r.links[e.target.dataset.link]=e.target.value;const open=document.querySelector(`[data-open="${e.target.dataset.link}"]`);open.href=e.target.value||'#';scheduleSave(a,r);}));
 document.querySelectorAll('[data-field]').forEach(t=>t.addEventListener('input',e=>{setDeep(r,e.target.dataset.field,e.target.value);scheduleSave(a,r);}));
 document.querySelectorAll('[data-question-text]').forEach(t=>t.addEventListener('input',e=>{r.official.questions[+e.target.dataset.questionText].text=e.target.value;scheduleSave(a,r);}));
 document.querySelectorAll('[data-question-answer]').forEach(t=>t.addEventListener('input',e=>{r.official.questions[+e.target.dataset.questionAnswer].response=e.target.value;scheduleSave(a,r);}));
 document.querySelectorAll('[data-remove-question]').forEach(b=>b.addEventListener('click',()=>{r.official.questions.splice(+b.dataset.removeQuestion,1);commit(a,r);renderDetail(a);}));
 $('addQuestion').addEventListener('click',()=>{r.official.questions.push({text:'',response:''});commit(a,r);renderDetail(a);setTimeout(()=>{const q=document.querySelectorAll('[data-question-text]');q[q.length-1]?.focus();},0);});
 $('saveActivity').addEventListener('click',()=>commit(a,r));
}
function openActivity(seq){selected=seq;history.replaceState(null,'','?activity='+encodeURIComponent(seq));renderList();const a=activities.find(x=>x.sequence===seq);if(a)renderDetail(a);}
function exportJson(){const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='HOTI0108_actividades_local_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
async function init(){const res=await fetch('./data/course-state.json',{cache:'no-store'});course=await res.json();activities=flattenCourse(course);renderList();renderPending();$('exportActivities').addEventListener('click',exportJson);const requested=new URLSearchParams(location.search).get('activity');if(requested&&activities.some(a=>a.sequence===requested))openActivity(requested);else if(activities.length)openActivity(activities[0].sequence);}
init().catch(e=>{$('activityDetail').innerHTML='<p class="notice">No se pudo cargar el estado del curso.</p>';console.error(e);});