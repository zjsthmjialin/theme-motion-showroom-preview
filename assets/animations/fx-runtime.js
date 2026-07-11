(function () {
  "use strict";

  const FX_IDS = {
    "particle-field": particleField,
    starfield,
    "knowledge-graph": knowledgeGraph,
    "data-stream": dataStream,
    "spark-burst": sparkBurst,
  };

  const handles = new WeakMap();
  const activeSlides = new Set();
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  function prefersReducedMotion() {
    return reducedMotion?.matches === true;
  }

  function ensureCanvas(slide) {
    let canvas = slide.querySelector(":scope > canvas.fx-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "fx-canvas";
      canvas.setAttribute("aria-hidden", "true");
      slide.prepend(canvas);
    }

    if (getComputedStyle(slide).position === "static") {
      slide.style.position = "relative";
    }

    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: "0",
      pointerEvents: "none",
    });

    Array.from(slide.children).forEach((child) => {
      if (child === canvas) return;
      const style = getComputedStyle(child);
      if (style.position === "static") child.style.position = "relative";
      if (style.zIndex === "auto") child.style.zIndex = "1";
    });

    return canvas;
  }

  function resize(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { width, height, ratio };
  }

  function start(slide) {
    if (!slide || prefersReducedMotion()) return;

    const fxId = slide.getAttribute("data-fx");
    const draw = FX_IDS[fxId];
    if (!draw) return;

    stop(slide);

    const canvas = ensureCanvas(slide);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = {
      canvas,
      ctx,
      frameId: 0,
      startedAt: performance.now(),
      points: [],
      sparks: [],
    };

    function frame(now) {
      const size = resize(canvas);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(state, now, size);
      state.frameId = requestAnimationFrame(frame);
    }

    activeSlides.add(slide);
    handles.set(slide, state);
    state.frameId = requestAnimationFrame(frame);
  }

  function stop(slide) {
    const state = handles.get(slide);
    if (!state) return;

    cancelAnimationFrame(state.frameId);
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    state.canvas.remove();
    handles.delete(slide);
    activeSlides.delete(slide);
  }

  function stopAll() {
    Array.from(activeSlides).forEach(stop);
  }

  function seedPoints(state, count, width, height, velocity) {
    if (state.points.length === count) return;
    state.points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * velocity,
      vy: (Math.random() - 0.5) * velocity,
      size: 1 + Math.random() * 2,
    }));
  }

  function particleField(state, now, { width, height }) {
    const { ctx } = state;
    seedPoints(state, 28, width, height, 0.45);
    ctx.fillStyle = "rgba(70, 130, 180, 0.24)";
    for (const point of state.points) {
      point.x = (point.x + point.vx + width) % width;
      point.y = (point.y + point.vy + height) % height;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSoftConnections(ctx, state.points, 96, "rgba(70, 130, 180, 0.12)");
    drawTimeWash(ctx, now, width, height);
  }

  function starfield(state, now, { width, height }) {
    const { ctx } = state;
    seedPoints(state, 36, width, height, 0.18);
    ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
    for (const star of state.points) {
      star.y += 0.12 + star.size * 0.02;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
      const glow = 0.35 + Math.sin(now / 900 + star.x) * 0.2;
      ctx.globalAlpha = Math.max(0.18, glow);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function knowledgeGraph(state, now, { width, height }) {
    const { ctx } = state;
    seedPoints(state, 18, width, height, 0.28);
    for (const point of state.points) {
      point.x += point.vx + Math.sin(now / 2400 + point.y) * 0.03;
      point.y += point.vy + Math.cos(now / 2600 + point.x) * 0.03;
      if (point.x < 24 || point.x > width - 24) point.vx *= -1;
      if (point.y < 24 || point.y > height - 24) point.vy *= -1;
    }
    drawSoftConnections(ctx, state.points, 150, "rgba(43, 105, 120, 0.18)");
    ctx.fillStyle = "rgba(43, 105, 120, 0.34)";
    for (const point of state.points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function dataStream(state, now, { width, height }) {
    const { ctx } = state;
    const columns = 18;
    const gap = width / columns;
    ctx.font = `${Math.max(12, Math.floor(gap * 0.32))}px monospace`;
    ctx.fillStyle = "rgba(30, 95, 105, 0.20)";
    for (let i = 0; i < columns; i += 1) {
      const x = i * gap + gap * 0.25;
      const y = (now * 0.035 + i * 43) % (height + 80) - 40;
      const value = ((i * 37 + Math.floor(now / 220)) % 97).toString(16).padStart(2, "0");
      ctx.fillText(value, x, y);
      ctx.fillRect(x, y + 8, Math.max(8, gap * 0.34), 1);
    }
  }

  function sparkBurst(state, now, { width, height }) {
    const { ctx } = state;
    if (!state.sparks.length || now - state.startedAt > 2200) {
      state.startedAt = now;
      state.sparks = Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return {
          angle,
          speed: 0.45 + Math.random() * 0.55,
          life: 0.6 + Math.random() * 0.35,
        };
      });
    }
    const age = (now - state.startedAt) / 1000;
    const cx = width * 0.5;
    const cy = height * 0.45;
    for (const spark of state.sparks) {
      const distance = age * spark.speed * Math.min(width, height) * 0.42;
      const alpha = Math.max(0, spark.life - age);
      ctx.strokeStyle = `rgba(240, 160, 70, ${alpha * 0.32})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(spark.angle) * distance * 0.72, cy + Math.sin(spark.angle) * distance * 0.72);
      ctx.lineTo(cx + Math.cos(spark.angle) * distance, cy + Math.sin(spark.angle) * distance);
      ctx.stroke();
    }
  }

  function drawSoftConnections(ctx, points, maxDistance, strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > maxDistance) continue;
        ctx.globalAlpha = 1 - distance / maxDistance;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawTimeWash(ctx, now, width, height) {
    const x = (Math.sin(now / 2400) * 0.5 + 0.5) * width;
    const gradient = ctx.createRadialGradient(x, height * 0.3, 0, x, height * 0.3, Math.max(width, height) * 0.45);
    gradient.addColorStop(0, "rgba(120, 160, 180, 0.08)");
    gradient.addColorStop(1, "rgba(120, 160, 180, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  reducedMotion?.addEventListener?.("change", (event) => {
    if (event.matches) stopAll();
  });

  window.InspirationFX = {
    start(slide) {
      start(slide);
    },
    stop(slide) {
      stop(slide);
    },
    stopAll() {
      stopAll();
    },
  };
})();
