const header = document.querySelector('.header');
let prevScrollPos = window.pageYOffset;

window.addEventListener('scroll', () => {
  const currentScrollPos = window.pageYOffset;
  const isMobile = window.innerWidth < 1280;

  if (!isMobile) {
    header.style.top = '0';
    return;
  }

  if (currentScrollPos > header.offsetHeight) {
    if (prevScrollPos > currentScrollPos) {
      header.style.top = '0';
    } else {
      header.style.top = '-100%';
    }
  }

  prevScrollPos = currentScrollPos;
});
