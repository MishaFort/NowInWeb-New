let servicesSwiper = null;
const SERVICES_BREAK = 1140;

function initServicesSwiper() {
  const el = document.querySelector('#services-section .swiper-container');
  if (!el) return;

  const shouldEnable = window.innerWidth < SERVICES_BREAK;

  if (shouldEnable && !servicesSwiper) {
    servicesSwiper = new Swiper(el, {
      loop: false,
      slidesPerView: 'auto',
      spaceBetween: 20,
      centeredSlides: false,
      watchOverflow: true,
    });

    const setSwiperLock = v => {
      window.__swiperGestureLock = v;
    };

    servicesSwiper.on('touchStart', () => setSwiperLock(false));
    servicesSwiper.on('sliderFirstMove', () => setSwiperLock(true)); // ключове: зрушили хоч трохи
    servicesSwiper.on('sliderMove', () => setSwiperLock(true));
    servicesSwiper.on('touchEnd', () =>
      setTimeout(() => setSwiperLock(false), 0),
    );
    servicesSwiper.on('transitionEnd', () => setSwiperLock(false));
  }

  if (!shouldEnable && servicesSwiper) {
    servicesSwiper.destroy(true, true); // прибрати стилі/події
    window.__swiperGestureLock = false;
    servicesSwiper = null;
  }
}

// виклик при старті
initServicesSwiper();

// виклик при resize
let servicesResizeTmr = null;

window.addEventListener(
  'resize',
  () => {
    clearTimeout(servicesResizeTmr);
    servicesResizeTmr = setTimeout(() => {
      initServicesSwiper();
    }, 120);
  },
  { passive: true },
);
