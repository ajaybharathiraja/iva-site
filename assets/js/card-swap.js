// card-swap.js
// Reusable 3D CardSwap component powered by GSAP

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') return;

  function setupCardSwap(selector, cardSelector, customConfig = {}) {
    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll(cardSelector));
    if (cards.length === 0) return;

    const config = Object.assign({
      cardDistance: 48,
      verticalDistance: 32,
      delay: 4500,
      skewAmount: 4,
      ease: 'power2.out',
      durDrop: 1.2,
      durMove: 1.2,
      durReturn: 1.2,
      promoteOverlap: 0.85,
      returnDelay: 0.05
    }, customConfig);

    const makeSlot = (i, distX, distY, total) => ({
      x: i * distX,
      y: -i * distY,
      z: -i * distX * 1.5,
      zIndex: total - i
    });

    const placeNow = (el, slot, skew) => {
      gsap.set(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        xPercent: -50,
        yPercent: -50,
        skewY: skew,
        transformOrigin: 'center center',
        zIndex: slot.zIndex,
        force3D: true
      });
    };

    let order = Array.from({ length: cards.length }, (_, i) => i);
    let isAnimating = false;

    cards.forEach((el, i) => {
      placeNow(el, makeSlot(i, config.cardDistance, config.verticalDistance, cards.length), config.skewAmount);
    });

    const swap = () => {
      if (order.length < 2 || isAnimating) return;
      isAnimating = true;

      const [front, ...rest] = order;
      const elFront = cards[front];
      const tl = gsap.timeline({
        onComplete: () => {
          order = [...rest, front];
          isAnimating = false;
        }
      });

      tl.to(elFront, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      
      rest.forEach((idx, i) => {
        const el = cards[idx];
        const slot = makeSlot(i, config.cardDistance, config.verticalDistance, cards.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(el, {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: config.durMove,
          ease: config.ease
        }, `promote+=${i * 0.1}`);
      });

      const backSlot = makeSlot(cards.length - 1, config.cardDistance, config.verticalDistance, cards.length);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      
      tl.call(() => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      }, undefined, 'return');
      
      tl.to(elFront, {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: config.durReturn,
        ease: config.ease
      }, 'return');
    };

    let intervalRef = setInterval(swap, config.delay);

    const nextBtn = document.getElementById('project-swap-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnimating) return;
        clearInterval(intervalRef);
        swap();
        intervalRef = setInterval(swap, config.delay);
      });
    }
  }

  // Init for Signature Touch / Projects Showcase
  setupCardSwap('.sig-right', '.photo-card');

  // Carousel controls for Projects Track below
  const nextTrackBtn = document.getElementById('next-project-btn');
  const prevTrackBtn = document.getElementById('prev-project-btn');
  const track = document.getElementById('projects-track');

  if (nextTrackBtn && track) {
    nextTrackBtn.addEventListener('click', () => {
      const cards = track.querySelectorAll('.featured-project-card');
      if (cards.length > 1) {
        track.appendChild(cards[0]);
      }
    });
  }

  if (prevTrackBtn && track) {
    prevTrackBtn.addEventListener('click', () => {
      const cards = track.querySelectorAll('.featured-project-card');
      if (cards.length > 1) {
        track.insertBefore(cards[cards.length - 1], cards[0]);
      }
    });
  }
});
