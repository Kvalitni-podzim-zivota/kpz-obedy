#!/usr/bin/env python3
"""
parse_menu.py — Parse a KPŽ menu DOCX and output ready-to-paste HTML panels.

Usage:
    python parse_menu.py "assets/Jídelní lístek 25. 5. - 29. 5. 2026.docx"

Output: menu_output.html with HTML for both supplier panels.

Pasting into jidelni-listek.html:
  - For 'Příští týden': paste panels with IDs panel-a-t2 / panel-b-t2  (default)
  - For 'Tento týden':  paste panels with IDs panel-a-t1 / panel-b-t1
    → find-replace "-t2" → "-t1" in the output before pasting
"""

import re
import sys
import zipfile
from xml.etree import ElementTree as ET

# ── DOCX reading ──────────────────────────────────────────────────────────────

def read_docx_paragraphs(path):
    """Return list of non-empty text strings, one per paragraph."""
    with zipfile.ZipFile(path) as z:
        with z.open('word/document.xml') as f:
            tree = ET.parse(f)
    ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    paragraphs = []
    for para in tree.getroot().iter(f'{{{ns}}}p'):
        text = ''.join(t.text for t in para.iter(f'{{{ns}}}t') if t.text).strip()
        if text:
            paragraphs.append(text)
    return paragraphs

# ── helpers ───────────────────────────────────────────────────────────────────

DAYS_CZ = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek']

def is_separator(line):
    return bool(re.match(r'^-{10,}$', line.strip()))

def strip_allergens(text):
    """Remove trailing EU allergen codes (digits 1–14 separated by commas)."""
    text = re.sub(r'\s*/[\d,\s]+/\s*$', '', text)       # /1,3,7/
    text = re.sub(r'\s+\d{1,2}(?:,\d{1,2})+\s*$', '', text)  # 1,3,7,9
    return text.strip()

def normalize_weight(raw):
    """'140g' → '140 g', '2ks' → '2 ks'"""
    raw = raw.strip()
    raw = re.sub(r'(\d+)\s*g$', r'\1 g', raw)
    raw = re.sub(r'(\d+)\s*ks$', r'\1 ks', raw)
    return raw

def parse_week_dates(header):
    """
    Extract 5 date strings from a range like '25. 5. - 29. 5. 2026'.
    Returns ['25. 5. 2026', '26. 5. 2026', ...]
    """
    m = re.search(r'(\d+)\.\s*(\d+)\.\s*[-–].*?(\d{4})', header)
    if not m:
        return [''] * 5
    start_day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return [f'{start_day + i}. {month}. {year}' for i in range(5)]

# ── section splitter ──────────────────────────────────────────────────────────

def split_suppliers(paragraphs):
    """Split paragraphs into (modletice_lines, majak_lines) at the Maják header."""
    for i, line in enumerate(paragraphs):
        if 'Maják' in line or 'Štěchovický' in line:
            return paragraphs[:i], paragraphs[i:]
    return paragraphs, []

# ── parsers ───────────────────────────────────────────────────────────────────

def parse_modletice(lines, dates):
    """
    Modletice format:
      PONDĚLÍ: Soup name allergens
      A 140g  Description allergens
      B 120g  Description allergens
      ---separator---
    """
    days, soup, meals, day_idx = [], None, [], 0

    for line in lines:
        if is_separator(line):
            if soup is not None and day_idx < 5:
                days.append({'name': DAYS_CZ[day_idx], 'date': dates[day_idx],
                             'soup': soup, 'meals': meals})
                day_idx += 1
            soup, meals = None, []
            continue

        # Day header — uppercase Czech day name followed by colon
        upper = line.upper()
        for d in DAYS_CZ:
            if upper.startswith(d.upper() + ':'):
                soup = strip_allergens(line.split(':', 1)[1])
                break
        else:
            # Meal line: letter, weight (g or ks), description, allergens
            m = re.match(r'^([A-H])\s+(\d+\s*(?:g|ks))\s+(.+)$', line)
            if m:
                label = f'{m.group(1)} · {normalize_weight(m.group(2))}'
                desc = strip_allergens(m.group(3))
                meals.append((label, desc))

    if soup is not None and day_idx < 5:
        days.append({'name': DAYS_CZ[day_idx], 'date': dates[day_idx],
                     'soup': soup, 'meals': meals})
    return days


def parse_majak(lines, dates):
    """
    Maják format:
      Pondělí: Soup name /allergens/
      1: Description 130g /allergens/
      ---separator---
    """
    days, soup, meals, day_idx = [], None, [], 0

    for line in lines:
        if is_separator(line):
            if soup is not None and day_idx < 5:
                days.append({'name': DAYS_CZ[day_idx], 'date': dates[day_idx],
                             'soup': soup, 'meals': meals})
                day_idx += 1
            soup, meals = None, []
            continue

        # Day header — title-case Czech day name followed by colon
        for d in DAYS_CZ:
            if line.lower().startswith(d.lower() + ':'):
                soup = strip_allergens(line.split(':', 1)[1])
                break
        else:
            # Meal line: number, description, weight at end
            m = re.match(r'^(\d+):\s+(.+?)\s+(\d+)\s*g\s*/[\d,]+/\s*$', line)
            if m:
                label = f'{m.group(1)} · {m.group(3)} g'
                desc = m.group(2).strip()
                meals.append((label, desc))

    if soup is not None and day_idx < 5:
        days.append({'name': DAYS_CZ[day_idx], 'date': dates[day_idx],
                     'soup': soup, 'meals': meals})
    return days

# ── HTML rendering ────────────────────────────────────────────────────────────

def render_days(days):
    out = []
    for day in days:
        cells = '\n'.join(
            f'              <div class="meal-cell">\n'
            f'                <div class="meal-num">{label}</div>\n'
            f'                <div class="meal-name">{desc}</div>\n'
            f'              </div>'
            for label, desc in day['meals']
        )
        out.append(
            f'          <div class="menu-day" role="listitem">\n'
            f'            <div class="day-header">'
            f'<span class="day-name">{day["name"]}</span>'
            f'<span class="day-date">{day["date"]}</span></div>\n'
            f'            <div class="day-soup">'
            f'<span class="soup-label">Polévka</span>'
            f'<span class="soup-name">{day["soup"]}</span></div>\n'
            f'            <div class="day-meals">\n'
            f'{cells}\n'
            f'            </div>\n'
            f'          </div>'
        )
    return '\n\n'.join(out)


def render_modletice_panel(panel_id, days):
    closing = panel_id.replace('panel-a', '/panel-a')
    return (
        f'      <!-- PANEL: MODLETICE -->\n'
        f'      <div class="supplier-panel panel-a active" id="{panel_id}" role="tabpanel">\n'
        f'        <div class="supplier-header a">\n'
        f'          <span class="supplier-header-name">Modletice</span>\n'
        f'          <span class="supplier-header-note">— každé jídlo včetně polévky Modletice a dovozu</span>\n'
        f'        </div>\n'
        f'        <div class="menu-days" role="list">\n\n'
        f'{render_days(days)}\n\n'
        f'        </div><!-- /menu-days Modletice -->\n'
        f'      </div><!-- {closing} -->'
    )


def render_majak_panel(panel_id, days):
    closing = panel_id.replace('panel-b', '/panel-b')
    return (
        f'      <!-- PANEL: ŠTĚCHOVICKÝ MAJÁK -->\n'
        f'      <div class="supplier-panel panel-b" id="{panel_id}" role="tabpanel">\n'
        f'        <div class="supplier-header b">\n'
        f'          <span class="supplier-header-name">Štěchovický Maják</span>\n'
        f'          <span class="supplier-header-note">— každé jídlo včetně polévky Štěchovického Majáku a dovozu</span>\n'
        f'        </div>\n'
        f'        <div class="menu-days" role="list">\n\n'
        f'{render_days(days)}\n\n'
        f'        </div><!-- /menu-days Štěchovický Maják -->\n'
        f'      </div><!-- {closing} -->'
    )

# ── main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    docx_path = sys.argv[1]
    paragraphs = read_docx_paragraphs(docx_path)

    dates = parse_week_dates(paragraphs[0]) if paragraphs else [''] * 5

    mod_lines, maj_lines = split_suppliers(paragraphs)
    mod_days = parse_modletice(mod_lines[1:], dates)   # skip header
    maj_days = parse_majak(maj_lines[1:], dates)        # skip header

    output = (
        '<!-- ════════════════════════════════════════════════════════════════\n'
        '     PASTE INTO jidelni-listek.html\n'
        '     Default IDs: panel-a-t2 / panel-b-t2  →  Příští týden\n'
        '     For Tento týden: find-replace -t2 with -t1 before pasting\n'
        '     ════════════════════════════════════════════════════════════════ -->\n\n'
        f'{render_modletice_panel("panel-a-t2", mod_days)}\n\n'
        f'{render_majak_panel("panel-b-t2", maj_days)}\n'
    )

    out_path = 'menu_output.html'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(output)

    week = f'{dates[0]} – {dates[4]}' if dates[0] else '(dates unknown)'
    print(f'Week:    {week}')
    print(f'Parsed:  Modletice {len(mod_days)} days, Maják {len(maj_days)} days')
    print(f'Output:  {out_path}')


if __name__ == '__main__':
    main()