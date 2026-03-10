(() => {
  const DESKTOP_CURSOR_MEDIA = window.matchMedia(
    '(min-width: 1140px) and (pointer: fine)',
  );

  const trailSvg = document.querySelector('.neon-trail');
  const sprayGroup = document.querySelector('.neon-trail__spray');
  const bodyPath = document.querySelector('.neon-trail__body');

  if (!trailSvg || !sprayGroup || !bodyPath) return;

  const TRAIL_LENGTH = 300;
  const POINT_SPACING = 3;
  const HEAD_EASING = 0.22;
  const IDLE_FADE_DELAY = 60;

  let rafId = 0;
  let enabled = false;
  let visible = false;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastMoveAt = 0;

  let points = [];

  const setSvgSize = () => {
    trailSvg.setAttribute(
      'viewBox',
      `0 0 ${window.innerWidth} ${window.innerHeight}`,
    );
    trailSvg.setAttribute('width', window.innerWidth);
    trailSvg.setAttribute('height', window.innerHeight);
  };

  const show = () => {
    visible = true;
    trailSvg.classList.add('is-visible');
  };

  const clearTrail = () => {
    points = [];
    bodyPath.setAttribute('d', '');
    sprayGroup.innerHTML = '';
  };

  const hide = () => {
    visible = false;
    trailSvg.classList.remove('is-visible');
    clearTrail();
  };

  const onMouseMove = event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    lastMoveAt = performance.now();

    if (!visible) show();

    if (!points.length) {
      points = [{ x: mouseX, y: mouseY }];
    }
  };

  const trimPointsToLength = () => {
    if (points.length < 2) return;

    const trimmed = [points[0]];
    let total = 0;

    for (let i = 1; i < points.length; i += 1) {
      const prev = trimmed[trimmed.length - 1];
      const current = points[i];

      const dx = current.x - prev.x;
      const dy = current.y - prev.y;
      const segment = Math.hypot(dx, dy);

      if (segment === 0) continue;

      if (total + segment >= TRAIL_LENGTH) {
        const remaining = TRAIL_LENGTH - total;
        const t = remaining / segment;

        trimmed.push({
          x: prev.x + dx * t,
          y: prev.y + dy * t,
        });
        break;
      }

      trimmed.push(current);
      total += segment;
    }

    points = trimmed;
  };

  const relaxTail = () => {
    if (points.length < 2) return;

    for (let i = points.length - 1; i > 0; i -= 1) {
      points[i].x += (points[i - 1].x - points[i].x) * 0.22;
      points[i].y += (points[i - 1].y - points[i].y) * 0.22;
    }

    const head = points[0];
    const tail = points[points.length - 1];

    if (Math.hypot(head.x - tail.x, head.y - tail.y) < 1.5) {
      points.length = 1;
    }
  };

  const updatePoints = now => {
    if (!points.length) {
      points.unshift({ x: mouseX, y: mouseY });
      return;
    }

    const head = points[0];
    const dx = mouseX - head.x;
    const dy = mouseY - head.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= POINT_SPACING) {
      points.unshift({ x: mouseX, y: mouseY });
    } else {
      head.x += dx * HEAD_EASING;
      head.y += dy * HEAD_EASING;
    }

    trimPointsToLength();

    if (now - lastMoveAt > IDLE_FADE_DELAY) {
      relaxTail();
    }
  };

  const buildSmoothPath = pathPoints => {
    if (pathPoints.length < 2) return '';

    let d = `M ${pathPoints[0].x.toFixed(1)} ${pathPoints[0].y.toFixed(1)}`;

    for (let i = 0; i < pathPoints.length - 1; i += 1) {
      const p0 = pathPoints[i - 1] || pathPoints[i];
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const p3 = pathPoints[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    return d;
  };

  const renderTrail = () => {
    if (!visible || points.length < 2) {
      bodyPath.setAttribute('d', '');
      sprayGroup.innerHTML = '';
      return;
    }

    const d = buildSmoothPath(points);
    bodyPath.setAttribute('d', d);

    const headPoint = points[0];
    const HEAD_CLEAR_RADIUS = 18;

    const sprayPoints = points.slice(1).filter(point => {
      const distanceToHead = Math.hypot(
        point.x - headPoint.x,
        point.y - headPoint.y,
      );

      return distanceToHead > HEAD_CLEAR_RADIUS;
    });

    const circles = sprayPoints
      .map((point, index) => {
        const progress = 1 - index / Math.max(sprayPoints.length - 1, 1);
        const baseRadius = 8.5 * progress + 2;
        const spread = 2.8 * (1 - progress) + 1.1;
        const alphaMain = 0.14 * progress + 0.025;
        const alphaSide = 0.085 * progress + 0.018;

        return `
          <circle
            cx="${point.x.toFixed(1)}"
            cy="${point.y.toFixed(1)}"
            r="${baseRadius.toFixed(2)}"
            fill="rgba(106,34,234,${alphaMain.toFixed(3)})"
          />
          <circle
            cx="${(point.x + spread).toFixed(1)}"
            cy="${(point.y - spread * 0.6).toFixed(1)}"
            r="${(baseRadius * 0.72).toFixed(2)}"
            fill="rgba(140,90,255,${alphaSide.toFixed(3)})"
          />
          <circle
            cx="${(point.x - spread * 0.9).toFixed(1)}"
            cy="${(point.y + spread * 0.5).toFixed(1)}"
            r="${(baseRadius * 0.55).toFixed(2)}"
            fill="rgba(58,0,128,${(alphaSide * 0.9).toFixed(3)})"
          />
`;
      })
      .join('');

    sprayGroup.innerHTML = circles;
  };

  const animate = now => {
    if (visible) {
      updatePoints(now);
      renderTrail();
    }

    rafId = requestAnimationFrame(animate);
  };

  const start = () => {
    if (enabled) return;
    enabled = true;

    setSvgSize();

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', setSvgSize);
    window.addEventListener('blur', hide);

    document.addEventListener('mouseleave', hide);

    rafId = requestAnimationFrame(animate);
  };

  const stop = () => {
    if (!enabled) return;
    enabled = false;

    cancelAnimationFrame(rafId);

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', setSvgSize);
    window.removeEventListener('blur', hide);

    document.removeEventListener('mouseleave', hide);

    hide();
  };

  const checkMode = () => {
    if (DESKTOP_CURSOR_MEDIA.matches) start();
    else stop();
  };

  checkMode();

  if (typeof DESKTOP_CURSOR_MEDIA.addEventListener === 'function') {
    DESKTOP_CURSOR_MEDIA.addEventListener('change', checkMode);
  } else {
    DESKTOP_CURSOR_MEDIA.addListener(checkMode);
  }
})();
