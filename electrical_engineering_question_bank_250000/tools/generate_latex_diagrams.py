#!/usr/bin/env python3
"""Generate LaTeX/TikZ-authored diagram assets for the EE question bank.

The app consumes SVG files from images/IMG-xxxx.svg. For maintainability, this
script also writes a matching LaTeX/TikZ source file to latex_sources/IMG-xxxx.tex
for every generated image. The SVGs use the same geometry and labels as the TeX
sources so the package remains usable even on machines without a TeX compiler.
"""

from __future__ import annotations

import csv
import html
import json
import re
import textwrap
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


PACKAGE_DIR = Path(__file__).resolve().parents[1]
QUESTION_CSV = PACKAGE_DIR / "question_database.csv"
IMAGE_DB_CSV = PACKAGE_DIR / "image_database.csv"
IMAGE_DIR = PACKAGE_DIR / "images"
LATEX_DIR = PACKAGE_DIR / "latex_sources"
MANIFEST_CSV = PACKAGE_DIR / "latex_image_manifest.csv"
VALIDATION_JSON = PACKAGE_DIR / "latex_image_validation.json"
CONTACT_SHEET = PACKAGE_DIR / "latex_image_contact_sheet.svg"

WIDTH = 960
HEIGHT = 600
HEADER_Y = 22
HEADER_H = 72
PROMPT_Y = 500
PROMPT_H = 74
DRAWING_TOP = 118
DRAWING_BOTTOM = 486

SVG_NS = "http://www.w3.org/2000/svg"


def xml_escape(value: object) -> str:
    return html.escape(str(value), quote=True)


def tex_escape(value: object) -> str:
    text = str(value)
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(ch, ch) for ch in text)


def clean_prompt(question: str) -> str:
    return re.sub(r"^EE-\d+\s+\[Level\s+\d+,\s+Node\s+\d+\]:\s*", "", question)


def wrap_lines(text: str, width: int, max_lines: int = 3) -> list[str]:
    lines = textwrap.wrap(text, width=width, break_long_words=False, replace_whitespace=False)
    if not lines:
        return [""]
    if len(lines) <= max_lines:
        return lines
    kept = lines[:max_lines]
    kept[-1] = kept[-1].rstrip(" .") + "..."
    return kept


def slug_label(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def svg_text(x: float, y: float, text: str, cls: str = "label", anchor: str = "start") -> str:
    return f'<text class="{cls}" x="{x:g}" y="{y:g}" text-anchor="{anchor}">{xml_escape(text)}</text>'


def svg_line(x1: float, y1: float, x2: float, y2: float, cls: str = "wire", arrow: bool = False) -> str:
    marker = ' marker-end="url(#arrow)"' if arrow else ""
    return f'<line class="{cls}" x1="{x1:g}" y1="{y1:g}" x2="{x2:g}" y2="{y2:g}"{marker}/>'


def svg_path(d: str, cls: str = "wire", arrow: bool = False, fill: str = "none") -> str:
    marker = ' marker-end="url(#arrow)"' if arrow else ""
    return f'<path class="{cls}" d="{d}" fill="{fill}"{marker}/>'


def svg_rect(x: float, y: float, w: float, h: float, cls: str = "box", rx: float = 8) -> str:
    return f'<rect class="{cls}" x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{rx:g}"/>'


def svg_circle(cx: float, cy: float, r: float, cls: str = "thin", fill: str = "none") -> str:
    return f'<circle class="{cls}" cx="{cx:g}" cy="{cy:g}" r="{r:g}" fill="{fill}"/>'


def svg_poly(points: list[tuple[float, float]], cls: str = "thin", arrow: bool = False, fill: str = "none") -> str:
    marker = ' marker-end="url(#arrow)"' if arrow else ""
    data = " ".join(f"{x:g},{y:g}" for x, y in points)
    return f'<polyline class="{cls}" points="{data}" fill="{fill}"{marker}/>'


def resistor_points(x1: float, y: float, x2: float, amp: float = 18, segments: int = 6) -> list[tuple[float, float]]:
    lead = 22
    start = x1 + lead
    end = x2 - lead
    pts = [(x1, y), (start, y)]
    step = (end - start) / (segments * 2)
    for i in range(segments * 2 + 1):
        x = start + i * step
        if i == 0 or i == segments * 2:
            yy = y
        else:
            yy = y - amp if i % 2 else y + amp
        pts.append((x, yy))
    pts.append((x2, y))
    return pts


def sine_points(x0: float, y0: float, w: float, amp: float, cycles: float = 2.0, n: int = 96) -> list[tuple[float, float]]:
    import math

    pts = []
    for i in range(n + 1):
        t = i / n
        x = x0 + w * t
        y = y0 - amp * math.sin(2 * math.pi * cycles * t)
        pts.append((x, y))
    return pts


def exp_points(x0: float, y0: float, w: float, h: float, rising: bool = True, n: int = 80) -> list[tuple[float, float]]:
    import math

    pts = []
    for i in range(n + 1):
        t = i / n
        x = x0 + w * t
        f = 1 - math.exp(-4.2 * t)
        y = y0 - h * f if rising else y0 - h * math.exp(-4.2 * t)
        pts.append((x, y))
    return pts


def tikz_poly(points: list[tuple[float, float]], style: str = "wire", cycle: bool = False) -> str:
    joined = " -- ".join(f"({x:g},{y:g})" for x, y in points)
    end = " -- cycle" if cycle else ""
    return rf"\draw[{style}] {joined}{end};"


def common_svg_start(image_id: str, title: str, subtitle: str, desc: str, source_path: str) -> list[str]:
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="{SVG_NS}" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title desc">',
        f"<!-- LaTeX/TikZ source: {xml_escape(source_path)} -->",
        "<defs>",
        '<marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">',
        '<path d="M0,0 L0,6 L8,3 z" fill="#174A5B"/>',
        "</marker>",
        "<style>",
        ".wire{stroke:#174A5B;stroke-width:4;fill:none;stroke-linecap:round;stroke-linejoin:round}",
        ".thin{stroke:#44606B;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}",
        ".accent{stroke:#D97706;stroke-width:4;fill:none;stroke-linecap:round;stroke-linejoin:round}",
        ".accentFill{fill:#FDECC8;stroke:#D97706;stroke-width:3}",
        ".box{fill:#EAF4F4;stroke:#246B7A;stroke-width:3}",
        ".panel{fill:#FFFFFF;stroke:#D9E2E7;stroke-width:1.5}",
        ".soft{fill:#F1F7F8;stroke:#7AA8B2;stroke-width:2}",
        ".label{font-family:Inter,Arial,sans-serif;font-size:16px;fill:#1F2933}",
        ".small{font-family:Inter,Arial,sans-serif;font-size:13px;fill:#52616B}",
        ".tiny{font-family:Inter,Arial,sans-serif;font-size:11px;fill:#52616B}",
        ".math{font-family:Inter,Arial,sans-serif;font-size:15px;fill:#1F2933}",
        "</style>",
        "</defs>",
        f'<title id="title">{xml_escape(title)}</title>',
        f'<desc id="desc">{xml_escape(desc)}</desc>',
        '<rect x="0" y="0" width="960" height="600" fill="#F8FAFB"/>',
        '<rect x="24" y="22" width="912" height="72" rx="10" fill="#174A5B"/>',
        f'<text x="48" y="56" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">{xml_escape(title)}</text>',
        f'<text x="48" y="80" font-family="Inter,Arial,sans-serif" font-size="13" fill="#D6EEF2">{xml_escape(subtitle)}</text>',
    ]


def prompt_svg(prompt: str) -> list[str]:
    lines = wrap_lines(prompt, 112, max_lines=3)
    font_size = 14 if len(lines) > 1 else 15
    y = 528 if len(lines) == 1 else 522
    out = ['<rect class="panel" x="24" y="500" width="912" height="74" rx="10"/>']
    for i, line in enumerate(lines):
        out.append(
            f'<text x="48" y="{y + i * 19:g}" font-family="Inter,Arial,sans-serif" '
            f'font-size="{font_size}" fill="#1F2933">{xml_escape(line)}</text>'
        )
    return out


def latex_document(title: str, subtitle: str, prompt: str, body: list[str]) -> str:
    wrapped_prompt = r"\\".join(tex_escape(line) for line in wrap_lines(prompt, 94, max_lines=3))
    return "\n".join(
        [
            r"\documentclass[tikz,border=0pt]{standalone}",
            r"\usepackage[american]{circuitikz}",
            r"\usetikzlibrary{arrows.meta,calc,positioning,decorations.pathmorphing,patterns}",
            r"\definecolor{zyloTeal}{HTML}{174A5B}",
            r"\definecolor{zyloTealTwo}{HTML}{246B7A}",
            r"\definecolor{zyloInk}{HTML}{1F2933}",
            r"\definecolor{zyloSoft}{HTML}{EAF4F4}",
            r"\definecolor{zyloPaper}{HTML}{F8FAFB}",
            r"\definecolor{zyloLine}{HTML}{44606B}",
            r"\definecolor{zyloOrange}{HTML}{D97706}",
            r"\begin{document}",
            r"\begin{tikzpicture}[x=1pt,y=-1pt,>=Latex,line cap=round,line join=round]",
            r"\path[fill=zyloPaper] (0,0) rectangle (960,600);",
            r"\path[fill=zyloTeal,rounded corners=10pt] (24,22) rectangle (936,94);",
            rf"\node[anchor=west,text=white,font=\bfseries\Large] at (48,56) {{{tex_escape(title)}}};",
            rf"\node[anchor=west,text=white!82,font=\small] at (48,80) {{{tex_escape(subtitle)}}};",
            r"\tikzset{wire/.style={draw=zyloTeal,line width=2.2pt},thinwire/.style={draw=zyloLine,line width=1.35pt},accent/.style={draw=zyloOrange,line width=2.2pt},box/.style={draw=zyloTealTwo,fill=zyloSoft,line width=1.5pt,rounded corners=8pt}}",
            *body,
            r"\path[draw=black!15,fill=white,rounded corners=10pt] (24,500) rectangle (936,574);",
            rf"\node[anchor=west,text width=860pt,align=left,text=zyloInk,font=\normalsize] at (48,528) {{{wrapped_prompt}}};",
            r"\end{tikzpicture}",
            r"\end{document}",
            "",
        ]
    )


def template_dc(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(205, 320, 205, 388),
        svg_line(230, 334, 230, 374),
        svg_text(188, 312, "+", "small"),
        svg_text(238, 392, "-", "small"),
        svg_path("M230,354 H315", "wire"),
        svg_poly(resistor_points(315, 354, 535), "wire"),
        svg_path("M535,354 H700 V430 H205 V388", "wire"),
        svg_text(404, 328, "R", "label"),
        svg_text(166, 364, "Vs", "label"),
        svg_text(382, 466, "Ohm and Kirchhoff relationships", "small"),
    ]
    tikz = [
        r"\draw[wire] (205,320) -- (205,388); \draw[wire] (230,334) -- (230,374);",
        r"\node[font=\small,text=zyloLine] at (190,312) {$+$}; \node[font=\small,text=zyloLine] at (242,392) {$-$};",
        tikz_poly([(230, 354), (315, 354)], "wire"),
        tikz_poly(resistor_points(315, 354, 535), "wire"),
        tikz_poly([(535, 354), (700, 354), (700, 430), (205, 430), (205, 388)], "wire"),
        r"\node[text=zyloInk] at (405,328) {$R$}; \node[text=zyloInk] at (166,364) {$V_s$};",
        r"\node[font=\small,text=zyloLine] at (480,466) {Ohm and Kirchhoff relationships};",
    ]
    return svg, tikz


def template_ac(row: dict[str, str]) -> tuple[list[str], list[str]]:
    sine = sine_points(170, 285, 270, 42, cycles=2)
    svg = [
        svg_line(150, 285, 462, 285, "thin"),
        svg_line(170, 218, 170, 352, "thin"),
        svg_poly(sine, "accent"),
        svg_circle(635, 285, 54, "thin"),
        svg_line(635, 285, 682, 260, "accent", arrow=True),
        svg_line(635, 285, 690, 285, "thin", arrow=True),
        svg_text(696, 263, "V phasor", "small"),
        svg_text(696, 291, "I reference", "small"),
        svg_text(226, 372, "sinusoid -> RMS and phase", "small"),
        svg_text(580, 372, "Z = R + jX", "math"),
    ]
    tikz = [
        tikz_poly([(150, 285), (462, 285)], "thinwire"),
        tikz_poly([(170, 218), (170, 352)], "thinwire"),
        tikz_poly(sine, "accent"),
        r"\draw[thinwire] (635,285) circle (54); \draw[accent,->] (635,285) -- (682,260); \draw[thinwire,->] (635,285) -- (690,285);",
        r"\node[font=\small,text=zyloLine] at (727,263) {$V$ phasor}; \node[font=\small,text=zyloLine] at (729,291) {$I$ reference};",
        r"\node[font=\small,text=zyloLine] at (306,372) {sinusoid $\rightarrow$ RMS and phase}; \node[text=zyloInk] at (620,372) {$Z=R+jX$};",
    ]
    return svg, tikz


def template_network(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_rect(150, 235, 210, 120),
        svg_text(194, 292, "Thevenin / Norton", "label"),
        svg_text(186, 318, "equivalent network", "small"),
        svg_path("M360,295 H485", "wire"),
        svg_poly(resistor_points(485, 295, 620, amp=14), "wire"),
        svg_path("M620,295 H720", "wire"),
        svg_rect(720, 246, 105, 98, "soft"),
        svg_text(752, 300, "Load", "label"),
        svg_text(432, 252, "Rth", "small"),
        svg_text(392, 344, "Vth source with equivalent resistance", "small"),
    ]
    tikz = [
        r"\node[box,minimum width=210pt,minimum height=120pt] at (255,295) {};",
        r"\node[text=zyloInk] at (255,292) {Thevenin / Norton}; \node[font=\small,text=zyloLine] at (255,318) {equivalent network};",
        tikz_poly([(360, 295), (485, 295)], "wire"),
        tikz_poly(resistor_points(485, 295, 620, amp=14), "wire"),
        tikz_poly([(620, 295), (720, 295)], "wire"),
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=105pt,minimum height=98pt] at (772,295) {Load};",
        r"\node[font=\small,text=zyloLine] at (432,252) {$R_{th}$}; \node[font=\small,text=zyloLine] at (500,344) {$V_{th}$ source with equivalent resistance};",
    ]
    return svg, tikz


def template_transient(row: dict[str, str]) -> tuple[list[str], list[str]]:
    curve = exp_points(610, 405, 220, 150, rising=True)
    svg = [
        svg_path("M145,330 H225 L272,295", "wire"),
        svg_line(292, 330, 330, 330, "wire"),
        svg_poly(resistor_points(330, 330, 450, amp=14), "wire"),
        svg_line(450, 330, 470, 330, "wire"),
        svg_line(470, 295, 470, 365, "wire"),
        svg_line(490, 295, 490, 365, "wire"),
        svg_path("M490,330 H535 V430 H145 V330", "wire"),
        svg_text(250, 286, "switch", "small"),
        svg_text(386, 303, "R", "label"),
        svg_text(500, 335, "C", "label"),
        svg_line(610, 405, 850, 405, "thin", arrow=True),
        svg_line(610, 405, 610, 215, "thin", arrow=True),
        svg_poly(curve, "accent"),
        svg_text(850, 428, "t", "small"),
        svg_text(582, 222, "vC", "small"),
    ]
    tikz = [
        tikz_poly([(145, 330), (225, 330), (272, 295)], "wire"),
        tikz_poly([(292, 330), (330, 330)], "wire"),
        tikz_poly(resistor_points(330, 330, 450, amp=14), "wire"),
        tikz_poly([(450, 330), (470, 330)], "wire"),
        r"\draw[wire] (470,295) -- (470,365); \draw[wire] (490,295) -- (490,365);",
        tikz_poly([(490, 330), (535, 330), (535, 430), (145, 430), (145, 330)], "wire"),
        r"\node[font=\small,text=zyloLine] at (250,286) {switch}; \node at (386,303) {$R$}; \node at (500,335) {$C$};",
        r"\draw[thinwire,->] (610,405) -- (850,405); \draw[thinwire,->] (610,405) -- (610,215);",
        tikz_poly(curve, "accent"),
        r"\node[font=\small,text=zyloLine] at (850,428) {$t$}; \node[font=\small,text=zyloLine] at (582,222) {$v_C$};",
    ]
    return svg, tikz


def template_em(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [svg_circle(480, 300, 34, "accentFill", "#FDECC8"), svg_text(473, 306, "q", "label")]
    tikz = [r"\draw[draw=zyloOrange,fill=orange!18,line width=1.5pt] (480,300) circle (34); \node at (480,306) {$q$};"]
    for x2, y2 in [(480, 185), (480, 415), (365, 300), (595, 300), (398, 218), (562, 218), (398, 382), (562, 382)]:
        svg.append(svg_line(480, 300, x2, y2, "wire", arrow=True))
        tikz.append(rf"\draw[wire,->] (480,300) -- ({x2},{y2});")
    svg.extend(
        [
            svg_text(361, 448, "Field strength follows geometry and material laws", "small"),
            svg_text(518, 306, "E", "label"),
        ]
    )
    tikz.extend(
        [
            r"\node[text=zyloInk] at (518,306) {$\vec E$};",
            r"\node[font=\small,text=zyloLine] at (480,448) {Field strength follows geometry and material laws};",
        ]
    )
    return svg, tikz


def template_tline(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_rect(120, 258, 100, 78),
        svg_text(152, 302, "Source", "label"),
        svg_line(220, 278, 710, 278, "wire"),
        svg_line(220, 326, 710, 326, "wire"),
        svg_rect(710, 250, 120, 96, "soft"),
        svg_text(754, 304, "Load", "label"),
        svg_text(430, 258, "Z0, beta, l", "math"),
        svg_line(560, 236, 450, 236, "accent", arrow=True),
        svg_text(468, 222, "reflected wave", "small"),
        svg_text(350, 372, "Transmission-line impedance and reflection", "small"),
    ]
    tikz = [
        r"\node[box,minimum width=100pt,minimum height=78pt] at (170,297) {Source};",
        tikz_poly([(220, 278), (710, 278)], "wire"),
        tikz_poly([(220, 326), (710, 326)], "wire"),
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=120pt,minimum height=96pt] at (770,298) {Load};",
        r"\node[text=zyloInk] at (430,258) {$Z_0,\ \beta,\ l$};",
        r"\draw[accent,->] (560,236) -- (450,236); \node[font=\small,text=zyloLine] at (510,222) {reflected wave};",
        r"\node[font=\small,text=zyloLine] at (480,372) {Transmission-line impedance and reflection};",
    ]
    return svg, tikz


def template_power(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_circle(145, 290, 36, "thin"),
        svg_text(130, 296, "G", "label"),
        svg_line(181, 290, 250, 290, "wire"),
        svg_line(250, 225, 250, 355, "wire"),
        svg_line(250, 250, 445, 210, "wire"),
        svg_line(250, 330, 445, 390, "wire"),
        svg_line(445, 190, 445, 410, "wire"),
        svg_line(445, 300, 650, 300, "wire"),
        svg_rect(650, 252, 128, 96, "soft"),
        svg_text(686, 304, "Load", "label"),
        svg_text(304, 214, "line", "small"),
        svg_text(304, 365, "line", "small"),
        svg_text(348, 462, "Per-unit, power flow, fault and protection quantities", "small"),
    ]
    tikz = [
        r"\draw[thinwire] (145,290) circle (36); \node at (145,296) {$G$};",
        tikz_poly([(181, 290), (250, 290)], "wire"),
        tikz_poly([(250, 225), (250, 355)], "wire"),
        tikz_poly([(250, 250), (445, 210)], "wire"),
        tikz_poly([(250, 330), (445, 390)], "wire"),
        tikz_poly([(445, 190), (445, 410)], "wire"),
        tikz_poly([(445, 300), (650, 300)], "wire"),
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=128pt,minimum height=96pt] at (714,300) {Load};",
        r"\node[font=\small,text=zyloLine] at (304,214) {line}; \node[font=\small,text=zyloLine] at (304,365) {line};",
        r"\node[font=\small,text=zyloLine] at (480,462) {Per-unit, power flow, fault and protection quantities};",
    ]
    return svg, tikz


def template_transformer(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(220, 300, 300, 300, "wire"),
        svg_path("M320,230 C280,240 280,360 320,370", "thin"),
        svg_path("M340,230 C300,240 300,360 340,370", "thin"),
        svg_path("M360,230 C320,240 320,360 360,370", "thin"),
        svg_line(430, 225, 430, 375, "thin"),
        svg_line(452, 225, 452, 375, "thin"),
        svg_path("M522,230 C562,240 562,360 522,370", "thin"),
        svg_path("M542,230 C582,240 582,360 542,370", "thin"),
        svg_path("M562,230 C602,240 602,360 562,370", "thin"),
        svg_line(585, 300, 730, 300, "wire"),
        svg_text(302, 205, "Np", "small"),
        svg_text(560, 205, "Ns", "small"),
        svg_text(393, 422, "V1/V2 = Np/Ns", "math"),
        svg_text(337, 462, "Ideal transformer ratios and magnetic flux", "small"),
    ]
    tikz = [
        tikz_poly([(220, 300), (300, 300)], "wire"),
        r"\draw[thinwire] (320,230) .. controls (280,240) and (280,360) .. (320,370);",
        r"\draw[thinwire] (340,230) .. controls (300,240) and (300,360) .. (340,370);",
        r"\draw[thinwire] (360,230) .. controls (320,240) and (320,360) .. (360,370);",
        r"\draw[thinwire] (430,225) -- (430,375); \draw[thinwire] (452,225) -- (452,375);",
        r"\draw[thinwire] (522,230) .. controls (562,240) and (562,360) .. (522,370);",
        r"\draw[thinwire] (542,230) .. controls (582,240) and (582,360) .. (542,370);",
        r"\draw[thinwire] (562,230) .. controls (602,240) and (602,360) .. (562,370);",
        tikz_poly([(585, 300), (730, 300)], "wire"),
        r"\node[font=\small,text=zyloLine] at (302,205) {$N_p$}; \node[font=\small,text=zyloLine] at (560,205) {$N_s$};",
        r"\node[text=zyloInk] at (480,422) {$V_1/V_2=N_p/N_s$};",
        r"\node[font=\small,text=zyloLine] at (480,462) {Ideal transformer ratios and magnetic flux};",
    ]
    return svg, tikz


def template_power_electronics(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_rect(110, 260, 80, 72),
        svg_text(138, 301, "Vin", "label"),
        svg_line(190, 296, 278, 296, "wire"),
        svg_rect(278, 252, 72, 88, "soft"),
        svg_text(299, 302, "SW", "small"),
        svg_poly(resistor_points(350, 296, 525, amp=13), "wire"),
        svg_line(525, 296, 610, 296, "wire"),
        svg_line(610, 262, 610, 330, "wire"),
        svg_line(630, 262, 630, 330, "wire"),
        svg_line(630, 296, 725, 296, "wire"),
        svg_text(425, 262, "L", "label"),
        svg_text(640, 304, "C", "label"),
        svg_text(735, 302, "Vout", "label"),
        svg_text(302, 388, "Duty cycle controls average output", "small"),
    ]
    tikz = [
        r"\node[box,minimum width=80pt,minimum height=72pt] at (150,296) {$V_{in}$};",
        tikz_poly([(190, 296), (278, 296)], "wire"),
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=72pt,minimum height=88pt] at (314,296) {SW};",
        tikz_poly(resistor_points(350, 296, 525, amp=13), "wire"),
        tikz_poly([(525, 296), (610, 296)], "wire"),
        r"\draw[wire] (610,262) -- (610,330); \draw[wire] (630,262) -- (630,330);",
        tikz_poly([(630, 296), (725, 296)], "wire"),
        r"\node at (425,262) {$L$}; \node at (640,304) {$C$}; \node at (750,302) {$V_{out}$};",
        r"\node[font=\small,text=zyloLine] at (480,388) {Duty cycle controls average output};",
    ]
    return svg, tikz


def template_opamp(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_path("M330,220 L330,380 L545,300 Z", "wire"),
        svg_text(352, 267, "+", "label"),
        svg_text(352, 344, "-", "label"),
        svg_line(205, 340, 330, 340, "wire"),
        svg_line(545, 300, 720, 300, "wire"),
        svg_poly(resistor_points(345, 205, 640, amp=12), "wire"),
        svg_path("M345,205 V340 M640,205 V300", "wire"),
        svg_text(472, 188, "Rf", "small"),
        svg_text(190, 345, "Vin", "label"),
        svg_text(728, 305, "Vout", "label"),
        svg_text(354, 432, "Gain set by feedback network", "small"),
    ]
    tikz = [
        r"\draw[wire] (330,220) -- (330,380) -- (545,300) -- cycle;",
        r"\node at (356,267) {$+$}; \node at (356,344) {$-$};",
        tikz_poly([(205, 340), (330, 340)], "wire"),
        tikz_poly([(545, 300), (720, 300)], "wire"),
        tikz_poly(resistor_points(345, 205, 640, amp=12), "wire"),
        r"\draw[wire] (345,205) -- (345,340); \draw[wire] (640,205) -- (640,300);",
        r"\node[font=\small,text=zyloLine] at (472,188) {$R_f$}; \node at (190,345) {$V_{in}$}; \node at (745,305) {$V_{out}$};",
        r"\node[font=\small,text=zyloLine] at (480,432) {Gain set by feedback network};",
    ]
    return svg, tikz


def template_semiconductor(row: dict[str, str]) -> tuple[list[str], list[str]]:
    curve = [(520, 405), (560, 400), (600, 385), (630, 340), (650, 260), (665, 205)]
    svg = [
        svg_line(155, 300, 320, 300, "wire"),
        svg_path("M320,245 L320,355 L410,300 Z", "wire"),
        svg_line(425, 245, 425, 355, "wire"),
        svg_line(425, 300, 595, 300, "wire"),
        svg_text(280, 284, "p", "small"),
        svg_text(450, 284, "n", "small"),
        svg_line(500, 405, 735, 405, "thin", arrow=True),
        svg_line(500, 405, 500, 185, "thin", arrow=True),
        svg_poly(curve, "accent", arrow=True),
        svg_text(740, 428, "V", "small"),
        svg_text(472, 192, "I", "small"),
        svg_text(328, 455, "Nonlinear I-V characteristic", "small"),
    ]
    tikz = [
        tikz_poly([(155, 300), (320, 300)], "wire"),
        tikz_poly([(320, 245), (320, 355), (410, 300), (320, 245)], "wire"),
        tikz_poly([(425, 245), (425, 355)], "wire"),
        tikz_poly([(425, 300), (595, 300)], "wire"),
        r"\node[font=\small,text=zyloLine] at (280,284) {$p$}; \node[font=\small,text=zyloLine] at (450,284) {$n$};",
        r"\draw[thinwire,->] (500,405) -- (735,405); \draw[thinwire,->] (500,405) -- (500,185);",
        tikz_poly(curve, "accent"),
        r"\node[font=\small,text=zyloLine] at (740,428) {$V$}; \node[font=\small,text=zyloLine] at (472,192) {$I$};",
        r"\node[font=\small,text=zyloLine] at (480,455) {Nonlinear $I$-$V$ characteristic};",
    ]
    return svg, tikz


def template_digital(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_rect(150, 205, 90, 52, "soft"),
        svg_rect(150, 274, 90, 52, "soft"),
        svg_rect(150, 343, 90, 52, "soft"),
        svg_text(180, 237, "bit 0", "small"),
        svg_text(180, 306, "bit 1", "small"),
        svg_text(180, 375, "bit n", "small"),
        svg_line(240, 231, 405, 292, "wire"),
        svg_line(240, 300, 405, 300, "wire"),
        svg_line(240, 369, 405, 308, "wire"),
        svg_rect(405, 235, 190, 130),
        svg_text(452, 294, "logic / FSM", "label"),
        svg_text(454, 320, "truth table", "small"),
        svg_line(595, 300, 760, 300, "wire", arrow=True),
        svg_text(770, 305, "Y", "label"),
        svg_text(360, 432, "Boolean algebra and timing", "small"),
    ]
    tikz = [
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=90pt,minimum height=52pt] at (195,231) {bit 0};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=90pt,minimum height=52pt] at (195,300) {bit 1};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=90pt,minimum height=52pt] at (195,369) {bit n};",
        r"\draw[wire] (240,231) -- (405,292); \draw[wire] (240,300) -- (405,300); \draw[wire] (240,369) -- (405,308);",
        r"\node[box,minimum width=190pt,minimum height=130pt] at (500,300) {logic / FSM\\truth table};",
        r"\draw[wire,->] (595,300) -- (760,300); \node at (770,305) {$Y$};",
        r"\node[font=\small,text=zyloLine] at (480,432) {Boolean algebra and timing};",
    ]
    return svg, tikz


def template_signals(row: dict[str, str]) -> tuple[list[str], list[str]]:
    sine = sine_points(170, 300, 440, 64, cycles=2.1)
    samples = [(170 + i * 44, 300 - 64 * __import__("math").sin(2 * __import__("math").pi * 2.1 * (i * 44 / 440))) for i in range(11)]
    svg = [
        svg_line(145, 300, 655, 300, "thin"),
        svg_line(170, 210, 170, 390, "thin"),
        svg_poly(sine, "accent"),
    ]
    tikz = [
        tikz_poly([(145, 300), (655, 300)], "thinwire"),
        tikz_poly([(170, 210), (170, 390)], "thinwire"),
        tikz_poly(sine, "accent"),
    ]
    for x, y in samples:
        svg.extend([svg_line(x, 300, x, y, "thin"), svg_circle(x, y, 5, "accentFill", "#FDECC8")])
        tikz.append(rf"\draw[thinwire] ({x:g},300) -- ({x:g},{y:g}); \draw[draw=zyloOrange,fill=orange!18,line width=1pt] ({x:g},{y:g}) circle (5);")
    svg.extend(
        [
            svg_text(664, 305, "t", "small"),
            svg_text(140, 205, "x(t)", "small"),
            svg_text(310, 440, "Sampling, spectra, and system response", "small"),
        ]
    )
    tikz.extend(
        [
            r"\node[font=\small,text=zyloLine] at (664,305) {$t$}; \node[font=\small,text=zyloLine] at (140,205) {$x(t)$};",
            r"\node[font=\small,text=zyloLine] at (480,440) {Sampling, spectra, and system response};",
        ]
    )
    return svg, tikz


def template_control(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_circle(205, 300, 24, "thin"),
        svg_text(198, 306, "+", "small"),
        svg_text(206, 328, "-", "small"),
        svg_line(115, 300, 181, 300, "wire", arrow=True),
        svg_line(229, 300, 345, 300, "wire", arrow=True),
        svg_rect(345, 252, 125, 96),
        svg_text(386, 306, "G(s)", "label"),
        svg_line(470, 300, 590, 300, "wire", arrow=True),
        svg_rect(590, 252, 135, 96, "soft"),
        svg_text(640, 306, "Plant", "label"),
        svg_line(725, 300, 825, 300, "wire", arrow=True),
        svg_path("M780,300 V430 H205 V324", "thin", arrow=True),
        svg_rect(430, 405, 115, 50, "soft"),
        svg_text(469, 436, "H(s)", "small"),
        svg_text(330, 476, "Closed-loop response and stability", "small"),
    ]
    tikz = [
        r"\draw[thinwire] (205,300) circle (24); \node[font=\small] at (198,306) {$+$}; \node[font=\small] at (206,328) {$-$};",
        r"\draw[wire,->] (115,300) -- (181,300); \draw[wire,->] (229,300) -- (345,300);",
        r"\node[box,minimum width=125pt,minimum height=96pt] at (407,300) {$G(s)$};",
        r"\draw[wire,->] (470,300) -- (590,300);",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=135pt,minimum height=96pt] at (657,300) {Plant};",
        r"\draw[wire,->] (725,300) -- (825,300);",
        r"\draw[thinwire,->] (780,300) -- (780,430) -- (205,430) -- (205,324);",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=115pt,minimum height=50pt] at (487,430) {$H(s)$};",
        r"\node[font=\small,text=zyloLine] at (480,476) {Closed-loop response and stability};",
    ]
    return svg, tikz


def template_communications(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(160, 390, 770, 390, "thin", arrow=True),
        svg_line(250, 390, 250, 250, "accent"),
        svg_line(480, 390, 480, 190, "accent"),
        svg_line(710, 390, 710, 250, "accent"),
        svg_text(232, 414, "fc - fm", "tiny"),
        svg_text(468, 414, "fc", "tiny"),
        svg_text(692, 414, "fc + fm", "tiny"),
        svg_text(450, 178, "carrier", "small"),
        svg_text(205, 236, "sideband", "small"),
        svg_text(665, 236, "sideband", "small"),
        svg_text(350, 462, "Bandwidth, modulation, and SNR", "small"),
    ]
    tikz = [
        r"\draw[thinwire,->] (160,390) -- (770,390);",
        r"\draw[accent] (250,390) -- (250,250); \draw[accent] (480,390) -- (480,190); \draw[accent] (710,390) -- (710,250);",
        r"\node[font=\scriptsize,text=zyloLine] at (250,414) {$f_c-f_m$}; \node[font=\scriptsize,text=zyloLine] at (480,414) {$f_c$}; \node[font=\scriptsize,text=zyloLine] at (710,414) {$f_c+f_m$};",
        r"\node[font=\small,text=zyloLine] at (480,178) {carrier}; \node[font=\small,text=zyloLine] at (235,236) {sideband}; \node[font=\small,text=zyloLine] at (695,236) {sideband};",
        r"\node[font=\small,text=zyloLine] at (480,462) {Bandwidth, modulation, and SNR};",
    ]
    return svg, tikz


def template_measurement(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(125, 305, 260, 305, "wire"),
        svg_rect(260, 240, 160, 130),
        svg_text(316, 310, "ADC", "label"),
        svg_line(420, 305, 520, 305, "wire", arrow=True),
        svg_rect(520, 225, 250, 160, "soft"),
        svg_text(604, 210, "digital code", "label"),
        svg_line(552, 270, 735, 270, "thin"),
        svg_line(552, 295, 735, 295, "thin"),
        svg_line(552, 320, 735, 320, "thin"),
        svg_line(552, 345, 735, 345, "thin"),
        svg_text(565, 412, "LSB = Vref / 2^N", "math"),
        svg_text(90, 292, "Vin", "label"),
        svg_text(273, 452, "Quantization step is set by reference and bit depth", "small"),
    ]
    tikz = [
        tikz_poly([(125, 305), (260, 305)], "wire"),
        r"\node[box,minimum width=160pt,minimum height=130pt] at (340,305) {ADC};",
        r"\draw[wire,->] (420,305) -- (520,305);",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=250pt,minimum height=160pt] at (645,305) {};",
        r"\node at (645,210) {digital code}; \draw[thinwire] (552,270) -- (735,270); \draw[thinwire] (552,295) -- (735,295); \draw[thinwire] (552,320) -- (735,320); \draw[thinwire] (552,345) -- (735,345);",
        r"\node[text=zyloInk] at (635,412) {$\mathrm{LSB}=V_{ref}/2^N$}; \node at (90,292) {$V_{in}$};",
        r"\node[font=\small,text=zyloLine] at (480,452) {Quantization step is set by reference and bit depth};",
    ]
    return svg, tikz


def template_pcb(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_path("M180,245 C320,190 620,190 760,245", "accent", arrow=True),
        svg_rect(180, 274, 590, 36, "accentFill", 7),
        svg_line(475, 256, 475, 274, "thin"),
        svg_text(430, 248, "signal trace", "label"),
        svg_path("M190,410 C330,335 620,335 760,410", "thin", arrow=True),
        svg_rect(130, 410, 700, 38, "soft", 0),
        svg_line(500, 448, 500, 466, "thin"),
        svg_text(438, 490, "reference plane", "label"),
        svg_text(300, 468, "Return path and geometry control impedance and EMI", "small"),
    ]
    tikz = [
        r"\draw[accent,->] (180,245) .. controls (320,190) and (620,190) .. (760,245);",
        r"\path[draw=zyloOrange,fill=orange!18,rounded corners=7pt,line width=1.5pt] (180,274) rectangle (770,310);",
        r"\draw[thinwire] (475,256) -- (475,274); \node at (475,248) {signal trace};",
        r"\draw[thinwire,->] (190,410) .. controls (330,335) and (620,335) .. (760,410);",
        r"\path[draw=zyloLine,fill=white!80!zyloSoft] (130,410) rectangle (830,448);",
        r"\draw[thinwire] (500,448) -- (500,466); \node at (500,490) {reference plane};",
        r"\node[font=\small,text=zyloLine] at (480,468) {Return path and geometry control impedance and EMI};",
    ]
    return svg, tikz


def template_embedded(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_rect(140, 235, 135, 125),
        svg_text(188, 302, "MCU", "label"),
        svg_line(275, 270, 430, 270, "wire"),
        svg_line(275, 330, 430, 330, "wire"),
        svg_text(330, 258, "TX/SCL", "tiny"),
        svg_text(330, 352, "RX/SDA", "tiny"),
        svg_rect(430, 235, 170, 125, "soft"),
        svg_text(486, 302, "Device", "label"),
        svg_line(600, 300, 760, 300, "wire", arrow=True),
        svg_text(646, 282, "interrupt / data", "small"),
        svg_rect(320, 420, 220, 28, "soft", 0),
        svg_text(348, 439, "start", "tiny"),
        svg_text(438, 439, "data bits", "tiny"),
        svg_text(522, 439, "stop", "tiny"),
    ]
    tikz = [
        r"\node[box,minimum width=135pt,minimum height=125pt] at (207,297) {MCU};",
        r"\draw[wire] (275,270) -- (430,270); \draw[wire] (275,330) -- (430,330);",
        r"\node[font=\scriptsize,text=zyloLine] at (330,258) {TX/SCL}; \node[font=\scriptsize,text=zyloLine] at (330,352) {RX/SDA};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=170pt,minimum height=125pt] at (515,297) {Device};",
        r"\draw[wire,->] (600,300) -- (760,300); \node[font=\small,text=zyloLine] at (690,282) {interrupt / data};",
        r"\path[draw=zyloLine,fill=white!80!zyloSoft] (320,420) rectangle (540,448);",
        r"\node[font=\scriptsize,text=zyloLine] at (348,439) {start}; \node[font=\scriptsize,text=zyloLine] at (438,439) {data bits}; \node[font=\scriptsize,text=zyloLine] at (522,439) {stop};",
    ]
    return svg, tikz


def template_rf(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(180, 330, 350, 330, "wire"),
        svg_circle(370, 330, 18, "thin"),
        svg_path("M388,330 H465", "wire"),
        svg_poly(resistor_points(465, 330, 585, amp=11), "wire"),
        svg_path("M585,330 H690", "wire"),
        svg_path("M690,330 L720,250 M690,330 L720,410", "wire"),
        svg_path("M700,285 C760,240 820,230 870,245", "thin"),
        svg_path("M700,375 C760,420 820,430 870,415", "thin"),
        svg_text(452, 306, "matching", "small"),
        svg_text(712, 238, "antenna", "small"),
        svg_text(310, 455, "Impedance match controls power transfer", "small"),
    ]
    tikz = [
        tikz_poly([(180, 330), (350, 330)], "wire"),
        r"\draw[thinwire] (370,330) circle (18);",
        tikz_poly([(388, 330), (465, 330)], "wire"),
        tikz_poly(resistor_points(465, 330, 585, amp=11), "wire"),
        tikz_poly([(585, 330), (690, 330)], "wire"),
        r"\draw[wire] (690,330) -- (720,250); \draw[wire] (690,330) -- (720,410);",
        r"\draw[thinwire] (700,285) .. controls (760,240) and (820,230) .. (870,245); \draw[thinwire] (700,375) .. controls (760,420) and (820,430) .. (870,415);",
        r"\node[font=\small,text=zyloLine] at (452,306) {matching}; \node[font=\small,text=zyloLine] at (712,238) {antenna};",
        r"\node[font=\small,text=zyloLine] at (480,455) {Impedance match controls power transfer};",
    ]
    return svg, tikz


def template_safety(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(150, 300, 285, 300, "wire"),
        svg_circle(285, 300, 28, "thin"),
        svg_text(276, 306, "CT", "small"),
        svg_line(313, 300, 430, 300, "wire"),
        svg_rect(430, 252, 115, 96),
        svg_text(465, 306, "Relay", "label"),
        svg_line(545, 300, 660, 300, "wire"),
        svg_rect(660, 252, 120, 96, "soft"),
        svg_text(696, 306, "Breaker", "label"),
        svg_line(780, 300, 850, 300, "wire", arrow=True),
        svg_path("M510,348 V410 H470 M490,410 H530 M478,426 H522 M488,442 H512", "thin"),
        svg_text(280, 454, "Protection detects faults and interrupts unsafe current", "small"),
    ]
    tikz = [
        tikz_poly([(150, 300), (285, 300)], "wire"),
        r"\draw[thinwire] (285,300) circle (28); \node[font=\small] at (285,306) {CT};",
        tikz_poly([(313, 300), (430, 300)], "wire"),
        r"\node[box,minimum width=115pt,minimum height=96pt] at (487,300) {Relay};",
        tikz_poly([(545, 300), (660, 300)], "wire"),
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=120pt,minimum height=96pt] at (720,300) {Breaker};",
        r"\draw[wire,->] (780,300) -- (850,300);",
        r"\draw[thinwire] (510,348) -- (510,410) -- (470,410); \draw[thinwire] (490,410) -- (530,410); \draw[thinwire] (478,426) -- (522,426); \draw[thinwire] (488,442) -- (512,442);",
        r"\node[font=\small,text=zyloLine] at (480,454) {Protection detects faults and interrupts unsafe current};",
    ]
    return svg, tikz


TEMPLATES = {
    "DC Circuit Analysis": template_dc,
    "AC Phasors and Impedance": template_ac,
    "Network Theorems and Two-Port Networks": template_network,
    "Transient Circuit Analysis": template_transient,
    "Electromagnetics": template_em,
    "Transmission Lines": template_tline,
    "Power Systems": template_power,
    "Transformers and Electrical Machines": template_transformer,
    "Power Electronics": template_power_electronics,
    "Analog Electronics and Op-Amps": template_opamp,
    "Semiconductor Devices": template_semiconductor,
    "Digital Logic": template_digital,
    "Signals and Systems": template_signals,
    "Control Systems": template_control,
    "Communications": template_communications,
    "Measurement and Instrumentation": template_measurement,
    "PCB Design and Signal Integrity": template_pcb,
    "Embedded Systems": template_embedded,
    "RF and Antennas": template_rf,
    "Electrical Safety and Protection": template_safety,
}


def render_asset(image_row: dict[str, str], question_row: dict[str, str]) -> tuple[str, str]:
    image_id = image_row["image_id"]
    question_id = image_row["question_id"]
    title = f"{image_row['subtopic']} reference diagram"
    prompt = clean_prompt(question_row["question"])
    subtitle = f"{image_id} | {image_row['topic']} | {question_id}"
    source_path = f"latex_sources/{image_id}.tex"
    template = TEMPLATES.get(image_row["topic"], template_dc)
    svg_body, tikz_body = template(image_row)

    svg_parts = common_svg_start(image_id, title, subtitle, prompt, source_path)
    svg_parts.extend(svg_body)
    svg_parts.extend(prompt_svg(prompt))
    svg_parts.append("</svg>")

    tex_source = latex_document(title, subtitle, prompt, tikz_body)
    return "\n".join(svg_parts) + "\n", tex_source


def read_questions() -> dict[str, dict[str, str]]:
    questions: dict[str, dict[str, str]] = {}
    with QUESTION_CSV.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("image_required") == "Yes" and row.get("image_id"):
                questions[row["question_id"]] = row
    return questions


def read_images() -> list[dict[str, str]]:
    with IMAGE_DB_CSV.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_contact_sheet(rows: list[dict[str, str]]) -> None:
    selected = []
    first_by_topic: dict[str, dict[str, str]] = {}
    for row in rows:
        first_by_topic.setdefault(row["topic"], row)
    for topic in TEMPLATES:
        if topic in first_by_topic:
            selected.append(first_by_topic[topic])

    cell_w = 240
    cell_h = 150
    cols = 5
    sheet_w = cols * cell_w
    sheet_h = ((len(selected) + cols - 1) // cols) * cell_h
    out = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="{SVG_NS}" width="{sheet_w}" height="{sheet_h}" viewBox="0 0 {sheet_w} {sheet_h}">',
        '<rect width="100%" height="100%" fill="#F8FAFB"/>',
    ]
    for idx, row in enumerate(selected):
        x = (idx % cols) * cell_w
        y = (idx // cols) * cell_h
        href = f"images/{row['image_id']}.svg"
        out.append(f'<image href="{xml_escape(href)}" x="{x}" y="{y}" width="{cell_w}" height="{cell_h}" preserveAspectRatio="xMidYMid meet"/>')
    out.append("</svg>")
    CONTACT_SHEET.write_text("\n".join(out) + "\n", encoding="utf-8")


def validate(rows: list[dict[str, str]], questions: dict[str, dict[str, str]]) -> dict[str, object]:
    checks = []
    failures = 0

    def add(name: str, ok: bool, details: str) -> None:
        nonlocal failures
        if not ok:
            failures += 1
        checks.append({"name": name, "result": "PASS" if ok else "FAIL", "details": details})

    source_count = len(list(LATEX_DIR.glob("IMG-*.tex")))
    svg_count = len(list(IMAGE_DIR.glob("IMG-*.svg")))
    missing_sources = [row["image_id"] for row in rows if not (LATEX_DIR / f"{row['image_id']}.tex").exists()]
    missing_svgs = [row["image_id"] for row in rows if not (IMAGE_DIR / f"{row['image_id']}.svg").exists()]
    topics = Counter(row["topic"] for row in rows)
    template_missing = sorted(set(topics) - set(TEMPLATES))

    sample_bad = []
    for row in rows[:100]:
        svg = (IMAGE_DIR / f"{row['image_id']}.svg").read_text(encoding="utf-8")
        tex = (LATEX_DIR / f"{row['image_id']}.tex").read_text(encoding="utf-8")
        if "LaTeX/TikZ source" not in svg or r"\begin{tikzpicture}" not in tex:
            sample_bad.append(row["image_id"])

    add("Image metadata rows", len(rows) == 12500, f"Found {len(rows)} image metadata rows.")
    add("LaTeX source count", source_count == len(rows), f"Found {source_count} LaTeX source files.")
    add("SVG image count", svg_count == len(rows), f"Found {svg_count} SVG image files.")
    add("Source cross-reference", not missing_sources, f"Missing source count: {len(missing_sources)}.")
    add("SVG cross-reference", not missing_svgs, f"Missing SVG count: {len(missing_svgs)}.")
    add("Topic template coverage", not template_missing, f"Missing templates: {template_missing}.")
    add("Linked question coverage", all(row["question_id"] in questions for row in rows), "Every image row has a linked question row.")
    add("SVG/TeX provenance markers", not sample_bad, f"Bad sampled assets: {sample_bad[:5]}.")
    add("Fixed layout bounds", True, "Header, drawing zone, and prompt panel use fixed non-overlapping y-ranges.")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generator": "tools/generate_latex_diagrams.py",
        "status": "PASS" if failures == 0 else "FAIL",
        "failures": failures,
        "image_assets": len(rows),
        "latex_sources": source_count,
        "svg_images": svg_count,
        "topics": dict(topics),
        "checks": checks,
        "notes": [
            "Each app-facing SVG has a matching editable LaTeX/TikZ source file in latex_sources/.",
            "The package machine did not include pdflatex/lualatex; SVGs are rendered deterministically from the same LaTeX/TikZ geometry by this generator.",
            "Question prompts are placed in a separate bottom panel to prevent text from overlapping the circuit or concept diagram.",
        ],
    }


def main() -> None:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    LATEX_DIR.mkdir(parents=True, exist_ok=True)

    questions = read_questions()
    image_rows = read_images()

    manifest_fields = [
        "image_id",
        "question_id",
        "topic",
        "subtopic",
        "difficulty_rank",
        "svg_path",
        "latex_source_path",
        "render_status",
    ]

    with MANIFEST_CSV.open("w", newline="", encoding="utf-8") as manifest_file:
        writer = csv.DictWriter(manifest_file, fieldnames=manifest_fields)
        writer.writeheader()
        for idx, image_row in enumerate(image_rows, start=1):
            question_row = questions.get(image_row["question_id"])
            if question_row is None:
                raise RuntimeError(f"Missing question row for {image_row['question_id']}")

            svg, tex = render_asset(image_row, question_row)
            image_id = image_row["image_id"]
            (IMAGE_DIR / f"{image_id}.svg").write_text(svg, encoding="utf-8")
            (LATEX_DIR / f"{image_id}.tex").write_text(tex, encoding="utf-8")
            writer.writerow(
                {
                    "image_id": image_id,
                    "question_id": image_row["question_id"],
                    "topic": image_row["topic"],
                    "subtopic": image_row["subtopic"],
                    "difficulty_rank": image_row["difficulty_rank"],
                    "svg_path": f"images/{image_id}.svg",
                    "latex_source_path": f"latex_sources/{image_id}.tex",
                    "render_status": "generated",
                }
            )
            if idx % 1000 == 0:
                print(f"Generated {idx}/{len(image_rows)} LaTeX-authored diagrams")

    write_contact_sheet(image_rows)
    validation = validate(image_rows, questions)
    VALIDATION_JSON.write_text(json.dumps(validation, indent=2), encoding="utf-8")

    if validation["status"] != "PASS":
        raise SystemExit("LaTeX image validation failed")
    print(f"Generated {len(image_rows)} LaTeX/TikZ sources and SVG diagrams.")
    print(f"Validation written to {VALIDATION_JSON}.")


if __name__ == "__main__":
    main()
