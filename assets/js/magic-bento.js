document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_PARTICLE_COUNT = 12;
  const DEFAULT_SPOTLIGHT_RADIUS = 300;
  const DEFAULT_GLOW_COLOR = '201, 162, 39'; // Gold
  const MOBILE_BREAKPOINT = 768;

  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

  // Particle creation utility
  const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
    const el = document.createElement('div');
    el.className = 'particle';
    el.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(${color}, 1);
      box-shadow: 0 0 6px rgba(${color}, 0.6);
      pointer-events: none;
      z-index: 100;
      left: ${x}px;
      top: ${y}px;
    `;
    return el;
  };

  const calculateSpotlightValues = radius => ({
    proximity: radius * 0.5,
    fadeDistance: radius * 0.75
  });

  const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
    const rect = card.getBoundingClientRect();
    const relativeX = ((mouseX - rect.left) / rect.width) * 100;
    const relativeY = ((mouseY - rect.top) / rect.height) * 100;

    card.style.setProperty('--glow-x', `${relativeX}%`);
    card.style.setProperty('--glow-y', `${relativeY}%`);
    card.style.setProperty('--glow-intensity', glow.toString());
    card.style.setProperty('--glow-radius', `${radius}px`);
  };

  // --- Global Spotlight ---
  class GlobalSpotlight {
    constructor(gridEl) {
      this.gridEl = gridEl;
      this.spotlightEl = null;
      this.init();
    }

    init() {
      if (isMobile() || !this.gridEl) return;

      this.spotlightEl = document.createElement('div');
      this.spotlightEl.className = 'global-spotlight';
      this.spotlightEl.style.cssText = `
        position: fixed;
        width: 800px;
        height: 800px;
        border-radius: 50%;
        pointer-events: none;
        background: radial-gradient(circle,
          rgba(${DEFAULT_GLOW_COLOR}, 0.15) 0%,
          rgba(${DEFAULT_GLOW_COLOR}, 0.08) 15%,
          rgba(${DEFAULT_GLOW_COLOR}, 0.04) 25%,
          rgba(${DEFAULT_GLOW_COLOR}, 0.02) 40%,
          rgba(${DEFAULT_GLOW_COLOR}, 0.01) 65%,
          transparent 70%
        );
        z-index: 200;
        opacity: 0;
        transform: translate(-50%, -50%);
        mix-blend-mode: screen;
      `;
      document.body.appendChild(this.spotlightEl);

      document.addEventListener('mousemove', this.handleMouseMove.bind(this));
      document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    handleMouseMove(e) {
      if (!this.spotlightEl || !this.gridEl) return;

      const section = this.gridEl.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      const cards = this.gridEl.querySelectorAll('.magic-bento-card');

      if (!mouseInside) {
        gsap.to(this.spotlightEl, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(DEFAULT_SPOTLIGHT_RADIUS);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, DEFAULT_SPOTLIGHT_RADIUS);
      });

      gsap.to(this.spotlightEl, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
      gsap.to(this.spotlightEl, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    }

    handleMouseLeave() {
      this.gridEl?.querySelectorAll('.magic-bento-card').forEach(card => card.style.setProperty('--glow-intensity', '0'));
      if (this.spotlightEl) {
        gsap.to(this.spotlightEl, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      }
    }
  }

  // --- Particle Card ---
  class ParticleCard {
    constructor(cardEl) {
      this.cardEl = cardEl;
      this.particles = [];
      this.timeouts = [];
      this.isHovered = false;
      this.magnetismAnimation = null;
      this.memoizedParticles = [];
      this.particlesInitialized = false;

      this.initEvents();
    }

    initializeParticles() {
      if (this.particlesInitialized || !this.cardEl) return;
      const { width, height } = this.cardEl.getBoundingClientRect();
      this.memoizedParticles = Array.from({ length: DEFAULT_PARTICLE_COUNT }, () =>
        createParticleElement(Math.random() * width, Math.random() * height, DEFAULT_GLOW_COLOR)
      );
      this.particlesInitialized = true;
    }

    clearAllParticles() {
      this.timeouts.forEach(clearTimeout);
      this.timeouts = [];
      if (this.magnetismAnimation) this.magnetismAnimation.kill();

      this.particles.forEach(particle => {
        gsap.to(particle, {
          scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)',
          onComplete: () => particle.parentNode?.removeChild(particle)
        });
      });
      this.particles = [];
    }

    animateParticles() {
      if (!this.cardEl || !this.isHovered) return;
      if (!this.particlesInitialized) this.initializeParticles();

      this.memoizedParticles.forEach((particle, index) => {
        const timeoutId = setTimeout(() => {
          if (!this.isHovered || !this.cardEl) return;

          const clone = particle.cloneNode(true);
          this.cardEl.appendChild(clone);
          this.particles.push(clone);

          gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

          gsap.to(clone, {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: 'none',
            repeat: -1,
            yoyo: true
          });

          gsap.to(clone, {
            opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true
          });
        }, index * 100);
        this.timeouts.push(timeoutId);
      });
    }

    initEvents() {
      if (isMobile()) return;

      this.cardEl.addEventListener('mouseenter', () => {
        this.isHovered = true;
        this.animateParticles();
        gsap.to(this.cardEl, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
      });

      this.cardEl.addEventListener('mouseleave', () => {
        this.isHovered = false;
        this.clearAllParticles();
        gsap.to(this.cardEl, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
        gsap.to(this.cardEl, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      });

      this.cardEl.addEventListener('mousemove', e => {
        const rect = this.cardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        gsap.to(this.cardEl, { rotateX, rotateY, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });

        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        this.magnetismAnimation = gsap.to(this.cardEl, { x: magnetX, y: magnetY, duration: 0.3, ease: 'power2.out' });
      });

      this.cardEl.addEventListener('click', e => {
        const rect = this.cardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const maxDistance = Math.max(
          Math.hypot(x, y), Math.hypot(x - rect.width, y),
          Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height)
        );

        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          width: ${maxDistance * 2}px;
          height: ${maxDistance * 2}px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(${DEFAULT_GLOW_COLOR}, 0.4) 0%, rgba(${DEFAULT_GLOW_COLOR}, 0.2) 30%, transparent 70%);
          left: ${x - maxDistance}px;
          top: ${y - maxDistance}px;
          pointer-events: none;
          z-index: 1000;
        `;
        this.cardEl.appendChild(ripple);

        gsap.fromTo(ripple, { scale: 0, opacity: 1 }, {
          scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out',
          onComplete: () => ripple.remove()
        });
      });
    }
  }

  // Initialize
  const grid = document.querySelector('.bento-section');
  if (grid && window.gsap) {
    new GlobalSpotlight(grid);
    grid.querySelectorAll('.magic-bento-card').forEach(card => new ParticleCard(card));
  }
});
