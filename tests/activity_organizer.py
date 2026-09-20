"""Regression for HOTI0108 no-API activity organizer with UF0049 source import."""
import os,pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]

class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass

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
 assert page.locator('.sequence-chip').text_content()=='2.1.1.1'
 assert 'CALIDAD Y PRODUCTIVIDAD' in page.locator('.activity-sheet-head h1').text_content()
 assert 'Actividad 1_Caso práctico grupal' in page.locator('.activity-sheet-head').text_content()
 assert page.locator('.question-pair').count()==4
 assert 'Sonia' in page.locator('.source-text').first.text_content()
 assert page.locator('.manual-ref-list>div').count()==3
 assert page.locator('#copyFullActivity').count()==1
 assert page.locator('[data-field="official.statement"]').count()==0
 page.locator('[data-link="chat"]').fill('https://chatgpt.com/c/example')
 page.locator('[data-link="docs"]').fill('https://docs.google.com/document/d/example/edit')
 page.locator('[data-field="work.introduction"]').fill('INTRO APROBADA')
 page.locator('[data-question-answer="0"]').fill('RESPUESTA PROPIA 1')
 page.locator('[data-field="work.blog"]').fill('BLOG FINAL')
 page.locator('#activityStatus').select_option('in_progress')
 page.locator('#saveActivity').click()
 page.reload();page.locator('.question-pair').first.wait_for()
 assert page.locator('[data-field="work.introduction"]').input_value()=='INTRO APROBADA'
 assert page.locator('[data-question-answer="0"]').input_value()=='RESPUESTA PROPIA 1'
 assert page.locator('[data-field="work.blog"]').input_value()=='BLOG FINAL'
 assert page.locator('#activityStatus').input_value()=='in_progress'
 assert not errors,errors
 browser.close()

server.shutdown()
print('PASS: 16 UF0049 activities, read-only Campus source, question/work separation, manual refs, copy UI and persistence.')

