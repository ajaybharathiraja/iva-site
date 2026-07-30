/**
 * SplitText - Staggered Character/Word Text Animation Component
 * Ported from React Bits (JavaScript + CSS + GSAP variant)
 * Preserves inner HTML structures (like <em>) while splitting into animated character/word spans
 */
class SplitText {
  constructor(element, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element || element._splitTextInitialized) return;
    element._splitTextInitialized = true;

    this.el = element;
    const ds = element.dataset || {};

    this.delay = ds.delay ? parseFloat(ds.delay) : (options.delay || 25);
    this.duration = ds.duration ? parseFloat(ds.duration) : (options.duration || 0.7);
    this.splitType = ds.splitType || options.splitType || 'chars';
    this.threshold = ds.threshold ? parseFloat(ds.threshold) : (options.threshold || 0.1);
    this.ease = ds.ease || options.ease || 'cubic-bezier(0.16, 1, 0.3, 1)';

    this.init();
  }

  init() {
    this.splitElement(this.el);

    const targets = this.el.querySelectorAll('.split-char, .split-word');
    if (!targets.length) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateTargets(targets);
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: this.threshold });

    this.observer.observe(this.el);
  }

  splitElement(el) {
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text.trim() && text !== ' ') return null;

        const frag = document.createDocumentFragment();

        if (this.splitType === 'words') {
          const words = text.split(/(\s+)/);
          words.forEach(w => {
            if (/^\s+$/.test(w)) {
              frag.appendChild(document.createTextNode(' '));
            } else if (w.length) {
              const span = document.createElement('span');
              span.className = 'split-word';
              span.style.display = 'inline-block';
              span.style.opacity = '0';
              span.style.transform = 'translateY(40px)';
              span.style.willChange = 'transform, opacity';
              span.style.transition = `opacity ${this.duration}s ${this.ease}, transform ${this.duration}s ${this.ease}`;
              span.textContent = w;
              frag.appendChild(span);
            }
          });
        } else {
          // splitType === 'chars'
          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const span = document.createElement('span');
            span.className = 'split-char';
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(40px)';
            span.style.willChange = 'transform, opacity';
            span.style.transition = `opacity ${this.duration}s ${this.ease}, transform ${this.duration}s ${this.ease}`;
            if (ch === ' ') {
              span.style.whiteSpace = 'pre';
              span.textContent = ' ';
            } else {
              span.textContent = ch;
            }
            frag.appendChild(span);
          }
        }
        return frag;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(node.childNodes);
        children.forEach(child => {
          const replacement = processNode(child);
          if (replacement) {
            node.replaceChild(replacement, child);
          }
        });
      }
      return null;
    };

    const children = Array.from(el.childNodes);
    children.forEach(child => {
      const replacement = processNode(child);
      if (replacement) {
        el.replaceChild(replacement, child);
      }
    });
  }

  animateTargets(targets) {
    targets.forEach((target, index) => {
      setTimeout(() => {
        target.style.opacity = '1';
        target.style.transform = 'translateY(0)';
      }, index * this.delay);
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

if (typeof window !== 'undefined') {
  window.SplitText = SplitText;
}
