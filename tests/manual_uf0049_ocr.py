"""Regression for UF0049 OCR layer tied to RAW PDF."""
import hashlib,json,os,pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OCR=ROOT/'content'/'UF0049'/'source'/'HOTI0108_MF0268_3_UF0049_MANUAL_TRANSCRIPCION_OCR.json'
RAW=ROOT/'content'/'UF0049'/'source'/'HOTI0108_MF0268_3_UF0049_MANUAL_RAW.pdf'
j=OCR.read_text(encoding='utf-8');d=json.loads(j)
assert hashlib.sha256(OCR.read_bytes()).hexdigest()=='8c215d1d8258804c3ed72e2d8a4bf17edca42a0fa9feec9838cc7a504a558029'
assert d['fuente']['unidad_formativa']=='UF0049' and d['fuente']['modulo_formativo']=='MF0268_3'
assert d['fuente']['sha256']==hashlib.sha256(RAW.read_bytes()).hexdigest()
assert d['fuente']['numero_paginas_pdf']==206 and len(d['paginas'])==206
assert 'UF0080' not in j and 'MF1074_3' not in j
assert all(p['pagina_pdf']==i for i,p in enumerate(d['paginas'],1))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}))
 page=browser.new_page(viewport={'width':393,'height':851});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 base='http://127.0.0.1:'+str(server.server_port)+'/'
 page.goto(base+'manuals.html?unit=UF0049');page.locator('#pageImage').wait_for(state='visible')
 assert page.locator('#viewOcr').is_visible() and page.locator('#ocrSearchPanel').is_visible()
 page.locator('#viewOcr').click();page.locator('#ocrPage').wait_for(state='visible')
 assert 'UF0049' in page.locator('#ocrText').text_content()
 page.locator('#pageNumber').fill('2');page.locator('#pageForm button[type="submit"]').click();page.locator('#ocrPage').wait_for(state='visible')
 t=page.locator('#ocrText').text_content();assert 'Unidad Formativa UF0049' in t and 'MF0268_3' in t
 assert page.locator('#pageImage').is_hidden()
 page.locator('#viewImage').click();page.locator('#pageImage').wait_for(state='visible');assert page.locator('#ocrPage').is_hidden()
 page.locator('#ocrSearchPanel').click();page.locator('#ocrQuery').fill('Servqual')
 page.locator('#ocrResults button').first.wait_for();assert page.locator('#ocrResults button').count()>=1
 page.locator('#ocrResults button').first.click();page.locator('#ocrPage').wait_for(state='visible')
 assert 'Servqual' in page.locator('#ocrText').text_content()
 page.goto(base+'manuals.html#UF0080/1');page.locator('#pageImage').wait_for(state='visible')
 assert page.locator('#unit').text_content()=='UF0080' and page.locator('#viewOcr').is_hidden()
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: canonical UF0049/MF0268 OCR, 206 aligned pages, RAW hash linkage, image/OCR toggle, full-text search and legacy manuals isolated.')

