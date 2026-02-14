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
  }

  if (!shouldEnable && servicesSwiper) {
    servicesSwiper.destroy(true, true); // прибрати стилі/події
    servicesSwiper = null;
  }
}

// виклик при старті
initServicesSwiper();

// виклик при resize (додай у твій existing resize handler, не роби окремий)
