"""Regression for Campus-master MF0268_3 hierarchy."""
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
 assert page.locator('#courseMap .course-activity').count()==16
 assert page.locator('#courseMap .uf-sequence').all_text_contents()==['2.1 · UF0049','2.2 · UF0077']
 assert page.locator('#courseMap .ud-sequence').first.text_content()=='2.1.1'
 assert page.locator('#courseMap .activity-sequence').first.text_content()=='2.1.1.1'
 assert page.locator('#courseMap .course-activity .activity-sequence').last.text_content()=='2.1.3.6'
 assert 'Módulo Formativo 3 oficial' in page.locator('#activeModuleMeta').text_content()
 assert '16 actividades · Campus confirmado' in page.locator('.course-uf').first.text_content()
 assert 'pendiente de validación directa en Campus' in page.locator('.course-uf').nth(1).text_content()
 assert page.locator('.course-uf').nth(1).locator('.course-activity').count()==0
 assert '19/10' in page.locator('#moduleExamCard .exam-confirmed').text_content()
 assert '10:00' in page.locator('#moduleExamCard .exam-confirmed').text_content()
 assert '22/10' in page.locator('#moduleExamCard .exam-provisional').text_content()
 assert 'MF1074_3' in page.locator('.archive-head').text_content()
 page.goto(base+'manuals.html?unit=UF0049');page.locator('#pageImage').wait_for(state='visible');assert page.locator('#unit').text_content()=='UF0049';assert page.locator('#totalPages').text_content().strip()=='/ 206'
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: M02 itinerary / MF3 official split, 16 confirmed UF0049 activities, UF0077 unknown count, 11 UDs and exam dates.')
