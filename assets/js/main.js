// =========================================================
// IVA INFRASTRUCTURE — shared site script
// =========================================================
document.addEventListener('DOMContentLoaded', () => {

  // Header scroll state
  const header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // Mobile Menu Toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  // Count-up stats
  const counters = document.querySelectorAll('.num[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          let cur = 0;
          const step = Math.max(1, Math.round(target / 40));
          const tick = () => {
            cur += step;
            if (cur >= target) { el.textContent = target; return; }
            el.textContent = cur;
            requestAnimationFrame(tick);
          };
          tick();
          cio.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  }

  // Testimonial carousel (supports multiple tracks per page)
  document.querySelectorAll('[data-testi-track]').forEach(track => {
    const wrap = track.closest('section') || document;
    const prevBtn = wrap.querySelector('[data-testi-prev]');
    const nextBtn = wrap.querySelector('[data-testi-next]');
    const cards = track.children;
    let index = 0;
    function cardWidth() { return cards[0].getBoundingClientRect().width + 26; }
    function update() { track.style.transform = `translateX(-${index * cardWidth()}px)`; }
    if (nextBtn) nextBtn.addEventListener('click', () => { index = (index + 1) % cards.length; update(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { index = (index - 1 + cards.length) % cards.length; update(); });
    window.addEventListener('resize', update);
  });

  // Mobile burger nav
  const burger = document.querySelector('.burger');
  const navlist = document.querySelector('.navlist');
  if (burger && navlist) {
    burger.addEventListener('click', () => {
      const open = navlist.style.display === 'flex';
      navlist.style.cssText = open ? '' :
        'display:flex;position:fixed;top:70px;left:0;right:0;background:var(--paper);flex-direction:column;padding:2rem 6vw;gap:1.4rem;box-shadow:0 10px 30px rgba(0,0,0,.1);z-index:150;';
    });
  }

  // Simple contact form handler (front-end only — wire to backend/email service on deploy)
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Message Sent';
      btn.disabled = true;
      form.reset();
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 3000);
    });
  }

  // Initialize StarBorder animated orbiting light borders on buttons
  const starBorderEls = document.querySelectorAll('.btn-primary, .nav-cta, .star-border, [data-star-border]');
  if (starBorderEls.length && typeof StarBorder !== 'undefined') {
    starBorderEls.forEach(el => {
      new StarBorder(el);
    });
  }

  // Initialize SplitText character/word stagger animations
  const splitTextEls = document.querySelectorAll('.split-text, [data-split-text]');
  if (splitTextEls.length && typeof SplitText !== 'undefined') {
    splitTextEls.forEach(el => {
      new SplitText(el);
    });
  }

  // Initialize LightRays WebGL backgrounds
  const lightRaysEls = document.querySelectorAll('.side-rays-container, [data-side-rays], [data-light-rays]');
  if (lightRaysEls.length && typeof LightRays !== 'undefined') {
    lightRaysEls.forEach(el => {
      new LightRays(el);
    });
  }

  // Initialize BorderGlow edge proximity tracking on cards
  const borderGlowCards = document.querySelectorAll('.border-glow-card, [data-border-glow]');
  if (borderGlowCards.length && typeof BorderGlow !== 'undefined') {
    borderGlowCards.forEach(card => {
      new BorderGlow(card);
    });
  }

  // Initialize SpotlightCard radial mouse tracking on cards
  const spotlightCards = document.querySelectorAll('.card-spotlight');
  if (spotlightCards.length && typeof SpotlightCard !== 'undefined') {
    spotlightCards.forEach(card => {
      new SpotlightCard(card);
    });
  }

  // Initialize Beams 3D backgrounds
  const beamsEls = document.querySelectorAll('.beams-container, [data-beams]');
  if (beamsEls.length && typeof Beams !== 'undefined') {
    beamsEls.forEach(el => {
      new Beams(el);
    });
  }

  // Initialize Aurora WebGL backgrounds
  const auroras = document.querySelectorAll('.aurora-container, [data-aurora]');
  if (auroras.length && typeof Aurora !== 'undefined') {
    auroras.forEach(el => {
      new Aurora(el);
    });
  }

  // Initialize ShapeGrid canvas backgrounds
  const shapeGrids = document.querySelectorAll('.shapegrid-canvas');
  if (shapeGrids.length && typeof ShapeGrid !== 'undefined') {
    shapeGrids.forEach(canvas => {
      new ShapeGrid(canvas);
    });
  }

  // Interactive ShapeGrid pattern selector
  const shapeBtns = document.querySelectorAll('[data-shape-btn]');
  if (shapeBtns.length) {
    shapeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        shapeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const selectedShape = btn.getAttribute('data-shape-btn');
        const heroCanvas = document.querySelector('.hero .shapegrid-canvas');
        if (heroCanvas) {
          if (heroCanvas._shapeGridInstance) {
            heroCanvas._shapeGridInstance.destroy();
          }
          heroCanvas.dataset.shape = selectedShape;
          new ShapeGrid(heroCanvas);
        }
      });
    });
  }

  // Initialize ModelViewer 3D building containers
  const modelViewerEls = document.querySelectorAll('.model-viewer-box, [data-model-viewer]');
  if (modelViewerEls.length && typeof ModelViewer !== 'undefined') {
    modelViewerEls.forEach(el => {
      new ModelViewer(el);
    });
  }

});
