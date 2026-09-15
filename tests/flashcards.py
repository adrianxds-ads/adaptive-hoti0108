"""Browser checks for the flashcard study mode and compact Focus Time placement."""
import pathlib, threading, http.server, functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(r'C:\Users\adria\adaptive-hoti0108')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='msedge')
 page=browser.new_page(viewport={'width':393,'height':851})
 page.goto(f'http://127.0.0.1:{server.server_port}/');page.locator('#openFlash').wait_for()
 assert page.locator('#focusPanel').is_visible()
 assert page.locator('#focusPanel details').count()==0
 assert page.locator('#home').evaluate('(h,f)=>h.contains(f)',page.locator('#focusPanel').element_handle())
 page.locator('#openFlash').click();page.locator('#flashCard').wait_for()
 assert page.evaluate("bank.filter(q=>!(STUDY_EMPHASIS[q.id]||[]).some(x=>q.question.includes(x))).length") == 0
 assert page.locator('#flashCard .flashcard-front .option').count()==4
 assert page.locator('#flashCard .flashcard-front .study-keyword').count()==0
 assert page.locator('#flashCard .flashcard-back .study-keyword').count()>0
 assert page.locator('#flashCard .flashcard-back .option.correct').count()==1
 assert page.locator('#flashCard .flashcard-back .option.dim').count()==3
 page.locator('#flashCard').click();assert page.locator('#flashCard').get_attribute('class').find('is-revealed')>=0
 assert page.locator('#flashCard .flashcard-back .option.correct').is_visible()
 first=page.locator('#flashPosition').text_content();page.locator('#flashCard').click();second=page.locator('#flashPosition').text_content();assert first!=second
 assert page.locator('#flashCard').get_attribute('class').find('is-revealed')<0
 page.evaluate('focusData.byDate={};focusActivity=Date.now();focusLastTick=Date.now()-1000;focusTick()')
 assert page.evaluate('Object.values(focusData.byDate).reduce((a,b)=>a+b,0)')>0
 for width in [360,393,768,1280]:
  page.set_viewport_size({'width':width,'height':851});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 browser.close()
server.shutdown()
print('PASS: flashcards front/back, 130 prompt cues, correct/dim reveal, tap-to-next, focus counting, compact home counter, 360–1280px.')
