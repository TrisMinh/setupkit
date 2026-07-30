(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = [...document.querySelectorAll(".reveal")];
  const timeline = document.getElementById("timeline");
  const timelineProgress = document.getElementById("timelineProgress");
  const cursorOrb = document.getElementById("cursorOrb");
  const starfield = document.getElementById("starfield");
  const starCtx = starfield?.getContext("2d");
  const themeButtons = [...document.querySelectorAll("[data-theme-choice]")];
  const featureStory = document.getElementById("featureScrollStory");
  const orbitRoot = document.getElementById("workspaceOrbits");

  function getThemeValue(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function applyTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("setupkit-theme", nextTheme);
    } catch {
      // The page still works if storage is blocked.
    }
    for (const button of themeButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === nextTheme));
    }
  }

  applyTheme(document.documentElement.dataset.theme || "light");

  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add("in-view"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => observer.observe(el));
  }

  function animateCounters() {
    for (const node of document.querySelectorAll("[data-count]")) {
      const target = Number(node.dataset.count || 0);
      const rect = node.getBoundingClientRect();
      if (node.dataset.done || rect.top > window.innerHeight) continue;
      node.dataset.done = "true";
      const started = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / 1100);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = String(Math.round(target * eased));
        if (progress < 1 && !reduceMotion) requestAnimationFrame(tick);
        else node.textContent = String(target);
      };
      requestAnimationFrame(tick);
    }
  }

  function updateTimeline() {
    if (!timeline || !timelineProgress) return;
    const rect = timeline.getBoundingClientRect();
    const total = rect.height + window.innerHeight;
    const visible = window.innerHeight - rect.top;
    const progress = Math.max(0, Math.min(100, (visible / total) * 130));
    timeline.style.setProperty("--progress", progress.toFixed(2));
  }

  function updateFeatureStory() {
    if (!featureStory) return;
    if (window.innerWidth <= 900 || reduceMotion) {
      featureStory.style.setProperty("--story-progress", "1");
      featureStory.style.setProperty("--story-inverse", "0");
      featureStory.style.setProperty("--slot-1", "1");
      featureStory.style.setProperty("--slot-2", "1");
      featureStory.style.setProperty("--slot-3", "1");
      featureStory.classList.add("is-second");
      return;
    }
    const rect = featureStory.getBoundingClientRect();
    const stickyNode = featureStory.querySelector(".feature-sticky");
    const stickyTop = stickyNode
      ? Number.parseFloat(getComputedStyle(stickyNode).top)
      : Math.min(96, window.innerHeight * 0.11);
    const stickyHeight = stickyNode?.offsetHeight || window.innerHeight * 0.74;
    const distance = Math.max(1, rect.height - stickyHeight);
    const raw = (stickyTop - rect.top) / distance;
    const progress = Math.max(0, Math.min(1, raw));
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const slotEase = (start, end) => {
      const value = Math.max(0, Math.min(1, (progress - start) / (end - start)));
      return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
    };
    featureStory.style.setProperty("--story-progress", eased.toFixed(4));
    featureStory.style.setProperty("--story-inverse", (1 - eased).toFixed(4));
    featureStory.style.setProperty("--slot-1", slotEase(0.08, 0.28).toFixed(4));
    featureStory.style.setProperty("--slot-2", slotEase(0.34, 0.54).toFixed(4));
    featureStory.style.setProperty("--slot-3", slotEase(0.6, 0.8).toFixed(4));
    featureStory.classList.toggle("is-second", eased > 0.5);
  }

  const orbitSections = [
    { selector: ".hero-section", focus: "developer" },
    { selector: ".feature-section", focus: "developer" },
    { selector: ".showcase-section", focus: "office" },
    { selector: ".updates-section", focus: "design" },
    { selector: ".timeline-section", focus: "gaming" },
    { selector: ".download-section", focus: "developer" }
  ].map((item) => ({ ...item, node: document.querySelector(item.selector) })).filter((item) => item.node);

  function setOrbitFocus(focus) {
    if (!orbitRoot || !focus) return;
    orbitRoot.dataset.focus = focus;
  }

  function updateOrbitFocus() {
    if (!orbitRoot || orbitRoot.dataset.pinnedFocus) return;
    const anchor = window.innerHeight * 0.46;
    let best = orbitSections[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of orbitSections) {
      const rect = item.node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      const distance = visible ? Math.abs(center - anchor) : Math.abs(rect.top - anchor) + window.innerHeight;
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    setOrbitFocus(best?.focus || "developer");
  }

  function updateStarsSize() {
    if (!starfield || !starCtx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    starfield.width = Math.floor(window.innerWidth * dpr);
    starfield.height = Math.floor(window.innerHeight * dpr);
    starfield.style.width = `${window.innerWidth}px`;
    starfield.style.height = `${window.innerHeight}px`;
    starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const stars = Array.from({ length: reduceMotion ? 60 : 180 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.4 + Math.random() * 1.6,
    speed: 0.08 + Math.random() * 0.28,
    alpha: 0.18 + Math.random() * 0.62
  }));

  function drawStars() {
    if (!starCtx) return;
    const starColor = getThemeValue("--star-color") || "#17362d";
    starCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const star of stars) {
      star.y += star.speed / window.innerHeight;
      if (star.y > 1.05) {
        star.y = -0.05;
        star.x = Math.random();
      }
      starCtx.globalAlpha = star.alpha;
      starCtx.fillStyle = starColor;
      starCtx.beginPath();
      starCtx.arc(star.x * window.innerWidth, star.y * window.innerHeight, star.size, 0, Math.PI * 2);
      starCtx.fill();
    }
    starCtx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(drawStars);
  }

  document.addEventListener("pointermove", (event) => {
    if (!cursorOrb || reduceMotion) return;
    cursorOrb.style.transform = `translate3d(${event.clientX - 180}px, ${event.clientY - 180}px, 0)`;
  }, { passive: true });

  function playTapRipple(target, point) {
    if (reduceMotion) return;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const ripple = document.createElement("span");
    ripple.className = "tap-ripple";
    ripple.style.setProperty("--ripple-size", `${size}px`);
    ripple.style.setProperty("--ripple-x", `${(point?.clientX ?? rect.left + rect.width / 2) - rect.left}px`);
    ripple.style.setProperty("--ripple-y", `${(point?.clientY ?? rect.top + rect.height / 2) - rect.top}px`);
    target.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  for (const action of document.querySelectorAll(".button, .header-cta, .site-nav a, .theme-switch button")) {
    action.addEventListener("pointerdown", (event) => {
      playTapRipple(action, event);
    });
    action.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") playTapRipple(action);
    });
  }

  for (const card of document.querySelectorAll(".feature-card")) {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }, { passive: true });
  }

  for (const button of document.querySelectorAll(".magnetic")) {
    button.addEventListener("pointermove", (event) => {
      if (reduceMotion) return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
      button.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  }

  for (const button of themeButtons) {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.themeChoice);
      if (reduceMotion) drawStars();
    });
  }

  for (const item of document.querySelectorAll("[data-orbit-focus]")) {
    item.addEventListener("pointerenter", () => {
      if (!orbitRoot) return;
      orbitRoot.dataset.pinnedFocus = item.dataset.orbitFocus;
      setOrbitFocus(item.dataset.orbitFocus);
    });
    item.addEventListener("pointerleave", () => {
      if (!orbitRoot) return;
      delete orbitRoot.dataset.pinnedFocus;
      updateOrbitFocus();
    });
  }

  window.addEventListener("scroll", () => {
    animateCounters();
    updateTimeline();
    updateFeatureStory();
    updateOrbitFocus();
  }, { passive: true });

  window.addEventListener("resize", () => {
    updateStarsSize();
    updateTimeline();
    updateFeatureStory();
    updateOrbitFocus();
  });

  updateStarsSize();
  animateCounters();
  updateTimeline();
  updateFeatureStory();
  updateOrbitFocus();
  drawStars();
})();
