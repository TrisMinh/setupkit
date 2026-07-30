(() => {
  const back = document.getElementById("blackHoleBack");
  const front = document.getElementById("blackHoleFront");
  const stage = back?.parentElement;
  const orbitRoot = document.getElementById("workspaceOrbits");
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
    orbitLayers: [],
    raf: 0,
    last: performance.now()
  };

  const config = {
    particleCount: reduceMotion ? 220 : 960,
    voidRadius: 46,
    outerRadius: 0.62,
    particleSize: 1.34,
    orbitSpeed: 1.72,
    pullSpeed: 0.0048,
    trailAlpha: 0.028,
    tilt: 19 * Math.PI / 180,
    tiltSideway: 154 * Math.PI / 180,
    perspective: 1320,
    colors: ["#ffffff", "#75e0c0", "#d7f5aa", "#7aa8ff"]
  };

  const workspaceConfigs = {
    developer: { rx: 0.27, ry: 0.085, speed: 0.00022, offset: 0.2, lift: -0.03, rotate: -13 },
    office: { rx: 0.22, ry: 0.07, speed: -0.00018, offset: 1.4, lift: 0.015, rotate: -8 },
    design: { rx: 0.32, ry: 0.105, speed: 0.00015, offset: 2.5, lift: 0.055, rotate: -16 },
    gaming: { rx: 0.38, ry: 0.125, speed: -0.00012, offset: 3.4, lift: 0.1, rotate: -19 }
  };

  function initOrbitLayers() {
    if (!orbitRoot) return;
    state.orbitLayers = [...orbitRoot.querySelectorAll(".workspace-orbit-layer")].map((layer, layerIndex) => {
      const key = layer.dataset.orbitLayer || "developer";
      const nodes = [...layer.querySelectorAll("img, .orbit-tag")];
      const logos = nodes.map((node, index, list) => ({
        node,
        type: node.classList.contains("orbit-tag") ? "tag" : "logo",
        angle: (Math.PI * 2 * index) / Math.max(1, list.length) + layerIndex * 0.42,
        phase: index * 0.16
      }));
      return {
        key,
        layer,
        logos,
        config: workspaceConfigs[key] || workspaceConfigs.developer
      };
    });
    if (state.orbitLayers.length && !orbitRoot.dataset.focus) {
      orbitRoot.dataset.focus = "developer";
    }
  }

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
    updateOrbitRings();
  }

  function outerRadius() {
    const radiusBase = cssNumber("--black-hole-radius-base", 0.56);
    return config.voidRadius + config.outerRadius * (state.w * radiusBase - config.voidRadius);
  }

  function cssNumber(name, fallback) {
    const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
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

  function updateOrbitRings() {
    if (!state.orbitLayers.length) return;
    const cx = state.w * cssNumber("--black-hole-cx", 0.63);
    const cy = state.h * cssNumber("--black-hole-cy", 0.48);
    const base = Math.max(260, state.w * cssNumber("--black-hole-radius-base", 0.34));
    for (const item of state.orbitLayers) {
      const rx = base * item.config.rx * 2.25;
      const ry = base * item.config.ry * 2.25;
      item.layer.style.setProperty("--ring-left", `${cx}px`);
      item.layer.style.setProperty("--ring-top", `${cy + state.h * item.config.lift}px`);
      item.layer.style.setProperty("--ring-width", `${rx * 2}px`);
      item.layer.style.setProperty("--ring-height", `${ry * 2}px`);
      item.layer.style.setProperty("--ring-rotate", `${item.config.rotate}deg`);
    }
  }

  function renderOrbitLayers(now, cx, cy) {
    if (!state.orbitLayers.length) return;
    const base = Math.max(260, state.w * cssNumber("--black-hole-radius-base", 0.34));
    for (const item of state.orbitLayers) {
      const cfg = item.config;
      const rx = base * cfg.rx * 2.25;
      const ry = base * cfg.ry * 2.25;
      const layerCy = cy + state.h * cfg.lift;
      const focus = orbitRoot?.dataset.focus === item.key;
      const layerBoost = focus ? 1 : 0;
      for (const logo of item.logos) {
        const isTag = logo.type === "tag";
        const tagDrift = isTag ? 0.42 + Math.sin(now * 0.00008 + logo.phase) * 0.08 : 0;
        const angle = logo.angle + cfg.offset + tagDrift + (reduceMotion ? 0 : now * cfg.speed * (isTag ? 0.82 : 1));
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const orbitScale = isTag ? 1.12 : 1;
        const x = cx + cos * rx * orbitScale;
        const y = layerCy + sin * ry * orbitScale;
        const depth = (sin + 1) / 2;
        const zIndex = String(3 + Math.round(depth * 8) + (isTag ? 1 : 0));
        if (isTag) {
          const scale = 0.82 + depth * 0.18 + layerBoost * 0.08;
          const width = 42 + logo.node.textContent.length * 5 + depth * 8;
          const alpha = Math.max(0.2, 0.28 + depth * 0.34 + layerBoost * 0.28);
          logo.node.style.setProperty("--tag-x", `${x}px`);
          logo.node.style.setProperty("--tag-y", `${y}px`);
          logo.node.style.setProperty("--tag-width", `${width}px`);
          logo.node.style.setProperty("--tag-scale", scale.toFixed(3));
          logo.node.style.setProperty("--tag-alpha", alpha.toFixed(3));
          logo.node.style.setProperty("--tag-z", zIndex);
          logo.node.style.setProperty("--tag-saturation", focus ? "1.12" : (0.72 + depth * 0.2).toFixed(2));
        } else {
          const size = 25 + depth * 14 + layerBoost * 4;
          const alpha = Math.max(0.26, 0.48 + depth * 0.34 + layerBoost * 0.2);
          const scale = 0.86 + depth * 0.3 + layerBoost * 0.06;
          logo.node.style.setProperty("--logo-x", `${x}px`);
          logo.node.style.setProperty("--logo-y", `${y}px`);
          logo.node.style.setProperty("--logo-size", `${size}px`);
          logo.node.style.setProperty("--logo-scale", scale.toFixed(3));
          logo.node.style.setProperty("--logo-alpha", alpha.toFixed(3));
          logo.node.style.setProperty("--logo-z", zIndex);
          logo.node.style.setProperty("--logo-saturation", focus ? "1.08" : (0.72 + depth * 0.22).toFixed(2));
        }
      }
    }
  }

  function render(now) {
    const dt = Math.min((now - state.last) / 16.667, 3);
    state.last = now;

    fade(backCtx);
    fade(frontCtx);

    const cx = state.w * cssNumber("--black-hole-cx", 0.63);
    const cy = state.h * cssNumber("--black-hole-cy", 0.48);
    const maxR = outerRadius();
    const background = [];
    const foreground = [];
    renderOrbitLayers(now, cx, cy);

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
  initOrbitLayers();
  ro.observe(stage);
  resize();
  state.raf = requestAnimationFrame(render);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(state.raf));
})();
