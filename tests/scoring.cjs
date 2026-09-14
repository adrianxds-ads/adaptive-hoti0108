const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../quiz-engine.js');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/questions-mf1074.json'),'utf8')).questions;
const byId=Object.fromEntries(bank.map(q=>[q.id,q]));
assert.equal(bank.length,130);assert.equal(new Set(bank.map(q=>q.id)).size,130);
assert.deepEqual(bank.map(q=>q.global_index),Array.from({length:130},(_,i)=>i+1));
for(const q of bank){assert.ok(['a','b','c','d'].includes(q.correct_answer));assert.equal(q.correct_answer_text,q.options[q.correct_answer]);}
for(const q of bank.filter(q=>!q.ambiguous)){for(const letter of ['a','b','c','d'])assert.equal(E.grade(q,letter).kind,letter===q.correct_answer?'correct':'wrong');}
const q35=byId.UF0080_UD4_Q05;assert.equal(q35.correct_answer,'d');assert.equal(E.grade(q35,'d').kind,'correct');assert.equal(E.grade(q35,'a').kind,'wrong');
const q77=byId.UF0081_UD2_Q07;assert.equal(E.grade(q77,'c').kind,'correct');assert.equal(E.grade(q77,'b').kind,'neutral');assert.equal(E.grade(q77,'a').kind,'wrong');
const q106=byId.UF0082_UD1_Q06;assert.equal(E.grade(q106,'d').kind,'correct');assert.equal(E.grade(q106,'c').kind,'neutral');assert.equal(E.grade(q106,'a').kind,'wrong');
const q118=byId.UF0082_FINAL_Q08;assert.equal(E.grade(q118,'a').kind,'correct');for(const a of ['b','c','d'])assert.equal(E.grade(q118,a).kind,'neutral');assert.equal(E.grade(q118,null).kind,'wrong');
const q7=byId.UF0080_UD1_Q07;assert.equal(E.grade(q7,'a').kind,'correct');assert.match(E.special(q7),/7 regiones/);
assert.match(E.special(q35),/manual oficial/);assert.match(E.special(q77),/opción B/);assert.match(E.special(q106),/estudio se usa D/);assert.match(E.special(q118),/Clave académica: A/);
assert.equal(E.grade(bank[0],null).kind,'wrong');
assert.deepEqual(E.summarize([{kind:'correct',points:10},{kind:'wrong',points:0},{kind:'neutral',points:0}]),{correct:1,wrong:1,neutral:1,points:10,ms:0});
const copy=bank.slice(),shuffled=E.shuffle(bank,()=>.2);assert.deepEqual(bank,copy);assert.equal(shuffled.length,bank.length);assert.deepEqual(new Set(shuffled.map(q=>q.id)),new Set(bank.map(q=>q.id)));
console.log('PASS: 130 keys structurally valid; audit2 critical cases and conflict grading policy verified.');