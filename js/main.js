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
      links = Array.from(link.closest(".photos-grid").querySelectorAll(".photo-link"));
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
})();
