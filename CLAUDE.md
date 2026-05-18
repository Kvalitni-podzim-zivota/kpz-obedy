# KPŽ – Rozvoz obědů / Webpage

Static HTML/CSS/JS website for **Služby KPŽ s.r.o.**, a meal delivery service operating in villages near Prague.

## Files

| File                  | Description                                      |
|-----------------------|--------------------------------------------------|
| `index.html`          | Homepage – landing page for households           |
| `jidelni-listek.html` | Weekly menu with two supplier tabs               |
| `firmy.html`          | Corporate clients page incl. náhradní plnění     |
| `vop.html`            | Všeobecné obchodní podmínky (terms & conditions) |
| `flier.html`          | Printable flier / leták                          |
| `generate_menu.py`    | Parses DOCX files into `assets/menu.json`        |

No build system, no dependencies, no frameworks. Everything is plain HTML + CSS + JS in single files. Google Fonts loaded via CDN.

## Structure

All pages share the same design system defined inline in `<style>` blocks:
- **Fonts:** Source Serif 4 (headings) + IBM Plex Sans (body)
- **Colors:** defined as CSS custom properties in `:root` – navy `#1a2e3b`, teal `#2a6b6e`, warm cream `#f5f0e8`
- **Nav:** sticky top bar, collapses to hamburger on mobile (≤700px)
- **Containers:** `.container { max-width: 1100px; margin: 0 auto; }` — no padding on container, padding is on `.section { padding: 3.5rem 1.5rem; }`

## Key content notes

- Operated by **Služby KPŽ s.r.o.**, subsidiary of non-profit **Kvalitní podzim života z.ú.**
- Two meal suppliers — each has own soup; customers can order from both simultaneously
- Delivery areas: Vestec, Praha–Libuš, Praha–Písnice, Jesenice (incl. Zdiměřice, Osnice, Kocanda), Dolní Břežany (incl. Lhota, Zálepy), Ohrobec, Dobřejovice, Zvole, Březová–Oleško, Radějovice, Velké Přílepy, Statenice–Černý Vůl, Holubice–Kozinec, Tursko, Noutonice–Lichoceves, Lysolaje
- Base price 135 Kč incl. VAT, soup always included

## Pricing per delivery area

When the user asks to update prices or locations, edit this table, then run the update command.

| Location | Total price | Delivery fee | Notes |
|---|---|---|---|
| Vestec | 75 Kč | free (covered by discount) | Municipal discount 95 Kč off (35 Kč delivery + 60 Kč off meal). Not guaranteed. |
| Praha – Libuš | 135 Kč + 11 Kč | 11 Kč/lunch | |
| Praha – Písnice | 135 Kč + 35/10 Kč | 35 Kč (1st) + 10 Kč (each additional to same address) | |
| Jesenice (vč. Zdiměřic, Osnice, Kocandy) | 135 Kč + 11 Kč | 11 Kč/lunch | |
| Dolní Břežany (vč. Lhoty, Zálepů) | 135 Kč | free | |
| Ohrobec | 135 Kč + 11 Kč | 11 Kč/lunch | |
| Dobřejovice | 105 Kč | free (covered by discount) | Municipal discount 65 Kč off (35 Kč delivery + 30 Kč off meal). Not guaranteed. |
| Zvole | 135 Kč | free | |
| Březová – Oleško | 135 Kč + 35/10 Kč | 35 Kč (1st) + 10 Kč (each additional) | |
| Radějovice | 135 Kč | free | |
| Velké Přílepy | 135 Kč | free | |
| Statenice – Černý Vůl | 135 Kč | free | |
| Holubice – Kozinec | 135 Kč | free | |
| Tursko | 135 Kč | free | |
| Noutonice – Lichoceves | 135 Kč | free | |
| Lysolaje | 135 Kč + 35/10 Kč | 35 Kč (1st) + 10 Kč (each additional) | |
| Other areas | 135 Kč + 35/10 Kč | 35 Kč (1st) + 10 Kč (each additional) | |

**When told to update pricing**, apply changes from this table consistently across:
1. `index.html` — delivery area grid (lines ~155–220) and price calculator `<select>` options
2. `assets/js/index.js` — `CENY` object (lines ~3–20) and `POZNAMKY` strings (lines ~23–40)
3. `vop.html` — section 6 (cena, platební podmínky)
- Orders for **next week**, placed by end of current working week
- Contact for orders: Jaroslava Kubásková, 778 095 906, obedy@kvalitnipodzimzivota.cz
- Contact for billing: Šárka Radilová, 778 095 645, administrativa@kvalitnipodzimzivota.cz

## Order form

`index.html` contains an HTML order form (`#objednat-formular`) with client-side validation. The submit handler is in `assets/js/index.js`.

On submit, the handler opens a `mailto:obedy@kvalitnipodzimzivota.cz` link with a pre-filled subject and body containing all form fields. The user's email client opens and they send the message manually.

Required fields: jméno, telefon, e-mail, ulice, obec, objednávka. Submission is blocked until the user checks all three checkboxes (next-week acknowledgement, GDPR consent, VOP agreement).

**To upgrade to server-side sending** (e.g. SMTP.js, Formspree, or a PHP endpoint): replace the `window.location.href = 'mailto:...'` block in `assets/js/index.js` with a `fetch()` call. The form data is already assembled in local variables (`jmeno`, `telefon`, `email`, `ulice`, `obec`, `psc`, `objednavka`, `platbaVal`) at that point.

## Menu update workflow

`generate_menu.py` converts the weekly supplier DOCX files into `assets/menu.json`, which `jidelni-listek.html` reads to render the menu. No third-party dependencies — stdlib only (`zipfile`, `xml.etree`, `re`, `json`).

**Run:**
```
python generate_menu.py
```
You are prompted for two DOCX paths — current week and next week. Drag-and-drop into the terminal works. The script writes `assets/menu.json` and prints a summary. Then publish:
```
git add assets/menu.json && git commit -m "update menu" && git push
```

**DOCX format expected by the parsers:**
- First paragraph is the week header: `Jídelní lístek 19.5. – 23.5.2025` (used to derive day dates).
- Day headers: `Pondělí: Rajská polévka` — day name + colon + soup.
- Day separator: a line of 10+ dashes (`----------`).
- Modletice meal rows: `A 200g Svíčková na smetaně` (letter label, weight, description).
- Maják meal rows: `1: Kuřecí řízek 150g /1,3,7/` (number label, description, weight, allergens).
- Both suppliers can arrive in a single DOCX; the script splits on `Maják`/`Štěchovický`.

**Output schema** (`assets/menu.json`):
```
{
  "tyden1": { "label": "19.5.–23.5.2025", "modletice": [...], "majak": [...] },
  "tyden2": { "label": "26.5.–30.5.2025", "modletice": [...], "majak": [...] }
}
```
Each day entry: `{ "day": "Pondělí", "date": "19. 5. 2025", "soup": "…", "meals": [{"label": "A · 200 g", "desc": "…"}] }`.

## Deployment

Hosted on GitHub Pages. All internal links are relative — no absolute paths. To deploy: push all HTML files (`index.html`, `jidelni-listek.html`, `firmy.html`, `vop.html`, `flier.html`) to the root of the repository and enable Pages from the main branch.
