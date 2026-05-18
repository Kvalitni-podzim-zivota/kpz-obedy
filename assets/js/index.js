// ============================================================
// assets/js/index.js – logika pro index.html
//
// Tento soubor dělá tři věci:
//   1. Načte assets/cenik.json a z něj dynamicky vykreslí
//      tabulku cen, select kalkulačky a select formuláře.
//   2. Spočítá orientační cenu (funkce spocitej).
//   3. Zpracuje odeslání objednávkového formuláře přes mailto.
//
// Ceník je záměrně v JSON (ne hardkódovaný tady), aby stačilo
// při změně cen nebo oblastí editovat pouze assets/cenik.json.
// ============================================================


// ── 1. CENÍK ─────────────────────────────────────────────────

// _ceny a _poznamky se naplní po načtení JSON; dokud nejsou
// naplněné, spocitej() nic nedělá (guard na řádku 56).
let _ceny = null;
let _poznamky = null;

// Cesta je relativní k index.html, ne k tomuto souboru.
fetch('assets/cenik.json')
  .then(function(r) { return r.json(); })
  .then(function(data) {

    // Sestavíme rychlé lookup tabulky pro kalkulačku.
    _ceny = {};
    _poznamky = {};
    data.zones.forEach(function(z) {
      _ceny[z.id] = { jidlo: z.jidlo, doprava: z.doprava };
      _poznamky[z.id] = z.poznamka;
    });

    // -- Mřížka doručovacích oblastí --
    // Zóny s inGrid: false (tj. "Jiná obec") se v mřížce nezobrazí –
    // mřížka slouží jako přehled cen, ne jako úplný seznam obcí.
    var grid = document.getElementById('cenik-grid');
    if (grid) {
      var gridHtml = '';
      data.zones.forEach(function(z) {
        if (z.inGrid === false) return;
        gridHtml += '<div style="background:#fff;padding:1rem 1.25rem;">'
          + '<div style="font-weight:700;color:var(--navy);">' + z.label + '</div>'
          + '<div style="font-size:0.82rem;color:var(--muted);">' + z.gridNote + '</div>'
          + '</div>';
      });
      grid.innerHTML = gridHtml;
    }

    // -- Select kalkulačky --
    // selectLabel je nepovinný – používá se jen tam, kde název zóny
    // nestačí (např. "Jesenice (vč. Zdiměřic, Osnice, Kocandy)").
    var calcSelect = document.getElementById('obec');
    if (calcSelect) {
      var calcHtml = '<option value="">– vyberte obec –</option>';
      data.zones.forEach(function(z) {
        calcHtml += '<option value="' + z.id + '">' + (z.selectLabel || z.label) + '</option>';
      });
      calcSelect.innerHTML = calcHtml;
    }

    // -- Select objednávkového formuláře --
    // Formulář potřebuje individuální obce (vč. spádových), proto
    // iterujeme přes z.villages místo přes zóny. Hodnota optionu
    // je název obce – přijde do těla e-mailu jako adresa doručení.
    var formSelect = document.getElementById('obec-form');
    if (formSelect) {
      var formHtml = '<option value="">– vyberte obec –</option>';
      data.zones.forEach(function(z) {
        z.villages.forEach(function(v) {
          var lbl = v === 'Jiná obec' ? 'Jiná obec (zeptejte se na cenu)' : v;
          formHtml += '<option value="' + v + '">' + lbl + '</option>';
        });
      });
      formSelect.innerHTML = formHtml;
    }
  });


// ── 2. KALKULAČKA ────────────────────────────────────────────

// Voláno z onchange/oninput atributů v index.html.
// Pro dopravné 35 Kč (Lysolaje, jiné obce) kalkulačka počítá
// jednoduše jidlo+doprava na oběd – nezohledňuje slevu za druhý
// a další oběd na stejnou adresu (to se řeší individuálně).
function spocitej() {
  if (!_ceny) return; // JSON ještě není načtený
  var obec = document.getElementById('obec').value;
  var pocet = parseInt(document.getElementById('pocet').value, 10);
  var result = document.getElementById('result');
  var priceEl = document.getElementById('result-price');
  var noteEl = document.getElementById('result-note');

  if (!obec || !pocet || pocet < 1) {
    result.classList.remove('visible');
    return;
  }

  var c = _ceny[obec];
  var celkem = (c.jidlo + c.doprava) * pocet;
  var jedenObejd = c.jidlo + c.doprava;

  priceEl.textContent = celkem.toLocaleString('cs-CZ') + ' Kč / měsíc';
  noteEl.textContent = jedenObejd + ' Kč za oběd · ' + pocet + ' obědů · ' + (_poznamky[obec] || '');
  result.classList.add('visible');
}


// ── 3. OBJEDNÁVKOVÝ FORMULÁŘ ─────────────────────────────────

// Formulář nevyužívá server – po odeslání otevře mailto: odkaz
// s předvyplněným předmětem a tělem. E-mailový klient uživatele
// zprávu zobrazí; uživatel ji sám odešle.
//
// Pokud by se do budoucna přecházelo na server (Formspree, PHP…),
// stačí nahradit blok s mailtoUrl za fetch() POST.

var form = document.getElementById('objednavka-form');
if (form) {

  // Zkontroluje jedno pole: přidá/odebere třídu 'invalid' a vrátí bool.
  function validateField(id, fieldId) {
    var fg = document.getElementById(id);
    var el = document.getElementById(fieldId);
    if (!fg || !el) return true;
    var val = el.value.trim();
    if (!val) { fg.classList.add('invalid'); return false; }
    fg.classList.remove('invalid'); return true;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validace všech povinných polí před sestavením mailu.
    var ok = true;
    ok = validateField('fg-jmeno', 'jmeno') && ok;
    ok = validateField('fg-telefon', 'telefon') && ok;
    ok = validateField('fg-email', 'email') && ok;
    ok = validateField('fg-ulice', 'ulice') && ok;
    ok = validateField('fg-obec', 'obec-form') && ok;
    ok = validateField('fg-objednavka', 'objednavka') && ok;

    // Tři checkboxy jsou povinné – chybová hláška se zobrazí/skryje ručně,
    // protože checkboxy nemají fg-* wrapper se třídou 'invalid'.
    var pristiTyden = document.getElementById('pristi-tyden');
    var pristiErr = document.getElementById('fg-pristi-tyden-err');
    if (!pristiTyden.checked) {
      pristiErr.style.display = 'block'; ok = false;
    } else { pristiErr.style.display = 'none'; }

    var souhlas = document.getElementById('souhlas');
    var souhlasErr = document.getElementById('fg-souhlas-err');
    if (!souhlas.checked) {
      souhlasErr.style.display = 'block'; ok = false;
    } else { souhlasErr.style.display = 'none'; }

    var vop = document.getElementById('vop');
    var vopErr = document.getElementById('fg-vop-err');
    if (!vop.checked) {
      vopErr.style.display = 'block'; ok = false;
    } else { vopErr.style.display = 'none'; }

    if (!ok) return;

    // Sestavení těla e-mailu z hodnot formuláře.
    var jmeno      = document.getElementById('jmeno').value.trim();
    var telefon    = document.getElementById('telefon').value.trim();
    var email      = document.getElementById('email').value.trim();
    var ulice      = document.getElementById('ulice').value.trim();
    var obec       = document.getElementById('obec-form').value;
    var psc        = document.getElementById('psc').value.trim();
    var objednavka = document.getElementById('objednavka').value.trim();
    var platbaVal  = document.getElementById('platba').value;
    var platbaMap  = { hotove: 'Hotově při rozvozu', prevod: 'Bankovní převod', nevim: 'Nevím, chci poradit' };

    var subject = 'Nová objednávka obědů – ' + jmeno;
    var body = [
      'Jméno: '    + jmeno,
      'Telefon: '  + telefon,
      'E-mail: '   + email,
      '',
      'Adresa doručení:',
      ulice,
      obec + (psc ? '  ' + psc : ''),
      '',
      'Objednávka:',
      objednavka,
      '',
      'Způsob platby: ' + (platbaMap[platbaVal] || platbaVal),
    ].join('\n');

    var mailtoUrl = 'mailto:obedy@kvalitnipodzimzivota.cz'
      + '?subject=' + encodeURIComponent(subject)
      + '&body='    + encodeURIComponent(body);

    // Přímé window.location.href = mailtoUrl nefunguje spolehlivě
    // ve všech prohlížečích; dočasný odkaz funguje všude.
    var tempLink = document.createElement('a');
    tempLink.href = mailtoUrl;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    // Zobrazíme potvrzení a zablokujeme formulář, aby uživatel
    // neodeslal objednávku dvakrát.
    var successEl = document.getElementById('form-success');
    var fallbackLink = document.createElement('a');
    fallbackLink.href = mailtoUrl;
    fallbackLink.textContent = 'klikněte zde';
    fallbackLink.style.cssText = 'color:inherit;font-weight:600;text-decoration:underline;';
    successEl.textContent = 'Otevřel se váš e-mailový klient – zkontrolujte zprávu a odešlete ji. Pokud se neotevřel, ';
    successEl.appendChild(fallbackLink);
    successEl.appendChild(document.createTextNode('.'));
    successEl.classList.add('visible');
    form.querySelectorAll('input,select,textarea,button').forEach(function(el) { el.disabled = true; });
  });

  // Live validace při opuštění pole (blur) – uživatel dostane
  // zpětnou vazbu ještě před pokusem o odeslání.
  ['jmeno', 'telefon', 'email', 'ulice'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('blur', function() { validateField('fg-' + id, id); });
  });
  var obecEl = document.getElementById('obec-form');
  if (obecEl) obecEl.addEventListener('change', function() { validateField('fg-obec', 'obec-form'); });
  var objEl = document.getElementById('objednavka');
  if (objEl) objEl.addEventListener('blur', function() { validateField('fg-objednavka', 'objednavka'); });
}


// ── 4. FAQ ACCORDION ─────────────────────────────────────────

// Otevře/zavře jednu otázku a zároveň zavře ostatní.
// Výška se animuje přes CSS transition na vlastnosti height –
// proto potřebujeme explicitně nastavit výšku v px (ne 'auto')
// před začátkem i koncem animace.
function toggleFaq(btn) {
  var item = btn.closest('.faq-item');
  var isOpen = item.classList.contains('open');

  // Zavři všechny aktuálně otevřené položky.
  document.querySelectorAll('.faq-item.open').forEach(function(el) {
    var ans = el.querySelector('.faq-a');
    ans.style.height = ans.scrollHeight + 'px'; // z 'auto' na konkrétní px (animace potřebuje číslo)
    ans.getBoundingClientRect();                 // force reflow, aby prohlížeč zaregistroval změnu
    ans.style.height = '0';
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });

  // Pokud kliknutá položka nebyla otevřená, otevři ji.
  if (!isOpen) {
    var ans = item.querySelector('.faq-a');
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    ans.getBoundingClientRect();                 // force reflow
    ans.style.height = ans.scrollHeight + 'px';
    // Po doběhnutí animace přepneme na 'auto', aby obsah mohl
    // měnit výšku (např. při změně velikosti okna).
    ans.addEventListener('transitionend', function() { ans.style.height = 'auto'; }, { once: true });
  }
}
