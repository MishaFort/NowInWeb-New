const mobileMenu = document.querySelector('.mobile-menu');
const menuBtnOpen = document.querySelector('.menu-btn-open');
const menuBtnClose = document.querySelector('.menu-btn-close');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

let lockedScrollY = 0;

function lockPageScroll() {
  lockedScrollY = window.scrollY || window.pageYOffset;
  document.body.style.setProperty('--lock-top', `-${lockedScrollY}px`);
  document.body.classList.add('is-scroll-disabled');
}

function unlockPageScroll() {
  document.body.classList.remove('is-scroll-disabled');
  document.body.style.removeProperty('--lock-top');
  window.scrollTo(0, lockedScrollY);
}

const openMenu = () => {
  mobileMenu.classList.add('is-open');
  lockPageScroll();
};

const closeMenu = () => {
  mobileMenu.classList.remove('is-open');
  unlockPageScroll();
};

menuBtnOpen.addEventListener('click', openMenu);
menuBtnClose.addEventListener('click', closeMenu);

mobileMenuLinks.forEach(link => {
  link.addEventListener('click', closeMenu);
});
