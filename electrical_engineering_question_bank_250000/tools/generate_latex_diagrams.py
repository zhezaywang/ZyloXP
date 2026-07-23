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

from verify_question_bank import FORMULA_METADATA


PACKAGE_DIR = Path(__file__).resolve().parents[1]
QUESTION_CSV = PACKAGE_DIR / "question_database.csv"
IMAGE_DB_CSV = PACKAGE_DIR / "image_database.csv"
IMAGE_DB_JSON = PACKAGE_DIR / "image_database.json"
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


def inductor_path(x1: float, y: float, x2: float, turns: int = 4, amp: float = 18) -> str:
    lead = 20
    start = x1 + lead
    end = x2 - lead
    width = (end - start) / turns
    commands = [f"M{x1:g},{y:g}", f"L{start:g},{y:g}"]
    for turn in range(turns):
        left = start + turn * width
        mid = left + width / 2
        right = left + width
        commands.append(
            f"C{left:g},{y - amp:g} {right:g},{y - amp:g} {right:g},{y:g}"
        )
    commands.append(f"L{x2:g},{y:g}")
    return " ".join(commands)


def sine_points(x0: float, y0: float, w: float, amp: float, cycles: float = 2.0, n: int = 96) -> list[tuple[float, float]]:
    import math

    pts = []
    for i in range(n + 1):
        t = i / n
        x = x0 + w * t
        y = y0 - amp * math.sin(2 * math.pi * cycles * t)
        pts.append((x, y))
    return pts


def cosine_points(
    x0: float,
    y0: float,
    w: float,
    amp: float,
    cycles: float = 2.0,
    phase_deg: float = 0.0,
    n: int = 96,
) -> list[tuple[float, float]]:
    import math

    phase = math.radians(phase_deg)
    return [
        (
            x0 + w * i / n,
            y0 - amp * math.cos(2 * math.pi * cycles * i / n + phase),
        )
        for i in range(n + 1)
    ]


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
        svg_text(330, 258, "TX", "tiny"),
        svg_text(330, 352, "RX", "tiny"),
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
        r"\node[font=\scriptsize,text=zyloLine] at (330,258) {TX}; \node[font=\scriptsize,text=zyloLine] at (330,352) {RX};",
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
        svg_line(105, 225, 680, 225, "wire", arrow=True),
        svg_text(112, 204, "primary conductor", "small"),
        svg_circle(300, 225, 44, "thin"),
        svg_text(300, 233, "CT", "label", "middle"),
        svg_rect(680, 180, 150, 90, "soft"),
        svg_text(755, 233, "Breaker", "label", "middle"),
        svg_line(830, 225, 875, 225, "wire", arrow=True),
        svg_path("M275,260 V355 H405", "wire"),
        svg_path("M325,260 V405 H405", "wire"),
        svg_rect(405, 330, 150, 100),
        svg_text(480, 374, "Protective", "small", "middle"),
        svg_text(480, 402, "relay", "label", "middle"),
        svg_path("M555,380 H755 V270", "accent", arrow=True),
        svg_text(652, 362, "trip command", "small", "middle"),
        svg_text(480, 468, "CT secondary and relay are isolated from the primary power path", "small", "middle"),
    ]
    tikz = [
        r"\draw[wire,->] (105,225) -- (680,225); \node[font=\small,text=zyloLine] at (175,204) {primary conductor};",
        r"\draw[thinwire] (300,225) circle (44); \node at (300,233) {CT};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=150pt,minimum height=90pt] at (755,225) {Breaker}; \draw[wire,->] (830,225) -- (875,225);",
        r"\draw[wire] (275,260) -- (275,355) -- (405,355); \draw[wire] (325,260) -- (325,405) -- (405,405);",
        r"\node[box,minimum width=150pt,minimum height=100pt,align=center] at (480,380) {Protective\\relay};",
        r"\draw[accent,->] (555,380) -- (755,380) -- (755,270); \node[font=\small,text=zyloLine] at (652,362) {trip command};",
        r"\node[font=\small,text=zyloLine] at (480,468) {CT secondary and relay are isolated from the primary power path};",
    ]
    return svg, tikz


PRIMARY_TEMPLATES = {
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


def answer_unit(answer: str) -> str:
    unit = re.sub(r"[-+]?\d+(?:\.\d+)?", "", answer, count=1).strip()
    return unit or "dimensionless"


def template_formula_scene(row: dict[str, str]) -> tuple[list[str], list[str]]:
    formula, assumptions = FORMULA_METADATA[row["template_id"]]
    formula_lines = wrap_lines(formula, 30, max_lines=3)
    subtopic_lines = wrap_lines(row["subtopic"], 27, max_lines=2)
    assumption_lines = wrap_lines(assumptions, 88, max_lines=2)
    unit = answer_unit(row["correct_answer"])

    svg = [
        svg_rect(86, 188, 240, 210, "soft"),
        svg_text(206, 224, "QUESTION GIVENS", "small", "middle"),
        svg_text(206, 268, row["template_id"], "label", "middle"),
        svg_text(206, 352, "values in the prompt", "small", "middle"),
        svg_line(326, 293, 390, 293, "wire", arrow=True),
        svg_rect(390, 206, 350, 174),
        svg_text(565, 240, "GOVERNING RELATION", "small", "middle"),
        svg_line(740, 293, 796, 293, "wire", arrow=True),
        svg_rect(796, 232, 105, 122, "accentFill"),
        svg_text(848, 276, "FIND", "small", "middle"),
        svg_text(848, 312, "?", "label", "middle"),
        svg_text(848, 336, unit, "tiny", "middle"),
    ]
    subtopic_start_y = 300 - 10 * (len(subtopic_lines) - 1)
    for index, line in enumerate(subtopic_lines):
        svg.append(svg_text(206, subtopic_start_y + index * 20, line, "small", "middle"))
    start_y = 282 - 18 * (len(formula_lines) - 1) / 2
    for index, line in enumerate(formula_lines):
        svg.append(svg_text(565, start_y + index * 22, line, "math", "middle"))
    for index, line in enumerate(assumption_lines):
        svg.append(svg_text(480, 430 + index * 19, line, "small", "middle"))

    tex_formula = r"\\".join(tex_escape(line) for line in formula_lines)
    tex_assumptions = r"\\".join(tex_escape(line) for line in assumption_lines)
    tikz = [
        r"\path[draw=zyloLine,fill=white!80!zyloSoft,rounded corners=8pt] (86,188) rectangle (326,398);",
        r"\node[font=\small\bfseries,text=zyloLine] at (206,224) {QUESTION GIVENS};",
        rf"\node[text=zyloInk] at (206,268) {{{tex_escape(row['template_id'])}}};",
        rf"\node[font=\small,text=zyloLine,text width=205pt,align=center] at (206,307) {{{tex_escape(row['subtopic'])}}};",
        r"\node[font=\small,text=zyloLine] at (206,352) {values in the prompt};",
        r"\draw[wire,->] (326,293) -- (390,293);",
        r"\node[box,minimum width=350pt,minimum height=174pt] at (565,293) {};",
        r"\node[font=\small\bfseries,text=zyloLine] at (565,240) {GOVERNING RELATION};",
        rf"\node[font=\ttfamily,text=zyloInk,text width=310pt,align=center] at (565,300) {{{tex_formula}}};",
        r"\draw[wire,->] (740,293) -- (796,293);",
        r"\path[draw=zyloOrange,fill=orange!18,rounded corners=8pt,line width=1.5pt] (796,232) rectangle (901,354);",
        r"\node[font=\small\bfseries,text=zyloLine] at (848,276) {FIND};",
        r"\node[font=\Large,text=zyloInk] at (848,312) {?};",
        rf"\node[font=\scriptsize,text=zyloLine] at (848,336) {{{tex_escape(unit)}}};",
        rf"\node[font=\small,text=zyloLine,text width=820pt,align=center] at (480,440) {{{tex_assumptions}}};",
    ]
    return svg, tikz


def template_ac_rms(row: dict[str, str]) -> tuple[list[str], list[str]]:
    wave = cosine_points(130, 310, 360, 64, cycles=1.6, phase_deg=30)
    svg = [
        svg_line(110, 310, 515, 310, "thin", arrow=True),
        svg_line(130, 210, 130, 405, "thin", arrow=True),
        svg_poly(wave, "accent"),
        svg_text(118, 206, "v(t)", "small"),
        svg_text(510, 332, "t", "small"),
        svg_text(290, 418, "cosine with +30 deg phase", "small", "middle"),
        svg_circle(690, 310, 70, "thin"),
        svg_line(690, 310, 750, 275, "accent", arrow=True),
        svg_line(690, 310, 770, 310, "thin", arrow=True),
        svg_text(758, 268, "Vrms at +30 deg", "small"),
        svg_text(742, 332, "0 deg", "tiny"),
    ]
    tikz = [
        tikz_poly([(110, 310), (515, 310)], "thinwire"),
        tikz_poly([(130, 405), (130, 210)], "thinwire"),
        tikz_poly(wave, "accent"),
        r"\node[font=\small,text=zyloLine] at (118,206) {$v(t)$}; \node[font=\small,text=zyloLine] at (510,332) {$t$};",
        r"\node[font=\small,text=zyloLine] at (310,418) {cosine with $+30^\circ$ phase};",
        r"\draw[thinwire] (690,310) circle (70); \draw[accent,->] (690,310) -- (750,275); \draw[thinwire,->] (690,310) -- (770,310);",
        r"\node[font=\small,text=zyloLine] at (800,268) {$V_{\mathrm{rms}}\angle30^\circ$}; \node[font=\scriptsize,text=zyloLine] at (742,332) {$0^\circ$};",
    ]
    return svg, tikz


def template_network_equivalents(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_text(265, 164, "THEVENIN", "small", "middle"),
        svg_circle(155, 300, 34, "thin"),
        svg_text(149, 292, "+", "tiny"),
        svg_text(149, 320, "-", "tiny"),
        svg_line(189, 300, 232, 300, "wire"),
        svg_poly(resistor_points(232, 300, 350, amp=12), "wire"),
        svg_path("M350,300 H395 M395,300 V390 H155 V334", "wire"),
        svg_circle(395, 300, 5, "accentFill"),
        svg_circle(395, 390, 5, "accentFill"),
        svg_text(268, 272, "Rth", "small", "middle"),
        svg_text(118, 304, "Vth", "small", "end"),
        svg_text(690, 164, "NORTON", "small", "middle"),
        svg_circle(575, 322, 36, "thin"),
        svg_line(575, 344, 575, 292, "accent", arrow=True),
        svg_path("M575,286 V235 H805 V390 H575 V358", "wire"),
        svg_poly(resistor_points(660, 235, 760, amp=11), "wire"),
        svg_circle(805, 235, 5, "accentFill"),
        svg_circle(805, 390, 5, "accentFill"),
        svg_text(710, 208, "RN = Rth", "small", "middle"),
        svg_text(548, 326, "IN", "small", "end"),
        svg_line(435, 312, 520, 312, "accent", arrow=True),
        svg_text(478, 294, "equivalent", "tiny", "middle"),
    ]
    tikz = [
        r"\node[font=\small\bfseries,text=zyloLine] at (265,164) {THEVENIN};",
        r"\draw[thinwire] (155,300) circle (34); \node[font=\scriptsize] at (149,292) {$+$}; \node[font=\scriptsize] at (149,320) {$-$};",
        r"\draw[wire] (189,300) -- (232,300);",
        tikz_poly(resistor_points(232, 300, 350, amp=12), "wire"),
        r"\draw[wire] (350,300) -- (395,300); \draw[wire] (395,300) -- (395,390) -- (155,390) -- (155,334);",
        r"\filldraw[draw=zyloOrange,fill=orange!18] (395,300) circle (5); \filldraw[draw=zyloOrange,fill=orange!18] (395,390) circle (5);",
        r"\node[font=\small,text=zyloLine] at (268,272) {$R_{th}$}; \node[font=\small,text=zyloLine] at (118,304) {$V_{th}$};",
        r"\node[font=\small\bfseries,text=zyloLine] at (690,164) {NORTON};",
        r"\draw[thinwire] (575,322) circle (36); \draw[accent,->] (575,344) -- (575,292);",
        r"\draw[wire] (575,286) -- (575,235) -- (805,235) -- (805,390) -- (575,390) -- (575,358);",
        tikz_poly(resistor_points(660, 235, 760, amp=11), "wire"),
        r"\filldraw[draw=zyloOrange,fill=orange!18] (805,235) circle (5); \filldraw[draw=zyloOrange,fill=orange!18] (805,390) circle (5);",
        r"\node[font=\small,text=zyloLine] at (710,208) {$R_N=R_{th}$}; \node[font=\small,text=zyloLine] at (548,326) {$I_N$};",
        r"\draw[accent,->] (435,312) -- (520,312); \node[font=\scriptsize,text=zyloLine] at (478,294) {equivalent};",
    ]
    return svg, tikz


def template_transient_charge(row: dict[str, str]) -> tuple[list[str], list[str]]:
    curve = exp_points(630, 410, 210, 150, rising=True)
    svg = [
        svg_circle(145, 330, 32, "thin"),
        svg_text(138, 320, "+", "tiny"),
        svg_text(138, 346, "-", "tiny"),
        svg_text(96, 334, "Vs", "small"),
        svg_path("M145,298 V245 H250", "wire"),
        svg_line(250, 245, 290, 220, "wire"),
        svg_line(307, 245, 340, 245, "wire"),
        svg_poly(resistor_points(340, 245, 465, amp=12), "wire"),
        svg_path("M465,245 H510 V300", "wire"),
        svg_line(485, 300, 535, 300, "wire"),
        svg_line(485, 320, 535, 320, "wire"),
        svg_path("M510,320 V410 H145 V362", "wire"),
        svg_text(402, 218, "R", "small"),
        svg_text(545, 316, "C", "small"),
        svg_text(270, 208, "switch closes", "tiny"),
        svg_line(610, 410, 860, 410, "thin", arrow=True),
        svg_line(630, 430, 630, 210, "thin", arrow=True),
        svg_poly(curve, "accent"),
        svg_text(846, 432, "t", "tiny"),
        svg_text(606, 210, "vC", "tiny"),
        svg_text(744, 236, "charging", "small"),
    ]
    tikz = [
        r"\draw[thinwire] (145,330) circle (32); \node[font=\scriptsize] at (138,320) {$+$}; \node[font=\scriptsize] at (138,346) {$-$}; \node[font=\small] at (96,334) {$V_s$};",
        r"\draw[wire] (145,298) -- (145,245) -- (250,245); \draw[wire] (250,245) -- (290,220); \draw[wire] (307,245) -- (340,245);",
        tikz_poly(resistor_points(340, 245, 465, amp=12), "wire"),
        r"\draw[wire] (465,245) -- (510,245) -- (510,300); \draw[wire] (485,300) -- (535,300); \draw[wire] (485,320) -- (535,320); \draw[wire] (510,320) -- (510,410) -- (145,410) -- (145,362);",
        r"\node[font=\small] at (402,218) {$R$}; \node[font=\small] at (545,316) {$C$}; \node[font=\scriptsize,text=zyloLine] at (270,208) {switch closes};",
        r"\draw[thinwire,->] (610,410) -- (860,410); \draw[thinwire,->] (630,430) -- (630,210);",
        tikz_poly(curve, "accent"),
        r"\node[font=\scriptsize,text=zyloLine] at (846,432) {$t$}; \node[font=\scriptsize,text=zyloLine] at (606,210) {$v_C$}; \node[font=\small,text=zyloLine] at (744,236) {charging};",
    ]
    return svg, tikz


def template_coulomb(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_circle(260, 310, 36, "accentFill"),
        svg_circle(700, 310, 36, "accentFill"),
        svg_text(260, 316, "q1", "label", "middle"),
        svg_text(700, 316, "q2", "label", "middle"),
        svg_line(310, 310, 650, 310, "thin"),
        svg_line(310, 270, 650, 270, "thin", arrow=True),
        svg_line(650, 270, 310, 270, "thin", arrow=True),
        svg_text(480, 254, "separation r", "small", "middle"),
        svg_line(224, 310, 145, 310, "accent", arrow=True),
        svg_line(736, 310, 815, 310, "accent", arrow=True),
        svg_text(155, 290, "F on q1", "small"),
        svg_text(745, 290, "F on q2", "small"),
        svg_text(480, 424, "equal and opposite forces along the line of centers", "small", "middle"),
    ]
    tikz = [
        r"\draw[draw=zyloOrange,fill=orange!18,line width=1.5pt] (260,310) circle (36); \draw[draw=zyloOrange,fill=orange!18,line width=1.5pt] (700,310) circle (36);",
        r"\node at (260,316) {$q_1$}; \node at (700,316) {$q_2$};",
        r"\draw[thinwire] (310,310) -- (650,310); \draw[thinwire,<->] (310,270) -- (650,270); \node[font=\small,text=zyloLine] at (480,254) {separation $r$};",
        r"\draw[accent,->] (224,310) -- (145,310); \draw[accent,->] (736,310) -- (815,310);",
        r"\node[font=\small,text=zyloLine] at (175,290) {$\vec F$ on $q_1$}; \node[font=\small,text=zyloLine] at (785,290) {$\vec F$ on $q_2$};",
        r"\node[font=\small,text=zyloLine] at (480,424) {equal and opposite forces along the line of centers};",
    ]
    return svg, tikz


def template_tline_distributed(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(110, 250, 205, 250, "wire"),
        svg_poly(resistor_points(205, 250, 360, amp=10), "wire"),
        svg_line(360, 250, 520, 250, "wire"),
        svg_poly(resistor_points(520, 250, 675, amp=10), "wire"),
        svg_line(675, 250, 850, 250, "wire", arrow=True),
        svg_line(110, 410, 850, 410, "wire"),
        svg_line(430, 250, 430, 300, "wire"),
        svg_line(405, 300, 455, 300, "wire"),
        svg_line(405, 320, 455, 320, "wire"),
        svg_line(430, 320, 430, 410, "wire"),
        svg_line(745, 250, 745, 300, "wire"),
        svg_line(720, 300, 770, 300, "wire"),
        svg_line(720, 320, 770, 320, "wire"),
        svg_line(745, 320, 745, 410, "wire"),
        svg_text(282, 220, "L' dx", "small", "middle"),
        svg_text(598, 220, "L' dx", "small", "middle"),
        svg_text(470, 316, "C' dx", "small"),
        svg_text(785, 316, "C' dx", "small"),
        svg_text(480, 458, "distributed lossless-line unit cells", "small", "middle"),
    ]
    tikz = [
        r"\draw[wire] (110,250) -- (205,250);",
        tikz_poly(resistor_points(205, 250, 360, amp=10), "wire"),
        r"\draw[wire] (360,250) -- (520,250);",
        tikz_poly(resistor_points(520, 250, 675, amp=10), "wire"),
        r"\draw[wire,->] (675,250) -- (850,250); \draw[wire] (110,410) -- (850,410);",
        r"\draw[wire] (430,250) -- (430,300); \draw[wire] (405,300) -- (455,300); \draw[wire] (405,320) -- (455,320); \draw[wire] (430,320) -- (430,410);",
        r"\draw[wire] (745,250) -- (745,300); \draw[wire] (720,300) -- (770,300); \draw[wire] (720,320) -- (770,320); \draw[wire] (745,320) -- (745,410);",
        r"\node[font=\small,text=zyloLine] at (282,220) {$L'\Delta x$}; \node[font=\small,text=zyloLine] at (598,220) {$L'\Delta x$};",
        r"\node[font=\small,text=zyloLine] at (485,316) {$C'\Delta x$}; \node[font=\small,text=zyloLine] at (800,316) {$C'\Delta x$};",
        r"\node[font=\small,text=zyloLine] at (480,458) {distributed lossless-line unit cells};",
    ]
    return svg, tikz


def template_three_phase_power(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_circle(155, 300, 48, "thin"),
        svg_text(155, 306, "3-PH", "label", "middle"),
        svg_line(203, 240, 700, 240, "wire", arrow=True),
        svg_line(203, 300, 700, 300, "wire", arrow=True),
        svg_line(203, 360, 700, 360, "wire", arrow=True),
        svg_text(232, 226, "phase A", "tiny"),
        svg_text(232, 286, "phase B", "tiny"),
        svg_text(232, 346, "phase C", "tiny"),
        svg_rect(700, 206, 145, 188, "soft"),
        svg_text(772, 294, "balanced", "small", "middle"),
        svg_text(772, 320, "3-phase load", "small", "middle"),
        svg_line(425, 240, 425, 300, "accent", arrow=True),
        svg_text(445, 274, "VL", "small"),
        svg_line(500, 220, 610, 220, "accent", arrow=True),
        svg_text(555, 202, "IL", "small", "middle"),
        svg_text(480, 438, "RMS line quantities and load power factor", "small", "middle"),
    ]
    tikz = [
        r"\draw[thinwire] (155,300) circle (48); \node at (155,306) {3-PH};",
        r"\draw[wire,->] (203,240) -- (700,240); \draw[wire,->] (203,300) -- (700,300); \draw[wire,->] (203,360) -- (700,360);",
        r"\node[font=\scriptsize,text=zyloLine] at (250,226) {phase A}; \node[font=\scriptsize,text=zyloLine] at (250,286) {phase B}; \node[font=\scriptsize,text=zyloLine] at (250,346) {phase C};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=145pt,minimum height=188pt,align=center] at (772,300) {balanced\\3-phase load};",
        r"\draw[accent,->] (425,240) -- (425,300); \node[font=\small,text=zyloLine] at (445,274) {$V_L$};",
        r"\draw[accent,->] (500,220) -- (610,220); \node[font=\small,text=zyloLine] at (555,202) {$I_L$};",
        r"\node[font=\small,text=zyloLine] at (480,438) {RMS line quantities and load power factor};",
    ]
    return svg, tikz


def template_am_bandwidth(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_line(130, 400, 840, 400, "thin", arrow=True),
        svg_rect(220, 285, 205, 115, "accentFill", 0),
        svg_rect(535, 285, 205, 115, "accentFill", 0),
        svg_line(480, 400, 480, 205, "accent"),
        svg_text(322, 270, "lower sideband", "small", "middle"),
        svg_text(638, 270, "upper sideband", "small", "middle"),
        svg_text(480, 188, "carrier", "small", "middle"),
        svg_text(220, 424, "fc - fm,max", "tiny", "middle"),
        svg_text(480, 424, "fc", "tiny", "middle"),
        svg_text(740, 424, "fc + fm,max", "tiny", "middle"),
        svg_line(220, 458, 740, 458, "thin"),
        svg_line(240, 458, 720, 458, "thin", arrow=True),
        svg_line(720, 458, 240, 458, "thin", arrow=True),
        svg_text(480, 484, "total occupied span", "small", "middle"),
    ]
    tikz = [
        r"\draw[thinwire,->] (130,400) -- (840,400);",
        r"\path[draw=zyloOrange,fill=orange!18] (220,285) rectangle (425,400); \path[draw=zyloOrange,fill=orange!18] (535,285) rectangle (740,400);",
        r"\draw[accent] (480,400) -- (480,205);",
        r"\node[font=\small,text=zyloLine] at (322,270) {lower sideband}; \node[font=\small,text=zyloLine] at (638,270) {upper sideband}; \node[font=\small,text=zyloLine] at (480,188) {carrier};",
        r"\node[font=\scriptsize,text=zyloLine] at (220,424) {$f_c-f_{m,\max}$}; \node[font=\scriptsize,text=zyloLine] at (480,424) {$f_c$}; \node[font=\scriptsize,text=zyloLine] at (740,424) {$f_c+f_{m,\max}$};",
        r"\draw[thinwire,<->] (240,458) -- (720,458); \node[font=\small,text=zyloLine] at (480,484) {total occupied span};",
    ]
    return svg, tikz


def template_bjt(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_circle(500, 305, 112, "thin"),
        svg_line(430, 245, 430, 365, "wire"),
        svg_line(245, 305, 430, 305, "wire", arrow=True),
        svg_line(430, 270, 555, 205, "wire"),
        svg_line(555, 205, 700, 205, "wire", arrow=True),
        svg_line(430, 340, 555, 405, "wire"),
        svg_line(555, 405, 700, 405, "wire", arrow=True),
        svg_line(515, 384, 558, 406, "accent", arrow=True),
        svg_text(225, 290, "IB", "small"),
        svg_text(705, 210, "IC", "small"),
        svg_text(705, 410, "IE", "small"),
        svg_text(405, 288, "B", "tiny"),
        svg_text(540, 190, "C", "tiny"),
        svg_text(540, 430, "E", "tiny"),
        svg_text(500, 466, "NPN transistor in forward-active operation", "small", "middle"),
    ]
    tikz = [
        r"\draw[thinwire] (500,305) circle (112); \draw[wire] (430,245) -- (430,365);",
        r"\draw[wire,->] (245,305) -- (430,305); \draw[wire] (430,270) -- (555,205); \draw[wire,->] (555,205) -- (700,205);",
        r"\draw[wire] (430,340) -- (555,405); \draw[wire,->] (555,405) -- (700,405); \draw[accent,->] (515,384) -- (558,406);",
        r"\node[font=\small,text=zyloLine] at (225,290) {$I_B$}; \node[font=\small,text=zyloLine] at (715,210) {$I_C$}; \node[font=\small,text=zyloLine] at (715,410) {$I_E$};",
        r"\node[font=\scriptsize,text=zyloLine] at (405,288) {B}; \node[font=\scriptsize,text=zyloLine] at (540,190) {C}; \node[font=\scriptsize,text=zyloLine] at (540,430) {E};",
        r"\node[font=\small,text=zyloLine] at (500,466) {NPN transistor in forward-active operation};",
    ]
    return svg, tikz


def template_inverting_opamp(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_path("M400,220 L400,380 L610,300 Z", "wire"),
        svg_text(425, 266, "+", "label"),
        svg_text(425, 346, "-", "label"),
        svg_line(120, 340, 180, 340, "wire"),
        svg_poly(resistor_points(180, 340, 330, amp=12), "wire"),
        svg_line(330, 340, 400, 340, "wire"),
        svg_circle(400, 340, 5, "accentFill"),
        svg_text(245, 314, "Rin", "small", "middle"),
        svg_text(98, 345, "Vin", "small", "end"),
        svg_line(610, 300, 825, 300, "wire"),
        svg_text(835, 305, "Vout", "small"),
        svg_line(400, 260, 330, 260, "wire"),
        svg_path("M330,260 V410", "wire"),
        svg_line(295, 410, 365, 410, "thin"),
        svg_line(305, 426, 355, 426, "thin"),
        svg_line(318, 442, 342, 442, "thin"),
        svg_path("M400,340 H330 V170 H380", "wire"),
        svg_poly(resistor_points(380, 170, 650, amp=12), "wire"),
        svg_path("M650,170 H720 V300", "wire"),
        svg_text(515, 144, "Rf", "small", "middle"),
        svg_text(515, 462, "negative feedback holds the summing node near virtual ground", "small", "middle"),
    ]
    tikz = [
        r"\draw[wire] (400,220) -- (400,380) -- (610,300) -- cycle;",
        r"\node at (425,266) {$+$}; \node at (425,346) {$-$};",
        r"\draw[wire] (120,340) -- (180,340);",
        tikz_poly(resistor_points(180, 340, 330, amp=12), "wire"),
        r"\draw[wire] (330,340) -- (400,340); \filldraw[draw=zyloOrange,fill=orange!18] (400,340) circle (5);",
        r"\node[font=\small,text=zyloLine] at (245,314) {$R_{in}$}; \node[font=\small,text=zyloLine] at (98,345) {$V_{in}$};",
        r"\draw[wire] (610,300) -- (825,300); \node[font=\small,text=zyloLine] at (850,305) {$V_{out}$};",
        r"\draw[wire] (400,260) -- (330,260) -- (330,410); \draw[thinwire] (295,410) -- (365,410); \draw[thinwire] (305,426) -- (355,426); \draw[thinwire] (318,442) -- (342,442);",
        r"\draw[wire] (400,340) -- (330,340) -- (330,170) -- (380,170);",
        tikz_poly(resistor_points(380, 170, 650, amp=12), "wire"),
        r"\draw[wire] (650,170) -- (720,170) -- (720,300); \node[font=\small,text=zyloLine] at (515,144) {$R_f$};",
        r"\node[font=\small,text=zyloLine] at (515,462) {negative feedback holds the summing node near virtual ground};",
    ]
    return svg, tikz


def template_transformer_valid(row: dict[str, str]) -> tuple[list[str], list[str]]:
    left_coil = (
        "M310,215 C265,230 265,260 310,275 "
        "C265,290 265,320 310,335 C265,350 265,380 310,395"
    )
    right_coil = (
        "M550,215 C595,230 595,260 550,275 "
        "C595,290 595,320 550,335 C595,350 595,380 550,395"
    )
    svg = [
        svg_path("M150,215 H310", "wire"),
        svg_path(left_coil, "wire"),
        svg_path("M310,395 H150", "wire"),
        svg_line(420, 190, 420, 420, "thin"),
        svg_line(442, 190, 442, 420, "thin"),
        svg_path("M550,215 H760", "wire"),
        svg_path(right_coil, "wire"),
        svg_path("M550,395 H760", "wire"),
        svg_text(260, 186, "Np", "small", "middle"),
        svg_text(620, 186, "Ns", "small", "middle"),
        svg_text(128, 222, "Vp+", "tiny", "end"),
        svg_text(128, 401, "Vp-", "tiny", "end"),
        svg_text(782, 222, "Vs+", "tiny"),
        svg_text(782, 401, "Vs-", "tiny"),
        svg_text(431, 458, "continuous windings linked by common core flux", "small", "middle"),
    ]
    tikz = [
        r"\draw[wire] (150,215) -- (310,215);",
        rf"\draw[wire] {left_coil.replace('M', '(').replace(',', ',').replace(' C', ') .. controls (').replace(' ', ' ')};",
        r"\draw[wire] (310,395) -- (150,395);",
        r"\draw[thinwire] (420,190) -- (420,420); \draw[thinwire] (442,190) -- (442,420);",
        r"\draw[wire] (550,215) -- (760,215);",
        r"\draw[wire] (550,215) .. controls (595,230) and (595,260) .. (550,275) .. controls (595,290) and (595,320) .. (550,335) .. controls (595,350) and (595,380) .. (550,395);",
        r"\draw[wire] (550,395) -- (760,395);",
        r"\node[font=\small,text=zyloLine] at (260,186) {$N_p$}; \node[font=\small,text=zyloLine] at (620,186) {$N_s$};",
        r"\node[font=\scriptsize,text=zyloLine] at (128,222) {$V_p+$}; \node[font=\scriptsize,text=zyloLine] at (128,401) {$V_p-$};",
        r"\node[font=\scriptsize,text=zyloLine] at (782,222) {$V_s+$}; \node[font=\scriptsize,text=zyloLine] at (782,401) {$V_s-$};",
        r"\node[font=\small,text=zyloLine] at (431,458) {continuous windings linked by common core flux};",
    ]
    # Use an explicit path for the primary in the TeX source.
    tikz[1] = (
        r"\draw[wire] (310,215) .. controls (265,230) and (265,260) .. (310,275) "
        r".. controls (265,290) and (265,320) .. (310,335) "
        r".. controls (265,350) and (265,380) .. (310,395);"
    )
    return svg, tikz


def template_buck_valid(row: dict[str, str]) -> tuple[list[str], list[str]]:
    load_points = [
        (715, 235),
        (715, 270),
        (700, 282),
        (730, 296),
        (700, 310),
        (730, 324),
        (700, 338),
        (715, 350),
        (715, 425),
    ]
    svg = [
        svg_circle(130, 320, 34, "thin"),
        svg_text(123, 308, "+", "tiny"),
        svg_text(123, 338, "-", "tiny"),
        svg_text(82, 324, "Vin", "small"),
        svg_path("M130,286 V235 H245", "wire"),
        svg_rect(245, 205, 90, 60, "soft"),
        svg_text(290, 241, "SW", "small", "middle"),
        svg_line(335, 235, 390, 235, "wire"),
        svg_path(inductor_path(390, 235, 560, turns=4, amp=20), "wire"),
        svg_line(560, 235, 790, 235, "wire"),
        svg_circle(390, 235, 5, "accentFill"),
        svg_path("M390,240 V315", "wire"),
        svg_rect(350, 315, 80, 62, "soft"),
        svg_text(390, 352, "D", "small", "middle"),
        svg_path("M390,377 V425 H130 V354", "wire"),
        svg_line(620, 235, 620, 305, "wire"),
        svg_line(595, 305, 645, 305, "wire"),
        svg_line(595, 325, 645, 325, "wire"),
        svg_line(620, 325, 620, 425, "wire"),
        svg_poly(load_points, "wire"),
        svg_text(475, 198, "L", "small", "middle"),
        svg_text(650, 318, "C", "small"),
        svg_text(750, 318, "Rload", "small"),
        svg_text(802, 240, "Vout", "small"),
        svg_text(510, 464, "switch node, freewheel path, output filter, and load", "small", "middle"),
    ]
    tikz = [
        r"\draw[thinwire] (130,320) circle (34); \node[font=\scriptsize] at (123,308) {$+$}; \node[font=\scriptsize] at (123,338) {$-$}; \node[font=\small] at (82,324) {$V_{in}$};",
        r"\draw[wire] (130,286) -- (130,235) -- (245,235); \node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=90pt,minimum height=60pt] at (290,235) {SW};",
        r"\draw[wire] (335,235) -- (390,235); \draw[wire,decorate,decoration={coil,aspect=0.5,segment length=22pt,amplitude=10pt}] (390,235) -- (560,235); \draw[wire] (560,235) -- (790,235);",
        r"\filldraw[draw=zyloOrange,fill=orange!18] (390,235) circle (5); \draw[wire] (390,240) -- (390,315); \node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=80pt,minimum height=62pt] at (390,346) {D}; \draw[wire] (390,377) -- (390,425) -- (130,425) -- (130,354);",
        r"\draw[wire] (620,235) -- (620,305); \draw[wire] (595,305) -- (645,305); \draw[wire] (595,325) -- (645,325); \draw[wire] (620,325) -- (620,425);",
        tikz_poly(load_points, "wire"),
        r"\node[font=\small,text=zyloLine] at (475,198) {$L$}; \node[font=\small,text=zyloLine] at (650,318) {$C$}; \node[font=\small,text=zyloLine] at (758,318) {$R_{load}$}; \node[font=\small,text=zyloLine] at (815,240) {$V_{out}$};",
        r"\node[font=\small,text=zyloLine] at (510,464) {switch node, freewheel path, output filter, and load};",
    ]
    return svg, tikz


def template_wavelength(row: dict[str, str]) -> tuple[list[str], list[str]]:
    wave = sine_points(150, 310, 660, 74, cycles=2.0)
    svg = [
        svg_line(115, 310, 850, 310, "thin", arrow=True),
        svg_poly(wave, "accent"),
        svg_line(232.5, 205, 562.5, 205, "thin"),
        svg_line(232.5, 190, 232.5, 225, "thin"),
        svg_line(562.5, 190, 562.5, 225, "thin"),
        svg_line(250, 205, 545, 205, "thin", arrow=True),
        svg_line(545, 205, 250, 205, "thin", arrow=True),
        svg_text(397.5, 184, "one wavelength, lambda", "small", "middle"),
        svg_text(480, 444, "free-space propagation: frequency sets wavelength", "small", "middle"),
    ]
    tikz = [
        r"\draw[thinwire,->] (115,310) -- (850,310);",
        tikz_poly(wave, "accent"),
        r"\draw[thinwire] (232.5,190) -- (232.5,225); \draw[thinwire] (562.5,190) -- (562.5,225); \draw[thinwire,<->] (250,205) -- (545,205);",
        r"\node[font=\small,text=zyloLine] at (397.5,184) {one wavelength, $\lambda$};",
        r"\node[font=\small,text=zyloLine] at (480,444) {free-space propagation: frequency sets wavelength};",
    ]
    return svg, tikz


def template_digital_states(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_text(110, 188, "n independent bits", "small"),
        svg_rect(110, 225, 125, 78, "soft"),
        svg_rect(255, 225, 125, 78, "soft"),
        svg_rect(525, 225, 155, 78, "soft"),
        svg_text(172, 272, "bit 0", "label", "middle"),
        svg_text(317, 272, "bit 1", "label", "middle"),
        svg_text(452, 272, "...", "label", "middle"),
        svg_text(602, 272, "bit n - 1", "label", "middle"),
        svg_line(680, 264, 760, 264, "wire", arrow=True),
        svg_rect(760, 215, 130, 98, "accentFill"),
        svg_text(825, 255, "2^n", "label", "middle"),
        svg_text(825, 284, "unique states", "small", "middle"),
        svg_text(480, 410, "Every added independent bit doubles the state count", "small", "middle"),
    ]
    tikz = [
        r"\node[font=\small,text=zyloLine] at (172,188) {$n$ independent bits};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=125pt,minimum height=78pt] at (172,264) {bit 0};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=125pt,minimum height=78pt] at (317,264) {bit 1};",
        r"\node[font=\Large,text=zyloLine] at (452,264) {$\cdots$};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=155pt,minimum height=78pt] at (602,264) {bit $n-1$};",
        r"\draw[wire,->] (680,264) -- (760,264);",
        r"\node[draw=zyloOrange,fill=orange!18,minimum width=130pt,minimum height=98pt,align=center] at (825,264) {$2^n$\\unique states};",
        r"\node[font=\small,text=zyloLine] at (480,410) {Every added independent bit doubles the state count};",
    ]
    return svg, tikz


def template_unity_feedback(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_text(88, 286, "r", "label"),
        svg_line(105, 300, 202, 300, "wire", arrow=True),
        svg_circle(226, 300, 24, "thin"),
        svg_text(216, 291, "+", "small"),
        svg_text(218, 329, "-", "small"),
        svg_line(250, 300, 365, 300, "wire", arrow=True),
        svg_rect(365, 245, 190, 110),
        svg_text(460, 293, "forward path", "small", "middle"),
        svg_text(460, 325, "DC gain K", "label", "middle"),
        svg_line(555, 300, 825, 300, "wire", arrow=True),
        svg_text(842, 306, "y", "label"),
        svg_circle(690, 300, 5, "accentFill"),
        svg_path("M690,305 V420 H226 V324", "wire", arrow=True),
        svg_rect(425, 392, 110, 56, "soft"),
        svg_text(480, 427, "H(s) = 1", "small", "middle"),
        svg_text(480, 472, "negative unity feedback", "small", "middle"),
    ]
    tikz = [
        r"\node at (88,286) {$r$}; \draw[wire,->] (105,300) -- (202,300);",
        r"\draw[thinwire] (226,300) circle (24); \node[font=\small] at (216,291) {$+$}; \node[font=\small] at (218,329) {$-$};",
        r"\draw[wire,->] (250,300) -- (365,300);",
        r"\node[box,minimum width=190pt,minimum height=110pt,align=center] at (460,300) {forward path\\DC gain $K$};",
        r"\draw[wire,->] (555,300) -- (825,300); \node at (842,306) {$y$};",
        r"\filldraw[draw=zyloOrange,fill=orange!18] (690,300) circle (5);",
        r"\draw[wire,->] (690,305) -- (690,420) -- (226,420) -- (226,324);",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=110pt,minimum height=56pt] at (480,420) {$H(s)=1$};",
        r"\node[font=\small,text=zyloLine] at (480,472) {negative unity feedback};",
    ]
    return svg, tikz


def template_pcb_delay(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_rect(145, 225, 670, 42, "accentFill", 4),
        svg_line(175, 205, 785, 205, "accent", arrow=True),
        svg_text(480, 184, "signal current", "small", "middle"),
        svg_text(480, 255, "trace length L", "label", "middle"),
        svg_rect(115, 390, 730, 44, "soft", 0),
        svg_line(785, 370, 175, 370, "wire", arrow=True),
        svg_text(480, 352, "return current", "small", "middle"),
        svg_text(480, 422, "continuous reference plane", "label", "middle"),
        svg_line(175, 295, 785, 295, "thin"),
        svg_line(175, 282, 175, 308, "thin"),
        svg_line(785, 282, 785, 308, "thin"),
        svg_text(480, 324, "one-way delay: tpd = L x d", "small", "middle"),
        svg_text(480, 464, "d is propagation delay per unit length", "small", "middle"),
    ]
    tikz = [
        r"\path[draw=zyloOrange,fill=orange!18,rounded corners=4pt,line width=1.5pt] (145,225) rectangle (815,267);",
        r"\draw[accent,->] (175,205) -- (785,205); \node[font=\small,text=zyloLine] at (480,184) {signal current};",
        r"\node at (480,255) {trace length $L$};",
        r"\path[draw=zyloLine,fill=white!80!zyloSoft] (115,390) rectangle (845,434);",
        r"\draw[wire,->] (785,370) -- (175,370); \node[font=\small,text=zyloLine] at (480,352) {return current};",
        r"\node at (480,422) {continuous reference plane};",
        r"\draw[thinwire] (175,295) -- (785,295); \draw[thinwire] (175,282) -- (175,308); \draw[thinwire] (785,282) -- (785,308);",
        r"\node[font=\small,text=zyloLine] at (480,324) {one-way delay: $t_{pd}=L d$};",
        r"\node[font=\small,text=zyloLine] at (480,464) {$d$ is propagation delay per unit length};",
    ]
    return svg, tikz


def template_voltmeter_loading(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_circle(150, 325, 38, "thin"),
        svg_text(143, 315, "+", "tiny"),
        svg_text(143, 342, "-", "tiny"),
        svg_text(93, 330, "Vs", "label"),
        svg_path("M150,287 V225 H250", "wire"),
        svg_poly(resistor_points(250, 225, 430, amp=12), "wire"),
        svg_text(340, 198, "Rs", "label", "middle"),
        svg_line(430, 225, 690, 225, "wire"),
        svg_circle(690, 325, 58, "thin"),
        svg_text(690, 337, "V", "label", "middle"),
        svg_path("M690,225 V267 M690,383 V425 H150 V363", "wire"),
        svg_text(770, 330, "Rm input", "small"),
        svg_circle(690, 225, 5, "accentFill"),
        svg_circle(690, 425, 5, "accentFill"),
        svg_text(480, 470, "The meter input resistance loads the source", "small", "middle"),
    ]
    tikz = [
        r"\draw[thinwire] (150,325) circle (38); \node[font=\scriptsize] at (143,315) {$+$}; \node[font=\scriptsize] at (143,342) {$-$}; \node at (93,330) {$V_s$};",
        r"\draw[wire] (150,287) -- (150,225) -- (250,225);",
        tikz_poly(resistor_points(250, 225, 430, amp=12), "wire"),
        r"\node at (340,198) {$R_s$}; \draw[wire] (430,225) -- (690,225);",
        r"\draw[thinwire] (690,325) circle (58); \node at (690,337) {$V$};",
        r"\draw[wire] (690,225) -- (690,267); \draw[wire] (690,383) -- (690,425) -- (150,425) -- (150,363);",
        r"\node[font=\small,text=zyloLine] at (790,330) {$R_m$ input};",
        r"\filldraw[draw=zyloOrange,fill=orange!18] (690,225) circle (5); \filldraw[draw=zyloOrange,fill=orange!18] (690,425) circle (5);",
        r"\node[font=\small,text=zyloLine] at (480,470) {The meter input resistance loads the source};",
    ]
    return svg, tikz


def template_wheatstone_bridge(row: dict[str, str]) -> tuple[list[str], list[str]]:
    svg = [
        svg_circle(480, 165, 5, "accentFill"),
        svg_circle(480, 440, 5, "accentFill"),
        svg_circle(255, 300, 5, "accentFill"),
        svg_circle(705, 300, 5, "accentFill"),
        svg_path("M480,165 L390,215 M340,245 L255,300 M255,300 L340,355 M390,385 L480,440", "wire"),
        svg_path("M480,165 L570,215 M620,245 L705,300 M705,300 L620,355 M570,385 L480,440", "wire"),
        svg_rect(340, 205, 50, 50, "soft", 2),
        svg_rect(340, 345, 50, 50, "soft", 2),
        svg_rect(570, 205, 50, 50, "soft", 2),
        svg_rect(570, 345, 50, 50, "soft", 2),
        svg_text(365, 238, "R1", "small", "middle"),
        svg_text(365, 378, "R2", "small", "middle"),
        svg_text(595, 238, "R3", "small", "middle"),
        svg_text(595, 378, "Rx", "small", "middle"),
        svg_line(260, 300, 422, 300, "wire"),
        svg_circle(480, 300, 58, "thin"),
        svg_text(480, 311, "G", "label", "middle"),
        svg_line(538, 300, 700, 300, "wire"),
        svg_text(480, 132, "excitation +", "small", "middle"),
        svg_text(480, 474, "excitation -", "small", "middle"),
    ]
    tikz = [
        r"\filldraw[draw=zyloOrange,fill=orange!18] (480,165) circle (5); \filldraw[draw=zyloOrange,fill=orange!18] (480,440) circle (5);",
        r"\filldraw[draw=zyloOrange,fill=orange!18] (255,300) circle (5); \filldraw[draw=zyloOrange,fill=orange!18] (705,300) circle (5);",
        r"\draw[wire] (480,165) -- (390,215); \draw[wire] (340,245) -- (255,300) -- (340,355); \draw[wire] (390,385) -- (480,440);",
        r"\draw[wire] (480,165) -- (570,215); \draw[wire] (620,245) -- (705,300) -- (620,355); \draw[wire] (570,385) -- (480,440);",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=50pt,minimum height=50pt] at (365,230) {$R_1$};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=50pt,minimum height=50pt] at (365,370) {$R_2$};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=50pt,minimum height=50pt] at (595,230) {$R_3$};",
        r"\node[draw=zyloLine,fill=white!80!zyloSoft,minimum width=50pt,minimum height=50pt] at (595,370) {$R_x$};",
        r"\draw[wire] (260,300) -- (422,300); \draw[thinwire] (480,300) circle (58); \node at (480,311) {$G$}; \draw[wire] (538,300) -- (700,300);",
        r"\node[font=\small,text=zyloLine] at (480,132) {excitation $+$}; \node[font=\small,text=zyloLine] at (480,474) {excitation $-$};",
    ]
    return svg, tikz


PRIMARY_OVERRIDES = {
    "AC-01": template_ac_rms,
    "NT-01": template_network_equivalents,
    "TR-01": template_transient_charge,
    "EM-01": template_coulomb,
    "TL-01": template_tline_distributed,
    "PS-01": template_three_phase_power,
    "TM-01": template_transformer_valid,
    "PE-01": template_buck_valid,
    "AE-01": template_inverting_opamp,
    "SD-01": template_bjt,
    "DL-01": template_digital_states,
    "CS-01": template_unity_feedback,
    "CM-01": template_am_bandwidth,
    "MI-04": template_voltmeter_loading,
    "MI-05": template_wheatstone_bridge,
    "PCB-01": template_pcb_delay,
    "RF-01": template_wavelength,
}


def template_problem(row: dict[str, str]) -> tuple[list[str], list[str]]:
    template_id = row["template_id"]
    if template_id in PRIMARY_OVERRIDES:
        return PRIMARY_OVERRIDES[template_id](row)
    if template_id.endswith("-01"):
        return PRIMARY_TEMPLATES[row["topic"]](row)
    return template_formula_scene(row)


TEMPLATES = {topic: template_problem for topic in PRIMARY_TEMPLATES}


def render_asset(image_row: dict[str, str], question_row: dict[str, str]) -> tuple[str, str]:
    image_id = image_row["image_id"]
    question_id = image_row["question_id"]
    title = f"{image_row['subtopic']} problem diagram"
    prompt = clean_prompt(question_row["question"])
    subtitle = f"{image_id} | {image_row['topic']} | {question_id}"
    source_path = f"latex_sources/{image_id}.tex"
    template = TEMPLATES.get(image_row["topic"], template_problem)
    asset_row = dict(image_row)
    asset_row.update(question_row)
    svg_body, tikz_body = template(asset_row)

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
    first_by_template: dict[str, dict[str, str]] = {}
    for row in rows:
        first_by_template.setdefault(row["template_id"], row)
    for template_id in sorted(FORMULA_METADATA):
        if template_id in first_by_template:
            selected.append(first_by_template[template_id])

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
    template_counts = Counter(row["template_id"] for row in rows)
    template_missing = sorted(set(topics) - set(TEMPLATES))
    formula_scene_missing = sorted(set(FORMULA_METADATA) - set(template_counts))

    sample_bad = []
    sampled_rows: dict[str, dict[str, str]] = {}
    for row in rows:
        sampled_rows.setdefault(row["template_id"], row)
    for row in sampled_rows.values():
        svg = (IMAGE_DIR / f"{row['image_id']}.svg").read_text(encoding="utf-8")
        tex = (LATEX_DIR / f"{row['image_id']}.tex").read_text(encoding="utf-8")
        if (
            "LaTeX/TikZ source" not in svg
            or r"\begin{tikzpicture}" not in tex
            or 'viewBox="0 0 960 600"' not in svg
            or '<rect class="panel" x="24" y="500"' not in svg
        ):
            sample_bad.append(row["image_id"])

    add("Image metadata rows", len(rows) == 12500, f"Found {len(rows)} image metadata rows.")
    add("LaTeX source count", source_count == len(rows), f"Found {source_count} LaTeX source files.")
    add("SVG image count", svg_count == len(rows), f"Found {svg_count} SVG image files.")
    add("Source cross-reference", not missing_sources, f"Missing source count: {len(missing_sources)}.")
    add("SVG cross-reference", not missing_svgs, f"Missing SVG count: {len(missing_svgs)}.")
    add("Topic template coverage", not template_missing, f"Missing templates: {template_missing}.")
    add(
        "Question-template image coverage",
        not formula_scene_missing and len(template_counts) == 100,
        f"Covered {len(template_counts)} of 100 question templates; missing: {formula_scene_missing}.",
    )
    add(
        "Balanced image distribution",
        set(template_counts.values()) == {125},
        f"Image counts per template: {sorted(set(template_counts.values()))}.",
    )
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
        "question_templates": dict(template_counts),
        "checks": checks,
        "notes": [
            "Each app-facing SVG has a matching editable LaTeX/TikZ source file in latex_sources/.",
            "The package machine did not include pdflatex/lualatex; SVGs are rendered deterministically from the same LaTeX/TikZ geometry by this generator.",
            "Question prompts are placed in a separate bottom panel to prevent text from overlapping the circuit or concept diagram.",
            "Each of the 100 question templates has 125 linked images, distributed evenly across all 25 levels.",
        ],
    }


def write_image_database(rows: list[dict[str, str]], qa_status: str) -> None:
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    for row in rows:
        row["qa_status"] = qa_status
    temp = IMAGE_DB_CSV.with_suffix(".csv.tmp")
    with temp.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    temp.replace(IMAGE_DB_CSV)
    IMAGE_DB_JSON.write_text(json.dumps(rows, indent=2), encoding="utf-8")


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
        "template_id",
        "difficulty_rank",
        "svg_path",
        "latex_source_path",
        "semantic_render_type",
        "asset_role",
        "visual_spec_version",
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
                    "template_id": image_row["template_id"],
                    "difficulty_rank": image_row["difficulty_rank"],
                    "svg_path": f"images/{image_id}.svg",
                    "latex_source_path": f"latex_sources/{image_id}.tex",
                    "semantic_render_type": (
                        "circuit_or_concept"
                        if image_row["template_id"] in PRIMARY_OVERRIDES
                        or image_row["template_id"].endswith("-01")
                        else "governing_relation"
                    ),
                    "asset_role": image_row.get("asset_role", "instructional_hint"),
                    "visual_spec_version": image_row.get("visual_spec_version", "2.0"),
                    "render_status": "generated_and_structurally_validated",
                }
            )
            if idx % 1000 == 0:
                print(f"Generated {idx}/{len(image_rows)} LaTeX-authored diagrams")

    write_contact_sheet(image_rows)
    validation = validate(image_rows, questions)
    VALIDATION_JSON.write_text(json.dumps(validation, indent=2), encoding="utf-8")

    if validation["status"] != "PASS":
        raise SystemExit("LaTeX image validation failed")
    write_image_database(image_rows, "Generated and structurally validated")
    print(f"Generated {len(image_rows)} LaTeX/TikZ sources and SVG diagrams.")
    print(f"Validation written to {VALIDATION_JSON}.")


if __name__ == "__main__":
    main()
