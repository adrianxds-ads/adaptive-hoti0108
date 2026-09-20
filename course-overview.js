'use strict';
async function loadCourseOverview(){
 try{
  const r=await fetch('./data/course-state.json',{cache:'no-store'});
  if(!r.ok)return;
  const data=await r.json();
  const mod=(data.modules||[]).find(x=>x.id===data.activeModule);
  if(!mod)return;
  const title=document.getElementById('activeModuleTitle');
  const unitTitle=document.getElementById('activeUnitTitle');
  const host=document.getElementById('courseDeadlines');
  if(title)title.textContent=mod.id+' · '+mod.name;
  const now=new Date();
  const ymd=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const units=mod.units||[];
  const active=units.find(u=>u.status==='active')||units.find(u=>ymd>=u.start&&ymd<=u.end)||units[0];
  if(unitTitle&&active)unitTitle.textContent=active.id+' · '+active.name;
  const rows=units.flatMap(u=>(u.didacticUnits||[]).map(x=>Object.assign({unit:u.id},x))).filter(x=>x.due>=ymd).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,3);
  if(host){
   host.replaceChildren();
   rows.forEach(x=>{
    const card=document.createElement('div');
    const date=document.createElement('strong');
    const body=document.createElement('span');
    date.textContent=new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit'}).format(new Date(x.due+'T12:00:00'));
    body.textContent=x.unit+' · '+x.id+' · '+x.name+(x.finalTest?' · TEST FINAL':'');
    card.append(date,body);host.append(card);
   });
   if(!rows.length){const p=document.createElement('p');p.textContent='Sin cierres próximos registrados.';host.append(p);}
  }
 }catch(e){console.warn('course-state',e);}
}
loadCourseOverview();
