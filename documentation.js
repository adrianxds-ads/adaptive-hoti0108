'use strict';
const DOC_DB='adaptive_hoti0108_docs_v1',DOC_STORE='documents';
const q=id=>document.getElementById(id);
let docDb=null,docUnits=[];
function openDocDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DOC_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(DOC_STORE))db.createObjectStore(DOC_STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function tx(mode='readonly'){return docDb.transaction(DOC_STORE,mode).objectStore(DOC_STORE);}
function allDocs(){return new Promise((resolve,reject)=>{const r=tx().getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
function putDoc(v){return new Promise((resolve,reject)=>{const r=tx('readwrite').put(v);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
function deleteDoc(id){return new Promise((resolve,reject)=>{const r=tx('readwrite').delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
function fmtBytes(n){if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1)+' KB';return (n/1048576).toFixed(1)+' MB';}
async function sha256(file){const bytes=await file.arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function setDocStatus(t,kind=''){const el=q('documentImportStatus');if(!el)return;el.textContent=t;el.dataset.kind=kind;}
function populateDocUnits(){
 const select=q('documentUnit');if(!select)return;select.replaceChildren();
 const catalog=window.HotiManualCatalog;if(!catalog)return;
 docUnits=catalog.units||[];
 (catalog.modules||[]).forEach(m=>{
  const group=document.createElement('optgroup');group.label=(m.status==='active'?'ACTIVO · ':'')+m.id+' · '+m.name;
  (m.units||[]).forEach(u=>{const o=new Option(u.id+' · '+u.name,u.id);if(m.status==='active'&&u.id==='UF0049')o.selected=true;group.append(o);});
  select.append(group);
 });
}
function autodetectUnit(){
 const file=q('documentFile')?.files?.[0];if(!file)return;
 const m=file.name.toUpperCase().match(/UF\d{4}/);if(m&&docUnits.some(u=>u.id===m[0]))q('documentUnit').value=m[0];
 setDocStatus(file.name+' · '+fmtBytes(file.size));
}
async function renderDocQueue(){
 const host=q('documentQueue');if(!host||!docDb)return;host.replaceChildren();
 const rows=(await allDocs()).sort((a,b)=>b.importedAt-a.importedAt);
 if(!rows.length){const p=document.createElement('p');p.className='note';p.textContent='Todavía no hay documentación registrada en este dispositivo.';host.append(p);return;}
 rows.forEach(row=>{
  const card=document.createElement('article');card.className='document-row';
  const body=document.createElement('div');const meta=document.createElement('small');meta.textContent=row.unit+' · '+fmtBytes(row.size)+' · SHA-256 '+row.sha256.slice(0,12)+'…';
  const title=document.createElement('strong');title.textContent=row.name;
  const state=document.createElement('span');state.textContent='REGISTRADO · PENDIENTE DE PUBLICACIÓN';body.append(title,meta,state);
  const actions=document.createElement('div');const open=document.createElement('button');open.textContent='Abrir';open.onclick=()=>{const u=URL.createObjectURL(row.blob);window.open(u,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(u),60000);};
  const del=document.createElement('button');del.textContent='Quitar';del.onclick=async()=>{await deleteDoc(row.id);renderDocQueue();};
  actions.append(open,del);card.append(body,actions);host.append(card);
 });
}
async function registerDocument(){
 const file=q('documentFile')?.files?.[0],unit=q('documentUnit')?.value;
 if(!file||!unit){setDocStatus('Selecciona un archivo y una unidad formativa.','error');return;}
 if(!crypto?.subtle){setDocStatus('Este navegador no permite calcular la huella del archivo.','error');return;}
 try{
  q('registerDocument').disabled=true;setDocStatus('Calculando SHA-256 y registrando el original…','busy');
  const digest=await sha256(file),existing=(await allDocs()).find(x=>x.sha256===digest);
  if(existing){setDocStatus('Ese archivo ya está registrado como '+existing.name+'.','ok');return;}
  const id=unit+'-'+digest.slice(0,20);
  await putDoc({id,unit,name:file.name,type:file.type||'application/octet-stream',size:file.size,sha256:digest,importedAt:Date.now(),status:'staged',blob:file});
  q('documentFile').value='';setDocStatus('Original registrado con integridad verificada. Pendiente de publicación en la biblioteca.','ok');await renderDocQueue();
 }catch(e){console.error(e);setDocStatus('No se pudo registrar el archivo en este dispositivo.','error');}
 finally{q('registerDocument').disabled=false;}
}
async function bootDocumentation(){
 try{docDb=await openDocDb();populateDocUnits();await renderDocQueue();q('documentFile').addEventListener('change',autodetectUnit);q('registerDocument').onclick=registerDocument;}
 catch(e){console.error(e);setDocStatus('El almacenamiento local de documentos no está disponible.','error');}
}
window.addEventListener('hoti:catalog-ready',()=>{populateDocUnits();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootDocumentation);else bootDocumentation();
