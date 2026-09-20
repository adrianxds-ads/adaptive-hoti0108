"""Regression for HOTI0108 JOTI activity list + independent activity workspace."""
import os,pathlib,threading,http.server,functools,json
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}))
 context=browser.new_context(viewport={'width':393,'height':851},permissions=['clipboard-read','clipboard-write'])
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 base='http://127.0.0.1:'+str(server.server_port)+'/'
 page.goto(base+'activities.html');page.locator('.activity-list-item').first.wait_for()
 assert page.locator('.activity-list-item').count()==16
 assert page.locator('.pending-unit-card').count()==1
 page.locator('.activity-list-item').first.click();page.wait_for_load_state('networkidle')
 assert page.url.endswith('activity.html?activity=2.1.1.1')
 assert 'CALIDAD Y PRODUCTIVIDAD' in page.locator('.activity-sheet-head h1').text_content()
 assert page.locator('.question-pair').count()==4
 assert page.locator('a',has_text='Volver a actividades').count()==1
 assert page.locator('#copyOfficialActivity').count()==1
 assert page.locator('#copyOfficialJson').count()==1
 assert page.locator('#copyFullActivity').count()==1
 project_url='https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/project'
 assert page.locator('[data-chatgpt-project]').last.get_attribute('href')==project_url
 assert 'Enlazar chat de actividad' in page.locator('#activityChatAction').text_content()
 page.once('dialog',lambda d:d.accept('https://chatgpt.com/share/test-activity-link'))
 page.locator('#activityChatAction').click()
 assert 'Abrir chat de actividad' in page.locator('#activityChatAction').text_content()
 stored=json.loads(page.evaluate("localStorage.getItem('adaptive_hoti0108_activity_hub_v1')"))
 assert stored['records']['2.1.1.1']['links']['chat']=='https://chatgpt.com/share/test-activity-link'
 page.locator('#copyOfficialJson').click()
 copied=json.loads(page.evaluate('navigator.clipboard.readText()'))
 assert copied['sequence']=='2.1.1.1'
 assert copied['taskTitle']=='CALIDAD Y PRODUCTIVIDAD'
 assert len(copied['questions'])==4
 page.locator('[data-field="work.introduction"]').fill('INTRO APROBADA')
 page.locator('[data-question-answer="0"]').fill('RESPUESTA PROPIA 1')
 page.locator('[data-field="work.blog"]').fill('BLOG FINAL')
 page.locator('#activityStatus').select_option('in_progress')
 page.locator('#saveActivity').click();page.reload();page.locator('.question-pair').first.wait_for()
 assert page.locator('[data-field="work.introduction"]').input_value()=='INTRO APROBADA'
 assert page.locator('[data-question-answer="0"]').input_value()=='RESPUESTA PROPIA 1'
 assert page.locator('[data-field="work.blog"]').input_value()=='BLOG FINAL'
 assert page.locator('#activityStatus').input_value()=='in_progress'
 # Recovered official Campus resources stay linked to their independent activity sheets.
 page.goto(base+'activity.html?activity=2.1.1.2');page.wait_for_load_state('networkidle')
 assert page.locator('.official-source-image').count()==1
 assert page.locator('.official-source-image').get_attribute('src').endswith('content/UF0049/activity-assets/2.1.1.2/campus_embedded_1.png')
 page.locator('#copyOfficialJson').click();copied=json.loads(page.evaluate('navigator.clipboard.readText()'))
 assert copied['sourceAssets'][0]['confidence']=='exact'
 page.goto(base+'activity.html?activity=2.1.1.4');page.wait_for_load_state('networkidle')
 assert 'Una serie de objetivos' in page.locator('.source-question').first.text_content()
 page.goto(base+'activity.html?activity=2.1.1.5');page.wait_for_load_state('networkidle')
 assert page.locator('.source-assets-panel a').first.get_attribute('href')=='https://www.youtube.com/watch?v=h-rVEJGI-ws'
 page.goto(base+'activity.html?activity=2.1.3.4');page.wait_for_load_state('networkidle')
 assert page.locator('.source-assets-panel a').first.get_attribute('href').endswith('UF0049_UD3_ACTIVIDAD_4_EJERCICIO_TEORICO_PRACTICO_AA.pdf')
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: 16-card menu, independent activity page, source text/JSON copy, resolution workspace and persistence.')
