from pathlib import Path
import base64
import hashlib
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--web", action="store_true", help="生成使用内容指纹图片的公开网页版本")
args = parser.parse_args()

root = Path(__file__).resolve().parent
src = root / 'src'
page = (src / 'template.html').read_text(encoding='utf-8')
for marker, filename in {
    'STYLES': 'style.css',
    'GENETICS': 'genetics.js',
    'APP': 'app.js',
    'MOTION': 'motion.js',
}.items():
    placeholder = f'/* {marker} */'
    assert page.count(placeholder) == 1
    page = page.replace(placeholder, (src / filename).read_text(encoding='utf-8'))

page = page.replace('</style>', (src / 'art-v2.css').read_text() + '</style>')
for name in ('biology-atlas.png', 'chromatids.png'):
    data = (root / 'assets' / name).read_bytes()
    if args.web:
        asset = Path(name).stem + '.' + hashlib.sha256(data).hexdigest()[:12] + '.png'
        (root / 'assets' / asset).write_bytes(data)
        url = 'assets/' + asset
    else:
        url = 'data:image/png;base64,' + base64.b64encode(data).decode()
    page = page.replace('ASSET:' + name, url)
(root / 'index.html').write_text(page, encoding='utf-8')
