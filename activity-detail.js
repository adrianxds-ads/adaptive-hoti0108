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
function blankRecord(){return {status:'not_started',links:{campus:'',chat:'',docs:'',pdf:''},work:{introduction:'',answers:[],blog:'',notes:''},recommendation:{hiddenPhotoIds:[],userPhoto:null},updatedAt:null};}
function getRecord(store,seq){
 let r=store.records[seq];if(!r)r=store.records[seq]=blankRecord();
 r.links=Object.assign({campus:'',chat:'',docs:'',pdf:''},r.links||{});r.work=r.work||{};
 r.work.introduction=r.work.introduction||'';r.work.blog=r.work.blog||'';r.work.notes=r.work.notes||'';
 r.recommendation=r.recommendation||{};if(!Array.isArray(r.recommendation.hiddenPhotoIds))r.recommendation.hiddenPhotoIds=[];if(!r.recommendation.userPhoto)r.recommendation.userPhoto=null;
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

function recommendationPhotoId(a,p,i){return String((p&&p.id)||a.sequence+'-recommended-'+(i+1));}
function recommendationPanelHtml(a,reco,record){
 const text=String((reco&&reco.recommendedText)||'').trim(),photos=(reco&&Array.isArray(reco.photos)?reco.photos:[]).slice(0,5),hidden=new Set(record.recommendation.hiddenPhotoIds||[]);
 const slots=Array.from({length:5},(_,i)=>{
  const p=photos[i],n=i+1;if(!p)return '<article class="recommended-photo-slot is-empty"><span>FOTO '+n+'</span><strong>Pendiente</strong><small>Hueco reservado para una foto recomendada.</small></article>';
  const id=recommendationPhotoId(a,p,i),isHidden=hidden.has(id);
  if(isHidden)return '<article class="recommended-photo-slot is-hidden"><span>FOTO '+n+'</span><strong>Foto quitada</strong><small>Oculta en esta ficha.</small><button type="button" data-restore-suggested="'+esc(id)+'">Restaurar</button></article>';
  const src=String(p.src||p.url||p.localPath||''),caption=p.caption||p.alt||('Foto recomendada '+n),source=p.sourceUrl||'';
  const image=src?'<img src="'+esc(src)+'" alt="'+esc(p.alt||caption)+'" loading="lazy">':'<div class="photo-missing">Sin archivo</div>';
  const sourceLink=source?'<a href="'+esc(source)+'" target="_blank" rel="noopener">Fuente ?</a>':'';
  return '<article class="recommended-photo-slot has-photo" data-recommended-photo="'+esc(id)+'"><span>FOTO '+n+'</span>'+image+'<strong>'+esc(caption)+'</strong><div class="photo-actions">'+sourceLink+'<button type="button" data-remove-suggested="'+esc(id)+'">Quitar</button></div></article>';
 }).join('');
 const user=record.recommendation.userPhoto;
 const userSlot=user&&user.dataUrl?
  '<article class="recommended-photo-slot user-photo-slot has-photo"><span>FOTO 6 ? TUYA</span><img src="'+esc(user.dataUrl)+'" alt="'+esc(user.name||'Foto a?adida por el alumno')+'"><strong>'+esc(user.name||'Foto a?adida')+'</strong><div class="photo-actions"><button type="button" id="removeUserPhoto">Quitar</button></div></article>':
  '<article class="recommended-photo-slot user-photo-slot is-empty"><span>FOTO 6 ? TUYA</span><strong>A?adir una foto</strong><small>Opcional. JOTI la comprime y la guarda solo en este dispositivo.</small><label class="user-photo-picker">Elegir foto<input id="userPhotoInput" type="file" accept="image/*"></label></article>';
 const restore=(record.recommendation.hiddenPhotoIds||[]).length?'<button type="button" id="restoreSuggestedPhotos" class="restore-photos">Restaurar fotos quitadas</button>':'';
 return '<section class="recommendation-panel"><div class="panel-title"><div><span>PROPUESTA EXTERNA ? REFERENCIA</span><h2>Texto recomendado</h2></div><small>Separado de tu redacci?n.</small></div><div class="recommended-text-box"><div class="field-label-row"><b>Texto recomendado</b><button id="copyRecommendedText" type="button" class="copy-mini" '+(text?'':'disabled')+'>Copiar</button></div><div class="recommended-text-view '+(text?'':'is-empty')+'">'+(text?esc(text):'<span>Pendiente de contenido. Otro chat puede volcar aqu? la propuesta desde el archivo de recomendaciones de JOTI.</span>')+'</div></div><div class="recommended-photos-head"><div><span>FOTOS ADJUNTAS</span><h3>Hasta 5 recomendadas + 1 tuya</h3></div>'+restore+'</div><div class="recommended-photo-grid">'+slots+userSlot+'</div></section>';
}
function prepareUserPhoto(file){
 return new Promise((resolve,reject)=>{
  if(!file||!String(file.type||'').startsWith('image/')){reject(new Error('Selecciona un archivo de imagen.'));return;}
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));
  reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('La imagen no es v?lida.'));img.onload=()=>{
   const max=1100,ratio=Math.min(1,max/Math.max(img.naturalWidth||1,img.naturalHeight||1)),w=Math.max(1,Math.round(img.naturalWidth*ratio)),h=Math.max(1,Math.round(img.naturalHeight*ratio));
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
   let dataUrl=canvas.toDataURL('image/webp',.8);if(!dataUrl.startsWith('data:image/webp'))dataUrl=canvas.toDataURL('image/jpeg',.8);
   resolve({name:file.name||'foto-personal',dataUrl,addedAt:new Date().toISOString()});
  };img.src=reader.result;};
  reader.readAsDataURL(file);
 });
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
   const tag=m.role==='supporting_only'||m.confidence==='supporting_only'?'Material de apoyo':(m.safeForOfficialTranscription?'Fuente verificable del contenido omitido':'Coincidencia / fuente recuperada');
   const link=href?'<a href="'+esc(href)+'" target="_blank" rel="noopener">Abrir ↗</a>':'';
   return '<div class="recovered-material-card"><div><strong>'+esc(m.label||m.id||'Material')+'</strong><small>'+esc(tag)+' · '+esc(m.confidence||'')+'</small></div>'+link+'</div>';
 }).join('');
 return '<section class="recovered-materials-panel"><div class="panel-title"><div><span>MATERIAL RECUPERADO / APOYO</span><h2>Recursos vinculados a esta actividad</h2></div><small>No modifica rawLines.</small></div>'+gapHtml+'<div class="recovered-material-list">'+cards+'</div></section>';
}
function sourceAssetsHtml(src){
 const assets=src.sourceAssets||[]; if(!assets.length)return '';
 const rows=assets.map(x=>{
   const href=x.localPath?('./'+x.localPath):(x.url||x.originalUrl||'');
   const kind=x.kind==='image'?'Imagen':x.kind==='video'?'Vídeo':x.kind==='attachment'?'Adjunto':'Enlace';
   const preview=x.kind==='image'&&x.localPath?'<img class="official-source-image" src="./'+esc(x.localPath)+'" alt="'+esc(x.label||'Recurso visual de Campus')+'">':'';
   const open=href?'<a href="'+esc(href)+'" target="_blank" rel="noopener">Abrir ↗</a>':'';
   return '<div class="source-asset-card">'+preview+'<div><span>'+esc(kind)+' · Campus</span><strong>'+esc(x.label||'Recurso oficial')+'</strong>'+(x.originalUrl&&x.url&&x.originalUrl!==x.url?'<small>URL original: '+esc(x.originalUrl)+'</small>':'')+'</div>'+open+'</div>';
 }).join('');
 return '<div class="source-assets-panel"><h3>Recursos oficiales incluidos en Campus</h3>'+rows+'</div>';
}
function officialAssetsText(src){
 const assets=src.sourceAssets||[]; if(!assets.length)return '';
 return 'RECURSOS OFICIALES DEL CAMPUS\n'+assets.map(x=>{
  const ref=x.originalUrl||x.url||x.localPath||'';
  return '- '+(x.kind||'recurso').toUpperCase()+': '+(x.label||'Recurso oficial')+(ref?' · '+ref:'');
 }).join('\n');
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
  officialAssetsText(src),
  'OBJETIVOS DE LA ACTIVIDAD\n'+(src.objectives&&src.objectives.text?src.objectives.text:'—'),
  src.criteria&&src.criteria.text?'CRITERIOS DE EVALUACIÓN\n'+src.criteria.text:''
 ];
 return blocks.filter(Boolean).join('\n\n');
}
function officialJson(a,src){
 return JSON.stringify({certificate:'HOTI0108',sequence:a.sequence,officialTitle:src.officialTitle||a.officialTitle||'',taskTitle:src.taskTitle||'',module:src.module||a.moduleId,uf:src.uf||a.ufId,ud:src.ud||a.udName,sourcePlatform:src.sourcePlatform||'Formacampus',sourceDueDate:src.sourceDueDate||null,operationalDueDate:a.due||null,statement:src.statement&&src.statement.text?src.statement.text:'',questionsIntro:src.questionsIntro||'',questions:(src.questions||[]).map(q=>({label:q.label||'',text:q.text||''})),guidelines:src.guidelines&&src.guidelines.text?src.guidelines.text:'',objectives:src.objectives&&src.objectives.text?src.objectives.text:'',criteria:src.criteria&&src.criteria.text?src.criteria.text:'',manualRefs:src.manualRefs||[],requiresExternalMaterial:Boolean(src.requiresExternalMaterial),externalMaterialTypes:src.externalMaterialTypes||[],sourceAudit:src.sourceAudit||null,sourceAssets:src.sourceAssets||[],attachment:src.attachment||null,recoveredGap:src.recoveredGap||null,recoveredMaterials:src.recoveredMaterials||[]},null,2);
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
function render(a,src,record,reco){
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
 html+=sourceAssetsHtml(src);
 if(src.questionsIntro)html+=sourceBlock('Indicaciones previas a las preguntas',src.questionsIntro);
 html+=sourceBlock('Orientaciones / información adicional',src.guidelines&&src.guidelines.text);
 html+=sourceBlock('Objetivos',src.objectives&&src.objectives.text);
 html+=sourceBlock('Criterios de evaluación',src.criteria&&src.criteria.text)+'</section>';
 html+=manualRefsHtml(src);
 html+=recommendationPanelHtml(a,reco,record);
 html+='<section class="student-panel><div class="panel-title"><div><span>TRABAJO DEL ALUMNO</span><h2>Maqueta 11</h2></div><small>ChatGPT redacta; JOTI organiza.</small></div>';
 html+=workField('1. Introducción','work.introduction',record.work.introduction,'work-block');
 html+='<div class="questions-head"><h3>2. Desarrollo de la actividad</h3><button id="copyDevelopment" type="button">Copiar desarrollo</button></div><p class="development-note">Las preguntas proceden de Campus y no son editables. Solo se edita tu respuesta.</p><div id="questionPairs">'+questions+'</div>';
 html+=workField('3. El Blog del Informador','work.blog',record.work.blog,'work-block');
 html+=workField('Notas rápidas','work.notes',record.work.notes,'notes-block')+'</section>';
 html+='<footer class="activity-control"><div><span>Última actualización</span><strong id="lastUpdated">'+(record.updatedAt?new Date(record.updatedAt).toLocaleString('es-ES'):'Sin guardar')+'</strong></div><div class="control-actions"><button id="copyFullActivity" type="button" class="primary-copy">Copiar resolución completa</button><button id="saveActivity" type="button">Guardar ficha</button></div></footer>';
 host.innerHTML=html;
 if(window.JOTI_CHATGPT)window.JOTI_CHATGPT.bindProjectLinks(host);
}function bind(a,src,record,store,reco){
 let timer=null;
 const commit=()=>{record.updatedAt=new Date().toISOString();saveStore(store);const x=$('lastUpdated');if(x)x.textContent=new Date(record.updatedAt).toLocaleString('es-ES');};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(commit,350);};
 $('activityStatus').addEventListener('change',e=>{record.status=e.target.value;schedule();});
 document.querySelectorAll('[data-link]').forEach(i=>i.addEventListener('input',e=>{record.links[e.target.dataset.link]=e.target.value;const open=document.querySelector('[data-open="'+e.target.dataset.link+'"]');if(open)open.href=e.target.value||'#';schedule();}));
 document.querySelectorAll('[data-field]').forEach(t=>t.addEventListener('input',e=>{setDeep(record,e.target.dataset.field,e.target.value);schedule();}));
 document.querySelectorAll('[data-question-answer]').forEach(t=>t.addEventListener('input',e=>{record.work.answers[Number(e.target.dataset.questionAnswer)]=e.target.value;schedule();}));
 document.querySelectorAll('[data-copy-field]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.copyField.split('.')[1];copyText(record.work[key]||'',b);}));
 document.querySelectorAll('[data-copy-answer]').forEach(b=>b.addEventListener('click',()=>copyText(record.work.answers[Number(b.dataset.copyAnswer)]||'',b)));
 const recommendedText=String((reco&&reco.recommendedText)||'').trim();
 const copyRecommended=$('copyRecommendedText');if(copyRecommended)copyRecommended.addEventListener('click',e=>copyText(recommendedText,e.currentTarget));
 document.querySelectorAll('[data-remove-suggested]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.removeSuggested;if(!record.recommendation.hiddenPhotoIds.includes(id))record.recommendation.hiddenPhotoIds.push(id);commit();render(a,src,record,reco);bind(a,src,record,store,reco);}));
 document.querySelectorAll('[data-restore-suggested]').forEach(b=>b.addEventListener('click',()=>{record.recommendation.hiddenPhotoIds=record.recommendation.hiddenPhotoIds.filter(id=>id!==b.dataset.restoreSuggested);commit();render(a,src,record,reco);bind(a,src,record,store,reco);}));
 const restoreSuggested=$('restoreSuggestedPhotos');if(restoreSuggested)restoreSuggested.addEventListener('click',()=>{record.recommendation.hiddenPhotoIds=[];commit();render(a,src,record,reco);bind(a,src,record,store,reco);});
 const userPhotoInput=$('userPhotoInput');if(userPhotoInput)userPhotoInput.addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{const previous=record.recommendation.userPhoto;record.recommendation.userPhoto=await prepareUserPhoto(file);try{commit();}catch(err){record.recommendation.userPhoto=previous;window.alert('La foto es demasiado grande para guardarla en este dispositivo.');return;}render(a,src,record,reco);bind(a,src,record,store,reco);}catch(err){window.alert(err.message||'No se pudo a?adir la foto.');}});
 const removeUserPhoto=$('removeUserPhoto');if(removeUserPhoto)removeUserPhoto.addEventListener('click',()=>{record.recommendation.userPhoto=null;commit();render(a,src,record,reco);bind(a,src,record,store,reco);});

 $('copyOfficialActivity').addEventListener('click',e=>copyText(officialText(a,src),e.currentTarget));
 $('copyOfficialJson').addEventListener('click',e=>copyText(officialJson(a,src),e.currentTarget));
 const askForActivityChat=()=>{
  const value=window.prompt('Pega el enlace compartido del chat de esta actividad. Se guardará en esta ficha.',record.links.chat||'');
  if(value===null)return false;
  const clean=value.trim();
  if(!window.JOTI_CHATGPT||!window.JOTI_CHATGPT.isChatUrl(clean)){window.alert('Pega un enlace válido de ChatGPT (https://chatgpt.com/...).');return false;}
  record.links.chat=clean;commit();render(a,src,record,reco);bind(a,src,record,store,reco);return true;
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
 const [courseRes,sourceRes,recommendationRes]=await Promise.all([fetch('./data/course-state.json',{cache:'no-store'}),fetch('./data/activities-uf0049-source.json',{cache:'no-store'}),fetch('./data/activity-recommendations.json',{cache:'no-store'})]);
 const course=await courseRes.json(),payload=await sourceRes.json(),recommendations=recommendationRes.ok?await recommendationRes.json():{activities:{}},activities=flattenCourse(course),a=activities.find(x=>x.sequence===seq),src=(payload.activities||[]).find(x=>x.sequence===seq),reco=(recommendations.activities&&recommendations.activities[seq])||{recommendedText:'',photos:[]};
 if(!a||!src){$('activityDetail').innerHTML='<p class="notice">No se encontró la actividad. <a href="./activities.html">Volver a actividades.</a></p>';return;}
 const store=loadStore(),record=getRecord(store,seq);render(a,src,record,reco);bind(a,src,record,store,reco);
}
init().catch(e=>{console.error(e);$('activityDetail').innerHTML='<p class="notice">No se pudo cargar la actividad.</p>';});