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

  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  if (menuToggle && siteNav) {
    siteNav.hidden = true;
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      siteNav.hidden = open;
    });
  }

  const viewer = document.getElementById("lightbox");
  const photo = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  let links = [];
  let current = 0;
  let trigger;

  if (menuToggle && siteNav) {
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !siteNav.hidden && (!viewer || !viewer.open)) {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.hidden = true;
        menuToggle.focus();
      }
    });
  }

  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    photo.src = link.href;
    photo.alt = link.querySelector("img").alt;
    if (link.closest(".slides")) {
      caption.textContent = "";
      caption.hidden = true;
      return;
    }
    caption.hidden = false;
    caption.textContent = photo.alt;
    if (link.dataset.pa) {
      const translation = document.createElement("span");
      translation.className = "pa";
      translation.lang = "pa";
      translation.textContent = link.dataset.pa;
      caption.append(translation);
    }
  }
  document.querySelectorAll(".photo-link").forEach(link => {
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !viewer.showModal) return;
      event.preventDefault();
      trigger = link;
      const group = link.closest(".slides, .handout-pages");
      links = group ? Array.from(group.querySelectorAll(".photo-link")) : [link];
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
    const prev = slideshow.querySelector(".slideshow-prev");
    const next = slideshow.querySelector(".slideshow-next");
    const counter = slideshow.querySelector(".slideshow-counter");
    if (slides.length <= 1) {
      if (slides[0]) slides[0].classList.add("is-active");
      if (prev) prev.hidden = true;
      if (next) next.hidden = true;
      if (counter) counter.hidden = true;
      return;
    }

    let index = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));
    let timer = 0;
    let mouseInside = false;
    let inView = true;
    let focused = slideshow.contains(document.activeElement);

    function goTo(target) {
      slides[index].classList.remove("is-active");
      index = (target + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      slides.forEach((slide, position) => {
        slide.setAttribute("aria-hidden", String(position !== index));
        slide.inert = position !== index;
      });
      if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    }

    function stopTimer() {
      if (!timer) return;
      clearInterval(timer);
      timer = 0;
    }

    function canAutoplay() {
      return mouseInside && inView && !focused && !reducedMotion.matches && !viewer.open && slideshow.matches(":hover");
    }

    function startTimer() {
      stopTimer();
      if (!canAutoplay()) return;
      timer = setInterval(() => {
        if (!canAutoplay()) {
          if (!slideshow.matches(":hover")) mouseInside = false;
          stopTimer();
          return;
        }
        goTo(index + 1);
      }, 3000);
    }

    function checkHover() {
      if (!slideshow.matches(":hover")) {
        mouseInside = false;
        stopTimer();
      }
    }

    if (prev) prev.hidden = false;
    if (next) next.hidden = false;
    goTo(index);
    if (prev) prev.addEventListener("click", () => goTo(index - 1));
    if (next) next.addEventListener("click", () => goTo(index + 1));
    slideshow.addEventListener("pointerenter", event => {
      if (event.pointerType !== "mouse") return;
      mouseInside = true;
      startTimer();
    });
    slideshow.addEventListener("pointerdown", event => {
      if (event.pointerType !== "mouse") {
        mouseInside = false;
        stopTimer();
      }
    });
    slideshow.addEventListener("pointerleave", () => {
      mouseInside = false;
      stopTimer();
    });
    slideshow.addEventListener("focusin", () => {
      focused = true;
      stopTimer();
    });
    slideshow.addEventListener("focusout", event => {
      if (!slideshow.contains(event.relatedTarget)) {
        focused = false;
        if (slideshow.matches(":hover")) startTimer();
      }
    });
    window.addEventListener("scroll", checkHover, { passive: true });
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          inView = entry.isIntersecting;
          if (!inView) {
            mouseInside = false;
            stopTimer();
          }
        });
      }, { threshold: 0 });
      observer.observe(slideshow);
    }
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) stopTimer();
      else if (slideshow.matches(":hover")) startTimer();
    });
    viewer.addEventListener("close", () => {
      if (slideshow.matches(":hover")) startTimer();
    });
  });
})();
