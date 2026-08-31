#!/usr/bin/env python3
"""Assemble tilda-embed.html from source SVGs + engine."""
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
ET.register_namespace("", "http://www.w3.org/2000/svg")


def local(tag):
    return tag.split("}")[-1] if "}" in tag else tag


def parse(name):
    return ET.fromstring((SRC / name).read_text())


def paths_with(root, pred):
    out = []
    for el in root.iter():
        if local(el.tag) == "path" and pred(el):
            out.append(el)
    return out


def attr(el, *keys):
    parts = []
    for k in keys:
        if k in el.attrib:
            parts.append(f'{k}="{el.attrib[k]}"')
    return " ".join(parts)


root1 = parse("1.svg")
root2 = parse("2.svg")
root3 = parse("3.svg")
root4 = parse("4.svg")

flow_ds = [
    el.attrib["d"]
    for el in paths_with(root1, lambda e: e.attrib.get("stroke") == "white")
]
hex_ds = [
    el.attrib["d"]
    for el in paths_with(root2, lambda e: "d" in e.attrib)
]
grid_d = set(hex_ds)
route_ds = [
    el.attrib["d"]
    for el in paths_with(root3, lambda e: e.attrib.get("stroke") == "white" and e.attrib.get("d") not in grid_d)
]

def svg_str(el):
    raw = ET.tostring(el, encoding="unicode")
    return (
        raw.replace("ns0:", "")
        .replace('xmlns:ns0="http://www.w3.org/2000/svg"', "")
        .replace('xmlns="http://www.w3.org/2000/svg"', "")
    )

# s3 labels: groups with blur
s3_labels = []
for el in root3.iter():
    if local(el.tag) == "g" and el.attrib.get("data-figma-bg-blur-radius"):
        inner = svg_str(el)
        inner = inner.replace("<g ", '<g class="mp-s3-lab" ', 1).replace("<g>", '<g class="mp-s3-lab">', 1)
        s3_labels.append(inner)

# s4: iterate top-level (skip svg, defs, bg rect)
s4_cards = []
# We'll rebuild cards from known geometry + copy inner groups/paths in order
# Card structure in 4.svg: rect, g(label), path(drawing) × 3
children = [c for c in list(root4) if local(c.tag) in ("rect", "g", "path")]
# first rect is full black bg
parts = children[1:]  # 3 × (card-rect, label-g, drawing-path)
assert len(parts) >= 9, len(parts)

flow_svg = "\n".join(
    f'      <path class="mp-flow" d="{d}" fill="none" stroke="white" stroke-opacity="0.2" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="15 15"/>'
    for d in flow_ds
)
hex_svg = "\n".join(
    f'      <path class="mp-hex" d="{d}" fill="none" stroke="white" stroke-opacity="0.1" stroke-width="2"/>'
    for d in hex_ds
)
route_svg = "\n".join(
    f'      <path class="mp-route" d="{d}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>'
    for d in route_ds
)

# s3 labels already include <g>...
s3_label_svg = "\n".join(s3_labels)

# s4 cards: three triples
card_chunks = []
for i in range(3):
    rect, lab, draw = parts[i * 3], parts[i * 3 + 1], parts[i * 3 + 2]
    card_chunks.append(
        "    <g class=\"mp-card\">\n"
        f'      <rect class="mp-card-frame" {attr(rect, "x", "y", "width", "height", "rx")} fill="transparent" stroke="white" stroke-opacity="0.2"/>\n'
        f'      <rect class="mp-card-shimmer" {attr(rect, "x", "y", "width", "height", "rx")} fill="url(#mp-shimmer)" opacity="0"/>\n'
        f"      {svg_str(lab)}\n"
        f'      <path class="mp-card-draw" d="{draw.attrib["d"]}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>\n'
        "    </g>"
    )
cards_svg = "\n".join(card_chunks)

gauges = [
    {"cx": 195, "cy": 363, "v": 100, "dec": 0, "cap": ["ТРЕНДОВЫЕ"]},
    {"cx": 523, "cy": 363, "v": 6.2, "dec": 1, "cap": ["НА ВАЖНЫХ АКТИВАХ"]},
    {"cx": 851, "cy": 363, "v": 4.3, "dec": 1, "cap": ["НА МАРШРУТАХ АТАК"]},
    {"cx": 1179, "cy": 363, "v": 0.3, "dec": 1, "cap": ["НА ОПАСНЫХ", "МАРШРУТАХ АТАК"]},
    {"cx": 1507, "cy": 363, "v": 0.06, "dec": 2, "cap": ["НА ПЕРЕСЕЧЕНИИ", "МАРШРУТОВ"]},
]
gauge_svg_parts = []
for i, g in enumerate(gauges):
    cap = []
    y0 = 42 if len(g["cap"]) == 1 else 34
    for j, line in enumerate(g["cap"]):
        cap.append(
            f'<tspan x="0" y="{y0 + j * 16}">{line}</tspan>'
        )
    gauge_svg_parts.append(
        f'''    <g class="mp-gauge" data-i="{i}" data-v="{g["v"]}" data-dec="{g["dec"]}" transform="translate({g["cx"]},{g["cy"]})">
      <circle class="mp-gauge-track" r="136" fill="none" stroke="#0D0D0D" stroke-width="16"/>
      <path class="mp-gauge-fill" fill="url(#mp-gauge-fill)" stroke="url(#mp-gauge-border)" stroke-width="2" fill-rule="evenodd" stroke-linejoin="miter"/>
      <text class="mp-gauge-val" text-anchor="middle" y="-6">0</text>
      <text class="mp-gauge-cap" text-anchor="middle">{"".join(cap)}</text>
    </g>'''
    )
gauges_svg = "\n".join(gauge_svg_parts)

css = r"""
  #mp-carbon{
    --mp-len: 9;
    position: relative;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    height: calc(var(--mp-len) * 100vh);
    background: #000;
    color: #fff;
    font-family: TildaSans, Inter, system-ui, sans-serif;
  }
  #mp-carbon *{ box-sizing: border-box; }
  #mp-carbon .mp-stage{
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #mp-carbon .mp-art{
    width: 100%;
    height: 100%;
    display: block;
  }
  #mp-carbon .mp-gauge-val{
    fill: url(#mp-num);
    font-size: 56px;
    font-weight: 650;
    letter-spacing: -0.03em;
  }
  #mp-carbon .mp-gauge-cap{
    fill: #E7ECF3;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
  }
  #mp-carbon .mp-card-draw{ opacity: 0 !important; }
  #mp-carbon .mp-s3-lab, #mp-carbon .mp-card, #mp-carbon .mp-gauge{ opacity: 0; }
"""

js = (ROOT / "engine.js").read_text(encoding="utf-8")

html = f"""<!-- ============================================================
     Carbon / маршруты атаки — SVG-анимация по скроллу
     Вставка: Tilda HTML-блок T123, ширина 100%, отступы 0.
     Чёрный кадр на весь экран (sticky), высота блока ~9 экранов.
============================================================ -->
<style>{css}
</style>
<div id="mp-carbon">
  <div class="mp-stage">
    <svg class="mp-art" viewBox="0 0 1702 726" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <clipPath id="mp-clip"><rect width="1702" height="726"/></clipPath>
        <linearGradient id="mp-num" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#B3B3B3"/>
        </linearGradient>
        <linearGradient id="mp-gauge-fill" gradientUnits="userSpaceOnUse" x1="-144" y1="-144" x2="201.088" y2="-32.183">
          <stop stop-color="#FFFFFF"/>
          <stop offset="1" stop-color="#151515"/>
        </linearGradient>
        <linearGradient id="mp-gauge-border" gradientUnits="userSpaceOnUse" x1="-158.412" y1="-178.436" x2="199.96" y2="133.539">
          <stop offset="0.0683" stop-color="#D5E2F3" stop-opacity="0.4"/>
          <stop offset="0.4577" stop-color="#F2F6FC" stop-opacity="0.1"/>
          <stop offset="0.5386" stop-color="#E8EDF5" stop-opacity="0.1"/>
          <stop offset="0.6767" stop-color="#CDD6E4" stop-opacity="0.1"/>
          <stop offset="0.8537" stop-color="#A1B1C7" stop-opacity="0.4"/>
          <stop offset="1" stop-color="#788EAC" stop-opacity="0.4"/>
        </linearGradient>
        <linearGradient id="mp-shimmer" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="white" stop-opacity="0"/>
          <stop offset="0.5" stop-color="white" stop-opacity="0.35"/>
          <stop offset="1" stop-color="white" stop-opacity="0"/>
        </linearGradient>
        <clipPath id="mp-flow-clip"><rect id="mp-flow-clip-rect" width="1702" height="0"/></clipPath>
        <clipPath id="mp-bloom-0"><circle class="mp-bloom" r="0"/></clipPath>
        <clipPath id="mp-bloom-1"><circle class="mp-bloom" r="0"/></clipPath>
        <clipPath id="mp-bloom-2"><circle class="mp-bloom" r="0"/></clipPath>
      </defs>
      <g clip-path="url(#mp-clip)">
        <rect width="1702" height="726" fill="#000"/>
        <g id="mp-s1" clip-path="url(#mp-flow-clip)">{flow_svg}
          <g id="mp-dots"></g>
        </g>
        <g id="mp-s2">{hex_svg}
        </g>
        <g id="mp-s3">
          <g class="mp-route-wrap" clip-path="url(#mp-bloom-0)">{'' if len(route_ds)<1 else f'<path class="mp-route" d="{route_ds[0]}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>'}
          </g>
          <g class="mp-route-wrap" clip-path="url(#mp-bloom-1)">{'' if len(route_ds)<2 else f'<path class="mp-route" d="{route_ds[1]}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>'}
          </g>
          <g class="mp-route-wrap" clip-path="url(#mp-bloom-2)">{'' if len(route_ds)<3 else f'<path class="mp-route" d="{route_ds[2]}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>'}
          </g>
        </g>
        <g id="mp-s3-labels">
{s3_label_svg}
        </g>
        <g id="mp-s4">
{cards_svg}
        </g>
        <g id="mp-s5">
{gauges_svg}
        </g>
      </g>
    </svg>
  </div>
</div>
<script>
{js}
</script>
"""

# Fix: I duplicated route paths - mp-s3 already uses route_svg conceptually but I split by bloom.
# Remove unused route_svg variable usage. The three clips each wrap one path.

(ROOT / "tilda-embed.html").write_text(html, encoding="utf-8")
print("wrote", ROOT / "tilda-embed.html", "bytes", (ROOT / "tilda-embed.html").stat().st_size)
print("flows", len(flow_ds), "hexes", len(hex_ds), "routes", len(route_ds), "s3 labels", len(s3_labels))
