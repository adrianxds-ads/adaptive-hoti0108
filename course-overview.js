'use strict';
const courseEl=id=>document.getElementById(id);
function courseDateLabel(value){if(!value)return '';return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit'}).format(new Date(value+'T12:00:00'));}
function courseStatusLabel(status){return status==='active'?'EN CURSO':status==='completed'?'TERMINADA':'PRÓXIMA';}
function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
function manualReady(manuals,unitId){
 const units=(manuals?.modules||[manuals?.module].filter(Boolean)).flatMap(m=>m?.units||[]);
 const u=units.find(x=>x.id===unitId);return Boolean(u?.manual&&u?.pageCount&&u?.pageImages&&u?.readerType!=='pending');
}
function renderActivity(a){
 const row=el('a',null,'course-activity');row.href='activity.html?activity='+encodeURIComponent(a.sequence);
 row.append(el('span',a.sequence,'activity-sequence'));
 const body=el('div');body.append(el('strong',a.officialTitle||('Actividad '+a.ordinal)),el('small',(a.type||'Actividad evaluable')+' · Abrir ficha →'));
 row.append(body);return row;
}
function renderDidacticUnit(ud){
 const d=document.createElement('details');d.className='course-ud '+(ud.status||'upcoming');
 if(ud.status==='active')d.open=true;
 const s=document.createElement('summary');
 const seq=el('span',ud.sequence,'ud-sequence'),body=el('span',null,'ud-summary-body'),meta=el('span',null,'ud-meta');
 const known=Array.isArray(ud.activities);
 body.append(el('strong',ud.id+' · '+ud.name),el('small',known?(ud.activities.length+' actividades · confirmadas en Campus'):'Actividades · pendiente de validación directa'));
 meta.append(el('b',courseDateLabel(ud.due)),el('small',ud.finalTest?'CIERRE + TEST FINAL':'CIERRE'));
 s.append(seq,body,meta);d.append(s);
 const inner=el('div',null,'ud-inner');
 if(known)ud.activities.forEach(a=>inner.append(renderActivity(a)));
 else inner.append(el('p','Todavía no se publica un número de actividades: falta validar el listado real de esta UD en Campus.','activity-pending'));
 if(ud.finalTest){const t=el('div',null,'course-final-test');t.append(el('span','TEST','activity-sequence'),el('strong','Test final de la unidad formativa · '+courseDateLabel(ud.due)));inner.append(t);}
 d.append(inner);return d;
}
function renderUnit(unit,manuals){
 const section=el('section',null,'course-uf '+unit.status);
 const head=el('div',null,'uf-head'),left=el('div',null,'uf-title');
 const badge=el('span',unit.sequence+' · '+unit.id,'uf-sequence'),status=el('span',courseStatusLabel(unit.status),'uf-status');
 left.append(badge,el('h2',unit.name));
 left.append(el('p',unit.officialHours+' h oficiales · '+unit.scheduledHours+' h programadas · '+courseDateLabel(unit.start)+' → '+courseDateLabel(unit.end)));
 const validation=unit.activityCountStatus==='confirmed_campus'?unit.activityCount+' actividades · Campus confirmado':'Actividades · pendiente de validación directa en Campus';
 left.append(el('p',validation,'uf-validation'));
 const tools=el('div',null,'uf-tools');
 const ready=manualReady(manuals,unit.id),a=document.createElement('a');a.href='manuals.html?unit='+encodeURIComponent(unit.id);a.textContent=ready?'Abrir manual →':'Manual pendiente · documentación →';a.className='uf-manual-link '+(ready?'ready':'pending');tools.append(a,status);
 head.append(left,tools);section.append(head);
 if(Array.isArray(unit.introduction)&&unit.introduction.length){const intro=el('section',null,'uf-introduction');intro.append(el('span','INTRODUCCIÓN · NO ES UNA UD','intro-label'));unit.introduction.forEach(x=>intro.append(el('div',x,'intro-item')));section.append(intro);}
 const list=el('div',null,'ud-list');(unit.didacticUnits||[]).forEach(ud=>list.append(renderDidacticUnit(ud)));section.append(list);
 return section;
}
function renderModuleExam(mod){
 const host=courseEl('moduleExamCard');if(!host)return;host.replaceChildren();
 const confirmed=el('div',null,'exam-confirmed');
 confirmed.append(el('span','PRUEBA DEL MÓDULO · CONFIRMADA EN CAMPUS'),el('strong',courseDateLabel(mod.moduleExam?.date)+' · '+(mod.moduleExam?.time||'hora pendiente')),el('small','MF0268_3 · '+(mod.moduleExam?.timezone||'Europe/Madrid')));
 const provisional=el('div',null,'exam-provisional');
 provisional.append(el('span','2.ª CONVOCATORIA · PROVISIONAL'),el('strong',courseDateLabel(mod.secondCall?.date)),el('small','Dato del esquema horario secundario · pendiente de confirmación directa'));
 host.append(confirmed,provisional);
}
async function loadCourseOverview(){
 try{
  const [courseRes,manualRes]=await Promise.all([fetch('./data/course-state.json',{cache:'no-store'}),fetch('./data/manuals-index.json',{cache:'no-store'}).catch(()=>null)]);
  if(!courseRes.ok)return;
  const data=await courseRes.json(),manuals=manualRes&&manualRes.ok?await manualRes.json():null;
  const mod=(data.modules||[]).find(x=>x.id===data.activeModule);if(!mod)return;
  const now=new Date(),ymd=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const units=mod.units||[],active=units.find(u=>u.status==='active')||units.find(u=>ymd>=u.start&&ymd<=u.end)||units[0];
  const activeUd=active?.didacticUnits?.find(x=>x.status==='active')||active?.didacticUnits?.find(x=>x.due>=ymd)||active?.didacticUnits?.[0];
  if(courseEl('activeModuleTitle'))courseEl('activeModuleTitle').textContent=mod.id+' · '+mod.name;
  if(courseEl('activeModuleMeta'))courseEl('activeModuleMeta').textContent=mod.id+' · Módulo Formativo '+mod.officialOrdinal+' oficial · '+mod.itineraryLabel+' en el itinerario operativo · '+mod.officialHours+' h oficiales / '+mod.scheduledHours+' h programadas';
  if(courseEl('activeUnitTitle')&&active)courseEl('activeUnitTitle').textContent=active.sequence+' · '+active.id+' · '+active.name;
  if(courseEl('courseBreadcrumb'))courseEl('courseBreadcrumb').textContent=['HOTI0108',mod.itineraryLabel,active?active.sequence+' '+active.id:null,activeUd?activeUd.sequence+' '+activeUd.id:null].filter(Boolean).join(' → ');
  const map=courseEl('courseMap');if(map){map.replaceChildren();units.forEach(u=>map.append(renderUnit(u,manuals)));}
  renderModuleExam(mod);
  const rows=units.flatMap(u=>(u.didacticUnits||[]).map(x=>Object.assign({unit:u.id,unitSequence:u.sequence},x))).filter(x=>x.due>=ymd).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);
  const host=courseEl('courseDeadlines');
  if(host){host.replaceChildren();rows.forEach(x=>{const card=el('div',null,'deadline-row');card.append(el('strong',courseDateLabel(x.due)),el('span',x.sequence+' · '+x.unit+' · '+x.id+' · '+x.name+(x.finalTest?' · TEST FINAL':'')+(x.dueTimeDisplay?' · Campus muestra '+x.dueTimeDisplay:'')));host.append(card);});if(!rows.length)host.append(el('p','Sin cierres próximos registrados.'));host.append(el('p','Las marcas 00:00 se conservan como dato visual de Campus; no se reinterpretan automáticamente como 23:59.','deadline-note'));}
 }catch(e){console.warn('course-state',e);}
}
loadCourseOverview();

