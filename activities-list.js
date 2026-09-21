'use strict';
const STORE_KEY='adaptive_hoti0108_activity_hub_v1';
const $=id=>document.getElementById(id);
const statusLabels={not_started:'No iniciada',source_captured:'Fuente capturada',in_progress:'En trabajo',draft_complete:'Borrador completo',docs_master:'Docs maestro',pdf_final:'PDF final',delivered:'Entregada'};
function loadStore(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{"version":2,"records":{}}')}catch{return {version:2,records:{}}}}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(v){return v?new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T12:00:00')):'—';}
function flattenCourse(data){
 const mod=data.modules.find(m=>m.id===data.activeModule),out=[];
 for(const uf of mod.units||[])for(const ud of uf.didacticUnits||[])for(const a of ud.activities||[])out.push(Object.assign({},a,{moduleId:mod.id,moduleName:mod.name,ufId:uf.id,ufName:uf.name,udId:ud.id,udName:ud.name,due:ud.due,dueTimeDisplay:ud.dueTimeDisplay}));
 return out;
}
function renderList(activities,sources,store){
 const host=$('activityList');host.replaceChildren();const groups=new Map();
 for(const a of activities){const k=a.ufId+' · '+a.udId;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a);}
 for(const [key,rows] of groups){
  const group=document.createElement('section');group.className='activity-group';group.innerHTML='<h2>'+esc(key)+'</h2>';
  for(const a of rows){   const src=sources.get(a.sequence),rec=store.records[a.sequence]||{status:'not_started'};
   const b=document.createElement('button');b.type='button';b.className='activity-list-item';
   const review=src&&src.sourceAudit&&src.sourceAudit.campusReviewRequired?'<small class="campus-review-badge">⚠ Revisar Campus</small>':'';
   const chat=rec.links&&window.JOTI_CHATGPT&&window.JOTI_CHATGPT.isChatUrl(rec.links.chat)?'<small class="chat-linked-badge">✓ Chat enlazado</small>':'';
   b.innerHTML='<span>'+esc(a.sequence)+'</span><strong>'+esc(src&&src.taskTitle?src.taskTitle:a.officialTitle)+'</strong><small>'+esc(a.officialTitle)+'</small><small>'+esc(statusLabels[rec.status]||rec.status)+' · '+fmtDate(a.due)+'</small>'+review+chat;
   b.addEventListener('click',()=>{location.href='./activity.html?activity='+encodeURIComponent(a.sequence)+'&v=320';});
   group.append(b);
  }
  host.append(group);
 }
}
function renderPending(course){
 const mod=course.modules.find(m=>m.id===course.activeModule),host=$('pendingUnits');host.replaceChildren();
 for(const uf of mod.units||[]){if(uf.activityCountStatus!=='pending_direct_campus_validation')continue;
  const box=document.createElement('div');box.className='pending-unit-card';
  box.innerHTML='<strong>'+esc(uf.sequence)+' · '+esc(uf.id)+'</strong><span>Actividades pendientes de validación directa en Campus.</span><small>No se crean fichas ni se inventa un total hasta ver el listado real.</small>';
  host.append(box);
 }
}
function exportWork(store){
 const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=u;a.download='HOTI0108_actividades_local_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
async function init(){
 const requested=new URLSearchParams(location.search).get('activity');
 if(requested){location.replace('./activity.html?activity='+encodeURIComponent(requested)+'&v=320');return;}
 const [courseRes,sourceRes]=await Promise.all([fetch('./data/course-state.json',{cache:'no-store'}),fetch('./data/activities-uf0049-source.json',{cache:'no-store'})]);
 const course=await courseRes.json(),payload=await sourceRes.json(),sources=new Map((payload.activities||[]).map(x=>[x.sequence,x])),store=loadStore();
 const activities=flattenCourse(course);renderList(activities,sources,store);renderPending(course);
 $('exportActivities').addEventListener('click',()=>exportWork(store));
}
init().catch(e=>{console.error(e);$('activityList').innerHTML='<p class="notice">No se pudo cargar el centro de actividades.</p>';});