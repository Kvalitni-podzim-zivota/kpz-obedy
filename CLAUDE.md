# KPŽ – Rozvoz obědů / Webpage

Static HTML/CSS/JS website for **Služby KPŽ s.r.o.**, a meal delivery service operating in villages near Prague.

## Files

| File | Description |
|------|-------------|
| `index.html` | Homepage – landing page for households |
| `jidelni-listek.html` | Weekly menu with two supplier tabs |
| `firmy.html` | Corporate clients page incl. náhradní plnění |

No build system, no dependencies, no frameworks. Everything is plain HTML + CSS + JS in single files. Google Fonts loaded via CDN.

## Structure

All three pages share the same design system defined inline in `<style>` blocks:
- **Fonts:** Source Serif 4 (headings) + IBM Plex Sans (body)
- **Colors:** defined as CSS custom properties in `:root` – navy `#1a2e3b`, teal `#2a6b6e`, warm cream `#f5f0e8`
- **Nav:** sticky top bar, collapses to hamburger on mobile (≤700px)
- **Containers:** `.container { max-width: 1100px; margin: 0 auto; }` — no padding on container, padding is on `.section { padding: 3.5rem 1.5rem; }`

## Key content notes

- Operated by **Služby KPŽ s.r.o.**, subsidiary of non-profit **Kvalitní podzim života z.ú.**
- Two meal suppliers — each has own soup; customers can order from both simultaneously
- Delivery areas: Vestec (70 Kč), Dobřejovice (105 Kč), Jesenice / Ohrobec / Libuš / Písnice (130 Kč + 11 Kč delivery)
- Base price 130 Kč incl. VAT, soup and delivery always included
- Orders for **next week**, placed by end of current working week
- Contact for orders: Jaroslava Kubásková, 778 095 906, obedy@kvalitnipodzimzivota.cz
- Contact for billing: Šárka Radilová, 778 095 645, administrativa@kvalitnipodzimzivota.cz

## Order form

`index.html` contains an HTML order form (`#objednat-formular`) with client-side validation. **The form does not send emails yet** — the submit handler logs data to console. To wire it up, replace the `console.log` block in the `<script>` at the bottom of `index.html` with a `fetch()` to a PHP endpoint or a service like Formspree.

## Deployment

Hosted on GitHub Pages. All internal links are relative — no absolute paths. To deploy: push all three HTML files to the root of the repository and enable Pages from the main branch.
