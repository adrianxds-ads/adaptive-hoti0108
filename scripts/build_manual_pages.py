"""Render complete official manuals for the mobile reader; never OCR/rewrite text."""
import argparse, hashlib, json, pathlib
import pymupdf as fitz
from PIL import Image, ImageChops
ROOT=pathlib.Path(__file__).resolve().parents[1]

def catalog_units(index):
    modules=index.get('modules') or [index.get('module')]
    return [u for m in modules if m for u in (m.get('units') or [])]

def build(source, unit_id=None):
    index=json.loads((ROOT/'data/manuals-index.json').read_text(encoding='utf-8-sig'))
    units=[u for u in catalog_units(index) if u.get('manual') and u.get('pageCount') and u.get('pageImages')]
    if unit_id:
        units=[u for u in units if u['id']==unit_id]
    if not units:
        raise SystemExit('No matching published manuals found')
    source=pathlib.Path(source)
    if source.is_file() and len(units)!=1:
        raise SystemExit('A source PDF file requires exactly one selected --unit')
    for unit in units:
        original=source if source.is_file() else source/unit['manual']
        raw=original.read_bytes()
        digest=hashlib.sha256(raw).hexdigest()
        assert digest==unit['sourceSha256'], f"Source differs: {unit['id']} {digest}"
        doc=fitz.open(original)
        assert len(doc)==unit['pageCount'], f"Page count differs: {unit['id']} {len(doc)}"
        dest=ROOT/'content'/unit['id']/'pages'
        dest.mkdir(parents=True,exist_ok=True)
        for old in dest.glob('*.webp'):
            old.unlink()
        for i,page in enumerate(doc):
            scale=1800/page.rect.width
            pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False)
            im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
            ink=ImageChops.difference(im.convert('L'),Image.new('L',im.size,255)).point(lambda p:255 if p>35 else 0)
            box=ink.getbbox()
            if box:
                im=im.crop((max(0,box[0]-30),max(0,box[1]-30),min(im.width,box[2]+30),min(im.height,box[3]+30)))
            output=dest/f'{i+1:03}.webp'
            im.save(output,'WEBP',quality=88,method=4)
            with Image.open(output) as check:
                check.load()
        total=sum(p.stat().st_size for p in dest.glob('*.webp'))
        print(unit['id'],len(doc),'pages',total,'bytes',flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('source',type=pathlib.Path)
    p.add_argument('--unit')
    args=p.parse_args()
    build(args.source,args.unit)
