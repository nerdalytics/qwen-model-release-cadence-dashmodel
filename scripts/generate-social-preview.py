import hashlib
import io
import json
import re
from datetime import date, timedelta
from html import escape
from pathlib import Path


def long_date(day):
    return f'{day:%b} {day.day}, {day.year}'


import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
payload = json.loads((ROOT / 'data/releases.json').read_text())
all_rows = sorted(payload['releases'], key=lambda row: row['date'])
rows = [row for row in all_rows if 'Generation' in row.get('modelTypes', [])]
rows = list({row['date']: row for row in rows}.values())
dates = [date.fromisoformat(row['date']) for row in rows]
gaps = [(current - previous).days for previous, current in zip(dates, dates[1:])]
if not gaps:
    raise ValueError('At least 2 generation releases are required for a preview.')
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
maximum = max(40, int(max(gaps + [ema, mean]) / 40 + 1) * 40)


def x(day):
    return left + (day - start).days / (end - start).days * (right - left)


def y(value):
    return bottom - value / maximum * (bottom - top)


def text(px, py, content, size=18, color='#535e67', weight=400, anchor='start'):
    return f'<text x="{px:.2f}" y="{py:.2f}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(content))}</text>'


svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">', '<title id="title">Qwen generation release timing</title>', f'<desc id="desc">{len(rows)} generation releases since {dates[0].year}. Latest generation release {long_date(dates[-1])}. EMA {int(ema + 0.5)} days forecasts {long_date(ema_date)}. Historical mean {int(mean + 0.5)} days forecasts {long_date(mean_date)}.</desc>', '<rect width="1200" height="630" fill="#f6f6f3"/>', '<g font-family="DejaVu Sans, sans-serif">', '<rect x="36" y="36" width="1128" height="558" rx="18" fill="#ffffff" stroke="#ced1d0"/>', text(72, 83, 'cadence.', 24, '#b62b34', 700), text(1128, 83, 'nerdalytics / QWEN', 16, anchor='end'), text(72, 143, "Has Qwen's release pace slowed?", 46, '#18222b', 700), text(72, 177, f'Generation history  ·  Latest generation release {long_date(dates[-1])}', 20), '<line x1="72" y1="205" x2="1128" y2="205" stroke="#ced1d0"/>', text(72, 235, f'EMA  {int(ema + 0.5)} days', 22, '#b62b34', 700), text(416, 235, f'Historical mean  {int(mean + 0.5)} days', 22, '#076878', 700), text(1128, 234, 'GENERATION · FULL HISTORY', 14, anchor='end')]
for tick in range(0, maximum + 1, 40):
    py = y(tick)
    svg.append(f'<line x1="{left}" y1="{py:.2f}" x2="{right}" y2="{py:.2f}" stroke="#ced1d0" stroke-dasharray="3 5"/>')
    svg.append(text(left - 14, py + 5, f'{tick}d', 15, anchor='end'))
for year in range(start.year, end.year + 1):
    day = max(start, date(year, 1, 1))
    px = x(day)
    svg.append(f'<line x1="{px:.2f}" y1="{top}" x2="{px:.2f}" y2="{bottom}" stroke="#dde0e0"/>')
    svg.append(text(px, bottom + 27, year, 16))
points = list(zip(dates[1:], gaps))
path = ' '.join(f'{"M" if i == 0 else "L"}{x(day):.2f},{y(value):.2f}' for i, (day, value) in enumerate(points))
svg.append(f'<path d="{path}" fill="none" stroke="#263b4b" stroke-width="3" stroke-linejoin="round"/>')
for day, value in points:
    svg.append(f'<circle cx="{x(day):.2f}" cy="{y(value):.2f}" r="3.5" fill="#263b4b"/>')
svg.append(f'<line x1="{left}" y1="{y(mean):.2f}" x2="{right}" y2="{y(mean):.2f}" stroke="#076878" stroke-width="2" stroke-dasharray="8 5"/>')
svg.append(f'<line x1="{x(dates[-1]):.2f}" y1="{y(ema):.2f}" x2="{x(ema_date):.2f}" y2="{y(ema):.2f}" stroke="#b62b34" stroke-width="2.5" stroke-dasharray="5 4"/>')
for day, value, color in [(ema_date, ema, '#b62b34'), (mean_date, mean, '#076878')]:
    svg.append(f'<circle cx="{x(day):.2f}" cy="{y(value):.2f}" r="7" fill="#ffffff" stroke="{color}" stroke-width="3"/>')
svg.extend([text(72, 546, f'EMA forecast  {long_date(ema_date)}', 22, '#b62b34', 700), text(560, 546, f'Historical mean forecast  {long_date(mean_date)}', 22, '#076878', 700), text(72, 578, 'Explore Qwen release history', 18, '#18222b', 700), text(1128, 578, 'Compare forecasts →', 18, '#076878', 700, anchor='end'), '</g></svg>'])
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
summary = f'{len(all_rows)} Qwen releases and model updates, the latest on {long_date(date.fromisoformat(all_rows[-1]["date"]))}. Compare release timing with 10 statistical methods.'
summary += ' Explore the full model history.'
for attribute, key in [('property', 'og:description'), ('name', 'twitter:description')]:
    html = re.sub(rf'(<meta {attribute}="{re.escape(key)}" content=")[^"]*("\s*/?>)', lambda match: match[1] + escape(summary, quote=True) + match[2], html)
page.write_text(html)
print(f'Generated 1200x630 preview: {len(rows)} generation releases, EMA {ema_date}, historical mean {mean_date}')
