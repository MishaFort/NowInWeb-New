(() => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  const HAS_HASH_AT_BOOT = !!location.hash;
  if (HAS_HASH_AT_BOOT) {
    try {
      document.documentElement.style.scrollBehavior = 'auto';
    } catch {}
    window.scrollTo(0, 0);
  }

  const INITIAL_HASH = location.hash; // збережемо стартовий хеш як був
  let suppressUrlSync = !!INITIAL_HASH; // поки true — updateActiveSection не міняє URL
  let isResizing = false;
  let lastHash = location.hash || '';
  let fitScaleLocked = false;
  let lockedSectionIndex = null;
  let keyboardWasOpen = false;
  let baselineViewportH = window.visualViewport?.height || window.innerHeight;
  const KEYBOARD_DELTA = 120;

  // ---------- НАЛАШТУВАННЯ ----------
  const TOP_GAP = 24;
  const BOTTOM_GAP = 16;
  const MIN_WHEEL = 15; // мінімальний нормалізований імпульс для одного кроку

  document.documentElement.style.setProperty(
    '--app-h',
    `${window.innerHeight}px`,
  );

  // ---------- УТИЛІТИ ----------
  function readCssTimeVar(varName, fallbackMs) {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    if (!raw) return fallbackMs;
    const isSec = raw.endsWith('s') && !raw.endsWith('ms');
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) return fallbackMs;
    return Math.round(isSec ? num * 1000 : num);
  }

  const BREATH_DUR_MS = readCssTimeVar('--breath-dur', 900);

  const HEADER_H = (() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--header-h')
      .trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 88;
  })();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothScrollTo(targetY, dur, onProgress) {
    const startY = window.scrollY;
    const dist = targetY - startY;
    const start = performance.now();

    return new Promise(resolve => {
      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = easeInOutCubic(p);
        const y = startY + dist * eased;
        window.scrollTo(0, Math.round(y));
        if (onProgress) onProgress(eased);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  //стартовий перехід на хеш
  function bootToHashIfAny() {
    const id = INITIAL_HASH;
    if (!id || id.length <= 1) {
      suppressUrlSync = false;
      document.documentElement.classList.remove('fp-preboot');
      return;
    }

    const target = document.querySelector(id);
    if (!target) {
      suppressUrlSync = false;
      document.documentElement.classList.remove('fp-preboot');
      return;
    }

    const sec = target.closest('.section') || target;
    const idx = sections.indexOf(sec);
    if (idx < 0) {
      suppressUrlSync = false;
      document.documentElement.classList.remove('fp-preboot');
      return;
    }

    init();
    current = idx;
    setActive(idx);
    window.scrollTo({ top: stops[idx], behavior: 'auto' });
    updateActiveSection();

    suppressUrlSync = false;
  }

  // Нормалізація колеса миші: pixel/line/page -> px
  function normWheelDY(e) {
    const LINE = 16;
    const PAGE = window.innerHeight;
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= LINE;
    else if (e.deltaMode === 2) dy *= PAGE;
    return dy;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  //хелпер для оновлення URL за індексом секції
  function idHashForIndex(i) {
    if (i < 0 || i >= sections.length) return '';
    const el = sections[i];
    return el?.id ? `#${el.id}` : '';
  }

  // без створення нової історії — лише заміна поточного запису
  function replaceUrlForIndex(i) {
    if (suppressUrlSync || isResizing) return;

    const hash = idHashForIndex(i);
    if (!hash || hash === location.hash) return;

    history.replaceState(null, '', hash);
  }

  // ---------- КЕШ ДОМ ЕЛЕМЕНТІВ ----------
  const sections = Array.from(document.querySelectorAll('.section'));
  const headerLinks = Array.from(
    document.querySelectorAll('header a[href^="#"]'),
  );

  // ---------- СТАН ----------
  let stops = [];
  let current = 0;
  let locked = false; // «фіксація»: поки true — імпульси ігноряться
  let resizeTimer = null;
  let scrollTmr = null;
  let startY = null;
  let formInteractionLock = false;

  const IS_TELEGRAM_WEBVIEW =
    /Telegram/i.test(navigator.userAgent) || !!window.Telegram?.WebApp;

  let keyboardSession = false;

  function isFormFieldFocused() {
    const el = document.activeElement;
    return (
      !!el && el.matches('input, textarea, select, [contenteditable="true"]')
    );
  }

  function blurFocusedFormField() {
    const el = document.activeElement;
    if (el && el.matches('input, textarea, select, [contenteditable="true"]')) {
      el.blur();
    }
  }

  function shouldPauseFullpage() {
    return formInteractionLock || isFormFieldFocused();
  }

  function onViewportResizeForKeyboard() {
    if (IS_TELEGRAM_WEBVIEW) return;
    const h = window.visualViewport?.height || window.innerHeight;
    const delta = baselineViewportH - h;
    const keyboardOpenNow = delta > KEYBOARD_DELTA;

    // клавіатура щойно закрилась -> знімаємо фокус
    if (keyboardWasOpen && !keyboardOpenNow) {
      blurFocusedFormField();
    }

    keyboardWasOpen = keyboardOpenNow;

    // оновлюємо базу тільки коли клавіатура точно закрита
    if (!keyboardOpenNow) baselineViewportH = h;
  }

  // ---------- ДОПОМОЖНІ ----------
  function computeStops() {
    return sections.map(s => Math.max(0, Math.round(s.offsetTop)));
  }

  function getClosestIndex(y) {
    let idx = 0,
      best = Infinity;
    for (let i = 0; i < stops.length; i++) {
      const d = Math.abs(stops[i] - y);
      if (d < best) {
        best = d;
        idx = i;
      }
    }
    return idx;
  }

  function init() {
    stops = computeStops();
    current = getClosestIndex(window.scrollY);
  }

  function indexOfAnchor(a) {
    const id = a.getAttribute('href');
    if (!id || id.length <= 1) return -1;
    const target = document.querySelector(id);
    if (!target) return -1;
    const sec = target.closest('.section') || target;
    return sections.indexOf(sec);
  }

  function setActiveHeader(idx) {
    headerLinks.forEach(a =>
      a.classList.toggle('is-active', indexOfAnchor(a) === idx),
    );
  }

  let sideNav = null;
  let sideItems = [];

  function buildSideNav() {
    if (sideNav) sideNav.remove();
    sideItems = [];

    const nav = document.createElement('nav');
    nav.className = 'side-nav';
    nav.setAttribute('aria-label', 'Section navigation');

    const ul = document.createElement('ul');
    ul.className = 'side-nav__list';

    sections.forEach((sec, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'side-nav__btn';
      const label =
        sec.dataset.navTitle ||
        sec.querySelector('.section__title')?.textContent?.trim() ||
        `Section ${i + 1}`;
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.addEventListener('click', () => {
        if (!locked) lockAndGo(i);
        // оновимо URL для глибокої навігації
        const id = sec.id ? `#${sec.id}` : '';
        if (id)
          (history.pushState(null, '', id),
            window.dispatchEvent(new HashChangeEvent('hashchange')));
      });
      li.appendChild(btn);
      ul.appendChild(li);
      sideItems.push(btn);
    });

    nav.appendChild(ul);
    document.body.appendChild(nav);
    sideNav = nav;
  }

  function setActiveSidebar(idx) {
    sideItems.forEach((b, i) => b.classList.toggle('is-active', i === idx));
  }

  // --- Заморозка «дихання» у передостанній секції (без зміни масштабу) ---

  // Керування класом на <body>, щоб CSS теж знав, що ми на/біля футера
  function setActive(idx) {
    sections.forEach((s, i) => {
      const isActive = i === idx;
      s.classList.toggle('is-active', isActive);
      s.classList.toggle('is-leaving', !isActive);
    });

    setActiveSidebar(idx);
    setActiveHeader(idx);
  }

  function updateActiveSection() {
    if (shouldPauseFullpage()) return;
    if (locked) return;

    let activeIdx = 0,
      minDiff = Infinity;
    sections.forEach((s, i) => {
      const diff = Math.abs(s.getBoundingClientRect().top);
      if (diff < minDiff) {
        minDiff = diff;
        activeIdx = i;
      }
    });
    setActive(activeIdx);
    current = activeIdx; // ← синхронізуємо індекс
    if (!suppressUrlSync) replaceUrlForIndex(current); // ← зміна
  }

  // ---------- FIT‑SCALE + компенсація падінга ----------
  function computeFitScaleFor(el) {
    const contentH = Math.max(el.scrollHeight, el.offsetHeight);
    const contentW = Math.max(el.scrollWidth, el.offsetWidth);

    const availH = Math.max(
      0,
      window.innerHeight - HEADER_H - TOP_GAP - BOTTOM_GAP,
    );
    const availW = Math.max(0, window.innerWidth);

    const scaleH = availH > 0 ? availH / contentH : 1;
    const scaleW = availW > 0 ? availW / contentW : 1;

    const s = Math.min(scaleH, scaleW, 1);
    return Math.max(s, 0.4);
  }

  function applyFitScales() {
    sections.forEach(sec => {
      //  тільки services: до 1140 — не скейлимо
      if (sec.id === 'services-section' && window.innerWidth < 1140) {
        // якщо ти скейлиш через .section__scaling — скидаємо
        const target = sec.querySelector('.section__scaling') || sec;
        target.style.setProperty('--fit-scale', '1.000');
        sec.style.setProperty('--pad-comp', '0px');
        return;
      }

      const target = sec.querySelector('.section__scaling') || sec;

      const s = computeFitScaleFor(target);
      target.style.setProperty('--fit-scale', s.toFixed(3));

      const cs = getComputedStyle(sec);
      const basePtVar = parseFloat(cs.getPropertyValue('--base-pt'));
      const basePt = Number.isFinite(basePtVar)
        ? basePtVar
        : parseFloat(cs.paddingTop) || 44;

      let padComp;
      if (s < 1 && sec.classList.contains('hero-section')) {
        padComp = basePt;
      } else {
        padComp = s < 1 ? basePt * (1 - s) : 0;
      }
      sec.style.setProperty('--pad-comp', `${padComp.toFixed(2)}px`);
    });
  }

  function applyFitScalesOnce() {
    if (fitScaleLocked) return;
    applyFitScales();
    fitScaleLocked = true;
  }

  function ensureScalingWrappers() {
    sections.forEach(sec => {
      // 1) зовнішня обгортка під fit‑scale
      let scaling = sec.querySelector('.section__scaling');
      if (!scaling) {
        scaling = document.createElement('div');
        scaling.className = 'section__scaling';
        while (sec.firstChild) scaling.appendChild(sec.firstChild);
        sec.appendChild(scaling);
      }
      // 2) внутрішня обгортка під «дихання»
      if (!scaling.querySelector('.section__breath')) {
        const breath = document.createElement('div');
        breath.className = 'section__breath';
        while (scaling.firstChild) breath.appendChild(scaling.firstChild);
        scaling.appendChild(breath);
      }
    });
  }

  // ---------- ПЕРЕХІД МІЖ СЕКЦІЯМИ (ФІКСАЦІЯ) ----------
  function nextFrame() {
    return new Promise(r => requestAnimationFrame(() => r()));
  }

  async function lockAndGo(nextIndex) {
    if (
      nextIndex < 0 ||
      nextIndex >= stops.length ||
      locked ||
      shouldPauseFullpage()
    )
      return;

    locked = true;

    current = nextIndex;
    setActive(nextIndex);

    const nextBreath = sections[nextIndex]?.querySelector('.section__breath');
    if (nextBreath) {
      void nextBreath.getBoundingClientRect();
    }

    await nextFrame();
    await smoothScrollTo(stops[nextIndex], BREATH_DUR_MS);

    replaceUrlForIndex(current);
    locked = false;
    updateActiveSection();
  }

  // ---------- ОБРОБКА ВВОДУ ----------
  function onWheel(e) {
    if (shouldPauseFullpage()) return;
    /*  if (isTextInputFocused()) return; */
    if (e.ctrlKey || e.metaKey) return;
    if (locked) {
      e.preventDefault();
      return;
    }

    const dy = normWheelDY(e);
    if (Math.abs(dy) < MIN_WHEEL) return;

    e.preventDefault();

    if (dy > 0 && current < stops.length - 1) {
      lockAndGo(current + 1);
    } else if (dy < 0 && current > 0) {
      lockAndGo(current - 1);
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      blurFocusedFormField();
      formInteractionLock = false;
      lockedSectionIndex = null;
      return;
    }

    if (shouldPauseFullpage()) return;

    const keys = [
      'ArrowDown',
      'PageDown',
      ' ',
      'ArrowUp',
      'PageUp',
      'Home',
      'End',
    ];
    if (locked && keys.includes(e.key)) {
      e.preventDefault();
      return;
    }

    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      if (current < stops.length - 1) lockAndGo(current + 1);
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (current > 0) lockAndGo(current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      lockAndGo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      lockAndGo(stops.length - 1);
    }
  }

  // Всі якірні посилання міняємо так, щоб НЕ було нативного стрибка,
  // а хеш оновлювався через history.pushState + штучний hashchange
  function wireAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href'); // типу "#about"
        if (!id || id.length <= 1) return;
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        history.pushState(null, '', id);
        window.dispatchEvent(new HashChangeEvent('hashchange')); // далі lockAndGo
      });
    });
  }

  function wireTouch() {
    window.addEventListener(
      'touchstart',
      e => {
        if (shouldPauseFullpage()) {
          startY = null;
          return;
        }
        startY = e.touches[0].clientY;
      },
      { passive: true },
    );

    window.addEventListener(
      'touchmove',
      e => {
        if (shouldPauseFullpage()) {
          startY = null;
          return;
        }

        if (startY == null) return;
        if (locked) return;

        const dy = startY - e.touches[0].clientY;
        if (Math.abs(dy) < 50) return;

        if (dy > 0 && current < stops.length - 1) {
          lockAndGo(current + 1);
        } else if (dy < 0 && current > 0) {
          lockAndGo(current - 1);
        }
        startY = null;
      },
      { passive: true },
    );

    document.addEventListener(
      'pointerdown',
      e => {
        const formEl = document.getElementById('contact-section-form');
        const field = e.target.closest(
          'input, textarea, select, [contenteditable="true"]',
        );

        // Тап по полю форми: тримаємо lock + клавіатуру
        if (field) {
          if (IS_TELEGRAM_WEBVIEW) startY = null;

          formInteractionLock = true;
          keyboardSession = true;
          lockedSectionIndex = current;
          clearTimeout(resizeTimer);
          clearTimeout(scrollTmr);
          return;
        }

        // Якщо фокус у полі і тап всередині форми (між інпутами) — НЕ blur
        if (isFormFieldFocused() && formEl && formEl.contains(e.target)) {
          formInteractionLock = true;
          keyboardSession = true;
          return;
        }

        // Blur тільки при тапі поза формою
        if (isFormFieldFocused()) {
          blurFocusedFormField();
          formInteractionLock = false;
          keyboardSession = false;
          lockedSectionIndex = null;
        }
      },
      true,
    );
  }

  // ---------- ПУБЛІЧНИЙ МІНІ-API ----------
  window.fullpage = {
    goToId(idOrHash) {
      const id = idOrHash.startsWith('#') ? idOrHash : `#${idOrHash}`;

      const target = document.querySelector(id);
      if (!target) return;
      const sec = target.closest('.section') || target;
      const idx = sections.indexOf(sec);
      if (idx >= 0 && !locked) lockAndGo(idx);
    },
    goToIndex(i) {
      if (i >= 0 && i < stops.length && !locked) lockAndGo(i);
    },
  };

  // ---------- ІНІЦІАЛІЗАЦІЯ ----------
  try {
    document.documentElement.style.scrollBehavior = 'auto';
  } catch {}

  ensureScalingWrappers();
  applyFitScalesOnce();
  init();
  buildSideNav();
  setActiveSidebar(current);
  setActiveHeader(current);
  updateActiveSection();
  bootToHashIfAny();

  // ---------- ЛІСТЕНЕРИ ----------
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  wireAnchors();
  wireTouch();

  // Головне: усі зміни хешу веде наш скролер (без нативного стрибка)
  window.addEventListener('hashchange', () => {
    if (shouldPauseFullpage()) return;
    const id = location.hash;
    if (!id || id.length <= 1) return;
    // утримаємо позицію (на випадок якщо браузер таки смикнеться)
    const keepY = window.scrollY;
    window.scrollTo(0, keepY);
    window.fullpage.goToId(id);
  });

  window.addEventListener(
    'scroll',
    () => {
      if (locked) return;

      if (shouldPauseFullpage()) return;

      clearTimeout(scrollTmr);
      scrollTmr = setTimeout(() => {
        updateActiveSection();
      }, 60);
    },
    { passive: true },
  );

  window.addEventListener('resize', () => {
    if (IS_TELEGRAM_WEBVIEW) return;
    if (formInteractionLock || keyboardSession || isFormFieldFocused()) return;
    if (shouldPauseFullpage()) return;
    // Ігноруємо resize від мобільної клавіатури/фокуса інпутів
    /* if (isTextInputFocused() || isLikelyKeyboardResize()) return; */

    isResizing = true;
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      if (shouldPauseFullpage()) {
        isResizing = false;
        return;
      }

      const prevY = stops[current] || 0;

      initServicesSwiper();
      init();

      buildSideNav();
      setActiveSidebar(current);
      setActiveHeader(current);

      current = getClosestIndex(prevY);
      window.scrollTo({ top: stops[current], behavior: 'auto' });
      updateActiveSection();
      isResizing = false;
    }, 120);
  });

  window.addEventListener('load', () => {
    init();
    updateActiveSection();
  });

  window.addEventListener('pageshow', e => {
    // при поверненні з кешу історії переконаємось, що хеш відпрацьовано
    if (e.persisted) bootToHashIfAny();
  });

  window.addEventListener(
    'focusin',
    e => {
      if (
        !e.target.matches('input, textarea, select, [contenteditable="true"]')
      )
        return;

      formInteractionLock = true;
      keyboardSession = true;
      lockedSectionIndex = current;
      clearTimeout(resizeTimer);
      clearTimeout(scrollTmr);
    },
    true,
  );

  window.addEventListener(
    'focusout',
    () => {
      clearTimeout(resizeTimer);
      clearTimeout(scrollTmr);

      setTimeout(
        () => {
          if (isFormFieldFocused()) return;

          keyboardSession = false;
          formInteractionLock = false;

          if (!IS_TELEGRAM_WEBVIEW) {
            stops = computeStops();
            const idx = lockedSectionIndex ?? current;
            current = Math.max(0, Math.min(idx, stops.length - 1));

            window.scrollTo({ top: stops[current], behavior: 'auto' });
            setActive(current);
            replaceUrlForIndex(current);
          }

          lockedSectionIndex = null;
        },
        IS_TELEGRAM_WEBVIEW ? 320 : 220,
      );
    },
    true,
  );

  window.visualViewport?.addEventListener(
    'resize',
    onViewportResizeForKeyboard,
  );
  window.addEventListener('resize', onViewportResizeForKeyboard);

  document.querySelectorAll('img').forEach(img => {
    if (!img.complete) {
      img.addEventListener(
        'load',
        () => {
          init();
          updateActiveSection();
        },
        { once: true },
      );
    }
  });
})();
