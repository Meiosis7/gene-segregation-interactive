from pathlib import Path
import base64

root = Path(__file__).resolve().parent
src = root / 'src'
page = (src / 'template.html').read_text(encoding='utf-8')
for marker, filename in {
    'STYLES': 'style.css',
    'GENETICS': 'genetics.js',
    'APP': 'app.js',
}.items():
    placeholder = f'/* {marker} */'
    assert page.count(placeholder) == 1
    page = page.replace(placeholder, (src / filename).read_text(encoding='utf-8'))

page = page.replace('</style>', (src / 'art-v2.css').read_text() + '</style>')
for name in ('biology-atlas.png', 'chromatids.png'):
    data = base64.b64encode((root / 'assets' / name).read_bytes()).decode()
    page = page.replace('ASSET:' + name, 'data:image/png;base64,' + data)
(root / 'index.html').write_text(page, encoding='utf-8')
