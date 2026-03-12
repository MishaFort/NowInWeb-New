"use strict";

(function () {
  // Запускає стартову анімацію "breath" лише один раз за сесію вкладки
  const STORAGE_KEY = 'niw_breath_once_done';
  const CLASS_NAME = 'breath-once';
  const DURATION_MS = 1000;
  const MIN_BREATH_WIDTH = 1140;
  function alreadyDone() {
    if (window.__niwBreathOnceDone) return true;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // У деяких режимах браузера або приватності sessionStorage недоступний
      return false;
    }
  }
  function markDone() {
    window.__niwBreathOnceDone = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Якщо storage заблокований, зберігаємо прапорець лише в пам'яті сторінки
    }
  }
  function canRunBreathByWidth() {
    return window.innerWidth >= MIN_BREATH_WIDTH;
  }
  function getClosestIndex(stops, y) {
    let idx = 0;
    let best = Infinity;
    for (let i = 0; i < stops.length; i++) {
      const d = Math.abs(stops[i] - y);
      if (d < best) {
        best = d;
        idx = i;
      }
    }
    return idx;
  }
  function computeStops(sections) {
    return sections.map(s => Math.max(0, Math.round(s.offsetTop)));
  }
  function getTargetEl(section) {
    return section.querySelector('.section__scaling') || section;
  }
  function runBreathOnce() {
    if (!canRunBreathByWidth()) return;
    if (alreadyDone()) return;
    const sections = Array.from(document.querySelectorAll('.section'));
    if (!sections.length) return;
    const stops = computeStops(sections);
    const idx = getClosestIndex(stops, window.scrollY);
    const target = getTargetEl(sections[idx]);

    // Спочатку прибираємо клас, щоб повторне додавання точно перезапустило CSS-анімацію
    target.classList.remove(CLASS_NAME);

    // Два кадри дають браузеру зафіксувати видалення класу перед повторним додаванням
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (alreadyDone()) return;
        target.classList.add(CLASS_NAME);
        markDone();
        setTimeout(() => target.classList.remove(CLASS_NAME), DURATION_MS);
      });
    });
  }
  if (document.readyState === 'complete') {
    runBreathOnce();
  } else {
    window.addEventListener('load', runBreathOnce, {
      once: true
    });
  }
})();
//# sourceMappingURL=breathing-on-start.js.map