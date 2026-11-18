(() => {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch { /* System preference remains available when storage is blocked. */ }

  function updateToggle() {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : preference.matches;
    toggle.setAttribute("aria-pressed", String(dark));
  }
  toggle.hidden = false;
  updateToggle();
  toggle.addEventListener("click", () => {
    const dark = toggle.getAttribute("aria-pressed") === "true";
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch { /* Keep the current choice. */ }
    updateToggle();
  });
  preference.addEventListener("change", updateToggle);

  const viewer = document.getElementById("lightbox");
  const photo = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  let links = [];
  let current = 0;
  let trigger;

  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    photo.src = link.href;
    photo.alt = link.querySelector("img").alt;
    caption.textContent = photo.alt;
  }
  document.querySelectorAll(".photo-link").forEach(link => {
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !viewer.showModal) return;
      event.preventDefault();
      trigger = link;
      links = Array.from(link.closest(".slides").querySelectorAll(".photo-link"));
      show(links.indexOf(link));
      viewer.showModal();
    });
  });
  document.getElementById("lightbox-prev").addEventListener("click", () => show(current - 1));
  document.getElementById("lightbox-next").addEventListener("click", () => show(current + 1));
  viewer.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      show(current + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });
  viewer.addEventListener("close", () => {
    photo.removeAttribute("src");
    if (trigger) trigger.focus();
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll(".slideshow").forEach(slideshow => {
    const slides = Array.from(slideshow.querySelectorAll(".slides > li"));
    const controls = slideshow.querySelector(".slideshow-controls");
    const prev = slideshow.querySelector(".slideshow-prev");
    const next = slideshow.querySelector(".slideshow-next");
    const counter = slideshow.querySelector(".slideshow-counter");
    if (slides.length <= 1) {
      if (slides[0]) slides[0].classList.add("is-active");
      if (controls) controls.hidden = true;
      return;
    }

    let index = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));
    let timer = 0;
    let hovered = slideshow.matches(":hover");
    let focused = slideshow.contains(document.activeElement);

    function goTo(target) {
      slides[index].classList.remove("is-active");
      index = (target + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    }

    function stopTimer() {
      if (!timer) return;
      clearInterval(timer);
      timer = 0;
    }

    function startTimer() {
      stopTimer();
      if (hovered || focused || reducedMotion.matches || viewer.open) return;
      timer = setInterval(() => {
        if (!viewer.open) goTo(index + 1);
      }, 5000);
    }

    if (controls) controls.hidden = false;
    goTo(index);
    prev.addEventListener("click", () => goTo(index - 1));
    next.addEventListener("click", () => goTo(index + 1));
    slideshow.addEventListener("pointerenter", () => { hovered = true; stopTimer(); });
    slideshow.addEventListener("pointerleave", () => { hovered = false; startTimer(); });
    slideshow.addEventListener("focusin", () => { focused = true; stopTimer(); });
    slideshow.addEventListener("focusout", event => {
      if (!slideshow.contains(event.relatedTarget)) {
        focused = false;
        startTimer();
      }
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) stopTimer();
      else startTimer();
    });
    viewer.addEventListener("close", startTimer);
    startTimer();
  });
})();
