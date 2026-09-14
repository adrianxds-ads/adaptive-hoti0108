/* Academic answer keys come from the reviewed bank. Platform conflicts stay as metadata. */
(function(root){
 function variant(q,answer,status){return (q.answer_variants||[]).some(v=>v.answer===answer&&v.answer&&v.status===status);}
 function grade(q,answer){
  if(q.validation_status==='possible_platform_key_error'){
   if(answer===q.correct_answer)return {kind:'correct',key:q.correct_answer,reason:'manual-key'};
   if(answer===null)return {kind:'wrong',key:q.correct_answer,reason:'timeout'};
   return {kind:'neutral',key:q.correct_answer,reason:'unknown-platform-key'};
  }
  if(answer===q.correct_answer)return {kind:'correct',key:q.correct_answer};
  if(q.validation_status==='manual_platform_conflict_academic_key_d'&&answer===q.platform_expected_answer)return {kind:'neutral',key:q.correct_answer,reason:'platform-conflict'};
  if(q.ambiguous&&variant(q,answer,'also_supported_by_official_manual'))return {kind:'neutral',key:q.correct_answer,reason:'manual-alternative'};
  return {kind:'wrong',key:q.correct_answer};
 }
 function shuffle(values,random=Math.random){const a=values.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function summarize(answers){return answers.reduce((s,a)=>{s[a.kind]++;s.points+=a.points||0;s.ms+=a.responseMs||0;return s;},{correct:0,wrong:0,neutral:0,points:0,ms:0});}
 function special(q){
  if(q.validation_status==='manual_internal_conflict_platform_matches_body')return 'El cuerpo del manual indica 33 oficinas en 8 áreas geográficas y el glosario indica 33 oficinas en 7 regiones geográficas. La plataforma coincide con el cuerpo del manual.';
  if(q.validation_status==='official_test_vs_manual_conflict')return 'El test conserva A (33 oficinas / 8 regiones), pero el manual revisado indica 33 oficinas / 7 regiones; esa formulación no aparece entre las opciones.';
  if(q.validation_status==='ambiguous_platform_vs_manual')return 'La plataforma espera C. La opción B también está respaldada por el manual; B se acepta sin penalización.';
  if(q.validation_status==='possible_platform_key_error')return 'Clave académica: A, respaldada por el manual. La plataforma penalizó A y no se ha identificado con seguridad qué otra clave esperaba.';
  if(q.validation_status==='manual_platform_conflict_academic_key_d')return 'Para estudio se usa D, respaldada por el manual. La fuente/plataforma conserva C; C se trata como respuesta con conflicto y no penaliza.';
  if(q.validation_status==='corrected_against_official_manual_platform_conflict')return `Para estudio se usa ${q.correct_answer.toUpperCase()}, respaldada por el manual oficial. La clave anterior de plataforma/fuente (${(q.platform_expected_answer||'?').toUpperCase()}) se conserva solo como trazabilidad.`;
  return '';
 }
 const api={grade,shuffle,summarize,special};root.HotiQuiz=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
