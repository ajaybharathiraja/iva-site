/**
 * SpotlightCard - Radial Mouse Tracking Spotlight Effect
 * Ported from React Bits (JavaScript + CSS variant)
 */
class SpotlightCard {
  constructor(card, options = {}) {
    if (typeof card === 'string') {
      card = document.querySelector(card);
    }
    if (!card) return;

    this.card = card;
    this.spotlightColor = card.dataset.spotlightColor || options.spotlightColor || 'rgba(188, 151, 5, 0.4)';

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.card.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e) {
    const rect = this.card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.card.style.setProperty('--mouse-x', `${x}px`);
    this.card.style.setProperty('--mouse-y', `${y}px`);
    this.card.style.setProperty('--spotlight-color', this.spotlightColor);
  }

  destroy() {
    if (this.card) {
      this.card.removeEventListener('mousemove', this.handleMouseMove);
    }
  }
}

if (typeof window !== 'undefined') {
  window.SpotlightCard = SpotlightCard;
}
