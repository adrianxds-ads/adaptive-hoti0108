const APP_VERSION='0.1-bootstrap';
const STORAGE_KEY='adaptive_hoti0108_v1';
async function loadJson(path){const r=await fetch(path);if(!r.ok)throw new Error(`Cannot load ${path}`);return r.json();}
async function boot(){
  const manuals=await loadJson('./data/manuals-index.json');
  const bank=await loadJson('./data/questions-mf1074.json');
  document.getElementById('version').textContent=`v${APP_VERSION}`;
  document.getElementById('manualCount').textContent=manuals.module.units.length;
  document.getElementById('questionCount').textContent=bank.questions.length;
  document.getElementById('status').textContent=bank.questions.length?'Banco oficial cargado.':'Banco oficial de preguntas en preparación. La estructura ya está lista.';
}
boot().catch(err=>{console.error(err);document.getElementById('status').textContent='No se pudo cargar la estructura de datos.';});
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;document.getElementById('installBtn')?.classList.remove('hidden');});
document.getElementById('installBtn')?.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;document.getElementById('installBtn')?.classList.add('hidden');});
window.addEventListener('appinstalled',()=>{document.getElementById('installBtn')?.classList.add('hidden');});
