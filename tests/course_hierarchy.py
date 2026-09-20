"""Regression for HOTI0108 MF→UF→UD→activity hierarchy."""
import os,pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}))
 page=browser.new_page(viewport={'width':393,'height':851});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 base='http://127.0.0.1:'+str(server.server_port)+'/'
 page.goto(base);page.locator('#courseMap .course-uf').first.wait_for()
 assert page.locator('#courseMap .course-uf').count()==2
 assert page.locator('#courseMap .course-ud').count()==11
 assert page.locator('#courseMap .course-activity').count()==34
 assert page.locator('#courseMap .uf-sequence').all_text_contents()==['2.1 · UF0049','2.2 · UF0077']
 assert page.locator('#courseMap .ud-sequence').first.text_content()=='2.1.1'
 assert page.locator('#courseMap .activity-sequence').first.text_content()=='2.1.1.1'
 assert 'MF0268_3' in page.locator('#activeModuleTitle').text_content()
 assert 'UF0049' in page.locator('#activeUnitTitle').text_content()
 assert 'MF1074_3' in page.locator('.archive-head').text_content()
 assert 'solo a MF1074_3' in page.locator('.archive-head').text_content()
 page.locator('#openStudy').click();page.locator('#studyCard').wait_for();assert page.locator('#studyCard').count()==1
 page.goto(base+'manuals.html?unit=UF0049');page.locator('[data-unit="UF0049"]').wait_for();assert 'is-target' in page.locator('[data-unit="UF0049"]').get_attribute('class')
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: 2 UF, 11 UD, 34 activities, Maqueta 11 sequences, MF1074 archive isolation and UF manual targeting.')
