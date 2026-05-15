
function switchWeek(btn, weekId) {
  document.querySelectorAll('.week-tab').forEach(t => {
    t.classList.remove('active'); t.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.menu-week').forEach(w => w.classList.remove('active'));
  btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
  document.getElementById(weekId).classList.add('active');
}

function switchSupplier(btn, panelId) {
  const week = btn.closest('.menu-week');
  week.querySelectorAll('.supplier-tab').forEach(t => {
    t.classList.remove('active'); t.setAttribute('aria-selected', 'false');
  });
  week.querySelectorAll('.supplier-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
  document.getElementById(panelId).classList.add('active');
}

// ── Menu loading from assets/menu.json ────────────────────────────────────────

function renderDay(day) {
  const meals = day.meals.map(m =>
    `<div class="meal-cell">
              <div class="meal-num">${m.label}</div>
              <div class="meal-name">${m.desc}</div>
            </div>`
  ).join('\n            ');
  return `<div class="menu-day" role="listitem">
            <div class="day-header"><span class="day-name">${day.day}</span><span class="day-date">${day.date}</span></div>
            <div class="day-soup"><span class="soup-label">Polévka</span><span class="soup-name">${day.soup}</span></div>
            <div class="day-meals">
            ${meals}
            </div>
          </div>`;
}

function fillPanel(days, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.querySelector('.menu-days').innerHTML = days.map(renderDay).join('\n\n          ');
}

async function loadMenu() {
  try {
    const res = await fetch('assets/menu.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const menu = await res.json();
    fillPanel(menu.tyden1.modletice, 'panel-a-t1');
    fillPanel(menu.tyden1.majak,     'panel-b-t1');
    fillPanel(menu.tyden2.modletice, 'panel-a-t2');
    fillPanel(menu.tyden2.majak,     'panel-b-t2');
    document.getElementById('date-tyden1').textContent = menu.tyden1.label || '';
    document.getElementById('date-tyden2').textContent = menu.tyden2.label || '';
  } catch (e) {
    console.error('Menu load failed:', e);
    document.querySelectorAll('.menu-days').forEach(el => {
      el.innerHTML = '<p style="padding:1rem;color:#c00">Jídelní lístek se nepodařilo načíst.</p>';
    });
  }
}

loadMenu();
