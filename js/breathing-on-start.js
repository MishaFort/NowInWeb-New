(function () {
  function getClosestIndex(stops, y) {
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

  function computeStops(sections) {
    return sections.map(s => Math.max(0, Math.round(s.offsetTop)));
  }

  function getTargetEl(section) {
    return section.querySelector('.section__scaling') || section;
  }

  function runBreathOnce() {
    const sections = Array.from(document.querySelectorAll('.section'));
    if (!sections.length) return;

    const stops = computeStops(sections);
    const idx = getClosestIndex(stops, window.scrollY);

    const target = getTargetEl(sections[idx]);
    // скинь попередню, якщо раптом лишилась
    target.classList.remove('breath-once');

    // невелика пауза — дає браузеру зафіксувати початковий стан
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.classList.add('breath-once');
        // опційно прибираємо клас після завершення
        setTimeout(() => target.classList.remove('breath-once'), 1000);
      });
    });
  }

  // Пускаємо ефект тоді, коли відомі шрифти/зображення (щоб --fit-scale був коректний)
  if (document.readyState === 'complete') {
    runBreathOnce();
  } else {
    window.addEventListener('load', runBreathOnce, { once: true });
  }
})();
