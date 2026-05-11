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