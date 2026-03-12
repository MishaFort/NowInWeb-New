"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const host = document.querySelector('.portfolio-section__collage-nav .pagination');
  const prevBtn = document.querySelector('.portfolio-section__collage-nav .carousel-button.prev');
  const nextBtn = document.querySelector('.portfolio-section__collage-nav .carousel-button.next');
  const swiperEl = document.querySelector('#portfolio-section .swiper');
  if (!host || !swiperEl) return;

  // ---------- 1. Створюємо DOM пагінації ----------
  host.innerHTML = `
    <div class="pagination__viewport">
      <div class="pagination__track">
        <span class="pagination__button"></span>
        <span class="pagination__button"></span>
        <span class="pagination__button pagination__button--active"></span>
        <span class="pagination__button"></span>
        <span class="pagination__button"></span>
      </div>
    </div>
  `;
  const viewport = host.querySelector('.pagination__viewport');
  const track = host.querySelector('.pagination__track');
  const bullets = Array.from(track.children);
  if (!viewport || !track || bullets.length !== 5) {
    return;
  }
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // ---------- 2. Геометрія ----------
  const getStep = () => {
    const styles = getComputedStyle(host);
    const bullet = parseFloat(styles.getPropertyValue('--bullet')) || 12;
    const gap = parseFloat(styles.getPropertyValue('--gap')) || 16;
    const step = bullet + gap;
    return step;
  };
  let stepPx = getStep();
  let baseX = -stepPx;
  const setX = (x, transition = 'none') => {
    track.style.transition = transition;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };
  const setActiveByIndex = idx => {
    const children = track.children;
    for (let i = 0; i < children.length; i += 1) {
      children[i].classList.toggle('pagination__button--active', i === idx);
    }
  };
  const setActiveCenter = () => {
    setActiveByIndex(2);
  };
  const resetStatic = (reason = 'init') => {
    stepPx = getStep();
    baseX = -stepPx;
    setX(baseX, 'none');
    setActiveCenter();
  };
  const rotateNext = () => {
    track.appendChild(track.firstElementChild);
  };
  const rotatePrev = () => {
    track.insertBefore(track.lastElementChild, track.firstElementChild);
  };
  resetStatic('init');
  window.addEventListener('resize', () => resetStatic('resize'));
  function setupAutoplayOnlyWhenVisible(sw, watchEl, autoplayParams, {
    threshold = 0.2
  } = {}) {
    let visibleNow = false;
    if (!('IntersectionObserver' in window)) {
      var _sw$autoplay, _sw$autoplay$start;
      sw.params.autoplay = autoplayParams;
      (_sw$autoplay = sw.autoplay) === null || _sw$autoplay === void 0 || (_sw$autoplay$start = _sw$autoplay.start) === null || _sw$autoplay$start === void 0 || _sw$autoplay$start.call(_sw$autoplay);
      visibleNow = true;
      return {
        destroy: () => {},
        isVisible: () => visibleNow
      };
    }
    let enabled = false;
    const enable = () => {
      var _sw$autoplay2, _sw$autoplay2$start;
      if (enabled) return;
      sw.params.autoplay = autoplayParams;
      (_sw$autoplay2 = sw.autoplay) === null || _sw$autoplay2 === void 0 || (_sw$autoplay2$start = _sw$autoplay2.start) === null || _sw$autoplay2$start === void 0 || _sw$autoplay2$start.call(_sw$autoplay2);
      enabled = true;
    };
    const disable = () => {
      var _sw$autoplay3, _sw$autoplay3$stop;
      if (!enabled) return;
      (_sw$autoplay3 = sw.autoplay) === null || _sw$autoplay3 === void 0 || (_sw$autoplay3$stop = _sw$autoplay3.stop) === null || _sw$autoplay3$stop === void 0 || _sw$autoplay3$stop.call(_sw$autoplay3);
      enabled = false;
    };
    const io = new IntersectionObserver(([entry]) => {
      visibleNow = entry.isIntersecting && entry.intersectionRatio >= threshold;
      if (visibleNow) enable();else disable();
    }, {
      root: null,
      threshold: [0, threshold, 1]
    });
    io.observe(watchEl);
    disable();
    return {
      destroy: () => {
        io.disconnect();
        disable();
      },
      isVisible: () => visibleNow
    };
  }

  // ---------- 3. Swiper ----------
  const autoplayParams = {
    delay: 2500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
    reverseDirection: false,
    stopOnLastSlide: false
  };
  const swiper = new Swiper(swiperEl, {
    autoplay: false,
    speed: 1200,
    loop: true,
    slidesPerView: 1,
    centeredSlides: true,
    effect: 'coverflow',
    coverflowEffect: {
      rotate: 30,
      stretch: 0,
      depth: 0,
      modifier: 1,
      slideShadows: false
    },
    pagination: false,
    simulateTouch: true,
    longSwipes: true,
    longSwipesRatio: 0.2,
    threshold: 3,
    lazyPreloadPrevNext: 1,
    // 1 лівий + 1 правий
    lazyPreloaderClass: 'swiper-lazy-preloader'
  });
  const setSwiperLock = v => {
    window.__swiperGestureLock = v;
  };
  const vis = setupAutoplayOnlyWhenVisible(swiper, document.querySelector('#portfolio-section'), autoplayParams, {
    threshold: 0.2
  });
  window.addEventListener('beforeunload', () => {
    var _vis$destroy;
    return (_vis$destroy = vis.destroy) === null || _vis$destroy === void 0 ? void 0 : _vis$destroy.call(vis);
  });
  swiper.on('touchStart', () => {
    var _swiper$autoplay, _swiper$autoplay$stop;
    setSwiperLock(false);
    (_swiper$autoplay = swiper.autoplay) === null || _swiper$autoplay === void 0 || (_swiper$autoplay$stop = _swiper$autoplay.stop) === null || _swiper$autoplay$stop === void 0 || _swiper$autoplay$stop.call(_swiper$autoplay);
  });
  swiper.on('touchEnd', () => {
    setTimeout(() => setSwiperLock(false), 0);
    setTimeout(() => {
      var _swiper$autoplay2, _swiper$autoplay2$sta;
      if (vis.isVisible()) (_swiper$autoplay2 = swiper.autoplay) === null || _swiper$autoplay2 === void 0 || (_swiper$autoplay2$sta = _swiper$autoplay2.start) === null || _swiper$autoplay2$sta === void 0 || _swiper$autoplay2$sta.call(_swiper$autoplay2);
    }, 300);
  });
  swiper.on('sliderFirstMove', () => setSwiperLock(true));
  swiper.on('sliderMove', () => setSwiperLock(true));
  swiper.on('transitionEnd', () => setSwiperLock(false));

  //КІЛЬКІСТЬ РЕАЛЬНИХ слайдів (без дублікатів loop)
  const TOTAL_SLIDES = swiper.slides.length;

  // ---------- 4. Стейт ----------
  let touching = false;
  let lastP = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentDir = 0;
  let prevRealIndex = swiper.realIndex;

  //функція визначення напряму
  const computeDirFromIndexes = (prev, curr) => {
    if (prev === curr) return 0;
    let diff = curr - prev;
    if (swiper.params.loop && TOTAL_SLIDES > 0) {
      const half = TOTAL_SLIDES / 2;
      if (diff > half) diff -= TOTAL_SLIDES;else if (diff < -half) diff += TOTAL_SLIDES;
    }
    if (diff > 0) return 1;
    if (diff < 0) return -1;
    return 0;
  };

  // ---------- 5. «Живий» активний bullet під час свайпа ----------
  const updateLiveActive = () => {};
  const disableTemporarily = (btn, ms = 800) => {
    if (!btn) return;
    if (btn.disabled) return;
    btn.disabled = true;
    setTimeout(() => {
      btn.disabled = false;
    }, ms);
  };

  // ---------- 6. Стрілки ----------
  const onArrow = dir => {
    if (dir === 1) swiper.slideNext();else swiper.slidePrev();
  };
  prevBtn === null || prevBtn === void 0 || prevBtn.addEventListener('click', () => {
    disableTemporarily(prevBtn, 800);
    onArrow(-1);
  });
  nextBtn === null || nextBtn === void 0 || nextBtn.addEventListener('click', () => {
    disableTemporarily(nextBtn, 800);
    onArrow(1);
  });

  // ---------- 7. Клік по кулях ----------
  track.addEventListener('click', evt => {
    const btn = evt.target.closest('.pagination__button');
    if (!btn) return;
    const children = Array.from(track.children);
    const idx = children.indexOf(btn);
    if (idx === -1) return;
    const center = 2;
    let dir = 0;
    if (idx < center) dir = -1;else if (idx > center) dir = 1;
    if (dir === 1) swiper.slideNext();else if (dir === -1) swiper.slidePrev();
  });

  // ---------- 8. Свайп: початок ----------
  swiper.on('touchStart', sw => {
    touching = true;
    lastP = 0;
    const t = sw.touches || {};
    dragStartX = typeof t.currentX === 'number' ? t.currentX : typeof t.startX === 'number' ? t.startX : 0;
    dragStartY = typeof t.currentY === 'number' ? t.currentY : typeof t.startY === 'number' ? t.startY : 0;

    //обрубаємо будь-яку попередню анімацію треку
    track.style.transition = 'none';
  });
  const preventVerticalScroll = (x, y, evt) => {
    if (!touching) return;
    const deltaX = Math.abs(x - dragStartX);
    const deltaY = Math.abs(y - dragStartY);
    if (deltaX > deltaY && evt.cancelable) evt.preventDefault();
  };
  swiperEl.addEventListener('pointermove', evt => {
    if (evt.pointerType !== 'touch') return;
    preventVerticalScroll(evt.clientX, evt.clientY, evt);
  }, {
    passive: false
  });
  swiperEl.addEventListener('touchmove', evt => {
    if (evt.touches.length !== 1) return;
    const t = evt.touches[0];
    preventVerticalScroll(t.clientX, t.clientY, evt);
  }, {
    passive: false
  });

  // ---------- 9. Свайп: рух ----------
  swiper.on('sliderMove', sw => {
    if (!touching) return;
    const t = sw.touches || {};
    const currentX = typeof t.currentX === 'number' ? t.currentX : typeof t.startX === 'number' ? t.startX : dragStartX;
    const diff = currentX - dragStartX;
    const size = sw.size || 1;
    const p = clamp(diff / size, -1, 1);
    lastP = p;
    const x = baseX + p * stepPx;
    setX(x, 'none');
    updateLiveActive(p);
  });

  // ---------- 10. Якщо свайп відмінили (повернулись на той самий слайд) ----------
  swiper.on('slideResetTransitionStart', sw => {
    const dir = computeDirFromIndexes(prevRealIndex, sw.realIndex);

    // Випадок 1: слайд НЕ змінився -> справжній відкат назад
    if (!dir) {
      const fromX = baseX + lastP * stepPx;
      const speed = sw.params.speed || swiper.params.speed || 800;
      const remain = Math.min(1, Math.abs(lastP));
      const duration = remain > 0 ? Math.max(120, Math.round(speed * remain)) : 0;
      if (duration > 0) {
        setX(fromX, 'none');
        requestAnimationFrame(() => {
          setX(baseX, `transform ${duration}ms ease`);
        });
      } else {
        setX(baseX, 'none');
      }
      touching = false;
      lastP = 0;
      currentDir = 0;
      setActiveCenter();
      prevRealIndex = sw.realIndex;
      return;
    }

    // Випадок 2: realIndex змінився -> реальний перехід через довгий свайп
    currentDir = dir;
    const step = stepPx;
    const fromX = baseX + lastP * step;
    const toX = dir === 1 ? baseX - step : baseX + step;
    const baseDuration = sw.params.speed || swiper.params.speed || 800;
    const remain = 1 - Math.min(1, Math.abs(lastP));
    const duration = Math.max(120, Math.round(baseDuration * remain));
    touching = false;
    setX(fromX, 'none');
    requestAnimationFrame(() => {
      setX(toX, `transform ${duration}ms ease`);
    });
    lastP = 0;
    prevRealIndex = sw.realIndex;
  });
  swiper.on('slideResetTransitionEnd', sw => {
    if (!touching) {
      if (currentDir === 1) {
        rotateNext();
      } else if (currentDir === -1) {
        rotatePrev();
      }

      // повертаємо доріжку в статику і центр робимо активним
      setX(baseX, 'none');
      setActiveCenter();
      prevRealIndex = sw.realIndex;
    }

    // Стан анімації скидаємо завжди
    currentDir = 0;
    lastP = 0;
  });

  // ---------- 11. Початок переходу на інший слайд ----------
  swiper.on('slideChangeTransitionStart', sw => {
    const dir = computeDirFromIndexes(prevRealIndex, sw.realIndex);
    currentDir = dir;
    const step = stepPx;
    const fromX = touching && lastP !== 0 ? baseX + lastP * step : baseX;
    const toX = dir === 1 ? baseX - step : dir === -1 ? baseX + step : baseX;
    const baseDuration = sw.params.speed || swiper.params.speed || 800;
    const remain = touching ? 1 - Math.min(1, Math.abs(lastP)) : 1;
    const duration = dir && remain > 0 ? Math.max(120, Math.round(baseDuration * remain)) : baseDuration;
    prevRealIndex = sw.realIndex;
    touching = false;
    lastP = 0;
    if (dir) {
      setX(fromX, 'none');
      requestAnimationFrame(() => {
        setX(toX, `transform ${duration}ms ease`);
      });
    } else {
      setX(baseX, `transform 200ms ease`);
    }
  });

  // ---------- 12. Кінець переходу ----------
  swiper.on('slideChangeTransitionEnd', sw => {
    if (currentDir === 1) rotateNext();else if (currentDir === -1) rotatePrev();
    setX(baseX, 'none');
    setActiveCenter();
    lastP = 0;
    currentDir = 0;
  });

  // ---------- 13. touchEnd ----------
  swiper.on('touchEnd', sw => {
    touching = false;
  });
});
//# sourceMappingURL=portfolio-slider.js.map