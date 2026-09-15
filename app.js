'use strict';
const APP_VERSION='1.6-flashcards',STORAGE_KEY='adaptive_hoti0108_v1',$=id=>document.getElementById(id),E=HotiQuiz;
let bank=[],byId=new Map(),evidence={},root={},state={},canSave=true,studyList=[],studyIndex=0,flashList=[],flashIndex=0,flashRevealed=false,session=null,tick=null,deadline=0,started=0,audioCtx=null;const titles={UF0080:'UF0080 · Organización del servicio',UF0081:'UF0081 · Gestión de la información',UF0082:'UF0082 · Atención al visitante'};
const VISUAL_SYSTEM=window.ADRIAN_VISUAL_SYSTEM||null;
const AVS_RANKS=VISUAL_SYSTEM?.ranks||[];
function applyVisualSystemTokens(){const r=document.documentElement;AVS_RANKS.forEach((x,i)=>{r.style.setProperty(`--rank-${i+1}`,x.color);r.style.setProperty(`--rank-${i+1}-surface`,x.surface||x.color);r.style.setProperty(`--rank-${i+1}-band`,x.band||x.color);r.style.setProperty(`--rank-${i+1}-text`,x.text||x.color);});}
function clamp(x,a=0,b=1){return Math.max(a,Math.min(b,x));}
function valueLevel(v){return Math.max(1,Math.min(15,Math.ceil(clamp(Number(v)||0)*15)));}
function valueColor(v){return (AVS_RANKS[valueLevel(v)-1]||{}).color||'#57965A';}
function valueTextColor(v){return (AVS_RANKS[valueLevel(v)-1]||{}).text||'#9EC29F';}
function scoreColor(v){return valueColor(clamp(v/15));}
function scoreTextColor(v){return valueTextColor(clamp(v/15));}
function avsLegendHtml(){return AVS_RANKS.map((x,i)=>`<div class="avs-legend-item"><i style="--swatch:${x.color}"></i><b>${i+1}</b></div>`).join('');}
function sessionScoreChart(rows){rows=(rows||[]).filter(x=>Number.isFinite(x.ts)&&Number.isFinite(x.equivalent15));if(rows.length<2)return '<div class="note">Sin datos suficientes.</div>';const mobile=innerWidth<=620,w=mobile?360:720,h=mobile?300:310,L=mobile?36:52,R=12,T=22,B=38,y=v=>T+((15-v)/15)*(h-T-B),first=rows[0].ts,last=rows[rows.length-1].ts,span=Math.max(1,last-first),x=(r,i)=>L+(last===first?i/(rows.length-1):(r.ts-first)/span)*(w-L-R);const bands=AVS_RANKS.map((c,i)=>`<rect x="${L}" y="${y(i+1)}" width="${w-L-R}" height="${Math.max(1,y(i)-y(i+1))}" fill="${c.band||c.color}" fill-opacity=".82"/>`).join('');const grid=[...Array(16).keys()].map(v=>`<line x1="${L}" y1="${y(v)}" x2="${w-R}" y2="${y(v)}" stroke="rgba(255,255,255,${v===0||v===15?'.35':'.12'})"/><text x="${L-7}" y="${y(v)+3}" text-anchor="end" fill="${v?scoreTextColor(v):'#b7c9bf'}" font-size="${mobile?8:10}" font-weight="850">${v}</text>`).join('');const pts=rows.map((r,i)=>({r,x:x(r,i),y:y(r.equivalent15),v:r.equivalent15}));const shadow=`<polyline points="${pts.map(q=>`${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}" fill="none" stroke="#050806" stroke-opacity=".78" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;const seg=pts.slice(1).map((q,i)=>`<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${q.x}" y2="${q.y}" stroke="${scoreColor(q.v)}" stroke-width="3.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`).join('');const dots=pts.map(q=>`<circle cx="${q.x}" cy="${q.y}" r="3" fill="${scoreColor(q.v)}" stroke="${scoreTextColor(q.v)}" stroke-width="1.5"><title>${q.r.correct}/${q.r.scored} correctas · ${q.v.toFixed(1)}/15</title></circle>`).join('');return `<svg class="score-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><rect x="${L}" y="${T}" width="${w-L-R}" height="${h-T-B}" rx="8" fill="#101815"/>${bands}${grid}${shadow}${seg}${dots}<text x="${L}" y="14" fill="#dfece5" font-size="${mobile?9:11}" font-weight="900">COLOR = AVS 1–15 · MÁS ALTO = MEJOR</text></svg><div class="chartmeta"><span>Última ${rows.at(-1).equivalent15.toFixed(1)}/15</span><span>${rows.length} rondas</span></div>`;}
function renderStatistics(){const rows=state.roundHistory||[],attempts=Object.values(state.attempts),recent=rows.slice(-10),scored=recent.reduce((n,r)=>n+r.scored,0),correct=recent.reduce((n,r)=>n+r.correct,0),acc=scored?correct/scored:null;$('statsRounds').textContent=rows.length;$('statsAccuracy').textContent=acc==null?'—':`${Math.round(acc*100)}%`;$('statsAccuracy').style.color=acc==null?'':valueTextColor(acc);$('statsAnswered').textContent=attempts.reduce((n,a)=>n+(a.count||0),0);$('scoreChart').innerHTML=sessionScoreChart(rows);$('avsLegend').innerHTML=avsLegendHtml();show('statistics');}
try{const raw=localStorage.getItem(STORAGE_KEY);root=raw?JSON.parse(raw):{};if(!root||typeof root!=='object'||Array.isArray(root))throw Error('shape');}catch{root={};canSave=false;}
state={version:1,attempts:{},studyPositions:{},flashPositions:{},roundHistory:[],...((root.studyGame&&typeof root.studyGame==='object')?root.studyGame:{})};
if(!state.attempts||typeof state.attempts!=='object')state.attempts={};if(!state.studyPositions||typeof state.studyPositions!=='object')state.studyPositions={};if(!state.flashPositions||typeof state.flashPositions!=='object')state.flashPositions={};if(!Array.isArray(state.roundHistory))state.roundHistory=[];
function notice(){ $('storageNotice').hidden=false;$('storageNotice').textContent='Puedes seguir practicando, pero no se está guardando el progreso en este navegador.'; }
function save(){if(!canSave){notice();return;}try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...root,studyGame:state}));}catch{canSave=false;notice();}}
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function evidencePanel(q){const e=evidence[q.id];if(!e)return null;const verified=String(e.status||'').startsWith('verified_'),conflict=!verified,box=node('div',undefined,'evidence-card '+(conflict?'conflict':'verified'));let badge=verified?'✓ VERIFICADA EN MANUAL':e.status==='conflict_manual_internal'?'⚠ CONFLICTO INTERNO DEL MANUAL':'⚠ AMBIGÜEDAD DEL MANUAL';box.append(node('span',badge,'verification-badge'));const add=(src,label,variant='')=>{if(label)box.append(node('strong',label,'evidence-source-title'));box.append(node('blockquote',src.quote||'','evidence-quote'));box.append(node('p',`${src.unit||q.uf} · ${src.section||''} · PDF ${src.page}${src.printedPage?' · manual p. '+src.printedPage:''}`,'evidence-ref'));const a=node('a','Abrir fragmento en el manual ↗','evidence-link');a.href=`manuals.html?evidence=${encodeURIComponent(q.id)}${variant?'&variant='+encodeURIComponent(variant):''}#${src.unit||q.uf}/${src.page}`;a.onclick=ev=>ev.stopPropagation();box.append(a);};add(e,conflict?'Evidencia principal':null);if(e.conflictEvidence)add(e.conflictEvidence,e.status==='conflict_manual_internal'?'Segunda evidencia · contradicción':'Evidencia alternativa','conflict');(e.additionalEvidence||[]).forEach((src,i)=>add(src,'Continuación en el manual',`additional${i+1}`));return box;}
function signal(kind){try{if(kind==='wrong'&&navigator.vibrate)navigator.vibrate([90,45,120]);const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=audioCtx||new AC();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;if(kind==='correct'){for(const [i,f] of [[0,660],[1,880]]){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,now+i*.09);g.gain.exponentialRampToValueAtTime(.12,now+i*.09+.015);g.gain.exponentialRampToValueAtTime(.0001,now+i*.09+.13);o.connect(g).connect(audioCtx.destination);o.start(now+i*.09);o.stop(now+i*.09+.14);}}else if(kind==='wrong'){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(190,now);o.frequency.exponentialRampToValueAtTime(115,now+.18);g.gain.setValueAtTime(.11,now);g.gain.exponentialRampToValueAtTime(.0001,now+.22);o.connect(g).connect(audioCtx.destination);o.start(now);o.stop(now+.23);}}catch{}}
function show(id){if(typeof focusSwitch==='function')focusSwitch(id);if(id==='statistics'&&typeof renderExamHistory==='function')renderExamHistory();for(const name of ['home','study','flash','setup','game','results','statistics','examSetup','exam','examResults'])$(name).hidden=name!==id;window.scrollTo(0,0);}
function stopTimer(){if(tick)clearInterval(tick);tick=null;}
function pause(){stopTimer();if(session&&state.active===session&&session.index<session.ids.length&&session.answers.length===session.index&&session.limit&&deadline){session.remainingMs=Math.max(0,deadline-Date.now());state.active=session;save();}deadline=0;}
function pendingErrorCount(){return Object.values(state.attempts).filter(a=>a.lastKind==='wrong').length;}
function home(){pause();show('home');$('coverage').textContent=`${Object.values(state.attempts).filter(a=>a.count>0).length} / ${bank.length}`;const pending=pendingErrorCount();$('pendingErrors').textContent=pending;$('clearErrors').hidden=!pending;$('resumeGame').hidden=!state.active;}
function clearErrors(){for(const a of Object.values(state.attempts))if(a.lastKind==='wrong')a.lastKind='cleared';save();home();}
function assessment(q){return q.id.replace(/_Q\d+$/,'');}
function assessmentLabel(id){const tail=id.split('_').slice(1).join('_');return tail==='FINAL'?'Test final':tail;}
function metadata(q){return `${q.uf} · ${q.ud==='FINAL'?'Test final':q.ud} · Pregunta ${q.question_number} · Ficha ${String(q.global_index).padStart(3,'0')}`;}
function makeFilters(prefix){const container=$(prefix+'Filters');for(const kind of ['Unit','Assessment']){const wrap=node('div'),label=node('label',kind==='Unit'?'Unidad formativa':'Evaluación'),select=node('select');select.id=prefix+kind;label.htmlFor=select.id;wrap.append(label,select);container.append(wrap);}const unit=$(prefix+'Unit');unit.append(new Option('Todas las unidades','all'));Object.entries(titles).forEach(([value,text])=>unit.append(new Option(text,value)));unit.onchange=()=>{populateAssessments(prefix);filtersChanged(prefix);};$(prefix+'Assessment').onchange=()=>filtersChanged(prefix);populateAssessments(prefix);}
function populateAssessments(prefix){const select=$(prefix+'Assessment'),unit=$(prefix+'Unit').value;select.replaceChildren(new Option('Todas las evaluaciones','all'));[...new Set(bank.filter(q=>unit==='all'||q.uf===unit).map(assessment))].forEach(id=>select.append(new Option((unit==='all'?id.split('_')[0]+' · ':'')+assessmentLabel(id),id)));}
function selected(prefix){const unit=$(prefix+'Unit').value,a=$(prefix+'Assessment').value;return bank.filter(q=>(unit==='all'||q.uf===unit)&&(a==='all'||assessment(q)===a));}
function filtersChanged(prefix){if(prefix==='study')loadStudy();else if(prefix==='flash')loadFlashcards();else poolInfo();}
function studyKey(){return $('studyUnit').value+'/'+$('studyAssessment').value;}
function flashKey(){return $('flashUnit').value+'/'+$('flashAssessment').value;}
// Presentation-only emphasis: exact excerpts from each study prompt.
const STUDY_EMPHASIS={
  "UF0080_FINAL_Q01": [
    "Visado",
    "hacer escala"
  ],
  "UF0080_FINAL_Q02": [
    "muy vistosa",
    "folletos, productos turísticos o carteles"
  ],
  "UF0080_FINAL_Q03": [
    "normas vigentes de accesibilidad"
  ],
  "UF0080_FINAL_Q04": [
    "ventaja",
    "cheques de viaje"
  ],
  "UF0080_FINAL_Q05": [
    "año 2000",
    "Cataluña"
  ],
  "UF0080_FINAL_Q06": [
    "carácter anual",
    "viajes que realizan los españoles"
  ],
  "UF0080_FINAL_Q07": [
    "Decreto 72/2008",
    "Andalucía"
  ],
  "UF0080_FINAL_Q08": [
    "bien estructurada",
    "promocionar el destino turístico"
  ],
  "UF0080_FINAL_Q09": [
    "declaración del dinero",
    "salida del territorio nacional"
  ],
  "UF0080_FINAL_Q10": [
    "SATE"
  ],
  "UF0080_FINAL_Q11": [
    "back desk"
  ],
  "UF0080_FINAL_Q12": [
    "cartas tipo"
  ],
  "UF0080_FINAL_Q13": [
    "punto turístico concreto"
  ],
  "UF0080_FINAL_Q14": [
    "directivos intermedios"
  ],
  "UF0080_FINAL_Q15": [
    "se atiende al visitante"
  ],
  "UF0080_FINAL_Q16": [
    "Encuesta de gasto turístico",
    "no residentes en España"
  ],
  "UF0080_FINAL_Q17": [
    "Ministerio de Asuntos Exteriores",
    "tres años (ampliable a cinco)"
  ],
  "UF0080_FINAL_Q18": [
    "Andalucía"
  ],
  "UF0080_FINAL_Q19": [
    "carácter temporal",
    "determinado evento o fiesta"
  ],
  "UF0080_FINAL_Q20": [
    "itinerario temático",
    "animador"
  ],
  "UF0080_UD1_Q01": [
    "Familitur"
  ],
  "UF0080_UD1_Q02": [
    "espacio físico"
  ],
  "UF0080_UD1_Q03": [
    "material informativo y promocional"
  ],
  "UF0080_UD1_Q04": [
    "SATE"
  ],
  "UF0080_UD1_Q05": [
    "back desk"
  ],
  "UF0080_UD1_Q06": [
    "solicitudes específicas"
  ],
  "UF0080_UD1_Q07": [
    "Oficinas de Turismo de España en el exterior"
  ],
  "UF0080_UD1_Q08": [
    "Desde qué año",
    "Encuesta anual de servicios"
  ],
  "UF0080_UD1_Q09": [
    "distribuidores, empleados y periodistas",
    "conozcan el destino"
  ],
  "UF0080_UD1_Q10": [
    "estacionalidad"
  ],
  "UF0080_UD2_Q01": [
    "centros permanentes"
  ],
  "UF0080_UD2_Q02": [
    "accesos",
    "puertas"
  ],
  "UF0080_UD2_Q03": [
    "puntos de información zonales"
  ],
  "UF0080_UD2_Q04": [
    "de forma autónoma"
  ],
  "UF0080_UD2_Q05": [
    "Canales de distribución",
    "reservar un servicio"
  ],
  "UF0080_UD2_Q06": [
    "situadas en el destino turístico"
  ],
  "UF0080_UD2_Q07": [
    "Andalucía",
    "temporada estival"
  ],
  "UF0080_UD2_Q08": [
    "señalización interna"
  ],
  "UF0080_UD2_Q09": [
    "descripciones detalladas",
    "puntos de interés"
  ],
  "UF0080_UD2_Q10": [
    "estación de esquí"
  ],
  "UF0080_UD3_Q01": [
    "circulares"
  ],
  "UF0080_UD3_Q02": [
    "partes",
    "documento"
  ],
  "UF0080_UD3_Q03": [
    "tour conductor"
  ],
  "UF0080_UD3_Q04": [
    "ruido",
    "receptor"
  ],
  "UF0080_UD3_Q05": [
    "desventajas",
    "por teléfono"
  ],
  "UF0080_UD3_Q06": [
    "membreta va centrado",
    "a la izquierda",
    "a la derecha"
  ],
  "UF0080_UD3_Q07": [
    "guía de turismo"
  ],
  "UF0080_UD3_Q08": [
    "comunicación no verbal"
  ],
  "UF0080_UD3_Q09": [
    "principal meta",
    "FEG"
  ],
  "UF0080_UD3_Q10": [
    "ruido",
    "informador turístico"
  ],
  "UF0080_UD4_Q01": [
    "generales y los temáticos"
  ],
  "UF0080_UD4_Q02": [
    "tipos de mapa"
  ],
  "UF0080_UD4_Q03": [
    "más plazas de las disponibles"
  ],
  "UF0080_UD4_Q04": [
    "fuentes documentales",
    "forma de tablas"
  ],
  "UF0080_UD4_Q05": [
    "sólo permiten",
    "dinero del que se dispone"
  ],
  "UF0080_UD4_Q06": [
    "legislación aplicable",
    "hojas de quejas y reclamaciones"
  ],
  "UF0080_UD4_Q07": [
    "gastos de la anulación del viaje"
  ],
  "UF0080_UD4_Q08": [
    "empleados",
    "embajador"
  ],
  "UF0080_UD4_Q09": [
    "Visado",
    "diplomacia"
  ],
  "UF0080_UD4_Q10": [
    "un solo viaje",
    "tres meses",
    "grupo de personas"
  ],
  "UF0081_FINAL_Q01": [
    "factores impulsores del turismo"
  ],
  "UF0081_FINAL_Q02": [
    "habilidades de recepción"
  ],
  "UF0081_FINAL_Q03": [
    "necesidades de los clientes"
  ],
  "UF0081_FINAL_Q04": [
    "fuentes orales o documentales"
  ],
  "UF0081_FINAL_Q05": [
    "documento",
    "servicios de alojamientos y agencias de viajes"
  ],
  "UF0081_FINAL_Q06": [
    "OMT",
    "Patrimonio Turístico"
  ],
  "UF0081_FINAL_Q07": [
    "gestión de la documentación"
  ],
  "UF0081_FINAL_Q08": [
    "información que elabora los profesionales y técnicos"
  ],
  "UF0081_FINAL_Q09": [
    "clasificación de la información",
    "por el contenido"
  ],
  "UF0081_FINAL_Q10": [
    "accesos de territorio",
    "papel activo"
  ],
  "UF0081_FINAL_Q11": [
    "unidad económica de producción"
  ],
  "UF0081_FINAL_Q12": [
    "norma ISBN"
  ],
  "UF0081_FINAL_Q13": [
    "Web 2.0"
  ],
  "UF0081_FINAL_Q14": [
    "interpretar la información",
    "medio personal"
  ],
  "UF0081_FINAL_Q15": [
    "audio digital comprimido",
    "rutas y monumentos"
  ],
  "UF0081_FINAL_Q16": [
    "escritos dirigidos a la Administración Pública"
  ],
  "UF0081_FINAL_Q17": [
    "mensaje ha sido comprendido",
    "modificar los mensajes"
  ],
  "UF0081_FINAL_Q18": [
    "ordenadores situados en la propia entidad",
    "uso de los visitantes"
  ],
  "UF0081_FINAL_Q19": [
    "no suelen requerir grandes inversiones",
    "actividades adaptadas al tema del viaje"
  ],
  "UF0081_FINAL_Q20": [
    "acceso de las personas con discapacidad"
  ],
  "UF0081_UD1_Q01": [
    "tipos de información"
  ],
  "UF0081_UD1_Q02": [
    "cuestionarios",
    "nunca deben faltar"
  ],
  "UF0081_UD1_Q03": [
    "escucha activa"
  ],
  "UF0081_UD1_Q04": [
    "obligación",
    "empresas públicas como privadas"
  ],
  "UF0081_UD1_Q05": [
    "actividad del hombre",
    "necesidades de la demanda"
  ],
  "UF0081_UD1_Q06": [
    "información que elabora los profesionales y técnicos"
  ],
  "UF0081_UD1_Q07": [
    "sistema de gestión de base de datos",
    "manipular la información"
  ],
  "UF0081_UD1_Q08": [
    "acceso de territorio de visita",
    "papel activo"
  ],
  "UF0081_UD1_Q09": [
    "aún no se encuentra"
  ],
  "UF0081_UD1_Q10": [
    "orden de prestación",
    "comprobante de pago y de reservación"
  ],
  "UF0081_UD2_Q01": [
    "ventajas",
    "segmentación del mercado"
  ],
  "UF0081_UD2_Q02": [
    "4 elementos básicos",
    "mercado turístico"
  ],
  "UF0081_UD2_Q03": [
    "destino que se quiere segmentar",
    "comportamiento del viajero"
  ],
  "UF0081_UD2_Q04": [
    "principios",
    "turismo sostenible"
  ],
  "UF0081_UD2_Q05": [
    "bienes muebles e inmuebles",
    "valor y significado cultural"
  ],
  "UF0081_UD2_Q06": [
    "características del itinerario cultural"
  ],
  "UF0081_UD2_Q07": [
    "comprensión recíproca"
  ],
  "UF0081_UD2_Q08": [
    "Feedback",
    "ha pedido la información"
  ],
  "UF0081_UD2_Q09": [
    "desarrollo del producto turístico"
  ],
  "UF0081_UD2_Q10": [
    "Cuántos tipos de turismo",
    "personas con discapacidad"
  ],
  "UF0082_FINAL_Q01": [
    "elementos tangibles"
  ],
  "UF0082_FINAL_Q02": [
    "beneficios",
    "SICTED"
  ],
  "UF0082_FINAL_Q03": [
    "accesibilidad",
    "comunicación"
  ],
  "UF0082_FINAL_Q04": [
    "fase de acogida"
  ],
  "UF0082_FINAL_Q05": [
    "ubicación más apropiada"
  ],
  "UF0082_FINAL_Q06": [
    "acogida agradable",
    "habilidades sociales"
  ],
  "UF0082_FINAL_Q07": [
    "beneficios",
    "normas de calidad"
  ],
  "UF0082_FINAL_Q08": [
    "capacidad de respuesta"
  ],
  "UF0082_FINAL_Q09": [
    "Servqual",
    "calidad"
  ],
  "UF0082_FINAL_Q10": [
    "atención directa",
    "distintas fases"
  ],
  "UF0082_FINAL_Q11": [
    "ventajas",
    "comunicación escrita"
  ],
  "UF0082_FINAL_Q12": [
    "Albert Mehrabian",
    "porcentajes",
    "componente verbal y no verbal"
  ],
  "UF0082_FINAL_Q13": [
    "desventajas",
    "comunicación oral"
  ],
  "UF0082_FINAL_Q14": [
    "atención telefónica",
    "voz"
  ],
  "UF0082_FINAL_Q15": [
    "gestión de la oferta"
  ],
  "UF0082_FINAL_Q16": [
    "comunicación verbal",
    "celeridad"
  ],
  "UF0082_FINAL_Q17": [
    "Allan Pease",
    "tipos de distancia"
  ],
  "UF0082_FINAL_Q18": [
    "tres pilares fundamentales",
    "personal de hostelería"
  ],
  "UF0082_FINAL_Q19": [
    "diversos puntos",
    "pernoctan en diferentes alojamientos"
  ],
  "UF0082_FINAL_Q20": [
    "tipos de asignación",
    "capacidad"
  ],
  "UF0082_UD1_Q01": [
    "acogida agradable",
    "habilidades sociales"
  ],
  "UF0082_UD1_Q02": [
    "capacidad de respuesta"
  ],
  "UF0082_UD1_Q03": [
    "Servqual",
    "calidad del servicio"
  ],
  "UF0082_UD1_Q04": [
    "Fases",
    "atención directa"
  ],
  "UF0082_UD1_Q05": [
    "Ventaja",
    "comunicación escrita"
  ],
  "UF0082_UD1_Q06": [
    "atención telefónica",
    "voz"
  ],
  "UF0082_UD1_Q07": [
    "contacto visual"
  ],
  "UF0082_UD1_Q08": [
    "LIFO"
  ],
  "UF0082_UD1_Q09": [
    "gestionar la demanda"
  ],
  "UF0082_UD1_Q10": [
    "turismo de estancia"
  ]
};
function emphasizeStudyPrompt(heading,q){
 const text=q.question,ranges=(STUDY_EMPHASIS[q.id]||[]).map(phrase=>({start:text.indexOf(phrase),length:phrase.length})).filter(r=>r.start>=0).sort((a,b)=>a.start-b.start);
 if(!ranges.length)return;
 heading.replaceChildren();let cursor=0;
 for(const range of ranges){if(range.start<cursor)continue;heading.append(document.createTextNode(text.slice(cursor,range.start)),node('strong',text.slice(range.start,range.start+range.length),'study-keyword'));cursor=range.start+range.length;}
 heading.append(document.createTextNode(text.slice(cursor)));
}
function renderPrompt(container,q,interactive=false){container.replaceChildren();container.dataset.questionId=q.id;container.append(node('p',metadata(q),'question-meta'));const h=node('h2',q.question,'question-text');h.id=interactive?'activeQuestion':'studyQuestion';if(!interactive)emphasizeStudyPrompt(h,q);container.append(h);const options=node('div',undefined,'options');options.setAttribute('role','group');options.setAttribute('aria-labelledby',h.id);for(const letter of ['a','b','c','d']){const o=node(interactive?'button':'div',undefined,'option');o.dataset.answer=letter;o.append(node('span',letter.toUpperCase(),'option-letter'),node('span',q.options[letter],'option-text'));if(interactive)o.onclick=()=>answer(letter);options.append(o);}container.append(options);}
function answerBody(q){const b=node('div',undefined,'answer-body');b.append(node('p',`Respuesta correcta · ${q.correct_answer.toUpperCase()}`,'answer-key'),node('p',q.options[q.correct_answer]));const ep=evidencePanel(q);if(ep)b.append(ep);if(q.ambiguous&&!evidence[q.id])b.append(node('p',E.special(q),'special-note'));return b;}function loadStudy(){state.studySelection={unit:$('studyUnit').value,assessment:$('studyAssessment').value};studyList=selected('study');const savedId=state.studyPositions[studyKey()];studyIndex=Math.max(0,studyList.findIndex(q=>q.id===savedId));const select=$('studyJump');select.replaceChildren();studyList.forEach((q,i)=>select.append(new Option(`${i+1}. ${q.uf} · ${q.ud} · Pregunta ${q.question_number}`,q.id)));renderStudy();}
function renderStudy(){const q=studyList[studyIndex];if(!q)return;state.studyPositions[studyKey()]=q.id;save();$('studyJump').value=q.id;$('studyPosition').textContent=`${studyIndex+1} de ${studyList.length} preguntas seleccionadas`;const card=$('studyCard');renderPrompt(card,q);const details=node('details',undefined,'answer-details');details.append(node('summary','Ver respuesta'),answerBody(q));card.append(details);card.classList.add('study-flip-card');card.onclick=e=>{if(e.target.closest('a,button,select,input,summary'))return;if(!details.open){details.open=true;details.scrollIntoView({block:'nearest'});}else if(studyIndex<studyList.length-1)moveStudy(1);};$('studyPrev').disabled=studyIndex===0;$('studyNext').disabled=studyIndex===studyList.length-1;}
function moveStudy(delta){studyIndex+=delta;renderStudy();$('studyPosition').scrollIntoView({block:'start'});}
function renderFlashFace(face,q,revealed=false){face.replaceChildren();face.append(node('p',metadata(q),'question-meta'));const h=node('h2',q.question,'question-text');if(revealed)emphasizeStudyPrompt(h,q);face.append(h);const options=node('div',undefined,'options flash-options');for(const letter of ['a','b','c','d']){const o=node('div',undefined,'option');o.dataset.answer=letter;o.append(node('span',letter.toUpperCase(),'option-letter'),node('span',q.options[letter],'option-text'));if(revealed){if(letter===q.correct_answer){o.classList.add('correct');o.querySelector('.option-text').append(node('span','✓ CORRECTA','option-badge'));}else{o.classList.add('dim');}}options.append(o);}face.append(options);}
function loadFlashcards(){state.flashSelection={unit:$('flashUnit').value,assessment:$('flashAssessment').value};flashList=selected('flash');const savedId=state.flashPositions[flashKey()];flashIndex=Math.max(0,flashList.findIndex(q=>q.id===savedId));const select=$('flashJump');select.replaceChildren();flashList.forEach((q,i)=>select.append(new Option(`${i+1}. ${q.uf} · ${q.ud} · Pregunta ${q.question_number}`,q.id)));renderFlashcard();}
function renderFlashcard(){const q=flashList[flashIndex];if(!q)return;flashRevealed=false;state.flashPositions[flashKey()]=q.id;save();$('flashJump').value=q.id;$('flashPosition').textContent=`${flashIndex+1} / ${flashList.length}`;const shell=$('flashCard');shell.replaceChildren();shell.classList.remove('is-revealed');const inner=node('div',undefined,'flashcard-inner'),front=node('div',undefined,'flashcard-face flashcard-front'),back=node('div',undefined,'flashcard-face flashcard-back');renderFlashFace(front,q,false);renderFlashFace(back,q,true);inner.append(front,back);shell.append(inner);$('flashPrev').disabled=flashIndex===0;$('flashNext').disabled=flashIndex===flashList.length-1;}
function flipFlashcard(){if(!flashList.length)return;if(!flashRevealed){flashRevealed=true;$('flashCard').classList.add('is-revealed');return;}if(flashIndex<flashList.length-1){flashIndex++;renderFlashcard();$('flashCard').scrollIntoView({block:'start'});}}
function moveFlash(delta){flashIndex=Math.max(0,Math.min(flashList.length-1,flashIndex+delta));renderFlashcard();$('flashCard').scrollIntoView({block:'start'});}
function pool(){return selected('game').filter(q=>!$('onlyErrors').checked||state.attempts[q.id]?.lastKind==='wrong');}
function poolInfo(){const n=pool().length,v=$('roundSize').value;$('poolInfo').textContent=n?(v==='infinite'?`${n} preguntas disponibles · ∞`:`${n} preguntas disponibles · ${v==='all'?n:Math.min(n,Number(v))}`):'0 preguntas disponibles';$('startGame').disabled=!n;}
function setup(){pause();show('setup');poolInfo();$('startGame').textContent=state.active?'Empezar una nueva ronda →':'Empezar ronda →';}
function start(ids=null){pause();let questions=ids?ids.map(id=>byId.get(id)).filter(Boolean):pool();if(!questions.length)return;const rv=ids?'all':$('roundSize').value,infinite=rv==='infinite',max=ids?questions.length:(rv==='all'||infinite?questions.length:Number(rv));session={ids:E.shuffle(questions).slice(0,max).map(q=>q.id),poolIds:questions.map(q=>q.id),infinite,index:0,answers:[],limit:ids?0:Number($('timeLimit').value),streak:0,bestStreak:0,createdAt:Date.now()};state.active=session;save();show('game');renderGame();}
function resume(){session=state.active;if(!session)return;show('game');renderGame();}
function renderTimer(){const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('timer').textContent=`Tiempo restante: ${left} s`;$('timer').classList.toggle('urgent',left<=5);if(left<=0)answer(null);}
function renderGame(){stopTimer();deadline=0;const q=byId.get(session.ids[session.index]);if(!q){finish();return;}renderPrompt($('gameCard'),q,true);$('feedback').hidden=true;$('nextQuestion').hidden=true;$('roundPosition').textContent=session.infinite?`${session.index+1} · ∞`:`${session.index+1} / ${session.ids.length}`;$('roundStreak').textContent=`Racha ${session.streak}`;$('roundProgress').hidden=!!session.infinite;$('roundProgress').max=session.ids.length;$('roundProgress').value=session.answers.length;const previous=session.answers[session.index];$('timer').hidden=!session.limit||!!previous;
 if(previous){showFeedback(q,previous,false);return;}
 started=Date.now();if(session.limit){deadline=Date.now()+(session.remainingMs??session.limit*1000);delete session.remainingMs;renderTimer();if(session.answers.length===session.index)tick=setInterval(renderTimer,200);}
}
function answer(letter){if(!session||session.answers.length!==session.index)return;stopTimer();const q=byId.get(session.ids[session.index]),g=E.grade(q,letter);if(g.kind==='correct'){session.streak++;session.bestStreak=Math.max(session.bestStreak,session.streak);}else if(g.kind==='wrong')session.streak=0;
 const record={id:q.id,answer:letter,kind:g.kind,reason:g.reason||null,responseMs:Math.max(0,Date.now()-started),timestamp:Date.now()};session.answers.push(record);delete session.remainingMs;
 const old=state.attempts[q.id]||{count:0,correct:0,wrong:0,neutral:0};state.attempts[q.id]={...old,count:old.count+1,[g.kind]:(old[g.kind]||0)+1,lastKind:g.kind,lastAnswer:letter,lastMs:record.responseMs};state.active=session;save();signal(g.kind);showFeedback(q,record,true);
}
function showFeedback(q,record,scroll){const feedback=$('feedback');feedback.replaceChildren();feedback.className='feedback '+record.kind;const heading=record.kind==='correct'?'CORRECTO':record.kind==='neutral'?'PREGUNTA CON MATIZ':record.answer===null?'TIEMPO AGOTADO':'INCORRECTO';feedback.append(node('h2',heading));if(record.answer&&record.kind!=='correct')feedback.append(node('p',`Tu respuesta: ${record.answer.toUpperCase()} · ${q.options[record.answer]}`,'feedback-user-answer'));if(record.kind==='neutral')feedback.append(node('p','Sin penalización ni cambio de racha.'));const reveal=node('div',undefined,'feedback-correct-answer');reveal.append(node('small',`Respuesta correcta · ${q.correct_answer.toUpperCase()}`),node('strong',q.options[q.correct_answer]));feedback.append(reveal);const ep=evidencePanel(q);if(ep)feedback.append(ep);else if(q.ambiguous)feedback.append(node('p',E.special(q),'special-note'));for(const o of $('gameCard').querySelectorAll('.option')){o.disabled=true;if(o.dataset.answer===q.correct_answer){o.classList.add('correct');o.querySelector('.option-text').append(node('span','✓ Respuesta correcta','option-badge'));}else if(o.dataset.answer===record.answer){o.classList.add(record.kind==='neutral'?'neutral':'wrong');o.querySelector('.option-text').append(node('span',record.kind==='neutral'?'Tu respuesta · sin penalización':'Tu respuesta','option-badge'));}else{o.classList.add('dim');}}feedback.hidden=false;$('nextQuestion').hidden=false;$('nextQuestion').textContent=session.index===session.ids.length-1?'Ver resultado →':'Siguiente pregunta →';$('roundStreak').textContent=`Racha ${session.streak}`;$('roundProgress').value=session.answers.length;$('timer').hidden=true;if(scroll){feedback.focus({preventScroll:true});feedback.scrollIntoView({block:'center',behavior:'instant'});}}
function next(){if(session.answers.length<=session.index)return;session.index++;if(session.infinite&&session.index===session.ids.length){let cycle=E.shuffle((session.poolIds||bank.map(q=>q.id)).map(id=>byId.get(id)).filter(Boolean)).map(q=>q.id);if(cycle.length>1&&cycle[0]===session.ids.at(-1))[cycle[0],cycle[1]]=[cycle[1],cycle[0]];session.ids.push(...cycle);}state.active=session;save();if(!session.infinite&&session.index===session.ids.length)finish();else{renderGame();$('game').scrollIntoView({block:'start'});}}
function finish(){stopTimer();deadline=0;const completed=session,totals=E.summarize(completed.answers),scored=totals.correct+totals.wrong;state.roundHistory.push({ts:Date.now(),correct:totals.correct,wrong:totals.wrong,neutral:totals.neutral,scored,total:completed.ids.length,equivalent15:scored?totals.correct/scored*15:0});state.roundHistory=state.roundHistory.slice(-500);state.lastResult=completed;state.active=null;session=null;save();renderResults(completed);}
function renderResults(s){show('results');const totals=E.summarize(s.answers),scored=totals.correct+totals.wrong;$('resultHeadline').textContent=scored?`${totals.correct} de ${scored} correctas`:'Sin preguntas puntuables';$('resultStats').replaceChildren();for(const [value,label] of [[totals.correct,'Aciertos'],[totals.wrong,'Fallos'],[s.bestStreak,'Mejor racha']]){const box=node('div');box.append(node('strong',String(value)),node('span',label));$('resultStats').append(box);}$('resultNote').textContent=totals.neutral?`${totals.neutral} pregunta(s) con matiz excluida(s) del cálculo.`:'';$('resultNote').hidden=!totals.neutral;const review=$('resultReview');review.replaceChildren();const mistakes=s.answers.filter(a=>a.kind==='wrong');for(const a of s.answers.filter(a=>a.kind!=='correct')){const q=byId.get(a.id),d=node('details',undefined,`review-item review-${a.kind}`);d.append(node('summary',(a.kind==='neutral'?'⚠ CON MATIZ · ':'✕ INCORRECTA · ')+q.question),node('p',`Tu respuesta: ${a.answer?a.answer.toUpperCase()+' · '+q.options[a.answer]:'Sin respuesta'}`),answerBody(q));review.append(d);}$('retryMistakes').hidden=!mistakes.length;$('retryMistakes').onclick=()=>start(mistakes.map(a=>a.id));}
$('openStudy').onclick=()=>{pause();show('study');loadStudy();};$('openFlash').onclick=()=>{pause();show('flash');loadFlashcards();};$('clearErrors').onclick=clearErrors;$('openGame').onclick=setup;$('openStats').onclick=renderStatistics;$('statsStudy').onclick=()=>{show('study');loadStudy();};$('statsGame').onclick=setup;$('resumeGame').onclick=resume;document.querySelectorAll('.home-button').forEach(b=>b.onclick=home);$('pauseGame').onclick=home;$('studyJump').onchange=()=>{studyIndex=studyList.findIndex(q=>q.id===$('studyJump').value);renderStudy();};$('studyPrev').onclick=()=>moveStudy(-1);$('studyNext').onclick=()=>moveStudy(1);$('flashJump').onchange=()=>{flashIndex=flashList.findIndex(q=>q.id===$('flashJump').value);renderFlashcard();};$('flashCard').onclick=e=>{if(e.target.closest('a,button,select,input,summary'))return;flipFlashcard();};$('flashCard').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flipFlashcard();}};$('flashPrev').onclick=()=>moveFlash(-1);$('flashNext').onclick=()=>moveFlash(1);$('startGame').onclick=()=>start();$('onlyErrors').onchange=poolInfo;$('roundSize').onchange=poolInfo;$('nextQuestion').onclick=next;$('anotherRound').onclick=setup;
window.addEventListener('pagehide',pause);
async function boot(){try{applyVisualSystemTokens();const [r,er]=await Promise.all([fetch('./data/questions-mf1074.json'),fetch('./data/question-evidence.json').catch(()=>null)]);if(!r.ok)throw Error('bank');const data=await r.json();bank=data.questions;if(er&&er.ok){const ed=await er.json();evidence=ed.questions||ed||{};}if(!bank.length||bank.some(q=>!q.id||!q.question||!q.options||!['a','b','c','d'].every(k=>typeof q.options[k]==='string')||!q.options[q.correct_answer]))throw Error('invalid bank');byId=new Map(bank.map(q=>[q.id,q]));
 if(state.active&&(!Array.isArray(state.active.ids)||!state.active.ids.length||state.active.ids.some(id=>!byId.has(id))||!Array.isArray(state.active.answers)||state.active.index>=state.active.ids.length)){state.active=null;}
 $('version').textContent='v'+APP_VERSION;$('questionCount').textContent=bank.length;makeFilters('study');makeFilters('flash');makeFilters('game');if(state.studySelection){$('studyUnit').value=state.studySelection.unit;if(!$('studyUnit').value)$('studyUnit').value='all';populateAssessments('study');$('studyAssessment').value=state.studySelection.assessment;if(!$('studyAssessment').value)$('studyAssessment').value='all';}if(state.flashSelection){$('flashUnit').value=state.flashSelection.unit;if(!$('flashUnit').value)$('flashUnit').value='all';populateAssessments('flash');$('flashAssessment').value=state.flashSelection.assessment;if(!$('flashAssessment').value)$('flashAssessment').value='all';}$('loadStatus').hidden=true;if(!canSave)notice();home();}catch(e){console.error(e);$('loadStatus').textContent='No se han podido cargar las preguntas. Comprueba la conexión y vuelve a abrir la aplicación.';}}
boot();
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').hidden=false;});$('installBtn').onclick=async()=>{if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').hidden=true;};window.addEventListener('appinstalled',()=>{$('installBtn').hidden=true;});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
