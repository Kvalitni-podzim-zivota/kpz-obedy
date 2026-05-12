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