"""Regression checks for multi-module dashboard and document intake."""
import os,pathlib,threading,http.server,functools,tempfile
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}))
 ctx=browser.new_context(viewport={'width':393,'height':851});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 base='http://127.0.0.1:'+str(server.server_port)+'/'
 page.goto(base);page.locator('#openStudy').wait_for()
 assert 'MF0268_3' in page.locator('#activeModuleTitle').text_content()
 assert 'UF0049' in page.locator('#activeUnitTitle').text_content()
 assert page.locator('#courseDeadlines > div').count()>=1
 page.goto(base+'manuals.html');page.locator('.manual-module').first.wait_for()
 assert page.locator('.manual-module').count()==2
 assert page.locator('.book.is-pending').count()==2
 assert page.locator('#documentUnit option[value="UF0049"]').count()==1
 assert page.locator('#documentUnit option[value="UF0077"]').count()==1
 tmp=pathlib.Path(tempfile.gettempdir())/'HOTI0108_UF0049_TEST.txt';tmp.write_text('Documento de prueba HOTI0108',encoding='utf-8')
 page.locator('#documentFile').set_input_files(str(tmp))
 page.locator('#registerDocument').click()
 page.locator('.document-row').wait_for()
 assert 'UF0049' in page.locator('.document-row small').first.text_content()
 assert 'PENDIENTE DE PUBLICACIÓN' in page.locator('.document-row span').first.text_content()
 page.reload();page.locator('.document-row').wait_for()
 assert page.locator('.document-row').count()==1
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: MF0268 active dashboard, calendar-driven deadlines, multi-module manuals and SHA-staged document intake.')
