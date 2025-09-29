(() => {
  const nav    = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const drawer = document.getElementById('nav-drawer');
  if (!nav || !toggle || !drawer) return;

  const open = () => {
    drawer.classList.add('is-open');
    toggle.classList.add('is-open');          // ← activa la cruz
    nav.classList.add('is-overlay');
    toggle.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    drawer.classList.remove('is-open');
    toggle.classList.remove('is-open');       // ← vuelve a hamburguesa
    nav.classList.remove('is-overlay');
    toggle.setAttribute('aria-expanded', 'false');
  };

  // Un solo listener para alternar
  toggle.addEventListener('click', () => {
    drawer.classList.contains('is-open') ? close() : open();
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !toggle.contains(e.target) && drawer.classList.contains('is-open')) {
      close();
    }
  });

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });

  // Cerrar al clicar un link del menú
  drawer.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) close();
  });
})();


// Carrusel móvil para .pillars__gallery (puntitos + autoplay cada 6s) — SIN saltos de página
(function () {
  const MOBILE_BP = 520;           // px
  const AUTOPLAY_MS = 6000;        // 6s
  const gallerySel = ".pillars__gallery";
  const dotsSel = ".pillars__dots";

  let mql = window.matchMedia(`(max-width:${MOBILE_BP}px)`);
  let gallery, slides, dotsBox;
  let cleanupFns = [];
  let autoplayId = null;
  let resumeTimeout = null;

  // Visibilidad de la sección (para evitar scroll de página cuando no se ve)
  const pillarsSection = document.getElementById("pillars");
  let isPillarsVisible = false;
  const io = new IntersectionObserver(
    (entries) => { isPillarsVisible = entries[0]?.isIntersecting || false; },
    { threshold: 0.6 }
  );
  if (pillarsSection) io.observe(pillarsSection);

  // --- Utils ---
  function centeredIndex() {
    const winCenter = window.innerWidth / 2;
    let best = { idx: 0, dist: Infinity };
    slides.forEach((el, idx) => {
      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2;
      const d = Math.abs(center - winCenter);
      if (d < best.dist) best = { idx, dist: d };
    });
    return best.idx;
  }

  function updateDots() {
    if (!gallery || !dotsBox) return;
    const idx = centeredIndex();
    Array.from(dotsBox.children).forEach((btn, j) =>
      btn.setAttribute("aria-current", j === idx ? "true" : "false")
    );
  }

  // Avance horizontal SIN scrollIntoView (para no mover el documento)
  function scrollToSlide(i) {
    if (!gallery || !slides[i]) return;
    const slide = slides[i];
    const slideRect = slide.getBoundingClientRect();
    const galleryRect = gallery.getBoundingClientRect();
    const slideCenter = slideRect.left + slideRect.width / 2;
    const galleryCenter = galleryRect.left + galleryRect.width / 2;
    const delta = slideCenter - galleryCenter;
    gallery.scrollTo({
      left: gallery.scrollLeft + delta,
      behavior: "smooth",
    });
  }

  function startAutoplay() {
    stopAutoplay();
    if (!slides || slides.length < 2) return;
    autoplayId = setInterval(() => {
      // Solo en móvil, con la pestaña visible y la sección en vista
      if (!mql.matches || document.hidden || !isPillarsVisible) return;
      const idx = centeredIndex();
      const next = (idx + 1) % slides.length;
      scrollToSlide(next);
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayId) clearInterval(autoplayId);
    autoplayId = null;
    if (resumeTimeout) clearTimeout(resumeTimeout);
    resumeTimeout = null;
  }

  function pauseThenResume(delayMs = 3000) {
    stopAutoplay();
    resumeTimeout = setTimeout(startAutoplay, delayMs);
  }

  // ---------- Setup / Teardown ----------
  function setupCarousel() {
    gallery = document.querySelector(gallerySel);
    dotsBox = document.querySelector(dotsSel);
    if (!gallery || !dotsBox) return;

    slides = Array.from(gallery.children);
    if (!slides.length) return;

    // Evitar duplicados de puntos
    if (dotsBox.dataset.bound === "true") return;
    dotsBox.dataset.bound = "true";

    // Crear puntos
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Ir al slide ${i + 1}`);
      b.addEventListener("click", () => {
        scrollToSlide(i);
        pauseThenResume(); // pausa breve al navegar manualmente
      });
      dotsBox.appendChild(b);
      cleanupFns.push(() => b.remove());
    });

    // Scroll listener (con rAF)
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateDots();
          ticking = false;
        });
        ticking = true;
      }
    };
    gallery.addEventListener("scroll", onScroll, { passive: true });
    cleanupFns.push(() => gallery.removeEventListener("scroll", onScroll));

    // Pausar por interacción táctil/arrastre/rueda
    const pauseEvents = ["touchstart", "mousedown", "pointerdown", "wheel"];
    const resumeEvents = ["touchend", "mouseup", "pointerup"];
    const onPause = () => pauseThenResume();
    pauseEvents.forEach(ev => gallery.addEventListener(ev, onPause, { passive: true }));
    resumeEvents.forEach(ev => gallery.addEventListener(ev, onPause, { passive: true }));
    cleanupFns.push(() => {
      pauseEvents.forEach(ev => gallery.removeEventListener(ev, onPause));
      resumeEvents.forEach(ev => gallery.removeEventListener(ev, onPause));
    });

    // Pestaña oculta → pausar
    const onVis = () => (document.hidden ? stopAutoplay() : startAutoplay());
    document.addEventListener("visibilitychange", onVis);
    cleanupFns.push(() => document.removeEventListener("visibilitychange", onVis));

    // Resize → recalcular puntos
    const onResize = () => updateDots();
    window.addEventListener("resize", onResize);
    cleanupFns.push(() => window.removeEventListener("resize", onResize));

    updateDots();
    startAutoplay(); // 🔥 activa autoplay sin saltos
  }

  function teardownCarousel() {
    stopAutoplay();
    if (!dotsBox) dotsBox = document.querySelector(dotsSel);
    cleanupFns.forEach((fn) => { try { fn(); } catch(_){} });
    cleanupFns = [];
    if (dotsBox) {
      dotsBox.innerHTML = "";
      dotsBox.dataset.bound = "false";
    }
  }

  function handleMQ(e) {
    if (e.matches) setupCarousel();
    else teardownCarousel();
  }

  // Inicial
  document.addEventListener("DOMContentLoaded", () => {
    handleMQ(mql);
  });

  // Reaccionar a cambios de tamaño
  if (mql.addEventListener) mql.addEventListener("change", handleMQ);
  else mql.addListener(handleMQ); // Safari viejo
})();


// Carrusel Testimonios: avanzar por "página"
(() => {
  const track   = document.querySelector('.testimonials__track');
  const slides  = Array.from(document.querySelectorAll('.testimonial'));
  const prevBtn = document.querySelector('.testimonials__prev');
  const nextBtn = document.querySelector('.testimonials__next');
  if (!track || !slides.length || !prevBtn || !nextBtn) return;

  // 2 visibles en desktop, 1 en móvil
  const mq = window.matchMedia('(max-width:700px)');
  const getVisible = () => (mq.matches ? 1 : 2);

  let index = 0;

  // ancho real del slide + márgenes
  const stepPx = () => {
    const w  = slides[0].getBoundingClientRect().width;
    const cs = getComputedStyle(slides[0]);
    const margin = parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
    return w + margin;
  };

  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  function snapToPage() {
    const vis = getVisible();
    index = Math.floor(index / vis) * vis;  // alinea al inicio de la "página"
  }

  function update() {
    const max = Math.max(0, slides.length - getVisible());
    index = clamp(index, 0, max);
    track.style.transform = `translateX(-${index * stepPx()}px)`;
  }

  function next() { index += getVisible(); update(); }   // ← avanza de a 2 (o 1 en móvil)
  function prev() { index -= getVisible(); update(); }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // Recalcular al cambiar de tamaño/breakpoint
  window.addEventListener('resize', () => { snapToPage(); update(); });
  mq.addEventListener?.('change', () => { snapToPage(); update(); });

  update();
})();
