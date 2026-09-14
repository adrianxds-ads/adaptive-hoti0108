"""Regression test for every documentary evidence deep-link and highlight."""
import json,pathlib,threading,http.server,functools,urllib.parse,os
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
EV=json.loads((ROOT/'data/question-evidence.json').read_text(encoding='utf-8'))['questions']
OUT=ROOT.parent/'quiz-qa';OUT.mkdir(exist_ok=True)
items=[]
for qid,r in EV.items():
 items.append((qid,'',r))
 if r.get('conflictEvidence'):items.append((qid,'conflict',r['conflictEvidence']))
 for i,x in enumerate(r.get('additionalEvidence',[]),1):items.append((qid,f'additional{i}',x))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/'
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True,**({'channel':os.environ['BROWSER_CHANNEL']} if os.environ.get('BROWSER_CHANNEL') else {}));ctx=browser.new_context(viewport={'width':393,'height':851});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for n,(qid,variant,e) in enumerate(items,1):
  query='?evidence='+urllib.parse.quote(qid)+(('&variant='+urllib.parse.quote(variant)) if variant else '')
  url=f"{base}manuals.html{query}#{e['unit']}/{e['page']}";page.goto(url,wait_until='domcontentloaded');page.locator('#pageImage').wait_for(state='visible');page.locator('#evidenceHighlight').wait_for(state='visible');page.locator('#evidenceStatus').wait_for(state='visible')
  assert page.locator('#unit').text_content()==e['unit'],(qid,variant,'unit');assert page.locator('#pageNumber').input_value()==str(e['page']),(qid,variant,'page');box=page.locator('#evidenceHighlight').bounding_box();assert box and box['width']>3 and box['height']>3,(qid,variant,'highlight')
  if n in (1,len(items)):page.screenshot(path=str(OUT/f'evidence-{n}.png'),full_page=False)
 assert not errors,errors;browser.close()
server.shutdown();print(f'PASS: {len(items)} documentary deep-links open the correct manual page with a visible highlight and evidence status.')