(() => {
  const back = document.getElementById("blackHoleBack");
  const front = document.getElementById("blackHoleFront");
  const stage = back?.parentElement;
  if (!back || !front || !stage) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const backCtx = back.getContext("2d");
  const frontCtx = front.getContext("2d");
  if (!backCtx || !frontCtx) return;

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    particles: [],
    raf: 0,
    last: performance.now()
  };

  const config = {
    particleCount: reduceMotion ? 260 : 1180,
    voidRadius: 52,
    outerRadius: 0.72,
    particleSize: 1.55,
    orbitSpeed: 4.2,
    pullSpeed: 0.012,
    trailAlpha: 0.035,
    tilt: 19 * Math.PI / 180,
    tiltSideway: 154 * Math.PI / 180,
    perspective: 1320,
    colors: ["#ffffff", "#75e0c0", "#d7f5aa", "#7aa8ff"]
  };

  function resize() {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    state.w = Math.max(1, rect.width);
    state.h = Math.max(1, rect.height);
    state.dpr = dpr;
    for (const canvas of [back, front]) {
      canvas.width = Math.floor(state.w * dpr);
      canvas.height = Math.floor(state.h * dpr);
      canvas.style.width = `${state.w}px`;
      canvas.style.height = `${state.h}px`;
    }
    seed();
  }

  function outerRadius() {
    return config.voidRadius + config.outerRadius * (state.w * 0.56 - config.voidRadius);
  }

  function seed() {
    const maxR = outerRadius();
    state.particles = Array.from({ length: config.particleCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: config.voidRadius + Math.pow(Math.random(), 2) * (maxR - config.voidRadius),
      height: (Math.random() - 0.5) * 20,
      speedOffset: 0.7 + Math.random() * 0.65,
      colorIdx: Math.floor(Math.random() * config.colors.length)
    }));
  }

  function fade(ctx) {
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0, 0, 0, ${config.trailAlpha})`;
    ctx.fillRect(0, 0, state.w, state.h);
    ctx.globalCompositeOperation = "source-over";
  }

  function drawSphere(ctx, cx, cy) {
    const r = config.voidRadius;
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.34, 2, cx, cy, r);
    grad.addColorStop(0, "#111616");
    grad.addColorStop(0.62, "#020303");
    grad.addColorStop(0.94, "#16221f");
    grad.addColorStop(1, "rgba(117, 224, 192, 0.18)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    const rim = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.22);
    rim.addColorStop(0, "rgba(117, 224, 192, 0)");
    rim.addColorStop(0.76, "rgba(117, 224, 192, 0.18)");
    rim.addColorStop(1, "rgba(117, 224, 192, 0)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(now) {
    const dt = Math.min((now - state.last) / 16.667, 3);
    state.last = now;

    fade(backCtx);
    fade(frontCtx);

    const cx = state.w * 0.63;
    const cy = state.h * 0.48;
    const maxR = outerRadius();
    const background = [];
    const foreground = [];

    for (const pt of state.particles) {
      const speedFactor = Math.sqrt(config.voidRadius / Math.max(pt.radius, 10));
      pt.angle += config.orbitSpeed * speedFactor * pt.speedOffset * 0.012 * dt;
      pt.radius -= config.pullSpeed * speedFactor * dt;
      if (pt.radius < config.voidRadius) {
        pt.radius = config.voidRadius + 0.66 * (maxR - config.voidRadius) + Math.random() * 0.34 * (maxR - config.voidRadius);
        pt.angle = Math.random() * Math.PI * 2;
        pt.height = (Math.random() - 0.5) * 20;
      }

      const cosA = Math.cos(pt.angle);
      const sinA = Math.sin(pt.angle);
      const xBase = pt.radius * cosA;
      const yBase = pt.height;
      const zBase = pt.radius * sinA;

      const y1 = yBase * Math.cos(config.tilt) + zBase * Math.sin(config.tilt);
      const z1 = -yBase * Math.sin(config.tilt) + zBase * Math.cos(config.tilt);
      const x3d = xBase * Math.cos(config.tiltSideway) - y1 * Math.sin(config.tiltSideway);
      const y3d = xBase * Math.sin(config.tiltSideway) + y1 * Math.cos(config.tiltSideway);
      const z3d = z1;
      const scale = config.perspective / (config.perspective + z3d);
      const x = cx + x3d * scale;
      const y = cy + y3d * scale;
      if (x < -40 || x > state.w + 40 || y < -40 || y > state.h + 40) continue;

      const particle = {
        x,
        y,
        z: z3d,
        size: Math.max(0.34, config.particleSize * scale),
        color: config.colors[pt.colorIdx % config.colors.length],
        alpha: Math.max(0.28, 1 - ((z3d + maxR) / (2 * maxR)) * 0.48)
      };
      if (z3d >= 0) background.push(particle);
      else foreground.push(particle);
    }

    background.sort((a, b) => b.z - a.z);
    foreground.sort((a, b) => b.z - a.z);

    for (const pt of background) {
      backCtx.globalAlpha = pt.alpha;
      backCtx.fillStyle = pt.color;
      backCtx.beginPath();
      backCtx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      backCtx.fill();
    }
    backCtx.globalAlpha = 1;
    drawSphere(backCtx, cx, cy);

    for (const pt of foreground) {
      frontCtx.globalAlpha = pt.alpha;
      frontCtx.fillStyle = pt.color;
      frontCtx.beginPath();
      frontCtx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      frontCtx.fill();
    }
    frontCtx.globalAlpha = 1;

    if (!reduceMotion) state.raf = requestAnimationFrame(render);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();
  state.raf = requestAnimationFrame(render);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(state.raf));
})();
