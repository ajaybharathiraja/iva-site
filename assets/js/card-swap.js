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
      ease: 'elastic.out(0.6,0.9)',
      durDrop: 1.8,
      durMove: 1.8,
      durReturn: 1.8,
      promoteOverlap: 0.9,
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

    cards.forEach((el, i) => {
      placeNow(el, makeSlot(i, config.cardDistance, config.verticalDistance, cards.length), config.skewAmount);
    });

    const swap = () => {
      if (order.length < 2) return;

      const [front, ...rest] = order;
      const elFront = cards[front];
      const tl = gsap.timeline();

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
        }, `promote+=${i * 0.15}`);
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

      tl.call(() => {
        order = [...rest, front];
      });
    };

    let intervalRef = setInterval(swap, config.delay);

    const nextBtn = document.getElementById('project-swap-btn');
    if (nextBtn && selector === '#project-card-swap') {
      nextBtn.addEventListener('click', () => {
        clearInterval(intervalRef);
        swap();
        intervalRef = setInterval(swap, config.delay);
      });
    }
  }

  // Init for Signature Touch
  setupCardSwap('.sig-right', '.photo-card');

  // Carousel controls for Projects Track
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
