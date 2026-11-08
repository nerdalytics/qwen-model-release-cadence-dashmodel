import io
import json
import re
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = 'https://nerdalytics.github.io/qwen-model-release-cadence-dashmodel/'
DESCRIPTION = 'Qwen release dates and updates, with EMA and average estimates of the next release date. These are estimates, not announcements.'
source = (ROOT / 'favicon.svg').read_bytes()
for filename, size in [('favicon-32x32.png', 32), ('favicon-48x48.png', 48), ('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512)]:
    png = cairosvg.svg2png(bytestring=source, output_width=size, output_height=size)
    rendered = Image.open(io.BytesIO(png)).convert('RGBA')
    icon = Image.new('RGB', rendered.size, '#090b13')
    icon.paste(rendered, mask=rendered.getchannel('A'))
    icon.save(ROOT / filename, optimize=True)
png = cairosvg.svg2png(bytestring=source, output_width=256, output_height=256)
Image.open(io.BytesIO(png)).save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
manifest = {
    'id': './',
    'name': 'Cadence | Qwen release radar',
    'short_name': 'Cadence',
    'description': DESCRIPTION,
    'lang': 'en',
    'start_url': './',
    'scope': './',
    'display': 'standalone',
    'background_color': '#090b13',
    'theme_color': '#090b13',
    'icons': [
        {'src': './icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': './icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
    ],
}
(ROOT / 'site.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
page = ROOT / 'index.html'
html = page.read_text()
html = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m[1] + DESCRIPTION + m[2], html)
html = re.sub(r'<link\b[^>]*\brel="(?:icon|apple-touch-icon|manifest)"[^>]*>\s*', '', html)
html = re.sub(r'<meta\b[^>]*\bname="color-scheme"[^>]*>\s*', '', html)
html = re.sub(r'<script\b[^>]*\btype="application/ld\+json"[^>]*>.*?</script>\s*', '', html, flags=re.S)
structured = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Cadence | Qwen release radar',
    'url': BASE_URL,
    'description': DESCRIPTION,
    'inLanguage': 'en',
    'about': {'@type': 'Thing', 'name': 'Qwen model release cadence'},
}
head = '''<meta name="color-scheme" content="dark">
<link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48" href="./favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="./favicon-48x48.png">
<link rel="icon" type="image/svg+xml" href="./favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png">
<link rel="manifest" href="./site.webmanifest">
<script type="application/ld+json">
''' + json.dumps(structured, ensure_ascii=False, indent=2) + '\n</script>\n'
html = html.replace('</head>', head + '</head>', 1)
html = re.sub(r'<p id="made-with"[^>]*>.*?</p>\s*', '', html, flags=re.S)
html = html.replace('</footer>', '</footer>\n<p id="made-with" style="text-align:center;font-size:var(--utility);color:#c4cde0;margin:0;padding:0 0 2rem">Made with <span role="img" aria-label="love">❤️</span> and Qwen</p>', 1)
page.write_text(html)
print('Generated favicon, home-screen icons, manifest, and structured page metadata.')
