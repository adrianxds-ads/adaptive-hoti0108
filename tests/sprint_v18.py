import pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'.audit'/'v18';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='msedge');page=browser.new_page(viewport={'width':393,'height':851});page.goto(base);page.locator('#openFlash').wait_for()
 page.locator('#openFlash').click();page.locator('#flashSprint').check();page.locator('#flashSprintClock').wait_for(state='visible')
 assert int(page.locator('#flashSprintClock .sprint-seconds').text_content()) in [19,20]
 first=page.locator('#flashPosition').text_content();page.evaluate('sprintExpire()');page.wait_for_timeout(550)
 assert 'is-revealed' in page.locator('#flashCard').get_attribute('class')
 assert page.locator('#flashCard .manual-snapshot').count()==1
 page.wait_for_function("document.querySelector('.manual-snapshot-canvas').width>0")
 page.screenshot(path=str(OUT/'flash-sprint-reveal.png'),full_page=True)
 page.evaluate('sprintExpire()');page.wait_for_timeout(150);assert page.locator('#flashPosition').text_content()!=first
 page.locator('#flash .home-button').click();page.locator('#openGame').click();page.locator('#gameSprint').check();page.locator('#startGame').click();page.locator('#gameSprintClock').wait_for(state='visible')
 idx=page.evaluate('session.index');page.evaluate('sprintExpire()');page.locator('#feedback').wait_for(state='visible');assert 'TIEMPO AGOTADO' in page.locator('#feedback').text_content();page.wait_for_timeout(2000);assert page.evaluate('session.index')==idx+1
 page.locator('#pauseGame').click();page.locator('#openExam').click();page.locator('#examSprint').check();page.locator('#startExam').click();page.locator('#examSprintClock').wait_for(state='visible')
 assert page.evaluate('state.activeExam.sprint===true');page.evaluate('sprintExpire()');page.wait_for_timeout(1200);assert page.evaluate("state.activeExam.choices[0]==='timeout'")
 assert page.evaluate('state.activeExam.index')==1
 for width in [360,393,768,1280]:
  page.set_viewport_size({'width':width,'height':851});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 browser.close()
server.shutdown();print('PASS: Sprint 20s flash/test/exam, timeout auto-advance, manual snapshot, responsive layout.')
