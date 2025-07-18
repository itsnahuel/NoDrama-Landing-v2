// Vanilla JavaScript implementation of TiltedCard
class TiltedCard {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      rotateAmplitude: 14,
      scaleOnHover: 1.1,
      showTooltip: true,
      captionText: '',
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupStyles();
  }
  
  setupElements() {
    // Create the inner card structure
    this.element.innerHTML = `
      <div class="tilted-card-inner">
        <img class="tilted-card-img" src="${this.options.imageSrc}" alt="${this.options.altText}" />
        <div class="tilted-card-overlay">
          <div class="tilted-card-overlay-content">
            <span class="album-title">${this.options.albumTitle}</span>
            <span class="album-artist">${this.options.albumArtist}</span>
            <span class="album-year">${this.options.albumYear}</span>
          </div>
        </div>
      </div>
      ${this.options.showTooltip ? `<div class="tilted-card-caption">${this.options.captionText}</div>` : ''}
    `;
    
    this.inner = this.element.querySelector('.tilted-card-inner');
    this.img = this.element.querySelector('.tilted-card-img');
    this.overlay = this.element.querySelector('.tilted-card-overlay');
    this.caption = this.element.querySelector('.tilted-card-caption');
  }
  
  setupStyles() {
    this.element.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      perspective: 800px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;
    
    this.inner.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    
    this.img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 15px;
      will-change: transform;
      transform: translateZ(0);
    `;
    
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9));
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      transform: translateZ(30px);
    `;
    
    this.overlay.querySelector('.tilted-card-overlay-content').style.cssText = `
      text-align: center;
      color: white;
      padding: 1rem;
    `;
    
    this.overlay.querySelector('.album-title').style.cssText = `
      display: block;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    `;
    
    this.overlay.querySelector('.album-artist').style.cssText = `
      display: block;
      font-size: 1rem;
      margin-bottom: 0.5rem;
      opacity: 0.9;
    `;
    
    this.overlay.querySelector('.album-year').style.cssText = `
      display: block;
      font-size: 0.9rem;
      opacity: 0.8;
    `;
    
    if (this.caption) {
      this.caption.style.cssText = `
        pointer-events: none;
        position: absolute;
        left: 0;
        top: 0;
        border-radius: 4px;
        background-color: #fff;
        padding: 4px 10px;
        font-size: 10px;
        color: #2d2d2d;
        opacity: 0;
        z-index: 3;
        transition: opacity 0.3s ease;
      `;
    }
  }
  
  setupEventListeners() {
    this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.element.addEventListener('mouseenter', () => this.handleMouseEnter());
    this.element.addEventListener('mouseleave', () => this.handleMouseLeave());
  }
  
  handleMouseMove(e) {
    const rect = this.element.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    
    const rotationX = (offsetY / (rect.height / 2)) * -this.options.rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * this.options.rotateAmplitude;
    
    this.inner.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${this.options.scaleOnHover})`;
    
    if (this.caption) {
      this.caption.style.left = `${e.clientX - rect.left + 10}px`;
      this.caption.style.top = `${e.clientY - rect.top - 30}px`;
    }
  }
  
  handleMouseEnter() {
    this.overlay.style.opacity = '1';
    if (this.caption) {
      this.caption.style.opacity = '1';
    }
  }
  
  handleMouseLeave() {
    this.inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    this.overlay.style.opacity = '0';
    if (this.caption) {
      this.caption.style.opacity = '0';
    }
  }
}

// Function to initialize tilted cards
function createTiltedCard(element, options) {
  return new TiltedCard(element, options);
}

// Make available globally
window.TiltedCard = TiltedCard;
window.createTiltedCard = createTiltedCard;