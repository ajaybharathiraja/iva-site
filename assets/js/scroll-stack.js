/**
 * ScrollStack - Stacked Cards Scroll Component (React Bits Variant)
 * Ported from React Bits (JavaScript + CSS + Lenis variant)
 * Renders sticky stacked cards with smooth scale, rotation, and translation effects
 */
class ScrollStack {
  constructor(container, options = {}) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container || container._scrollStackInitialized) return;
    container._scrollStackInitialized = true;

    this.container = container;
    const ds = container.dataset || {};

    this.itemDistance = ds.itemDistance ? parseFloat(ds.itemDistance) : (options.itemDistance || 100);
    this.itemScale = ds.itemScale ? parseFloat(ds.itemScale) : (options.itemScale || 0.03);
    this.itemStackDistance = ds.itemStackDistance ? parseFloat(ds.itemStackDistance) : (options.itemStackDistance || 30);
    this.stackPosition = ds.stackPosition || options.stackPosition || '20%';
    this.scaleEndPosition = ds.scaleEndPosition || options.scaleEndPosition || '10%';
    this.baseScale = ds.baseScale ? parseFloat(ds.baseScale) : (options.baseScale || 0.85);
    this.rotationAmount = ds.rotationAmount ? parseFloat(ds.rotationAmount) : (options.rotationAmount || 0);
    this.blurAmount = ds.blurAmount ? parseFloat(ds.blurAmount) : (options.blurAmount || 0);
    this.useWindowScroll = ds.useWindowScroll !== undefined ? ds.useWindowScroll === 'true' : (options.useWindowScroll !== undefined ? options.useWindowScroll : true);

    this.cards = Array.from(this.container.querySelectorAll('.scroll-stack-card'));
    this.lastTransforms = new Map();
    this.isUpdating = false;

    this.init();
  }

  calculateProgress(scrollTop, start, end) {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }

  parsePercentage(value, containerHeight) {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value);
  }

  getScrollData() {
    if (this.useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight
      };
    } else {
      return {
        scrollTop: this.container.scrollTop,
        containerHeight: this.container.clientHeight
      };
    }
  }

  getElementOffset(element) {
    if (this.useWindowScroll) {
      const rect = element.getBoundingClientRect();
      return rect.top + window.scrollY;
    } else {
      return element.offsetTop;
    }
  }

  updateCardTransforms() {
    if (!this.cards.length || this.isUpdating) return;
    this.isUpdating = true;

    const { scrollTop, containerHeight } = this.getScrollData();
    const stackPositionPx = this.parsePercentage(this.stackPosition, containerHeight);
    const scaleEndPositionPx = this.parsePercentage(this.scaleEndPosition, containerHeight);

    const endElement = this.container.querySelector('.scroll-stack-end') || this.container;
    const endElementTop = this.getElementOffset(endElement);

    this.cards.forEach((card, i) => {
      if (!card) return;

      const cardTop = this.getElementOffset(card);
      const triggerStart = cardTop - stackPositionPx - this.itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - this.itemStackDistance * i;
      const pinEnd = endElementTop - containerHeight / 2;

      const scaleProgress = this.calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = this.baseScale + i * this.itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = this.rotationAmount ? i * this.rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (this.blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < this.cards.length; j++) {
          const jCardTop = this.getElementOffset(this.cards[j]);
          const jTriggerStart = jCardTop - stackPositionPx - this.itemStackDistance * j;
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j;
          }
        }
        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i;
          blur = Math.max(0, depthInStack * this.blurAmount);
        }
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + this.itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + this.itemStackDistance * i;
      }

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100
      };

      const lastTransform = this.lastTransforms.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1;

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

        card.style.transform = transform;
        card.style.filter = filter;

        this.lastTransforms.set(i, newTransform);
      }
    });

    this.isUpdating = false;
  }

  init() {
    this.cards.forEach((card, i) => {
      if (i < this.cards.length - 1) {
        card.style.marginBottom = `${this.itemDistance}px`;
      }
      card.style.willChange = 'transform, filter';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
    });

    const onScroll = () => this.updateCardTransforms();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial update
    this.updateCardTransforms();
  }
}

if (typeof window !== 'undefined') {
  window.ScrollStack = ScrollStack;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-scroll-stack]').forEach(el => {
      new ScrollStack(el);
    });
  });
}
