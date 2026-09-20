"""Regression for app-native reflowable HOTI manual reading."""
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
 page.goto(base+'manuals.html?unit=UF0049')
 page.locator('#ocrPage').wait_for(state='visible')
 assert page.locator('#pageImage').is_hidden()
 assert page.locator('#textTools').is_visible() and page.locator('#imageTools').is_hidden()
 assert page.locator('#fontLabel').text_content()=='20 px'
 page.locator('#pageNumber').fill('2');page.locator('#pageForm button[type="submit"]').click();page.locator('#ocrPage').wait_for(state='visible')
 assert page.locator('#ocrText p').count()>=1
 assert 'Unidad Formativa UF0049' in page.locator('#ocrText').text_content()
 page.locator('#fontUp').click();assert page.locator('#fontLabel').text_content()=='22 px'
 size=page.locator('#ocrText').evaluate("e=>getComputedStyle(e).fontSize");assert size=='22px',size
 before=page.locator('#lineHeight').text_content();page.locator('#lineHeight').click();assert page.locator('#lineHeight').text_content()!=before
 width_before=page.locator('#textWidth').text_content();page.locator('#textWidth').click();assert page.locator('#textWidth').text_content()!=width_before
 page.reload();page.locator('#ocrPage').wait_for(state='visible');assert page.locator('#fontLabel').text_content()=='22 px'
 page.locator('#viewImage').click();page.locator('#pageImage').wait_for(state='visible')
 assert page.locator('#imageTools').is_visible() and page.locator('#textTools').is_hidden()
 page.locator('#viewOcr').click();page.locator('#ocrPage').wait_for(state='visible')
 page.locator('#ocrSearchPanel').click();page.locator('#ocrQuery').fill('EFQM')
 page.locator('#ocrResults button').first.wait_for();page.locator('#ocrResults button').first.click();page.locator('#ocrPage').wait_for(state='visible')
 assert page.locator('#viewOcr').get_attribute('aria-pressed')=='true'
 assert page.locator('#pageStatus').text_content().find('Modo lectura')>=0
 page.goto(base+'manuals.html#UF0080/1');page.locator('#pageImage').wait_for(state='visible')
 assert page.locator('#viewOcr').is_hidden() and page.locator('#imageTools').is_visible()
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: UF0049 opens in reflowed reading mode; font, spacing and width controls persist; search jumps into reading; legacy manuals remain visual.')
