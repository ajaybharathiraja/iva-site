// card-swap.js
// Vanilla JS equivalent of React Bits CardSwap component

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.sig-right');
  if (!container || typeof gsap === 'undefined') return;

  const cards = Array.from(container.querySelectorAll('.photo-card'));
  if (cards.length === 0) return;

  const config = {
    cardDistance: 48,
    verticalDistance: 32,
    delay: 5000,
    skewAmount: 4,
    ease: 'elastic.out(0.6,0.9)',
    durDrop: 2,
    durMove: 2,
    durReturn: 2,
    promoteOverlap: 0.9,
    returnDelay: 0.05
  };

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
  let tlRef = null;
  let intervalRef = null;

  // Initialize positions
  cards.forEach((el, i) => {
    placeNow(el, makeSlot(i, config.cardDistance, config.verticalDistance, cards.length), config.skewAmount);
  });

  const swap = () => {
    if (order.length < 2) return;

    const [front, ...rest] = order;
    const elFront = cards[front];
    const tl = gsap.timeline();
    tlRef = tl;

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

  // Start the cycle
  setTimeout(() => {
    swap();
    intervalRef = setInterval(swap, config.delay);
  }, 1000);
});
