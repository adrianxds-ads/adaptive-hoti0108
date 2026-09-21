"""Regression for HOTI0108 JOTI activity list + independent activity workspace."""
import os,pathlib,threading,http.server,functools,json,base64
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
 assert page.url.endswith('activity.html?activity=2.1.1.1&v=321')
 assert 'CALIDAD Y PRODUCTIVIDAD' in page.locator('.activity-sheet-head h1').text_content()
 assert page.locator('.question-pair').count()==4
 assert page.locator('a',has_text='Volver a actividades').count()==1
 assert page.locator('#copyOfficialActivity').count()==1
 assert page.locator('#copyOfficialJson').count()==1
 assert page.locator('#copyFullActivity').count()==1
 assert page.locator('.recommendation-photos-panel').count()==1
 assert page.locator('.recommended-photo-slot:not(.user-photo-slot)').count()==3
 assert page.locator('.user-photo-slot').count()==1
 assert page.locator('#userPhotoInput').count()==1
 assert page.locator('.photo-placement').count()==4
 # Recommended text is attached to the exact section it supports: intro + 4 answers + blog.
 assert page.locator('.recommended-section-box').count()==6
 assert page.locator('[data-copy-recommended="introduction"]').count()==1
 assert page.locator('[data-copy-recommended="answer:0"]').count()==1
 assert page.locator('[data-copy-recommended="blog"]').count()==1
 assert 'Esta actividad relaciona dos ideas' in page.locator('.recommended-section-text').first.text_content()
 page.locator('[data-copy-recommended="introduction"]').click()
 assert 'Esta actividad relaciona dos ideas' in page.evaluate('navigator.clipboard.readText()')
 project_url='https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/project'
 canonical_chat='https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/c/6ab06873-9c58-83ed-80b1-cebe6a15d60e'
 assert page.locator('[data-chatgpt-project]').last.get_attribute('href')==project_url
 assert 'Abrir chat de esta actividad' in page.locator('#activityChatAction').text_content()
 assert page.locator('#activityChatAction').get_attribute('href')==canonical_chat
 stored=json.loads(page.evaluate("localStorage.getItem('adaptive_hoti0108_activity_hub_v1')"))
 assert stored['records']['2.1.1.1']['links']['chat']==canonical_chat
 chat_map={
  '2.1.1.1':'https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/c/6ab06873-9c58-83ed-80b1-cebe6a15d60e',
  '2.1.1.2':'https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/c/6ab06896-bf5c-83eb-a222-c9f4d140225c',
  '2.1.1.3':'https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/c/6ab068a2-b88c-83eb-8933-27142792fe1f',
  '2.1.1.4':'https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/c/6ab068ae-44b8-83eb-a4c3-d5319ff40b75',
  '2.1.1.5':'https://chatgpt.com/g/g-p-6a09e7ebe58081918f53c26aef9c4a2f-certificat-hoti0108/c/6ab068ba-0fc8-83eb-ab88-95ad4cfa6fb9'}
 for seq,url in chat_map.items():
  page.goto(base+'activity.html?activity='+seq);page.wait_for_load_state('networkidle')
  assert page.locator('#activityChatAction').get_attribute('href')==url,(seq,page.locator('#activityChatAction').get_attribute('href'))
 page.goto(base+'activity.html?activity=2.1.1.1');page.wait_for_load_state('networkidle')
 page.locator('#copyOfficialJson').click()
 copied=json.loads(page.evaluate('navigator.clipboard.readText()'))
 assert copied['sequence']=='2.1.1.1'
 assert copied['taskTitle']=='CALIDAD Y PRODUCTIVIDAD'
 assert len(copied['questions'])==4
 # Full-screen editor opens from every writing fragment and syncs live with the underlying activity field.
 page.locator('[data-field="work.introduction"]').click()
 assert page.locator('#fragmentEditor').is_visible()
 editor_box=page.locator('#fragmentEditorTextarea').bounding_box()
 assert editor_box['x']<=1 and editor_box['width']>=392,(editor_box,page.viewport_size)
 assert page.locator('#fragmentEditorTitle').text_content().startswith('1. Introducci')
 page.locator('#fragmentEditorTextarea').fill('INTRO APROBADA DESDE EDITOR')
 assert page.locator('#fragmentEditorCount').text_content().startswith('4')
 page.locator('#fragmentEditorClose').click()
 assert not page.locator('#fragmentEditor').is_visible()
 assert page.locator('[data-field="work.introduction"]').input_value()=='INTRO APROBADA DESDE EDITOR'
 page.locator('[data-question-answer="0"]').click()
 assert page.locator('#fragmentEditor').is_visible()
 page.locator('#fragmentEditorTextarea').fill('RESPUESTA PROPIA 1')
 page.locator('#fragmentEditorClose').click()
 page.locator('[data-field="work.blog"]').click()
 page.locator('#fragmentEditorTextarea').fill('BLOG FINAL')
 page.locator('#fragmentEditorClose').click()
 page.locator('#activityStatus').select_option('in_progress')
 page.locator('#saveActivity').click();page.reload();page.locator('.question-pair').first.wait_for()
 assert page.locator('[data-field="work.introduction"]').input_value()=='INTRO APROBADA DESDE EDITOR'
 assert page.locator('[data-question-answer="0"]').input_value()=='RESPUESTA PROPIA 1'
 assert page.locator('[data-field="work.blog"]').input_value()=='BLOG FINAL'
 assert page.locator('#activityStatus').input_value()=='in_progress'
 tiny_png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6n6sAAAAASUVORK5CYII=')
 page.locator('#userPhotoInput').set_input_files({'name':'foto-prueba.png','mimeType':'image/png','buffer':tiny_png})
 page.locator('#removeUserPhoto').wait_for()
 stored=json.loads(page.evaluate("localStorage.getItem('adaptive_hoti0108_activity_hub_v1')"))
 assert stored['records']['2.1.1.1']['recommendation']['userPhoto']['dataUrl'].startswith('data:image/')
 page.locator('#removeUserPhoto').click()
 assert page.locator('#userPhotoInput').count()==1
 stored=json.loads(page.evaluate("localStorage.getItem('adaptive_hoti0108_activity_hub_v1')"))
 assert stored['records']['2.1.1.1']['recommendation']['userPhoto'] is None
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
