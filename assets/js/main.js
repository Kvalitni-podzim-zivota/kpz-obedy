function toggleMenu(btn) {
  const menu = document.getElementById('nav-mobile');
  const open = menu.classList.toggle('open');
  btn.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
}

function closeMenu() {
  const menu = document.getElementById('nav-mobile');
  const btn = document.querySelector('.nav-hamburger');
  menu.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}
