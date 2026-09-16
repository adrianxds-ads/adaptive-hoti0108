import pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'.audit'/'v17';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='msedge')
 page=browser.new_page(viewport={'width':393,'height':851})
 page.goto(base);page.locator('#openConflicts').wait_for()
 assert page.locator('#conflictHomeCount').text_content()=='3'
 assert page.locator('#soundToggle').get_attribute('aria-pressed')=='true'
 page.locator('#openConflicts').click();assert page.locator('#conflictList .conflict-card').count()==3
 ids=page.locator('#conflictList .conflict-card').evaluate_all('(els)=>els.map(e=>e.dataset.questionId)')
 assert ids==['UF0080_UD1_Q07','UF0081_UD2_Q07','UF0082_FINAL_Q08'],ids
 page.screenshot(path=str(OUT/'conflicts.png'),full_page=True)
 first=page.locator('#conflictList .conflict-card').first
 first.locator('.evidence-link').first.click();page.locator('#returnContext').wait_for()
 assert 'Discrepancias' in page.locator('#returnContext').text_content()
 page.screenshot(path=str(OUT/'manual-return-conflicts.png'),full_page=True)
 page.locator('#returnContext').click();page.locator('#conflictList').wait_for();assert page.locator('#conflictList .conflict-card').count()==3
 page.locator('#conflicts .home-button').click();page.locator('#openFlash').click();page.locator('#flashCard').click();page.wait_for_timeout(450)
 assert page.locator('#flashCard .flash-manual-link').is_visible()
 qid=page.evaluate('flashList[flashIndex].id')
 page.screenshot(path=str(OUT/'flash-back.png'),full_page=True)
 page.locator('#flashCard .flash-manual-link').click();page.locator('#returnContext').wait_for()
 assert 'Flashcards' in page.locator('#returnContext').text_content()
 page.locator('#returnContext').click();page.locator('#flashCard').wait_for();assert page.evaluate('flashList[flashIndex].id')==qid
 page.locator('#flash .home-button').click();page.locator('#soundToggle').click();assert page.locator('#soundToggle').get_attribute('aria-pressed')=='false'
 page.reload();page.locator('#openFlash').wait_for();assert page.locator('#soundToggle').get_attribute('aria-pressed')=='false'
 for width in [360,393,768,1280]:
  page.set_viewport_size({'width':width,'height':851});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 browser.close()
print('PASS: 3 manual discrepancies, flash manual link, contextual return, sound toggle persistence, 360-1280px layout.')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='msedge')
 page=browser.new_page(viewport={'width':393,'height':851});page.goto(base);page.locator('#openGame').wait_for();page.locator('#openGame').click();page.locator('#roundSize').select_option('10');page.locator('#startGame').click()
 qid=page.locator('#gameCard').get_attribute('data-question-id');letter=page.evaluate('byId.get(session.ids[session.index]).correct_answer');page.locator(f'#gameCard [data-answer="{letter}"]').click()
 page.locator('#feedback .evidence-link').first.click();page.locator('#returnContext').wait_for();assert 'Modo test' in page.locator('#returnContext').text_content()
 page.locator('#returnContext').click();page.locator('#gameCard').wait_for();assert page.locator('#gameCard').get_attribute('data-question-id')==qid;assert not page.locator('#feedback').is_hidden();browser.close()
server.shutdown();print('PASS: contextual manual return also restores answered test state.')
