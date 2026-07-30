/**
 * BorderGlow - Interactive Edge Proximity & Angular Directional Glow Component
 * Ported from React Bits (JavaScript + CSS variant)
 * Tailored with IVA Infrastructure brand gold colors
 */
class BorderGlow {
  constructor(card, options = {}) {
    if (typeof card === 'string') {
      card = document.querySelector(card);
    }
    if (!card) return;

    this.card = card;
    const ds = card.dataset || {};

    this.edgeSensitivity = ds.edgeSensitivity ? parseFloat(ds.edgeSensitivity) : (options.edgeSensitivity || 30);
    this.glowColor = ds.glowColor || options.glowColor || '25 75 45';
    this.backgroundColor = ds.backgroundColor || options.backgroundColor || '#4E1C10';
    this.borderRadius = ds.borderRadius ? parseInt(ds.borderRadius, 10) : (options.borderRadius || 16);
    this.glowRadius = ds.glowRadius ? parseInt(ds.glowRadius, 10) : (options.glowRadius || 30);
    this.glowIntensity = ds.glowIntensity ? parseFloat(ds.glowIntensity) : (options.glowIntensity || 1.0);
    this.coneSpread = ds.coneSpread ? parseFloat(ds.coneSpread) : (options.coneSpread || 25);
    this.fillOpacity = ds.fillOpacity ? parseFloat(ds.fillOpacity) : (options.fillOpacity || 0.4);
    this.colors = options.colors || ['#C9AA76', '#DFC494', '#3D1409'];

    this.init();
  }

  static parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 45, s: 85, l: 55 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  static buildGlowVars(glowColor, intensity) {
    const { h, s, l } = BorderGlow.parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    for (let i = 0; i < opacities.length; i++) {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
    }
    return vars;
  }

  init() {
    // Add edge-light span if not present
    if (!this.card.querySelector('.edge-light')) {
      const span = document.createElement('span');
      span.className = 'edge-light';
      this.card.insertBefore(span, this.card.firstChild);
    }

    // Set CSS properties
    this.card.style.setProperty('--card-bg', this.backgroundColor);
    this.card.style.setProperty('--edge-sensitivity', this.edgeSensitivity);
    this.card.style.setProperty('--border-radius', `${this.borderRadius}px`);
    this.card.style.setProperty('--glow-padding', `${this.glowRadius}px`);
    this.card.style.setProperty('--cone-spread', this.coneSpread);
    this.card.style.setProperty('--fill-opacity', this.fillOpacity);

    const glowVars = BorderGlow.buildGlowVars(this.glowColor, this.glowIntensity);
    for (const [key, val] of Object.entries(glowVars)) {
      this.card.style.setProperty(key, val);
    }

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.card.addEventListener('pointermove', this.handlePointerMove);
  }

  getCenterOfElement(el) {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  getEdgeProximity(el, x, y) {
    const [cx, cy] = this.getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  getCursorAngle(el, x, y) {
    const [cx, cy] = this.getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  handlePointerMove(e) {
    const rect = this.card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = this.getEdgeProximity(this.card, x, y);
    const angle = this.getCursorAngle(this.card, x, y);

    this.card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    this.card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }

  destroy() {
    if (this.card) {
      this.card.removeEventListener('pointermove', this.handlePointerMove);
    }
  }
}

if (typeof window !== 'undefined') {
  window.BorderGlow = BorderGlow;
}
