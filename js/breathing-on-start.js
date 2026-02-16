(function () {
  const STORAGE_KEY = 'niw_breath_once_done';
  const CLASS_NAME = 'breath-once';
  const DURATION_MS = 1000;

  function alreadyDone() {
    if (window.__niwBreathOnceDone) return true;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function markDone() {
    window.__niwBreathOnceDone = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {}
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
    if (alreadyDone()) return;

    const sections = Array.from(document.querySelectorAll('.section'));
    if (!sections.length) return;

    const stops = computeStops(sections);
    const idx = getClosestIndex(stops, window.scrollY);
    const target = getTargetEl(sections[idx]);

    target.classList.remove(CLASS_NAME);

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
    window.addEventListener('load', runBreathOnce, { once: true });
  }
})();
