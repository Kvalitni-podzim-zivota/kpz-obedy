// Načtení ceníku a inicializace kalkulačky + selectů
let _ceny = null;
let _poznamky = null;

fetch('assets/cenik.json')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    _ceny = {};
    _poznamky = {};
    data.zones.forEach(function(z) {
      _ceny[z.id] = { jidlo: z.jidlo, doprava: z.doprava };
      _poznamky[z.id] = z.poznamka;
    });

    // Mřížka doručovacích oblastí
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

    // Select kalkulačky
    var calcSelect = document.getElementById('obec');
    if (calcSelect) {
      var calcHtml = '<option value="">– vyberte obec –</option>';
      data.zones.forEach(function(z) {
        calcHtml += '<option value="' + z.id + '">' + (z.selectLabel || z.label) + '</option>';
      });
      calcSelect.innerHTML = calcHtml;
    }

    // Select objednávkového formuláře (jednotlivé obce vč. spádových)
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

function spocitej() {
  if (!_ceny) return;
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

// Objednávkový formulář – validace
var form = document.getElementById('objednavka-form');
if (form) {
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
    var ok = true;
    ok = validateField('fg-jmeno', 'jmeno') && ok;
    ok = validateField('fg-telefon', 'telefon') && ok;
    ok = validateField('fg-email', 'email') && ok;
    ok = validateField('fg-ulice', 'ulice') && ok;
    ok = validateField('fg-obec', 'obec-form') && ok;
    ok = validateField('fg-objednavka', 'objednavka') && ok;

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

    var tempLink = document.createElement('a');
    tempLink.href = mailtoUrl;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

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

  // Live validace
  ['jmeno', 'telefon', 'email', 'ulice'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('blur', function() { validateField('fg-' + id, id); });
  });
  var obecEl = document.getElementById('obec-form');
  if (obecEl) obecEl.addEventListener('change', function() { validateField('fg-obec', 'obec-form'); });
  var objEl = document.getElementById('objednavka');
  if (objEl) objEl.addEventListener('blur', function() { validateField('fg-objednavka', 'objednavka'); });
}

function toggleFaq(btn) {
  var item = btn.closest('.faq-item');
  var isOpen = item.classList.contains('open');

  document.querySelectorAll('.faq-item.open').forEach(function(el) {
    var ans = el.querySelector('.faq-a');
    ans.style.height = ans.scrollHeight + 'px';
    ans.getBoundingClientRect();
    ans.style.height = '0';
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });

  if (!isOpen) {
    var ans = item.querySelector('.faq-a');
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    ans.getBoundingClientRect();
    ans.style.height = ans.scrollHeight + 'px';
    ans.addEventListener('transitionend', function() { ans.style.height = 'auto'; }, { once: true });
  }
}
