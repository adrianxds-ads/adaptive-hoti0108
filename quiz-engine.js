/* Official question text/options are never changed. Pure scoring policy shared with tests. */
(function(root){
 function grade(q,answer){
  if(q.validation_status==='possible_platform_key_error')return {kind:'neutral',key:q.correct_answer,reason:'unknown-platform-key'};
  if(answer===q.correct_answer)return {kind:'correct',key:q.correct_answer};
  if(q.ambiguous&&(q.answer_variants||[]).some(v=>v.answer===answer&&v.answer&&v.status==='also_supported_by_official_manual'))return {kind:'neutral',key:q.correct_answer,reason:'manual-alternative'};
  return {kind:'wrong',key:q.correct_answer};
 }
 function shuffle(values,random=Math.random){const a=values.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function summarize(answers){return answers.reduce((s,a)=>{s[a.kind]++;s.points+=a.points||0;s.ms+=a.responseMs||0;return s;},{correct:0,wrong:0,neutral:0,points:0,ms:0});}
 function special(q){
  if(q.validation_status==='possible_platform_key_error')return 'Clave académica: A, respaldada por el manual. La plataforma penalizó A y no se ha podido identificar su clave. Esta pregunta no puntúa ni rompe la racha.';
  if(q.ambiguous)return 'Clave para el examen: C. La opción B también está respaldada por el manual; aquí no se penaliza, pero la plataforma espera C.';
  return '';
 }
 const api={grade,shuffle,summarize,special};root.HotiQuiz=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
