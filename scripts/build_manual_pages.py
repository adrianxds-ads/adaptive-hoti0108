"""Render complete official scanned manuals for the mobile reader; never OCR/rewrite text."""
import argparse, hashlib, json, pathlib, re
import fitz
from PIL import Image, ImageChops
ROOT=pathlib.Path(__file__).resolve().parents[1]
def build(source):
 index=json.loads((ROOT/'data/manuals-index.json').read_text(encoding='utf-8-sig'))
 for unit in index['module']['units']:
  original=source/unit['manual'];raw=original.read_bytes()
  assert hashlib.sha256(raw).hexdigest()==unit['sourceSha256'], 'Source differs: '+unit['id']
  doc=fitz.open(original); assert len(doc)==unit['pageCount']
  dest=ROOT/'content'/unit['id']/'pages';dest.mkdir(parents=True,exist_ok=True)
  for i,page in enumerate(doc):
   pix=page.get_pixmap(matrix=fitz.Matrix(1800/page.rect.width,1800/page.rect.width),alpha=False)
   im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
   # Trim only outside whitespace, preserving every nonwhite mark and a small margin.
   ink=ImageChops.difference(im.convert('L'),Image.new('L',im.size,255)).point(lambda p:255 if p>35 else 0)
   box=ink.getbbox()
   if box:im=im.crop((max(0,box[0]-30),max(0,box[1]-30),min(im.width,box[2]+30),min(im.height,box[3]+30)))
   output=dest/f'{i+1:03}.webp'
   im.save(output,'WEBP',quality=88,method=4)
   with Image.open(output) as check:check.load()
  print(unit['id'],len(doc),'pages',sum(p.stat().st_size for p in dest.glob('*.webp')),'bytes',flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source',type=pathlib.Path);build(p.parse_args().source)
