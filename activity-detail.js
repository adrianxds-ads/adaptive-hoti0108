'use strict';
const STORE_KEY='adaptive_hoti0108_activity_hub_v1';
const $=id=>document.getElementById(id);
const statusLabels={not_started:'No iniciada',source_captured:'Fuente capturada',in_progress:'En trabajo',draft_complete:'Borrador completo',docs_master:'Docs maestro',pdf_final:'PDF final',delivered:'Entregada'};
function loadStore(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{"version":2,"records":{}}')}catch{return {version:2,records:{}}}}
function saveStore(store){localStorage.setItem(STORE_KEY,JSON.stringify(store));}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(v){return v?new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T12:00:00')):'—';}
function flattenCourse(data){
 const mod=data.modules.find(m=>m.id===data.activeModule),out=[];
 for(const uf of mod.units||[])for(const ud of uf.didacticUnits||[])for(const a of ud.activities||[])out.push(Object.assign({},a,{moduleId:mod.id,moduleName:mod.name,ufId:uf.id,ufName:uf.name,udId:ud.id,udName:ud.name,due:ud.due,dueTimeDisplay:ud.dueTimeDisplay}));
 return out;
}
function blankRecord(){return {status:'not_started',links:{campus:'',chat:'',docs:'',pdf:''},work:{introduction:'',answers:[],blog:'',notes:''},updatedAt:null};}
function getRecord(store,seq){
 let r=store.records[seq];if(!r)r=store.records[seq]=blankRecord();
 r.links=Object.assign({campus:'',chat:'',docs:'',pdf:''},r.links||{});r.work=r.work||{};
 r.work.introduction=r.work.introduction||'';r.work.blog=r.work.blog||'';r.work.notes=r.work.notes||'';
 if(!Array.isArray(r.work.answers)){const old=r.official&&Array.isArray(r.official.questions)?r.official.questions.map(q=>q.response||''):[];r.work.answers=old;}
 return r;
}function sourceBlock(label,text){
 return '<div class="source-block"><span>'+esc(label)+'</span><div class="source-text">'+esc(text||'—')+'</div></div>';
}
function urlField(label,name,value){
 return '<label class="link-field"><span>'+esc(label)+'</span><div><input type="url" data-link="'+name+'" value="'+esc(value||'')+'" placeholder="Pegar enlace"><a data-open="'+name+'" href="'+esc(value||'#')+'" target="_blank" rel="noopener">Abrir ↗</a></div></label>';
}
function chatgptBridgeHtml(a,record){
 const linked=Boolean(record.links.chat&&window.JOTI_CHATGPT&&window.JOTI_CHATGPT.isChatUrl(record.links.chat));
 const status=linked?'Chat enlazado ✓':'Pendiente de enlazar';
 const actions=linked?'<button id="activityChatAction" type="button">Abrir chat de actividad ↗</button><button id="changeActivityChat" type="button" class="secondary-chat-action">Cambiar enlace</button>':'<button id="activityChatAction" type="button">Enlazar chat de actividad</button>';
 return '<div class="chatgpt-bridge-row"><div><span>PROYECTO CHATGPT</span><strong>Certificat HOTI0108</strong><small>Enlace fijo del proyecto JOTI.</small></div><a data-chatgpt-project class="chatgpt-bridge-main" href="#">Abrir proyecto ↗</a></div><div class="chatgpt-bridge-row activity-chat-row"><div><span>CHAT DE ESTA ACTIVIDAD</span><strong>'+esc(a.sequence)+' · '+status+'</strong><small>'+(linked?'Este enlace queda guardado en la ficha.':'Pega una vez el enlace del chat compartido y JOTI lo recordará.')+'</small></div><div class="chatgpt-bridge-actions">'+actions+'</div></div><button id="workInChatGPT" class="chatgpt-work-button" type="button">Copiar actividad JSON + abrir ChatGPT</button>';
}
function workField(label,name,value,cls){
 return '<label class="activity-field '+(cls||'')+'"><span class="field-label-row"><b>'+esc(label)+'</b><button type="button" class="copy-mini" data-copy-field="'+name+'">Copiar</button></span><textarea data-field="'+name+'" rows="6">'+esc(value||'')+'</textarea></label>';
}
function questionHtml(q,i,response){
 const label=q.label||('Pregunta '+(i+1)+'.');
 return '<article class="question-pair" data-q="'+i+'"><div class="question-head"><strong>'+esc(label)+'</strong></div><div class="source-question">'+esc(q.text||'')+'</div><label class="student-answer"><span class="field-label-row"><b>Respuesta del alumno</b><button type="button" class="copy-mini" data-copy-answer="'+i+'">Copiar</button></span><textarea data-question-answer="'+i+'" rows="8">'+esc(response||'')+'</textarea></label></article>';
}
function manualRefsHtml(src){
 const refs=src.manualRefs||[];if(!refs.length)return '';
 return '<section class="manual-ref-panel"><div class="panel-title"><div><span>MANUAL UF0049</span><h2>Referencias para esta actividad</h2></div><a href="./manuals.html" target="_blank" rel="noopener">Abrir manual ↗</a></div><div class="manual-ref-list">'+refs.map(r=>'<div><strong>'+esc(r.section)+'</strong><span>'+esc(r.title)+'</span></div>').join('')+'</div></section>';
}function campusAuditHtml(src){
 const audit=src.sourceAudit||{},checks=audit.checks||[];
 if(!audit.campusReviewRequired&&audit.status!=='captured_without_enunciado_heading')return '';
 const title=audit.campusReviewRequired?'REVISAR CAMPUS ANTES DE RESOLVER':'NOTA DE CAPTURA';
 const rows=checks.map(x=>'<li><strong>'+esc(x.confidence==='possible'?'Comprobar':'Recuperar')+'</strong><span>'+esc(x.instruction||x.reason||'')+'</span></li>').join('');
 const note=audit.note?'<p>'+esc(audit.note)+'</p>':'';
 const rule=audit.transcriptionRule?'<small>'+esc(audit.transcriptionRule)+'</small>':'';
 return '<section class="campus-audit-panel '+(audit.campusReviewRequired?'needs-review':'capture-note')+'"><div class="campus-audit-head"><span>'+title+'</span><strong>'+(audit.campusReviewRequired?'Hay contenido fuera de la captura textual':'La ficha no tiene un enunciado separado')+'</strong></div>'+note+(rows?'<ul>'+rows+'</ul>':'')+rule+'</section>';
}
function recoveredMaterialsHtml(src){
 const mats=src.recoveredMaterials||[],gap=src.recoveredGap||null;
 if(!mats.length&&!gap)return '';
 const gapHtml=gap?'<div class="recovered-gap"><strong>Contenido recuperado del hueco</strong><p>'+esc(gap.location||'')+'</p><ul>'+((gap.items||[]).map(x=>'<li>'+esc(x)+'</li>').join(''))+'</ul><small>'+esc(gap.source||'')+'</small></div>':'';
 const cards=mats.map(m=>{
   const href=m.localPath?('./'+m.localPath):m.url;
   const tag=m.safeForOfficialTranscription?'Fuente verificable del contenido omitido':(m.confidence==='supporting_only'?'Material de apoyo':'Coincidencia / fuente recuperada');
   const link=href?'<a href="'+esc(href)+'" target="_blank" rel="noopener">Abrir ↗</a>':'';
   return '<div class="recovered-material-card"><div><strong>'+esc(m.label||m.id||'Material')+'</strong><small>'+esc(tag)+' · '+esc(m.confidence||'')+'</small></div>'+link+'</div>';
 }).join('');
 return '<section class="recovered-materials-panel"><div class="panel-title"><div><span>MATERIAL RECUPERADO / APOYO</span><h2>Recursos vinculados a esta actividad</h2></div><small>No modifica rawLines.</small></div>'+gapHtml+'<div class="recovered-material-list">'+cards+'</div></section>';
}
function officialText(a,src){
 const qs=(src.questions||[]).map((q,i)=>(q.label||('Pregunta '+(i+1)+'.'))+' '+(q.text||'')).join('\n\n');
 const blocks=[
  'HOTI0108 · '+a.sequence,
  'TÍTULO OFICIAL: '+(src.officialTitle||a.officialTitle||''),
  'TAREA: '+(src.taskTitle||''),
  'MÓDULO: '+(src.module||a.moduleId),
  'UNIDAD FORMATIVA: '+(src.uf||a.ufId),
  'UNIDAD DIDÁCTICA: '+(src.ud||a.udName),
  'FECHA LÍMITE EN FICHA CAMPUS: '+(src.sourceDueDate||'—'),
  'CIERRE OPERATIVO: '+fmtDate(a.due),
  'ENUNCIADO\n'+(src.statement&&src.statement.text?src.statement.text:'—'),
  src.questionsIntro?'INDICACIONES PREVIAS\n'+src.questionsIntro:'',
  'PREGUNTAS / ACTIVIDADES A REALIZAR\n'+(qs||'—'),
  src.guidelines&&src.guidelines.text?'INFORMACIÓN ADICIONAL / ORIENTACIONES\n'+src.guidelines.text:'',
  'OBJETIVOS DE LA ACTIVIDAD\n'+(src.objectives&&src.objectives.text?src.objectives.text:'—'),
  src.criteria&&src.criteria.text?'CRITERIOS DE EVALUACIÓN\n'+src.criteria.text:''
 ];
 return blocks.filter(Boolean).join('\n\n');
}
function officialJson(a,src){
 return JSON.stringify({certificate:'HOTI0108',sequence:a.sequence,officialTitle:src.officialTitle||a.officialTitle||'',taskTitle:src.taskTitle||'',module:src.module||a.moduleId,uf:src.uf||a.ufId,ud:src.ud||a.udName,sourcePlatform:src.sourcePlatform||'Formacampus',sourceDueDate:src.sourceDueDate||null,operationalDueDate:a.due||null,statement:src.statement&&src.statement.text?src.statement.text:'',questionsIntro:src.questionsIntro||'',questions:(src.questions||[]).map(q=>({label:q.label||'',text:q.text||''})),guidelines:src.guidelines&&src.guidelines.text?src.guidelines.text:'',objectives:src.objectives&&src.objectives.text?src.objectives.text:'',criteria:src.criteria&&src.criteria.text?src.criteria.text:'',manualRefs:src.manualRefs||[],requiresExternalMaterial:Boolean(src.requiresExternalMaterial),externalMaterialTypes:src.externalMaterialTypes||[],sourceAudit:src.sourceAudit||null,recoveredGap:src.recoveredGap||null,recoveredMaterials:src.recoveredMaterials||[]},null,2);
}function developmentText(src,record){
 return (src.questions||[]).map((q,i)=>((q.label||('Pregunta '+(i+1)+'.'))+' '+(q.text||'')+'\n\n'+(record.work.answers[i]||'')).trim()).join('\n\n');
}
function resolutionText(src,record){
 return ('INTRODUCCIÓN\n\n'+(record.work.introduction||'')+'\n\nDESARROLLO DE LA ACTIVIDAD\n\n'+developmentText(src,record)+'\n\nEL BLOG DEL INFORMADOR\n\n'+(record.work.blog||'')).trim();
}
async function copyText(value,button){
 const text=String(value||'');
 try{await navigator.clipboard.writeText(text);}
 catch{const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();}
 if(button){const old=button.textContent;button.textContent='Copiado ✓';button.classList.add('copied');setTimeout(()=>{button.textContent=old;button.classList.remove('copied');},1100);}
}
function setDeep(obj,path,value){const parts=path.split('.');obj[parts[0]][parts[1]]=value;}
function render(a,src,record){
 const host=$('activityDetail'),questions=(src.questions||[]).map((q,i)=>questionHtml(q,i,record.work.answers[i]||'')).join('');
 const ext=src.requiresExternalMaterial?'<span class="external-flag">Requiere material adicional · '+esc((src.externalMaterialTypes||[]).join(', '))+'</span>':'';
 let html='<header class="activity-sheet-head"><div><span class="sequence-chip">'+esc(a.sequence)+'</span><p>Ficha independiente · Maqueta 11</p><h1>'+esc(src.taskTitle||a.officialTitle)+'</h1><p>'+esc(a.officialTitle)+'</p><p>'+esc(a.moduleId)+' → '+esc(a.ufId)+' → '+esc(a.udId)+'</p></div>';
 html+='<div class="sheet-meta"><strong>'+fmtDate(a.due)+'</strong><small>Cierre operativo · Campus '+esc(a.dueTimeDisplay||'hora no registrada')+'</small><small>Ficha Campus: '+esc(src.sourceDueDate||'—')+'</small><select id="activityStatus">'+Object.entries(statusLabels).map(([v,l])=>'<option value="'+v+'" '+(record.status===v?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select></div></header>';
 html+='<section class="identity-grid"><div><span>MÓDULO</span><strong>'+esc(a.moduleId)+'</strong><small>'+esc(a.moduleName)+'</small></div><div><span>UF</span><strong>'+esc(a.ufId)+'</strong><small>'+esc(a.ufName)+'</small></div><div><span>UD</span><strong>'+esc(a.udId)+'</strong><small>'+esc(a.udName)+'</small></div><div><span>ACTIVIDAD OFICIAL</span><strong>'+esc(a.officialTitle)+'</strong><small>'+esc(a.sequence)+'</small></div></section>';
 html+='<section class="link-panel"><h2>Accesos</h2>'+urlField('Campus','campus',record.links.campus)+chatgptBridgeHtml(a,record)+urlField('Google Docs maestro','docs',record.links.docs)+urlField('PDF final','pdf',record.links.pdf)+'</section>';
 html+=campusAuditHtml(src);
 html+=recoveredMaterialsHtml(src);
 html+='<section class="official-panel"><div class="panel-title"><div><span>FUENTE OFICIAL · SOLO LECTURA</span><h2>Contenido capturado de Formacampus</h2></div><small>Fuente cargada ✓</small></div><div class="source-copy-actions"><button id="copyOfficialActivity" type="button">Copiar actividad</button><button id="copyOfficialJson" type="button">Copiar actividad JSON</button></div>'+ext;
 html+=sourceBlock('Enunciado',src.statement&&src.statement.text);
 if(src.questionsIntro)html+=sourceBlock('Indicaciones previas a las preguntas',src.questionsIntro);
 html+=sourceBlock('Orientaciones / información adicional',src.guidelines&&src.guidelines.text);
 html+=sourceBlock('Objetivos',src.objectives&&src.objectives.text);
 html+=sourceBlock('Criterios de evaluación',src.criteria&&src.criteria.text)+'</section>';
 html+=manualRefsHtml(src);
 html+='<section class="student-panel"><div class="panel-title"><div><span>TRABAJO DEL ALUMNO</span><h2>Maqueta 11</h2></div><small>ChatGPT redacta; JOTI organiza.</small></div>';
 html+=workField('1. Introducción','work.introduction',record.work.introduction,'work-block');
 html+='<div class="questions-head"><h3>2. Desarrollo de la actividad</h3><button id="copyDevelopment" type="button">Copiar desarrollo</button></div><p class="development-note">Las preguntas proceden de Campus y no son editables. Solo se edita tu respuesta.</p><div id="questionPairs">'+questions+'</div>';
 html+=workField('3. El Blog del Informador','work.blog',record.work.blog,'work-block');
 html+=workField('Notas rápidas','work.notes',record.work.notes,'notes-block')+'</section>';
 html+='<footer class="activity-control"><div><span>Última actualización</span><strong id="lastUpdated">'+(record.updatedAt?new Date(record.updatedAt).toLocaleString('es-ES'):'Sin guardar')+'</strong></div><div class="control-actions"><button id="copyFullActivity" type="button" class="primary-copy">Copiar resolución completa</button><button id="saveActivity" type="button">Guardar ficha</button></div></footer>';
 host.innerHTML=html;
 if(window.JOTI_CHATGPT)window.JOTI_CHATGPT.bindProjectLinks(host);
}function bind(a,src,record,store){
 let timer=null;
 const commit=()=>{record.updatedAt=new Date().toISOString();saveStore(store);const x=$('lastUpdated');if(x)x.textContent=new Date(record.updatedAt).toLocaleString('es-ES');};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(commit,350);};
 $('activityStatus').addEventListener('change',e=>{record.status=e.target.value;schedule();});
 document.querySelectorAll('[data-link]').forEach(i=>i.addEventListener('input',e=>{record.links[e.target.dataset.link]=e.target.value;const open=document.querySelector('[data-open="'+e.target.dataset.link+'"]');if(open)open.href=e.target.value||'#';schedule();}));
 document.querySelectorAll('[data-field]').forEach(t=>t.addEventListener('input',e=>{setDeep(record,e.target.dataset.field,e.target.value);schedule();}));
 document.querySelectorAll('[data-question-answer]').forEach(t=>t.addEventListener('input',e=>{record.work.answers[Number(e.target.dataset.questionAnswer)]=e.target.value;schedule();}));
 document.querySelectorAll('[data-copy-field]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.copyField.split('.')[1];copyText(record.work[key]||'',b);}));
 document.querySelectorAll('[data-copy-answer]').forEach(b=>b.addEventListener('click',()=>copyText(record.work.answers[Number(b.dataset.copyAnswer)]||'',b)));
 $('copyOfficialActivity').addEventListener('click',e=>copyText(officialText(a,src),e.currentTarget));
 $('copyOfficialJson').addEventListener('click',e=>copyText(officialJson(a,src),e.currentTarget));
 const askForActivityChat=()=>{
  const value=window.prompt('Pega el enlace compartido del chat de esta actividad. Se guardará en esta ficha.',record.links.chat||'');
  if(value===null)return false;
  const clean=value.trim();
  if(!window.JOTI_CHATGPT||!window.JOTI_CHATGPT.isChatUrl(clean)){window.alert('Pega un enlace válido de ChatGPT (https://chatgpt.com/...).');return false;}
  record.links.chat=clean;commit();render(a,src,record);bind(a,src,record,store);return true;
 };
 const chatAction=$('activityChatAction');
 if(chatAction)chatAction.addEventListener('click',()=>{if(record.links.chat&&window.JOTI_CHATGPT.isChatUrl(record.links.chat))window.open(record.links.chat,'_blank','noopener');else askForActivityChat();});
 const changeChat=$('changeActivityChat');
 if(changeChat)changeChat.addEventListener('click',askForActivityChat);
 const workInChatGPT=$('workInChatGPT');
 if(workInChatGPT)workInChatGPT.addEventListener('click',e=>{const target=record.links.chat&&window.JOTI_CHATGPT.isChatUrl(record.links.chat)?record.links.chat:window.JOTI_CHATGPT.projectUrl;window.open(target,'_blank','noopener');copyText(officialJson(a,src),e.currentTarget);});
 $('copyDevelopment').addEventListener('click',e=>copyText(developmentText(src,record),e.currentTarget));
 $('copyFullActivity').addEventListener('click',e=>copyText(resolutionText(src,record),e.currentTarget));
 $('saveActivity').addEventListener('click',commit);
}
async function init(){
 const seq=new URLSearchParams(location.search).get('activity');
 if(!seq){location.replace('./activities.html');return;}
 const [courseRes,sourceRes]=await Promise.all([fetch('./data/course-state.json',{cache:'no-store'}),fetch('./data/activities-uf0049-source.json',{cache:'no-store'})]);
 const course=await courseRes.json(),payload=await sourceRes.json(),activities=flattenCourse(course),a=activities.find(x=>x.sequence===seq),src=(payload.activities||[]).find(x=>x.sequence===seq);
 if(!a||!src){$('activityDetail').innerHTML='<p class="notice">No se encontró la actividad. <a href="./activities.html">Volver a actividades.</a></p>';return;}
 const store=loadStore(),record=getRecord(store,seq);render(a,src,record);bind(a,src,record,store);
}
init().catch(e=>{console.error(e);$('activityDetail').innerHTML='<p class="notice">No se pudo cargar la actividad.</p>';});