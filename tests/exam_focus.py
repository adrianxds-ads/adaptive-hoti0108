"""Browser integration checks for the exam lifecycle and independent clocks."""
import os, pathlib, threading, http.server, functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(os.environ.get('HOTI_EXAM_ROOT','C:/Users/adria/adaptive-hoti0108-exam'))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel=os.environ.get('BROWSER_CHANNEL','msedge'))
 context=browser.new_context(viewport={'width':393,'height':851})
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:'+str(server.server_port));page.locator('#openExam').wait_for()
 page.evaluate('localStorage.setItem("adaptive_hoti_manual_reader_v1","preserve-manual");root.keepMe="legacy";save()')
 page.locator('#openExam').click();assert page.locator('#examTimed').is_checked()
 page.locator('#startExam').click()
 assert page.evaluate('state.activeExam.ids.length===20&&new Set(state.activeExam.ids).size===20')
 assert page.evaluate('new Set(state.activeExam.ids.map(id=>byId.get(id).uf)).size===3')
 assert page.evaluate('new Set(state.activeExam.ids.map(id=>byId.get(id)).filter(q=>q.ud!=="FINAL").map(q=>q.uf+q.ud)).size===7')
 assert '14:' in page.locator('#examCountdown').text_content() or '15:00' in page.locator('#examCountdown').text_content()
 assert page.locator('#submitExam').is_disabled()
 page.locator('#examCard [data-answer="a"]').click()
 page.locator('#examCard [data-answer="b"]').click()
 assert page.evaluate('state.activeExam.choices[0]==="b"&&Object.keys(state.attempts).length===0')
 assert page.locator('#examCard .correct,#examCard .wrong,#examCard .evidence-card').count()==0
 assert page.locator('#examCard [data-answer="b"]').get_attribute('aria-pressed')=='true'
 start=page.evaluate('state.activeExam.startedAt');ids=page.evaluate('state.activeExam.ids')
 page.locator('#exam .home-button').click();page.locator('#openExam').click();page.locator('#resumeExam').click()
 page.reload();page.locator('#openExam').wait_for();page.locator('#openExam').click();page.locator('#resumeExam').click()
 assert page.evaluate('state.activeExam.startedAt')==start and page.evaluate('state.activeExam.ids')==ids
 assert page.evaluate('state.activeExam.choices[0]')=='b'
 page.evaluate('state.activeExam.startedAt=Date.now()-901000;save();updateExamClock()')
 assert page.locator('#examOvertime').is_visible() and 'Tiempo excedido' in page.locator('#examCountdown').text_content()
 assert page.evaluate('state.activeExam!==null&&state.examHistory===undefined')
 page.locator('#removeExamTimer').click();assert page.locator('#examCountdown').is_hidden()
 page.reload();page.locator('#openExam').wait_for();page.locator('#openExam').click();page.locator('#resumeExam').click()
 assert page.locator('#examCountdown').is_hidden()
 # All selections go through real option buttons; changing selection never grades early.
 for i in range(20):
  page.locator('#examQuestionNav button').nth(i).click()
  letter=page.evaluate('byId.get(state.activeExam.ids[state.activeExam.index]).correct_answer')
  page.locator('#examCard [data-answer="'+letter+'"]').click()
 assert page.locator('#submitExam').is_enabled()
 for width in [360,393,768,1280]:
  page.set_viewport_size({'width':width,'height':851})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('#examCard .option').evaluate_all('(els)=>els.every((e,i)=>!i||e.getBoundingClientRect().top>=els[i-1].getBoundingClientRect().bottom)')
 page.locator('#submitExam').click();assert '20 de 20' in page.locator('#examResultHeadline').text_content()
 assert page.locator('#examReview details').count()==20
 assert page.evaluate('state.activeExam===null&&state.examHistory.length===1&&Object.values(state.attempts).reduce((n,a)=>n+a.count,0)===20')
 frozen=page.evaluate('state.lastExam.elapsedMs');page.evaluate('submitExam();updateExamClock()');assert page.evaluate('state.lastExam.elapsedMs')==frozen
 page.locator('#anotherExam').click();assert page.locator('#examTimed').is_checked()
 page.locator('#examTimed').uncheck();page.locator('#startExam').click();assert page.locator('#examCountdown').is_hidden()
 assert page.evaluate('state.activeExam.initiallyTimed===false')
 # Focus counts only foreground learning and never backfills a sleep/idle interval.
 assert page.evaluate('document.hasFocus()')
 page.evaluate('focusDirtyMs=0;focusData.byDate={};focusActivity=Date.now();focusLastTick=Date.now()-1000;focusTick()')
 assert 900<=page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)')<=1600
 page.evaluate('focusActivity=Date.now()-100000;focusLastTick=Date.now()-1000')
 before=page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)');page.evaluate('focusTick()')
 assert page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)')==before
 page.evaluate('focusActivity=Date.now();focusLastTick=Date.now()-3600000;focusTick()')
 assert page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)')-before<=1600
 page.evaluate('Object.defineProperty(document,"visibilityState",{value:"hidden",configurable:true});focusLastTick=Date.now()-1000')
 before=page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)');page.evaluate('focusTick()')
 assert page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)')==before
 page.evaluate('delete document.visibilityState;flushFocus()')
 assert page.evaluate('JSON.parse(localStorage.getItem(FOCUS_KEY)).byDate[localFocusDay()]>0')
 page.locator('#exam .home-button').click()
 page.evaluate('focusLastTick=Date.now()-1000');before=page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)');page.evaluate('focusTick()')
 assert page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)')==before
 page.locator('#openStudy').click();assert page.locator('#studyQuestion').is_visible()
 page.locator('#study .home-button').click();page.locator('#openGame').click();page.locator('#startGame').click()
 letter=page.evaluate('byId.get(session.ids[session.index]).correct_answer');page.locator('#gameCard [data-answer="'+letter+'"]').click()
 assert 'CORRECTO' in page.locator('#feedback').text_content()
 page.locator('#pauseGame').click();page.locator('#openStats').click();assert page.locator('#examHistory button').count()==1
 page.locator('#examHistory button').click();assert '20 de 20' in page.locator('#examResultHeadline').text_content()
 assert page.evaluate('JSON.parse(localStorage.getItem(STORAGE_KEY)).keepMe')=='legacy'
 assert page.evaluate('localStorage.getItem("adaptive_hoti_manual_reader_v1")')=='preserve-manual'
 page.evaluate('navigator.serviceWorker.ready');page.reload();page.locator('#openExam').wait_for();context.set_offline(True);page.reload();page.locator('#openExam').click();page.locator('#resumeExam').click();assert page.locator('#examCard').is_visible();context.set_offline(False)
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: 20 balanced unique questions, deferred grading, answer changes, resume/reload, overtime, timer removal, untimed exam, focus idle/background/sleep/menu, persistence, offline, history, existing modes, 360–1280px.')

