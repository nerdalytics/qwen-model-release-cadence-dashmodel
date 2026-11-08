import hashlib
import io
import json
import re
from datetime import date, timedelta
from html import escape
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
payload = json.loads((ROOT / 'data/releases.json').read_text())
rows = sorted(payload['releases'], key=lambda row: row['date'])
dates = [date.fromisoformat(row['date']) for row in rows]
gaps = [(current - previous).days for previous, current in zip(dates, dates[1:])]
if not gaps:
    raise ValueError('At least two events are required for a cadence preview.')
ema = gaps[0]
points = [(dates[1], ema)]
for day, gap in zip(dates[2:], gaps[1:]):
    ema = 0.2 * gap + 0.8 * ema
    points.append((day, ema))
mean = sum(gaps) / len(gaps)
ema_date = dates[-1] + timedelta(days=int(ema + 0.5))
mean_date = dates[-1] + timedelta(days=int(mean + 0.5))
start = dates[0]
end = max(dates[-1], ema_date, mean_date) + timedelta(days=35)
left, right, top, bottom = 96, 1104, 296, 472
maximum = max(40, int(max(value for _, value in points) / 20 + 1) * 20)


def x(day):
    return left + (day - start).days / (end - start).days * (right - left)


def y(value):
    return bottom - value / maximum * (bottom - top)


def text(px, py, content, size=18, color='#b8c2d6', weight=400, anchor='start'):
    return f'<text x="{px:.2f}" y="{py:.2f}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(content))}</text>'


svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">', '<title id="title">Qwen release cadence and forecast estimates</title>', f'<desc id="desc">{len(rows)} events since {dates[0].year}. Latest event {dates[-1]}. EMA {ema:.1f} days estimates {ema_date}. Average {mean:.1f} days estimates {mean_date}. Estimates are not announcements.</desc>', '<rect width="1200" height="630" fill="#090b13"/>', '<g font-family="DejaVu Sans, sans-serif">', '<rect x="36" y="36" width="1128" height="558" rx="18" fill="#10131e" stroke="#394154"/>', text(72, 83, 'cadence.', 24, '#edfa57', 700), text(1128, 83, 'nerdalytics / QWEN', 16, anchor='end'), text(72, 143, 'Qwen release radar.', 46, '#eef0f7', 700), text(72, 177, f'{len(rows)} release & update events  ·  Latest entry {dates[-1]}', 20), '<line x1="72" y1="205" x2="1128" y2="205" stroke="#394154"/>', text(72, 235, f'EMA  {ema:.1f} days', 22, '#edfa57', 700), text(416, 235, f'Average  {mean:.1f} days', 22, '#24e3df', 700), text(1128, 234, 'FULL HISTORY · UPDATES INCLUDED', 14, anchor='end')]
for tick in range(0, maximum + 1, 20):
    py = y(tick)
    svg.append(f'<line x1="{left}" y1="{py:.2f}" x2="{right}" y2="{py:.2f}" stroke="#394154" stroke-dasharray="3 5"/>')
    svg.append(text(left - 14, py + 5, f'{tick}d', 15, anchor='end'))
for year in range(start.year, end.year + 1):
    day = max(start, date(year, 1, 1))
    px = x(day)
    svg.append(f'<line x1="{px:.2f}" y1="{top}" x2="{px:.2f}" y2="{bottom}" stroke="#293246"/>')
    svg.append(text(px, bottom + 27, year, 16))
path = ' '.join(f'{"M" if i == 0 else "L"}{x(day):.2f},{y(value):.2f}' for i, (day, value) in enumerate(points))
svg.append(f'<path d="{path}" fill="none" stroke="#edfa57" stroke-width="3" stroke-linejoin="round"/>')
for day, value in points:
    svg.append(f'<circle cx="{x(day):.2f}" cy="{y(value):.2f}" r="3.5" fill="#edfa57"/>')
svg.append(f'<line x1="{left}" y1="{y(mean):.2f}" x2="{right}" y2="{y(mean):.2f}" stroke="#24e3df" stroke-width="2" stroke-dasharray="8 5"/>')
svg.append(f'<line x1="{x(dates[-1]):.2f}" y1="{y(ema):.2f}" x2="{x(ema_date):.2f}" y2="{y(ema):.2f}" stroke="#edfa57" stroke-width="2.5" stroke-dasharray="5 4"/>')
for day, value, color in [(ema_date, ema, '#edfa57'), (mean_date, mean, '#24e3df')]:
    svg.append(f'<circle cx="{x(day):.2f}" cy="{y(value):.2f}" r="7" fill="#10131e" stroke="{color}" stroke-width="3"/>')
svg.extend([text(72, 546, f'EMA estimate  {ema_date.strftime("%b %d, %Y")}', 22, '#edfa57', 700), text(625, 546, f'Average estimate  {mean_date.strftime("%b %d, %Y")}', 22, '#24e3df', 700), text(72, 578, 'Dates are estimates, not announcements. Estimates can be in the past.', 16), '</g></svg>'])
assets = ROOT / 'assets'
assets.mkdir(exist_ok=True)
source = '\n'.join(svg)
(assets / 'social-preview.svg').write_text(source)
png = cairosvg.svg2png(bytestring=source.encode(), output_width=1200, output_height=630)
Image.open(io.BytesIO(png)).convert('RGB').save(assets / 'social-preview.png', optimize=True)
version = hashlib.sha256(source.encode()).hexdigest()[:12]
versioned_image = f'social-preview-{version}.png'
(assets / versioned_image).write_bytes((assets / 'social-preview.png').read_bytes())
page = ROOT / 'index.html'
html = page.read_text()
base_url = 'https://nerdalytics.github.io/qwen-model-release-cadence-dashmodel/'
image_url = base_url + 'assets/' + versioned_image
for attribute, key in [('property', 'og:image'), ('property', 'og:image:secure_url'), ('name', 'twitter:image')]:
    html = re.sub(rf'(<meta {attribute}="{re.escape(key)}" content=")[^"]*("\s*/?>)', lambda match: match[1] + image_url + match[2], html)
summary = f'{len(rows)} recorded Qwen releases and updates. Latest entry {dates[-1]}. Forecasts estimate timing, not confirmed releases.'
for attribute, key in [('property', 'og:description'), ('name', 'twitter:description')]:
    html = re.sub(rf'(<meta {attribute}="{re.escape(key)}" content=")[^"]*("\s*/?>)', lambda match: match[1] + escape(summary, quote=True) + match[2], html)
page.write_text(html)
print(f'Generated 1200x630 preview: {len(rows)} events, EMA {ema_date}, average {mean_date}')
