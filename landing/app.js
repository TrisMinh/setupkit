(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = [...document.querySelectorAll(".reveal")];
  const timeline = document.getElementById("timeline");
  const timelineProgress = document.getElementById("timelineProgress");
  const cursorOrb = document.getElementById("cursorOrb");
  const starfield = document.getElementById("starfield");
  const starCtx = starfield?.getContext("2d");

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
    starCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const star of stars) {
      star.y += star.speed / window.innerHeight;
      if (star.y > 1.05) {
        star.y = -0.05;
        star.x = Math.random();
      }
      starCtx.globalAlpha = star.alpha;
      starCtx.fillStyle = "#ffffff";
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

  window.addEventListener("scroll", () => {
    animateCounters();
    updateTimeline();
  }, { passive: true });

  window.addEventListener("resize", () => {
    updateStarsSize();
    updateTimeline();
  });

  updateStarsSize();
  animateCounters();
  updateTimeline();
  drawStars();
})();
