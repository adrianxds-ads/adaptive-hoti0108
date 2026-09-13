const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../quiz-engine.js');const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/questions-mf1074.json'),'utf8')).questions;
assert.equal(bank.length,130);assert.equal(new Set(bank.map(q=>q.id)).size,130);
for(const q of bank){const original=JSON.stringify(q);for(const letter of ['a','b','c','d']){const g=E.grade(q,letter);if(!q.ambiguous)assert.equal(g.kind,letter===q.correct_answer?'correct':'wrong');}assert.equal(JSON.stringify(q),original);}
const amb=bank.find(q=>q.id==='UF0081_UD2_Q07'),unknown=bank.find(q=>q.id==='UF0082_FINAL_Q08');
assert.equal(E.grade(amb,'c').kind,'correct');assert.equal(E.grade(amb,'b').kind,'neutral');assert.equal(E.grade(amb,'a').kind,'wrong');
for(const a of ['a','b','c','d',null])assert.equal(E.grade(unknown,a).kind,'neutral');
assert.equal(E.grade(bank[0],null).kind,'wrong');
assert.deepEqual(E.summarize([{kind:'correct',points:10},{kind:'wrong',points:0},{kind:'neutral',points:0}]),{correct:1,wrong:1,neutral:1,points:10,ms:0});
const copy=bank.slice(),shuffled=E.shuffle(bank,()=>.2);assert.deepEqual(bank,copy);assert.equal(shuffled.length,bank.length);assert.deepEqual(new Set(shuffled.map(q=>q.id)),new Set(bank.map(q=>q.id)));
console.log('PASS: 130 records preserved, ordinary answer keys, ambiguity policy, unknown key exclusion, timeouts, shuffle integrity.');
