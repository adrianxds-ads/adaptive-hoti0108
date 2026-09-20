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
 const row=el('div',null,'course-activity');
 row.append(el('span',a.sequence,'activity-sequence'));
 const body=el('div');body.append(el('strong','Actividad '+a.ordinal+' · '+a.name),el('small',a.type));
 row.append(body);return row;
}
function renderDidacticUnit(ud,unitStatus){
 const d=document.createElement('details');d.className='course-ud '+(ud.status||'upcoming');
 if(ud.status==='active')d.open=true;
 const s=document.createElement('summary');
 const seq=el('span',ud.sequence,'ud-sequence'),body=el('span',null,'ud-summary-body'),meta=el('span',null,'ud-meta');
 body.append(el('strong',ud.id+' · '+ud.name),el('small',(ud.activities?.length||0)+' actividades'));
 meta.append(el('b',courseDateLabel(ud.due)),el('small',ud.finalTest?'CIERRE + TEST FINAL':'CIERRE'));
 s.append(seq,body,meta);d.append(s);
 const inner=el('div',null,'ud-inner');
 (ud.activities||[]).forEach(a=>inner.append(renderActivity(a)));
 if(ud.finalTest){const t=el('div',null,'course-final-test');t.append(el('span','TEST','activity-sequence'),el('strong','Test final de la unidad formativa'));inner.append(t);}
 d.append(inner);return d;
}
function renderUnit(unit,manuals){
 const section=el('section',null,'course-uf '+unit.status);
 const head=el('div',null,'uf-head');
 const left=el('div',null,'uf-title');
 const badge=el('span',unit.sequence+' · '+unit.id,'uf-sequence');
 const status=el('span',courseStatusLabel(unit.status),'uf-status');
 left.append(badge,el('h2',unit.name),el('p',unit.hours+' h · '+courseDateLabel(unit.start)+' → '+courseDateLabel(unit.end)));
 const tools=el('div',null,'uf-tools');
 const ready=manualReady(manuals,unit.id),a=document.createElement('a');a.href='manuals.html?unit='+encodeURIComponent(unit.id);a.textContent=ready?'Abrir manual →':'Manual pendiente · documentación →';a.className='uf-manual-link '+(ready?'ready':'pending');tools.append(a,status);
 head.append(left,tools);section.append(head);
 const list=el('div',null,'ud-list');(unit.didacticUnits||[]).forEach(ud=>list.append(renderDidacticUnit(ud,unit.status)));section.append(list);
 return section;
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
  if(courseEl('activeUnitTitle')&&active)courseEl('activeUnitTitle').textContent=active.sequence+' · '+active.id+' · '+active.name;
  if(courseEl('courseBreadcrumb'))courseEl('courseBreadcrumb').textContent=['HOTI0108','M'+String(mod.ordinal).padStart(2,'0'),active?active.sequence+' '+active.id:null,activeUd?activeUd.sequence+' '+activeUd.id:null].filter(Boolean).join(' → ');
  const map=courseEl('courseMap');if(map){map.replaceChildren();units.forEach(u=>map.append(renderUnit(u,manuals)));}
  const rows=units.flatMap(u=>(u.didacticUnits||[]).map(x=>Object.assign({unit:u.id,unitSequence:u.sequence},x))).filter(x=>x.due>=ymd).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);
  const host=courseEl('courseDeadlines');if(host){host.replaceChildren();rows.forEach(x=>{const card=el('div',null,'deadline-row');card.append(el('strong',courseDateLabel(x.due)),el('span',x.sequence+' · '+x.unit+' · '+x.id+' · '+x.name+(x.finalTest?' · TEST FINAL':'')));host.append(card);});if(!rows.length)host.append(el('p','Sin cierres próximos registrados.'));}
 }catch(e){console.warn('course-state',e);}
}
loadCourseOverview();
