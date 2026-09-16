import pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='msedge');page=browser.new_page(viewport={'width':393,'height':851});page.goto(base);page.locator('#openExam').wait_for();page.locator('#openExam').click();page.locator('#examSprint').check();page.locator('#startExam').click();page.locator('#examSprintClock').wait_for(state='visible');page.wait_for_timeout(900)
 before=page.evaluate('sprintRemaining()');page.locator('#exam .home-button').click();saved=page.evaluate('state.activeExam.sprintRemaining[0]');assert 17000<saved<before<20000,(saved,before)
 page.locator('#openExam').click();page.locator('#resumeExam').click();page.locator('#examSprintClock').wait_for(state='visible');after=page.evaluate('sprintRemaining()');assert after<=saved+300,(after,saved)
 page.evaluate("const ex=state.activeExam;ex.choices=ex.ids.map((id,i)=>i===0?'timeout':byId.get(id).correct_answer);save();submitExam();")
 page.locator('#examResults').wait_for(state='visible');assert 'Sin respuesta · tiempo agotado' in page.locator('#examReview').text_content();browser.close()
server.shutdown();print('PASS: sprint exam preserves remaining time across save/resume and grades timeout as wrong.')
