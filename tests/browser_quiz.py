"""Browser regression checks. Run with Playwright installed; optional BROWSER_CHANNEL=msedge."""
import os,json,pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
BANK=json.loads((ROOT/'data/questions-mf1074.json').read_text(encoding='utf-8-sig'))['questions'];BY_ID={q['id']:q for q in BANK}
OUT=pathlib.Path(os.environ.get('QUIZ_QA_DIR',str(ROOT.parent/'quiz-qa')));OUT.mkdir(exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}));ctx=browser.new_context(viewport={'width':393,'height':851});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 url='http://127.0.0.1:'+str(server.server_port)+'/'
 page.goto(url);page.locator('#openStudy').wait_for();page.evaluate('localStorage.setItem("adaptive_hoti0108_v1", JSON.stringify({keepMe: "existing", studyGame: {version:1,attempts:{},studyPositions:{},roundHistory:[]}})); localStorage.setItem("adaptive_hoti_manual_reader_v1", "manual-progress");');page.reload();page.locator('#openStudy').wait_for();page.screenshot(path=str(OUT/'home.png'),full_page=True)
 def stored():return page.evaluate('JSON.parse(localStorage.getItem("adaptive_hoti0108_v1"))')
 def seed(ids,remaining=None):
  active={'ids':ids,'index':0,'answers':[],'limit':30 if remaining is not None else 0,'streak':0,'bestStreak':0,'createdAt':1}
  if remaining is not None:active['remainingMs']=remaining
  page.evaluate('(s)=>{const d=JSON.parse(localStorage.getItem("adaptive_hoti0108_v1"));d.studyGame.active=s;localStorage.setItem("adaptive_hoti0108_v1",JSON.stringify(d));}',active);page.reload();page.locator('#resumeGame').click()
 page.locator('#openStudy').click();page.locator('#studySelection summary').click()
 for q in BANK:
  page.locator('#studyJump').select_option(q['id']);assert page.locator('#studyQuestion').text_content()==q['question'];assert page.locator('#studyCard .option-text').all_text_contents()==[q['options'][k] for k in 'abcd'];assert not page.locator('#studyCard details').evaluate('(e)=>e.open');page.locator('#studyCard summary').click();assert q['options'][q['correct_answer']] in page.locator('#studyCard .answer-body').text_content()
 assert stored()['studyGame']['attempts']=={};assert page.locator('#totalPoints').count()==0;assert page.locator('#roundPoints').count()==0
 # Evidence UI: every question has a documentary panel; three questions remain explicitly non-clean.
 for q in BANK:
  page.locator('#studyJump').select_option(q['id']);page.locator('#studyCard summary').click();assert page.locator('#studyCard .evidence-card').count()==1,q['id'];badge=page.locator('#studyCard .verification-badge').text_content();
  if q['id'] in ['UF0080_UD1_Q07','UF0081_UD2_Q07','UF0082_FINAL_Q08']:assert '⚠' in badge,q['id']
  else:assert 'VERIFICADA' in badge,q['id']
 page.locator('#studyJump').select_option(BANK[0]['id']);assert page.locator('#studyPrev').is_disabled();page.locator('#studyNext').click();assert page.locator('#studyCard').get_attribute('data-question-id')==BANK[1]['id']
 page.locator('#studyJump').select_option('UF0081_UD2_Q07');page.locator('#studyCard summary').click();assert 'AMBIGÜEDAD' in page.locator('#studyCard .verification-badge').text_content();assert page.locator('#studyCard .evidence-link').count()==2;page.locator('#studySelection summary').click();page.screenshot(path=str(OUT/'study.png'),full_page=True)
 assert float(page.locator('#studyQuestion').evaluate('(e)=>getComputedStyle(e).fontSize.replace("px", "")'))>=23
 assert float(page.locator('#studyCard .option').first.evaluate('(e)=>getComputedStyle(e).fontSize.replace("px", "")'))>=18.5
 colors=page.locator('#studyCard .option').evaluate_all('(els)=>els.map(e=>getComputedStyle(e).backgroundColor)')
 assert colors==['rgb(119, 83, 31)','rgb(31, 98, 100)','rgb(64, 85, 130)','rgb(116, 64, 90)'],colors
 page.locator('#study .home-button').click();page.locator('#openGame').click();assert page.locator('#timeLimit').input_value()=='0';page.locator('#gameUnit').select_option('UF0080');page.locator('#gameAssessment').select_option('UF0080_UD1');page.locator('#roundSize').select_option('10');page.locator('#startGame').click()
 for i in range(10):
  q=BY_ID[page.locator('#gameCard').get_attribute('data-question-id')];assert page.locator('#activeQuestion').text_content()==q['question'];assert page.locator('#gameCard .option-text').all_text_contents()==[q['options'][k] for k in 'abcd']
  if i==0:page.screenshot(path=str(OUT/'game.png'),full_page=True)
  letter=q['correct_answer'] if i<7 else next(k for k in 'abcd' if k!=q['correct_answer']);page.locator(f'#gameCard [data-answer="{letter}"]').click();page.locator(f'#gameCard [data-answer="{letter}"]').dispatch_event('click');assert len(stored()['studyGame']['active']['answers'])==i+1
  assert q['options'][q['correct_answer']] in page.locator('#feedback').text_content();assert 'Respuesta correcta' in page.locator('#feedback').text_content()
  if i==0:page.screenshot(path=str(OUT/'feedback.png'),full_page=True)
  page.locator('#nextQuestion').click()
 assert '7 de 10' in page.locator('#resultHeadline').text_content();assert 'puntos' not in page.locator('#results').text_content().lower();assert stored()['studyGame']['active'] is None;page.screenshot(path=str(OUT/'results.png'),full_page=True)
 page.locator('#retryMistakes').click()
 for i in range(3):
  q=BY_ID[page.locator('#gameCard').get_attribute('data-question-id')];page.locator(f'#gameCard [data-answer="{q["correct_answer"]}"]').click();page.locator('#nextQuestion').click()
 assert '3 de 3' in page.locator('#resultHeadline').text_content();page.locator('#results .home-button').click();assert page.locator('#pendingErrors').text_content()=='0';assert stored()['keepMe']=='existing';assert page.evaluate('localStorage.getItem("adaptive_hoti_manual_reader_v1")')=='manual-progress'
 seed(['UF0080_UD1_Q01','UF0080_UD1_Q02']);page.locator('#gameCard [data-answer="c"]').click();page.locator('#pauseGame').click();page.reload();page.locator('#resumeGame').click();assert not page.locator('#feedback').is_hidden();page.locator('#nextQuestion').click();assert page.locator('#gameCard').get_attribute('data-question-id')=='UF0080_UD1_Q02'
 seed(['UF0081_UD2_Q07']);page.locator('#gameCard [data-answer="b"]').click();assert 'Sin penalización' in page.locator('#feedback').text_content();page.locator('#nextQuestion').click();assert 'Sin preguntas puntuables' in page.locator('#resultHeadline').text_content()
 seed(['UF0082_FINAL_Q08']);page.locator('#gameCard [data-answer="a"]').click();assert 'correct' in page.locator('#feedback').get_attribute('class');page.locator('#nextQuestion').click();assert '1 de 1' in page.locator('#resultHeadline').text_content()
 for letter in 'bcd':
  seed(['UF0082_FINAL_Q08']);page.locator(f'#gameCard [data-answer="{letter}"]').click();assert 'neutral' in page.locator('#feedback').get_attribute('class');page.locator('#nextQuestion').click();assert 'Sin preguntas puntuables' in page.locator('#resultHeadline').text_content()
 seed(['UF0082_UD1_Q06']);page.locator('#gameCard [data-answer="c"]').click();assert 'neutral' in page.locator('#feedback').get_attribute('class');assert 'VERIFICADA' in page.locator('#feedback .verification-badge').text_content();assert page.locator('#feedback .special-note').count()==0;page.locator('#nextQuestion').click()
 seed(['UF0082_UD1_Q06']);page.locator('#gameCard [data-answer="d"]').click();assert 'correct' in page.locator('#feedback').get_attribute('class');page.locator('#nextQuestion').click();assert '1 de 1' in page.locator('#resultHeadline').text_content()
 seed(['UF0080_UD4_Q05']);page.locator('#gameCard [data-answer="d"]').click();assert 'correct' in page.locator('#feedback').get_attribute('class');assert 'Tarjetas de débito.' in page.locator('#feedback').text_content();page.locator('#nextQuestion').click()
 seed(['UF0080_UD1_Q01']);page.locator('#gameCard [data-answer="a"]').click();page.locator('#pauseGame').click();assert page.locator('#pendingErrors').text_content()=='1';assert page.locator('#clearErrors').is_visible();page.locator('#clearErrors').click();assert page.locator('#pendingErrors').text_content()=='0';assert page.locator('#clearErrors').is_hidden()
 seed(['UF0080_UD1_Q01'],0);page.locator('#feedback').wait_for();assert 'TIEMPO AGOTADO' in page.locator('#feedback').text_content();assert len(stored()['studyGame']['active']['answers'])==1;page.locator('#nextQuestion').click();page.locator('#results .home-button').click();assert page.locator('#resumeGame').is_hidden()
 longest=max(BANK,key=lambda q:len(q['question'])+sum(map(len,q['options'].values())))
 seed([longest['id']])
 for width in [360,393,768,1280]:
  page.set_viewport_size({'width':width,'height':851});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 page.set_viewport_size({'width':393,'height':851});page.screenshot(path=str(OUT/'long-question.png'),full_page=True)
 page.locator('#pauseGame').click();page.evaluate('navigator.serviceWorker.ready');page.reload();ctx.set_offline(True);page.reload();page.locator('#openStudy').click();page.locator('#studyQuestion').wait_for();ctx.set_offline(False)
 page.locator('#study .home-button').click();page.locator('#openStats').click();assert page.locator('#avsLegend .avs-legend-item').count()==15;assert page.locator('#scoreChart').is_visible();page.screenshot(path=str(OUT/'statistics.png'),full_page=True)
 assert not errors,errors;browser.close()
server.shutdown();print('PASS: literal display of all 130 questions/options/keys; complete scoring and mistake-retry rounds; resume; ambiguity; timeout; 360–1280px layout; legacy/manual progress; offline shell.');print('SCREENSHOTS='+str(OUT))
