// Kalkulačka ceny
// doprava: 0 = zdarma, 11 = 11 Kč/oběd, 35 = 35 Kč za 1. oběd + 10 Kč za každý další (výpočet pro 1 oběd/den)
const ceny = {
  vestec:        { jidlo: 75,  doprava: 0 },
  libuse:        { jidlo: 135, doprava: 11 },
  pisnice:       { jidlo: 135, doprava: 35 },
  jesenice:      { jidlo: 135, doprava: 11 },
  dolni_brezany: { jidlo: 135, doprava: 0 },
  ohrobec:       { jidlo: 135, doprava: 11 },
  dobrejovice:   { jidlo: 105, doprava: 0 },
  zvole:         { jidlo: 135, doprava: 0 },
  brezova:       { jidlo: 135, doprava: 35 },
  radejovice:    { jidlo: 135, doprava: 0 },
  velke_prilepe: { jidlo: 135, doprava: 0 },
  statenice:     { jidlo: 135, doprava: 0 },
  holubice:      { jidlo: 135, doprava: 0 },
  tursko:        { jidlo: 135, doprava: 0 },
  noutonice:     { jidlo: 135, doprava: 0 },
  lysolaje:      { jidlo: 135, doprava: 35 },
  jina:          { jidlo: 135, doprava: 35 },
};

const poznamky = {
  vestec:        'Cena po obecní slevě (základní cena 135 Kč). Sleva není nároková a může se změnit.',
  libuse:        '135 Kč oběd + 11 Kč dopravné / oběd.',
  pisnice:       '135 Kč oběd + 35 Kč dopravné (1. oběd). Každý další na stejnou adresu: 10 Kč.',
  jesenice:      '135 Kč oběd + 11 Kč dopravné / oběd.',
  dolni_brezany: '135 Kč oběd, dopravné zdarma.',
  ohrobec:       '135 Kč oběd + 11 Kč dopravné / oběd.',
  dobrejovice:   'Cena po obecní slevě (základní cena 135 Kč). Sleva není nároková a může se změnit.',
  zvole:         '135 Kč oběd, dopravné zdarma.',
  brezova:       '135 Kč oběd + 35 Kč dopravné (1. oběd). Každý další na stejnou adresu: 10 Kč.',
  radejovice:    '135 Kč oběd, dopravné zdarma.',
  velke_prilepe: '135 Kč oběd, dopravné zdarma.',
  statenice:     '135 Kč oběd, dopravné zdarma.',
  holubice:      '135 Kč oběd, dopravné zdarma.',
  tursko:        '135 Kč oběd, dopravné zdarma.',
  noutonice:     '135 Kč oběd, dopravné zdarma.',
  lysolaje:      '135 Kč oběd + 35 Kč dopravné (1. oběd). Každý další na stejnou adresu: 10 Kč.',
  jina:          '135 Kč oběd + dopravné. Upřesnění při objednávce.',
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
  // Pro doprava=35: výpočet předpokládá 1 oběd na adresu denně
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

    const vop = document.getElementById('vop');
    const vopErr = document.getElementById('fg-vop-err');
    if (!vop.checked) {
      vopErr.style.display = 'block'; ok = false;
    } else { vopErr.style.display = 'none'; }

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

  document.querySelectorAll('.faq-item.open').forEach(el => {
    const ans = el.querySelector('.faq-a');
    ans.style.height = ans.scrollHeight + 'px';
    ans.getBoundingClientRect(); // force reflow
    ans.style.height = '0';
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });

  if (!isOpen) {
    const ans = item.querySelector('.faq-a');
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    ans.getBoundingClientRect(); // force reflow
    ans.style.height = ans.scrollHeight + 'px';
    ans.addEventListener('transitionend', () => { ans.style.height = 'auto'; }, { once: true });
  }
}