"""Regression for UF0049 RAW PDF + rendered manual reader."""
import hashlib,json,os,pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=ROOT/'content'/'UF0049'/'source'/'HOTI0108_MF0268_3_UF0049_MANUAL_RAW.pdf'
PAGES=ROOT/'content'/'UF0049'/'pages'
EXPECTED='0f3489ae0cbe8ea3e4231f020db9f40f9c6a53286d783b6b3a60be04989f1d5c'
assert RAW.exists() and hashlib.sha256(RAW.read_bytes()).hexdigest()==EXPECTED
imgs=sorted(PAGES.glob('*.webp'))
assert len(imgs)==206 and imgs[0].name=='001.webp' and imgs[-1].name=='206.webp'
idx=json.loads((ROOT/'data'/'manuals-index.json').read_text(encoding='utf-8-sig'))
m=next(x for x in idx['modules'] if x['id']=='MF0268_3')
u=next(x for x in m['units'] if x['id']=='UF0049')
assert u['pageCount']==206 and u['readerType']=='scanned-pages'
assert u['rawPdf'].endswith('HOTI0108_MF0268_3_UF0049_MANUAL_RAW.pdf')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}))
 page=browser.new_page(viewport={'width':393,'height':851});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 base='http://127.0.0.1:'+str(server.server_port)+'/'
 page.goto(base+'manuals.html?unit=UF0049')
 page.locator('#pageImage').wait_for(state='visible')
 assert page.locator('#unit').text_content()=='UF0049'
 assert page.locator('#totalPages').text_content().strip()=='/ 206'
 assert page.locator('#rawPdf').is_visible()
 assert page.locator('#rawPdf').get_attribute('href').endswith('content/UF0049/source/HOTI0108_MF0268_3_UF0049_MANUAL_RAW.pdf')
 page.locator('#pageNumber').fill('112');page.locator('#pageForm button[type="submit"]').click()
 page.locator('#pageImage').wait_for(state='visible');assert page.locator('#pageNumber').input_value()=='112'
 assert page.locator('#pageImage').get_attribute('src').endswith('112.webp')
 page.locator('#pageNumber').fill('206');page.locator('#pageForm button[type="submit"]').click()
 page.locator('#pageImage').wait_for(state='visible');assert page.locator('#pageNumber').input_value()=='206'
 assert page.locator('#pageImage').get_attribute('src').endswith('206.webp')
 page.locator('#back').click()
 first=page.locator('.manual-module').first
 assert 'MF0268_3' in first.text_content()
 assert 'UF0049' in first.text_content() and '206 páginas' in first.text_content()
 assert 'UF0077' in first.text_content() and 'Manual pendiente' in first.text_content()
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: UF0049 RAW hash, 206 rendered pages, reader navigation, RAW link, active-module ordering and UF0077 pending state.')
