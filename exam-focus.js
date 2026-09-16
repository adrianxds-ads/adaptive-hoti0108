'use strict';
// Focus Time follows Adaptive English: visible, focused use; 90-second idle cutoff.
const FOCUS_KEY='adaptive_hoti0108_focus_v1',EXAM_SIZE=20,EXAM_LIMIT_MS=15*60*1000;
let focusData={byDate:{}},focusCanSave=true,focusView='home',focusActivity=Date.now(),focusLastTick=Date.now(),focusDirtyMs=0;
try{const d=JSON.parse(localStorage.getItem(FOCUS_KEY)||'null');if(d&&d.byDate&&typeof d.byDate==='object')focusData=d;}catch{focusCanSave=false;}
function localFocusDay(ms=Date.now()){const d=new Date(ms);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function clockText(ms){const seconds=Math.floor(Math.max(0,ms)/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds/60)%60,s=seconds%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function focusMinutes(ms){return `${Math.floor(Math.max(0,ms)/60000)} min` ;}
function focusSwitch(view){focusTick();focusView=view;focusActivity=focusLastTick=Date.now();flushFocus();renderFocus();}
function focusTick(now=Date.now()){
 const from=focusLastTick;focusLastTick=now;
 if(!['study','flash','conflicts','game','results','exam','examResults'].includes(focusView)||document.visibilityState!=='visible'||!document.hasFocus())return;
 // Cap stalled callbacks so computer sleep never becomes study time.
 const end=Math.min(now,focusActivity+90000),dt=Math.max(0,Math.min(1600,end-from));if(!dt)return;
 const day=localFocusDay(end);focusData.byDate[day]=(Number(focusData.byDate[day])||0)+dt;focusDirtyMs+=dt;
 if(focusView==='exam'&&state.activeExam)state.activeExam.focusMs=(state.activeExam.focusMs||0)+dt;
 if(focusView==='game'&&session)session.focusMs=(session.focusMs||0)+dt;
 if(focusDirtyMs>=15000)flushFocus();
}
function flushFocus(){
 if(!focusDirtyMs)return;
 if(focusCanSave){try{localStorage.setItem(FOCUS_KEY,JSON.stringify(focusData));}catch{focusCanSave=false;notice();}}
 else notice();
 focusDirtyMs=0;save();
}
function renderFocus(){
 const today=Number(focusData.byDate[localFocusDay()])||0,total=Object.values(focusData.byDate).reduce((n,v)=>n+(Number(v)||0),0);
 $('focusToday').textContent=clockText(today);$('focusTotal').textContent=focusMinutes(total);
 const active=['study','game','results','exam','examResults'].includes(focusView)&&document.visibilityState==='visible'&&document.hasFocus()&&Date.now()-focusActivity<90000;
 $('focusStatus').textContent=active?'Contando tiempo activo':'En pausa';
}
function focusInteraction(){focusTick();focusActivity=Date.now();renderFocus();}
['pointerdown','keydown','touchstart','scroll'].forEach(ev=>document.addEventListener(ev,focusInteraction,{passive:true}));
document.addEventListener('visibilitychange',()=>{focusLastTick=Date.now();if(document.visibilityState==='hidden')flushFocus();else focusActivity=Date.now();renderFocus();updateExamClock();});
window.addEventListener('blur',()=>{focusTick();flushFocus();renderFocus();});
window.addEventListener('focus',()=>{focusActivity=focusLastTick=Date.now();renderFocus();});
window.addEventListener('pagehide',()=>{focusTick();flushFocus();save();});
// Balance the 20 questions over all three UFs and sample every available UD first.
function selectExamQuestions(){
 const units=E.shuffle([...new Set(bank.map(q=>q.uf))]);
 if(bank.length<EXAM_SIZE||units.length!==3)throw Error('No hay suficientes preguntas de las tres unidades.');
 const chosen=[];
 units.forEach((uf,i)=>{
  const count=Math.floor(EXAM_SIZE/units.length)+(i<EXAM_SIZE%units.length?1:0),pool=bank.filter(q=>q.uf===uf);
  const uds=E.shuffle([...new Set(pool.filter(q=>q.ud!=='FINAL').map(q=>q.ud))]);
  const picks=uds.slice(0,count).map(ud=>E.shuffle(pool.filter(q=>q.ud===ud))[0]);
  picks.push(...E.shuffle(pool.filter(q=>!picks.some(p=>p.id===q.id))).slice(0,count-picks.length));chosen.push(...picks);
 });
 if(chosen.length!==EXAM_SIZE)throw Error('No hay suficientes preguntas para un examen equilibrado.');
 return E.shuffle(chosen).map(q=>q.id);
}
function validExam(ex){return ex&&Array.isArray(ex.ids)&&ex.ids.length===EXAM_SIZE&&new Set(ex.ids).size===EXAM_SIZE&&ex.ids.every(id=>byId.has(id))&&Number.isFinite(ex.startedAt)&&Array.isArray(ex.choices)&&ex.choices.length===EXAM_SIZE&&ex.choices.every(x=>x===null||['a','b','c','d'].includes(x));}
function openExamSetup(){
 pause();show('examSetup');$('examTimed').checked=true;
 const pending=validExam(state.activeExam);$('resumeExam').hidden=!pending;$('startExam').hidden=pending;
 $('examSetupNote').textContent=pending?'Tienes un examen pendiente. Continúalo para completar las 20 preguntas.':'20 preguntas distintas, repartidas entre UF0080, UF0081 y UF0082. Corrección al terminar.';
 $('examTimeSetting').hidden=pending;
}
function startExam(){
 if(validExam(state.activeExam)){resumeExam();return;}
 let ids;try{ids=selectExamQuestions();}catch(e){$('examSetupNote').textContent=e.message;return;}
 state.activeExam={ids,choices:Array(EXAM_SIZE).fill(null),index:0,startedAt:Date.now(),focusMs:0,timed:$('examTimed').checked,initiallyTimed:$('examTimed').checked};
 save();show('exam');renderExam();
}
function resumeExam(){if(!validExam(state.activeExam)){openExamSetup();return;}state.activeExam.index=Math.max(0,Math.min(19,Number(state.activeExam.index)||0));show('exam');renderExam();}
function examAnswered(ex){return ex.choices.filter(x=>x!==null).length;}
function renderExam(){
 const ex=state.activeExam;if(!validExam(ex)){openExamSetup();return;}
 const q=byId.get(ex.ids[ex.index]),card=$('examCard');
 // Reuse the vertical answer layout but never the test grading handlers.
 renderPrompt(card,q,true);card.querySelector('h2').id='examQuestion';card.querySelector('.options').setAttribute('aria-labelledby','examQuestion');
 for(const o of card.querySelectorAll('.option')){const selected=o.dataset.answer===ex.choices[ex.index];o.classList.toggle('exam-selected',selected);o.setAttribute('aria-pressed',String(selected));o.onclick=()=>{focusTick();ex.choices[ex.index]=o.dataset.answer;save();renderExam();};}
 $('examPosition').textContent=`Pregunta ${ex.index+1} de 20`;$('examAnswered').textContent=`${examAnswered(ex)} / 20 respondidas`;
 $('examProgress').value=examAnswered(ex);$('examPrev').disabled=ex.index===0;$('examNext').disabled=ex.index===19;
 $('submitExam').disabled=examAnswered(ex)!==EXAM_SIZE;
 $('examQuestionNav').replaceChildren();ex.ids.forEach((id,i)=>{const b=node('button',String(i+1));b.type='button';b.classList.toggle('answered',ex.choices[i]!==null);b.setAttribute('aria-label',`Pregunta ${i+1}${ex.choices[i]!==null?', respondida':', pendiente'}`);if(i===ex.index)b.setAttribute('aria-current','step');b.onclick=()=>goExamQuestion(i);$('examQuestionNav').append(b);});
 updateExamClock();
}
function goExamQuestion(i){const ex=state.activeExam;if(!ex)return;focusTick();ex.index=i;save();renderExam();$('examPosition').scrollIntoView({block:'start'});}
function updateExamClock(){
 const ex=state.activeExam;if(!ex||!$('exam')||$('exam').hidden)return;
 const elapsed=Math.max(0,Date.now()-ex.startedAt),remaining=EXAM_LIMIT_MS-elapsed;
 $('examElapsed').textContent=`Tiempo transcurrido · ${clockText(elapsed)}`;
 $('examFocus').textContent=`Focus Time · ${clockText(ex.focusMs||0)}`;
 $('examCountdown').hidden=!ex.timed;$('removeExamTimer').hidden=!ex.timed;
 $('examCountdown').textContent=remaining>0?`Tiempo restante · ${clockText(Math.ceil(remaining/1000)*1000)}`:`Tiempo excedido · +${clockText(-remaining)}`;
 $('examCountdown').classList.toggle('urgent',remaining<=60000);
 const overtime=ex.timed&&remaining<=0;$('examOvertime').hidden=!overtime;
}
function submitExam(){
 const ex=state.activeExam;if(!validExam(ex)||examAnswered(ex)!==EXAM_SIZE)return;
 focusTick();flushFocus();const finishedAt=Date.now();
 const answers=ex.ids.map((id,i)=>{const q=byId.get(id),g=E.grade(q,ex.choices[i]==='timeout'?null:ex.choices[i]);return {id,answer:ex.choices[i],kind:g.kind,reason:g.reason||null,timestamp:finishedAt};});
 for(const a of answers){const old=state.attempts[a.id]||{count:0,correct:0,wrong:0,neutral:0};state.attempts[a.id]={...old,count:(old.count||0)+1,[a.kind]:(old[a.kind]||0)+1,lastKind:a.kind,lastAnswer:a.answer};}
 const totals=E.summarize(answers),scored=totals.correct+totals.wrong;
 const result={...ex,answers,finishedAt,elapsedMs:Math.max(0,finishedAt-ex.startedAt),scored,correct:totals.correct,wrong:totals.wrong,neutral:totals.neutral};
 state.examHistory=[...(state.examHistory||[]),result].slice(-100);state.lastExam=result;state.activeExam=null;save();renderExamResults(result);
}
function renderExamResults(result){
 show('examResults');$('examResultHeadline').textContent=result.scored?`${result.correct} de ${result.scored} correctas · ${(10*result.correct/result.scored).toFixed(1)} / 10`:'Sin preguntas puntuables';
 $('examResultTime').textContent=`Tiempo del examen: ${clockText(result.elapsedMs)} · Focus Time: ${clockText(result.focusMs||0)}`;
 $('examResultNote').textContent=[result.neutral?`${result.neutral} pregunta(s) con matiz, sin penalización y excluidas de la nota.`:'20 preguntas corregidas.',result.timed?(result.elapsedMs>EXAM_LIMIT_MS?`Tiempo excedido: +${clockText(result.elapsedMs-EXAM_LIMIT_MS)}.`:'Terminado dentro de los 15 minutos.'):(result.initiallyTimed?'Temporizador retirado durante el examen.':'Examen sin temporizador.')].join(' ');
 const review=$('examReview');review.replaceChildren();result.answers.forEach((a,i)=>{const q=byId.get(a.id);if(!q)return;const d=node('details',undefined,`review-item review-${a.kind}`);d.append(node('summary',`${i+1}. ${a.kind==='correct'?'✓ CORRECTA':a.kind==='neutral'?'⚠ CON MATIZ':'✕ INCORRECTA'} · ${q.question}`),node('p',a.answer==='timeout'?'Tu respuesta: Sin respuesta · tiempo agotado':`Tu respuesta: ${a.answer.toUpperCase()} · ${q.options[a.answer]}`),answerBody(q));review.append(d);});
 renderExamHistory();
}
function renderExamHistory(){
 const rows=state.examHistory||[];if(!$('examHistory'))return;
 $('examHistory').replaceChildren();if(!rows.length){$('examHistory').append(node('p','Todavía no has terminado ningún examen.','note'));return;}
 rows.slice(-10).reverse().forEach(r=>{const b=node('button',`${new Date(r.finishedAt).toLocaleDateString()} · ${r.correct}/${r.scored} · ${clockText(r.elapsedMs)}`,'wide');b.onclick=()=>renderExamResults(r);$('examHistory').append(b);});
}
$('openExam').onclick=openExamSetup;$('startExam').onclick=startExam;$('resumeExam').onclick=resumeExam;
$('examPrev').onclick=()=>goExamQuestion(state.activeExam.index-1);$('examNext').onclick=()=>goExamQuestion(state.activeExam.index+1);
$('submitExam').onclick=submitExam;$('anotherExam').onclick=openExamSetup;
$('removeExamTimer').onclick=()=>{if(!state.activeExam)return;state.activeExam.timed=false;save();updateExamClock();};
setInterval(()=>{focusTick();renderFocus();updateExamClock();},1000);
renderFocus();
