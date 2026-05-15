#!/usr/bin/env python3
"""
generate_menu.py — Weekly menu update tool for KPŽ.

Run:   python generate_menu.py
Enter the two DOCX paths when prompted.
Result: assets/menu.json — commit and push to update the website.
"""

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

# ── DOCX reading ──────────────────────────────────────────────────────────────

def read_docx_paragraphs(path):
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
    text = re.sub(r'\s*/[\d,\s]+/\s*$', '', text)
    text = re.sub(r'\s+\d{1,2}(?:,\d{1,2})+\s*$', '', text)
    return text.strip()

def normalize_weight(raw):
    raw = raw.strip()
    raw = re.sub(r'(\d+)\s*g$', r'\1 g', raw)
    raw = re.sub(r'(\d+)\s*ks$', r'\1 ks', raw)
    return raw

def parse_week_dates(header):
    m = re.search(r'(\d+)\.\s*(\d+)\.\s*[-–].*?(\d{4})', header)
    if not m:
        return [''] * 5
    start_day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return [f'{start_day + i}. {month}. {year}' for i in range(5)]

def split_suppliers(paragraphs):
    for i, line in enumerate(paragraphs):
        if 'Maják' in line or 'Štěchovický' in line:
            return paragraphs[:i], paragraphs[i:]
    return paragraphs, []

# ── parsers ───────────────────────────────────────────────────────────────────

def parse_modletice(lines, dates):
    days, soup, meals, day_idx = [], None, [], 0
    for line in lines:
        if is_separator(line):
            if soup is not None and day_idx < 5:
                days.append({'day': DAYS_CZ[day_idx], 'date': dates[day_idx],
                             'soup': soup, 'meals': meals})
                day_idx += 1
            soup, meals = None, []
            continue
        upper = line.upper()
        for d in DAYS_CZ:
            if upper.startswith(d.upper() + ':'):
                soup = strip_allergens(line.split(':', 1)[1])
                break
        else:
            m = re.match(r'^([A-H])\s+(\d+\s*(?:g|ks))\s+(.+)$', line)
            if m:
                label = f'{m.group(1)} · {normalize_weight(m.group(2))}'
                desc = strip_allergens(m.group(3))
                meals.append({'label': label, 'desc': desc})
    if soup is not None and day_idx < 5:
        days.append({'day': DAYS_CZ[day_idx], 'date': dates[day_idx],
                     'soup': soup, 'meals': meals})
    return days

def parse_majak(lines, dates):
    days, soup, meals, day_idx = [], None, [], 0
    for line in lines:
        if is_separator(line):
            if soup is not None and day_idx < 5:
                days.append({'day': DAYS_CZ[day_idx], 'date': dates[day_idx],
                             'soup': soup, 'meals': meals})
                day_idx += 1
            soup, meals = None, []
            continue
        for d in DAYS_CZ:
            if line.lower().startswith(d.lower() + ':'):
                soup = strip_allergens(line.split(':', 1)[1])
                break
        else:
            m = re.match(r'^(\d+):\s+(.+?)\s+(\d+)\s*g\s*/[\d,]+/\s*$', line)
            if m:
                label = f'{m.group(1)} · {m.group(3)} g'
                desc = m.group(2).strip()
                meals.append({'label': label, 'desc': desc})
    if soup is not None and day_idx < 5:
        days.append({'day': DAYS_CZ[day_idx], 'date': dates[day_idx],
                     'soup': soup, 'meals': meals})
    return days

def parse_docx(path):
    paragraphs = read_docx_paragraphs(str(path))
    dates = parse_week_dates(paragraphs[0]) if paragraphs else [''] * 5
    mod_lines, maj_lines = split_suppliers(paragraphs)
    modletice = parse_modletice(mod_lines[1:], dates)
    majak = parse_majak(maj_lines[1:], dates)
    return modletice, majak

# ── main ──────────────────────────────────────────────────────────────────────

def ask_path(prompt):
    p = input(prompt).strip().strip('"').strip("'")
    path = Path(p)
    if not path.exists():
        print(f'  Soubor nenalezen: {p}')
        sys.exit(1)
    return path

def week_label(days):
    if not days:
        return '?'
    first_date = days[0]['date']
    last_date = days[-1]['date']
    m = re.match(r'(\d+)\. (\d+)\.', first_date)
    m2 = re.match(r'(\d+)\. (\d+)\. (\d+)', last_date)
    if m and m2:
        return f"{m.group(1)}.{m.group(2)}.–{m2.group(1)}.{m2.group(2)}.{m2.group(3)}"
    return first_date

def main():
    print()
    print('=' * 48)
    print('  KPŽ – Generator jídelního lístku')
    print('=' * 48)
    print()
    print('Zadejte cesty k DOCX souborům (lze přetáhnout soubor do terminálu).')
    print()

    t1_path = ask_path('Tento týden  (DOCX): ')
    t2_path = ask_path('Příští týden (DOCX): ')

    print()
    print('Zpracovávám…')

    t1_mod, t1_maj = parse_docx(t1_path)
    t2_mod, t2_maj = parse_docx(t2_path)

    menu = {
        'tyden1': {'modletice': t1_mod, 'majak': t1_maj},
        'tyden2': {'modletice': t2_mod, 'majak': t2_maj},
    }

    out = Path('assets/menu.json')
    out.write_text(json.dumps(menu, ensure_ascii=False, indent=2), encoding='utf-8')

    print()
    print(f'✓  Tento týden:   {week_label(t1_mod)}  ({len(t1_mod)} dní Modletice, {len(t1_maj)} dní Maják)')
    print(f'✓  Příští týden:  {week_label(t2_mod)}  ({len(t2_mod)} dní Modletice, {len(t2_maj)} dní Maják)')
    print()
    print(f'Uloženo: {out}')
    print()
    print('Publikování na web:')
    print('  git add assets/menu.json')
    print('  git commit -m "update menu"')
    print('  git push')
    print()

if __name__ == '__main__':
    main()
