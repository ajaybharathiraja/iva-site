/**
 * StarBorder - Orbiting Star Light Border Glow Animation
 * Ported from React Bits (JavaScript + CSS variant)
 * Adds animated radial gradient borders to buttons & cards
 */
class StarBorder {
  constructor(element, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element || element._starBorderInitialized) return;
    element._starBorderInitialized = true;

    this.el = element;
    const ds = element.dataset || {};

    this.color = ds.color || options.color || '#D4B37D';
    this.speed = ds.speed || options.speed || '6s';
    this.thickness = ds.thickness ? parseInt(ds.thickness, 10) : (options.thickness || 1);

    this.init();
  }

  init() {
    this.el.classList.add('star-border-container');

    // Wrap children in inner-content if not present
    if (!this.el.querySelector('.inner-content')) {
      const inner = document.createElement('div');
      inner.className = 'inner-content';
      while (this.el.firstChild) {
        inner.appendChild(this.el.firstChild);
      }
      this.el.appendChild(inner);
    }

    // Insert gradient top & bottom elements
    if (!this.el.querySelector('.border-gradient-bottom')) {
      const b = document.createElement('div');
      b.className = 'border-gradient-bottom';
      b.style.background = `radial-gradient(circle, ${this.color}, transparent 10%)`;
      b.style.animationDuration = this.speed;
      this.el.insertBefore(b, this.el.firstChild);
    }

    if (!this.el.querySelector('.border-gradient-top')) {
      const t = document.createElement('div');
      t.className = 'border-gradient-top';
      t.style.background = `radial-gradient(circle, ${this.color}, transparent 10%)`;
      t.style.animationDuration = this.speed;
      this.el.insertBefore(t, this.el.firstChild);
    }
  }
}

if (typeof window !== 'undefined') {
  window.StarBorder = StarBorder;
}
