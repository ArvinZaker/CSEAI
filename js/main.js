(() => {
  const links = Array.from(document.querySelectorAll(".photo-link"));
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  if (!links.length || !lightbox || !lightboxImg || !lightboxCaption) {
    return;
  }

  const background = Array.from(document.body.children).filter(el =>
    el !== lightbox && el.tagName !== "SCRIPT"
  );
  let currentIndex = 0;
  let lastFocused = null;
  const focusables = [closeBtn, prevBtn, nextBtn].filter(Boolean);

  function showPhoto(index) {
    currentIndex = (index + links.length) % links.length;
    const link = links[currentIndex];
    const thumb = link.querySelector("img");
    const altText = thumb ? thumb.alt : `Construction site photo ${currentIndex + 1}`;
    lightboxImg.src = link.getAttribute("href");
    lightboxImg.alt = altText;
    lightboxCaption.textContent = `${altText} (${currentIndex + 1} / ${links.length})`;
  }

  function openLightbox(index, trigger) {
    lastFocused = trigger;
    showPhoto(index);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    background.forEach(el => { el.inert = true; });
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    background.forEach(el => { el.inert = false; });
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  links.forEach((link, idx) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openLightbox(idx, link);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", () => showPhoto(currentIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => showPhoto(currentIndex + 1));
  }

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(currentIndex + 1);
    } else if (event.key === "Tab" && focusables.length) {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || !lightbox.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !lightbox.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
