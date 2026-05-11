// Kalkulačka ceny
const ceny = {
  vestec:      { jidlo: 70,  doprava: 0 },
  dobrejovice: { jidlo: 105, doprava: 0 },
  jesenice:    { jidlo: 130, doprava: 11 },
  ohrobec:     { jidlo: 130, doprava: 11 },
  libuse:      { jidlo: 130, doprava: 11 },
  pisnice:     { jidlo: 130, doprava: 11 },
  jina:        { jidlo: 130, doprava: 0 },
};

const poznamky = {
  vestec:      'Cena po obecní slevě. Sleva není nároková a může se změnit.',
  dobrejovice: 'Cena po obecní slevě. Sleva není nároková.',
  jesenice:    'Základní cena + dopravné 11 Kč / oběd.',
  ohrobec:     'Základní cena + dopravné 11 Kč / oběd.',
  libuse:      'Základní cena + dopravné 11 Kč / oběd.',
  pisnice:     'Základní cena + dopravné 11 Kč / oběd.',
  jina:        'Základní cena bez dopravného. Upřesnění při objednávce.',
};

function spocitej() {
  const obec = document.getElementById('obec').value;
  const pocet = parseInt(document.getElementById('pocet').value, 10);
  const result = document.getElementById('result');
  const priceEl = document.getElementById('result-price');
  const noteEl = document.getElementById('result-note');

  if (!obec || !pocet || pocet < 1) {
    result.classList.remove('visible');
    return;
  }

  const c = ceny[obec];
  const celkem = (c.jidlo + c.doprava) * pocet;
  const jedenObejd = c.jidlo + c.doprava;

  priceEl.textContent = celkem.toLocaleString('cs-CZ') + ' Kč / měsíc';
  noteEl.textContent = jedenObejd + ' Kč za oběd · ' + pocet + ' obědů · ' + (poznamky[obec] || '');
  result.classList.add('visible');
}

// Objednávkový formulář – validace
const form = document.getElementById('objednavka-form');
if (form) {
  function validateField(id, fieldId) {
    const fg = document.getElementById(id);
    const el = document.getElementById(fieldId);
    if (!fg || !el) return true;
    const val = el.value.trim();
    if (!val) { fg.classList.add('invalid'); return false; }
    fg.classList.remove('invalid'); return true;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    let ok = true;
    ok = validateField('fg-jmeno', 'jmeno') && ok;
    ok = validateField('fg-telefon', 'telefon') && ok;
    ok = validateField('fg-ulice', 'ulice') && ok;
    ok = validateField('fg-obec', 'obec-form') && ok;
    ok = validateField('fg-objednavka', 'objednavka') && ok;

    const pristiTyden = document.getElementById('pristi-tyden');
    const pristiErr = document.getElementById('fg-pristi-tyden-err');
    if (!pristiTyden.checked) {
      pristiErr.style.display = 'block'; ok = false;
    } else { pristiErr.style.display = 'none'; }

    const souhlas = document.getElementById('souhlas');
    const souhlasErr = document.getElementById('fg-souhlas-err');
    if (!souhlas.checked) {
      souhlasErr.style.display = 'block'; ok = false;
    } else { souhlasErr.style.display = 'none'; }

    if (!ok) return;

    // --- DOPLŇTE VAŠE ODESLÁNÍ (fetch na PHP, Formspree, apod.) ---
    const data = {
      jmeno:      document.getElementById('jmeno').value,
      telefon:    document.getElementById('telefon').value,
      email:      document.getElementById('email').value,
      ulice:      document.getElementById('ulice').value,
      obec:       document.getElementById('obec-form').value,
      psc:        document.getElementById('psc').value,
      objednavka: document.getElementById('objednavka').value,
      platba:     document.getElementById('platba').value,
    };
    console.log('Data k odeslání:', data);
    document.getElementById('form-success').classList.add('visible');
    form.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = true);
  });

  // Live validace
  ['jmeno', 'telefon', 'ulice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validateField('fg-' + id, id));
  });
  const obecEl = document.getElementById('obec-form');
  if (obecEl) obecEl.addEventListener('change', () => validateField('fg-obec', 'obec-form'));
  const objEl = document.getElementById('objednavka');
  if (objEl) objEl.addEventListener('blur', () => validateField('fg-objednavka', 'objednavka'));
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}