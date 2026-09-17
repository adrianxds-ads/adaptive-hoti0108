'use strict';
const SPRINT_PREF_KEY='adaptive_hoti0108_sprint_v1',SPRINT_MS=20000,SPRINT_REVEAL_MS=5000;
let sprintPrefs={flash:false,game:false,exam:false},sprintHandle=null,sprintDeadline=0,sprintTotal=SPRINT_MS,sprintTarget=null,sprintExpire=null,sprintLastSecond=-1;
try{const x=JSON.parse(localStorage.getItem(SPRINT_PREF_KEY)||'null');if(x&&typeof x==='object')sprintPrefs={...sprintPrefs,...x};}catch{}
function saveSprintPrefs(){try{localStorage.setItem(SPRINT_PREF_KEY,JSON.stringify(sprintPrefs));}catch{}}
function sprintBeep(kind='tick'){
 if(!soundOn)return;
 try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=audioCtx||new AC();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind==='expire'?'sawtooth':'sine';o.frequency.value=kind==='expire'?170:kind==='last'?880:620;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(kind==='expire'?.11:.045,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+(kind==='expire'?.19:.075));o.connect(g).connect(audioCtx.destination);o.start(now);o.stop(now+(kind==='expire'?.21:.09));}catch{}
}
function hideSprintClock(){if(sprintTarget&&$(sprintTarget))$(sprintTarget).hidden=true;}
function stopSprintClock(){if(sprintHandle)clearInterval(sprintHandle);sprintHandle=null;sprintDeadline=0;sprintExpire=null;hideSprintClock();}
function sprintRemaining(){return sprintDeadline?Math.max(0,sprintDeadline-Date.now()):0;}
function paintSprintClock(){
 if(!sprintDeadline||!sprintTarget)return;const el=$(sprintTarget);if(!el)return;const left=Math.max(0,sprintDeadline-Date.now()),sec=Math.ceil(left/1000),ratio=Math.max(0,Math.min(1,left/sprintTotal));el.hidden=false;el.style.setProperty('--sprint-angle',`${ratio*360}deg`);el.classList.toggle('urgent',sec<=5);el.querySelector('.sprint-seconds').textContent=String(sec);if(sec<=5&&sec>0&&sec!==sprintLastSecond){sprintLastSecond=sec;sprintBeep(sec===1?'last':'tick');}if(left<=0){const fn=sprintExpire;stopSprintClock();sprintBeep('expire');if(fn)fn();}
}
function startSprintClock(target,ms=SPRINT_MS,total=SPRINT_MS,label='SPRINT',onExpire){stopSprintClock();const el=$(target);if(!el)return;sprintTarget=target;sprintTotal=total;sprintDeadline=Date.now()+Math.max(1,ms);sprintExpire=onExpire;sprintLastSecond=-1;el.innerHTML=`<div class="sprint-ring"><strong class="sprint-seconds">20</strong><small>s</small></div><div class="sprint-label"><b>⚡ ${label}</b><span>${Math.round(total/1000)} s</span></div>`;paintSprintClock();sprintHandle=setInterval(paintSprintClock,100);}
function setSprintControl(kind,on){sprintPrefs[kind]=Boolean(on);saveSprintPrefs();if(kind==='game'&&$('timeLimit'))$('timeLimit').disabled=sprintPrefs.game;if(kind==='flash'&&!$('flash').hidden)renderFlashcard();if(kind==='exam'&&!$('examSetup').hidden)$('examSprint').checked=sprintPrefs.exam;}
function bindSprintControls(){for(const kind of ['flash','game','exam']){const el=$(kind+'Sprint');if(!el)continue;el.checked=!!sprintPrefs[kind];el.onchange=()=>setSprintControl(kind,el.checked);}if($('timeLimit'))$('timeLimit').disabled=!!sprintPrefs.game;}
const basePause=pause;
pause=function(){if(session?.sprint&&session.answers.length===session.index&&sprintTarget==='gameSprintClock')session.sprintRemainingMs=sprintRemaining()||session.sprintRemainingMs||SPRINT_MS;stopSprintClock();basePause();};
const baseRenderFlashcard=renderFlashcard,baseFlipFlashcard=flipFlashcard;
function startFlashSprint(){if(!sprintPrefs.flash||$('flash').hidden||!flashList.length)return;startSprintClock('flashSprintClock',SPRINT_MS,SPRINT_MS,'SPRINT',()=>{if(!flashRevealed){baseFlipFlashcard();startSprintClock('flashSprintClock',SPRINT_REVEAL_MS,SPRINT_REVEAL_MS,'RESPUESTA',()=>{if(flashRevealed&&flashIndex<flashList.length-1)baseFlipFlashcard();});}});}
renderFlashcard=function(){stopSprintClock();baseRenderFlashcard();if(sprintPrefs.flash)startFlashSprint();};
flipFlashcard=function(){stopSprintClock();const before=flashRevealed;baseFlipFlashcard();if(sprintPrefs.flash&&!before&&flashRevealed)startSprintClock('flashSprintClock',SPRINT_REVEAL_MS,SPRINT_REVEAL_MS,'RESPUESTA',()=>{if(flashRevealed&&flashIndex<flashList.length-1)baseFlipFlashcard();});};
const baseStart=start,baseRenderGame=renderGame,baseAnswer=answer,baseNext=next;
start=function(ids=null){const useSprint=!ids&&!!sprintPrefs.game;if(useSprint){const old=$('timeLimit').value;$('timeLimit').value='0';baseStart(ids);$('timeLimit').value=old;if(session){session.sprint=true;session.sprintRemainingMs=SPRINT_MS;state.active=session;save();renderGame();}}else baseStart(ids);};
renderGame=function(){stopSprintClock();baseRenderGame();if(session?.sprint&&session.answers.length===session.index){const remain=session.sprintRemainingMs||SPRINT_MS;delete session.sprintRemainingMs;startSprintClock('gameSprintClock',remain,SPRINT_MS,'SPRINT',()=>{if(!session||session.answers.length!==session.index)return;const idx=session.index;baseAnswer(null);setTimeout(()=>{if(session?.sprint&&session.index===idx&&session.answers.length>idx)next();},1800);});}};
answer=function(letter){if(session?.sprint)stopSprintClock();baseAnswer(letter);};
next=function(){if(session?.sprint){stopSprintClock();session.sprintRemainingMs=SPRINT_MS;}baseNext();};

const baseValidExam=validExam,baseOpenExamSetup=openExamSetup,baseStartExam=startExam,baseRenderExam=renderExam,baseGoExamQuestion=goExamQuestion;
validExam=function(ex){return ex&&Array.isArray(ex.ids)&&ex.ids.length===EXAM_SIZE&&new Set(ex.ids).size===EXAM_SIZE&&ex.ids.every(id=>byId.has(id))&&Number.isFinite(ex.startedAt)&&Array.isArray(ex.choices)&&ex.choices.length===EXAM_SIZE&&ex.choices.every(x=>x===null||x==='timeout'||['a','b','c','d'].includes(x));};
function saveExamSprintRemaining(){const ex=state.activeExam;if(ex?.sprint&&ex.choices?.[ex.index]===null&&sprintTarget==='examSprintClock'){ex.sprintRemaining=ex.sprintRemaining||Array(EXAM_SIZE).fill(SPRINT_MS);ex.sprintRemaining[ex.index]=sprintRemaining()||ex.sprintRemaining[ex.index]||SPRINT_MS;}stopSprintClock();}
openExamSetup=function(){saveExamSprintRemaining();baseOpenExamSetup();const pending=validExam(state.activeExam);$('examSprintSetting').hidden=pending;if(!pending)$('examSprint').checked=!!sprintPrefs.exam;};
startExam=function(){const pending=validExam(state.activeExam),useSprint=!pending&&$('examSprint').checked;baseStartExam();if(!pending&&validExam(state.activeExam)){const ex=state.activeExam;ex.sprint=useSprint;if(useSprint)ex.sprintRemaining=Array(EXAM_SIZE).fill(SPRINT_MS);save();renderExam();}};
function nextExamSprint(i){const ex=state.activeExam;if(!ex||!ex.sprint||ex.index!==i)return;const next=ex.choices.findIndex((x,j)=>j>i&&x===null),fallback=ex.choices.findIndex(x=>x===null);if(next>=0)goExamQuestion(next);else if(fallback>=0)goExamQuestion(fallback);else submitExam();}
renderExam=function(){saveExamSprintRemaining();baseRenderExam();const ex=state.activeExam;if(!ex?.sprint){$('examSprintClock').hidden=true;return;}ex.sprintRemaining=ex.sprintRemaining||Array(EXAM_SIZE).fill(SPRINT_MS);const i=ex.index,choice=ex.choices[i],opts=[...$('examCard').querySelectorAll('.option')];if(choice===null){for(const o of opts)o.onclick=()=>{if(!state.activeExam?.sprint||state.activeExam.index!==i||state.activeExam.choices[i]!==null)return;stopSprintClock();ex.choices[i]=o.dataset.answer;ex.sprintRemaining[i]=0;save();sprintBeep('tick');renderExam();setTimeout(()=>nextExamSprint(i),420);};startSprintClock('examSprintClock',ex.sprintRemaining[i]||SPRINT_MS,SPRINT_MS,'SPRINT',()=>{if(!state.activeExam?.sprint||state.activeExam.index!==i||state.activeExam.choices[i]!==null)return;ex.choices[i]='timeout';ex.sprintRemaining[i]=0;save();renderExam();setTimeout(()=>nextExamSprint(i),1050);});}else{stopSprintClock();for(const o of opts)o.disabled=true;if(choice==='timeout')$('examCard').classList.add('sprint-timeout');}};
goExamQuestion=function(i){saveExamSprintRemaining();baseGoExamQuestion(i);};
const baseRenderExamResults=renderExamResults;
renderExamResults=function(result){stopSprintClock();baseRenderExamResults(result);if(result.sprint)$('examResultNote').textContent=($('examResultNote').textContent+' Sprint 20 s activado.').trim();};

const baseHome=home;
home=function(){saveExamSprintRemaining();stopSprintClock();baseHome();};
window.addEventListener('pagehide',()=>{saveExamSprintRemaining();stopSprintClock();});
bindSprintControls();
// exam-focus.js binds direct function references before this module loads; rebind wrapped handlers.
$('openExam').onclick=openExamSetup;$('startExam').onclick=startExam;$('anotherExam').onclick=openExamSetup;

// Rebind buttons that captured the pre-Sprint home function.
document.querySelectorAll('.home-button').forEach(b=>b.onclick=home);$('pauseGame').onclick=home;
