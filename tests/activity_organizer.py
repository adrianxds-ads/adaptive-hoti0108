"""Regression for HOTI0108 no-API activity organizer."""
import os,pathlib,threading,http.server,functools,json
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}))
 page=browser.new_page(viewport={'width':393,'height':851})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 base='http://127.0.0.1:'+str(server.server_port)+'/'
 page.goto(base+'activities.html?activity=2.1.1.1')
 page.locator('.activity-list-item').first.wait_for()
 assert page.locator('.activity-list-item').count()==16
 assert page.locator('.pending-unit-card').count()==1
 assert 'UF0077' in page.locator('.pending-unit-card').text_content()
 assert 'No se crean fichas' in page.locator('.pending-unit-card').text_content()
 assert page.locator('.sequence-chip').text_content()=='2.1.1.1'
 assert 'Actividad 1_Caso práctico grupal' in page.locator('.activity-sheet-head').text_content()
 assert page.locator('.identity-grid').text_content().count('MF0268_3')>=1
 page.locator('[data-link="chat"]').fill('https://chatgpt.com/c/example')
 page.locator('[data-link="docs"]').fill('https://docs.google.com/document/d/example/edit')
 page.locator('[data-field="official.statement"]').fill('ENUNCIADO LITERAL')
 page.locator('[data-field="work.introduction"]').fill('INTRO APROBADA')
 page.locator('#addQuestion').click()
 page.locator('[data-question-text="0"]').fill('Pregunta literal 1')
 page.locator('[data-question-answer="0"]').fill('Respuesta propia 1')
 page.locator('[data-field="work.blog"]').fill('BLOG FINAL')
 page.locator('#activityStatus').select_option('in_progress')
 page.locator('#saveActivity').click()
 page.reload();page.locator('.sequence-chip').wait_for()
 assert page.locator('[data-field="official.statement"]').input_value()=='ENUNCIADO LITERAL'
 assert page.locator('[data-field="work.introduction"]').input_value()=='INTRO APROBADA'
 assert page.locator('[data-question-text="0"]').input_value()=='Pregunta literal 1'
 assert page.locator('[data-question-answer="0"]').input_value()=='Respuesta propia 1'
 assert page.locator('[data-field="work.blog"]').input_value()=='BLOG FINAL'
 assert page.locator('#activityStatus').input_value()=='in_progress'
 data=page.evaluate("JSON.parse(localStorage.getItem('adaptive_hoti0108_activity_hub_v1'))")
 assert list(data['records'])==['2.1.1.1']
 assert data['records']['2.1.1.1']['links']['chat'].startswith('https://chatgpt.com/')
 page.goto(base);page.locator('#courseMap .course-activity').first.wait_for()
 assert page.locator('#courseMap .course-activity').first.get_attribute('href').endswith('activities.html?activity=2.1.1.1')
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: 16 unique UF0049 activity cards, UF0077 pending guard, source/work separation, question-response persistence, links/status and course-map deep links.')
