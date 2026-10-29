"""Renders the app icons (public/icons/*.png and favicon.svg) from one SVG with Playwright.
Run from the project root:  python3 scripts/make-icons.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public'
ACCENT = '#ff4d00'
# lucide "activity" glyph, drawn on a 24x24 grid
PULSE = 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2'

def svg(size, radius, glyph_scale):
    # glyph centered: 24-grid scaled to glyph_scale * size
    g = size * glyph_scale
    k = g / 24
    off = (size - g) / 2
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
<rect width="{size}" height="{size}" rx="{radius}" fill="{ACCENT}"/>
<g transform="translate({off} {off}) scale({k})"><path d="{PULSE}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>
</svg>'''

(OUT / 'favicon.svg').write_text(svg(64, 14, 0.62))

jobs = {
    'icons/icon-192.png': (192, 192 * 0.22, 0.6),
    'icons/icon-512.png': (512, 512 * 0.22, 0.6),
    'icons/maskable-512.png': (512, 0, 0.44),       # full bleed; glyph stays inside the 80% safe zone
    'icons/apple-touch-icon.png': (180, 0, 0.6),    # iOS rounds the corners itself
}
with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, (size, radius, scale) in jobs.items():
        page = browser.new_page(viewport={'width': int(size), 'height': int(size)})
        page.set_content(f'<body style="margin:0;background:transparent">{svg(size, radius, scale)}</body>')
        page.screenshot(path=str(OUT / name), omit_background=True)
        page.close()
    browser.close()
print('icons written to', OUT)
