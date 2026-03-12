"use strict";

let servicesSwiper = null;
const SERVICES_BREAK = 1140;
function setupAutoplayOnlyWhenVisible(sw, el, autoplayParams, {
  threshold = 0.2
} = {}) {
  if (!('IntersectionObserver' in window)) {
    var _sw$autoplay, _sw$autoplay$start;
    // fallback: одразу старт
    sw.params.autoplay = autoplayParams;
    (_sw$autoplay = sw.autoplay) === null || _sw$autoplay === void 0 || (_sw$autoplay$start = _sw$autoplay.start) === null || _sw$autoplay$start === void 0 || _sw$autoplay$start.call(_sw$autoplay);
    return () => {};
  }
  let enabled = false;
  const enable = () => {
    var _sw$autoplay2, _sw$autoplay2$start;
    if (enabled) return;
    sw.params.autoplay = autoplayParams; // підкладаємо параметри
    (_sw$autoplay2 = sw.autoplay) === null || _sw$autoplay2 === void 0 || (_sw$autoplay2$start = _sw$autoplay2.start) === null || _sw$autoplay2$start === void 0 || _sw$autoplay2$start.call(_sw$autoplay2); // старт
    enabled = true;
  };
  const disable = () => {
    var _sw$autoplay3, _sw$autoplay3$stop;
    if (!enabled) return;
    (_sw$autoplay3 = sw.autoplay) === null || _sw$autoplay3 === void 0 || (_sw$autoplay3$stop = _sw$autoplay3.stop) === null || _sw$autoplay3$stop === void 0 || _sw$autoplay3$stop.call(_sw$autoplay3);
    enabled = false;
  };
  const io = new IntersectionObserver(([entry]) => {
    const visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
    if (visible) enable();else disable();
  }, {
    root: null,
    threshold: [0, threshold, 1]
  });
  io.observe(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = rect.top < vh * (1 - threshold) && rect.bottom > vh * threshold;
      if (visible) enable();
    });
  });
  return () => {
    io.disconnect();
    disable();
  };
}
function setupVisibleEdgePingPong(sw, {
  threshold = 0.9
} = {}) {
  if (!('IntersectionObserver' in window)) return () => {};
  let lockEdge = false;
  const restartAutoplayWithDir = reverse => {
    if (!sw.autoplay || !sw.autoplay.running) return;
    if (sw.params.autoplay.reverseDirection === reverse) return;
    sw.params.autoplay.reverseDirection = reverse;
    sw.autoplay.stop();
    sw.autoplay.start();
  };
  const observer = new IntersectionObserver(entries => {
    if (lockEdge) return;
    const slides = sw.slides;
    if (!slides || slides.length < 2) return;
    const first = slides[0];
    const last = slides[slides.length - 1];
    for (const e of entries) {
      const ratio = e.intersectionRatio || 0;
      if (!e.isIntersecting || ratio < threshold) continue;
      if (e.target === last) {
        lockEdge = true;
        restartAutoplayWithDir(true);
        setTimeout(() => lockEdge = false, 150);
      } else if (e.target === first) {
        lockEdge = true;
        restartAutoplayWithDir(false);
        setTimeout(() => lockEdge = false, 150);
      }
    }
  }, {
    root: null,
    // viewport браузера (тобто тільки коли блок у кадрі)
    threshold: [threshold]
  });
  const observeEdges = () => {
    const slides = sw.slides;
    if (!slides || slides.length < 2) return;
    observer.disconnect();
    observer.observe(slides[0]);
    observer.observe(slides[slides.length - 1]);
  };
  observeEdges();
  sw.on('update', observeEdges);
  sw.on('resize', observeEdges);
  return () => {
    observer.disconnect();
    sw.off('update', observeEdges);
    sw.off('resize', observeEdges);
  };
}
function initServicesSwiper() {
  const el = document.querySelector('#services-section .swiper-container');
  if (!el) return;
  const shouldEnable = window.innerWidth < SERVICES_BREAK;
  const autoplayParams = {
    delay: 2500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
    reverseDirection: false,
    stopOnLastSlide: false
  };
  if (shouldEnable && !servicesSwiper) {
    servicesSwiper = new Swiper(el, {
      loop: false,
      slidesPerView: 'auto',
      spaceBetween: 20,
      centeredSlides: false,
      watchOverflow: true,
      speed: 1100,
      autoplay: false
    });
    const destroyVisibleAutoplay = setupAutoplayOnlyWhenVisible(servicesSwiper, servicesSwiper.el, autoplayParams, {
      threshold: 0.2
    });
    const destroyEdgeObserver = setupVisibleEdgePingPong(servicesSwiper, {
      threshold: 0.9
    });
    servicesSwiper.on('destroy', () => {
      destroyVisibleAutoplay === null || destroyVisibleAutoplay === void 0 || destroyVisibleAutoplay();
      destroyEdgeObserver === null || destroyEdgeObserver === void 0 || destroyEdgeObserver();
    });

    // gesture lock
    const setSwiperLock = v => window.__swiperGestureLock = v;
    servicesSwiper.on('touchStart', () => {
      var _servicesSwiper$autop, _servicesSwiper$autop2;
      setSwiperLock(false);
      (_servicesSwiper$autop = servicesSwiper.autoplay) === null || _servicesSwiper$autop === void 0 || (_servicesSwiper$autop2 = _servicesSwiper$autop.stop) === null || _servicesSwiper$autop2 === void 0 || _servicesSwiper$autop2.call(_servicesSwiper$autop);
    });
    servicesSwiper.on('sliderFirstMove', () => setSwiperLock(true));
    servicesSwiper.on('sliderMove', () => setSwiperLock(true));
    servicesSwiper.on('touchEnd', () => setTimeout(() => setSwiperLock(false), 0));
    servicesSwiper.on('transitionEnd', () => setSwiperLock(false));
  }
  if (!shouldEnable && servicesSwiper) {
    servicesSwiper.destroy(true, true);
    window.__swiperGestureLock = false;
    servicesSwiper = null;
  }
}

// старт
initServicesSwiper();

// resize
let servicesResizeTmr = null;
window.addEventListener('resize', () => {
  clearTimeout(servicesResizeTmr);
  servicesResizeTmr = setTimeout(initServicesSwiper, 120);
}, {
  passive: true
});
//# sourceMappingURL=services-slider.js.map