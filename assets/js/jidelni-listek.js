function getWeekRange(offsetWeeks) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offsetWeeks * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const d1 = monday.getDate(), m1 = monday.getMonth() + 1;
  const d2 = friday.getDate(), m2 = friday.getMonth() + 1;
  if (m1 === m2) return `${d1}.–${d2}. ${m2}.`;
  return `${d1}. ${m1}.–${d2}. ${m2}.`;
}

document.getElementById('date-tyden1').textContent = getWeekRange(0);
document.getElementById('date-tyden2').textContent = getWeekRange(1);

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
  } catch (e) {
    console.error('Menu load failed:', e);
    document.querySelectorAll('.menu-days').forEach(el => {
      el.innerHTML = '<p style="padding:1rem;color:#c00">Jídelní lístek se nepodařilo načíst.</p>';
    });
  }
}

loadMenu();
