// Vanilla JavaScript implementation of ProfileCard
// Based on the React ProfileCard component

const DEFAULT_BEHIND_GRADIENT = 
  "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)";

const DEFAULT_INNER_GRADIENT = 
  "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";

const ANIMATION_CONFIG = {
  SMOOTH_DURATION: 300,
  INITIAL_DURATION: 800,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  THROTTLE_DELAY: 16, // ~60fps
};

class ProfileCard {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      avatarUrl: "https://via.placeholder.com/400x600/1a1a1a/64ffda?text=ARTIST+PHOTO",
      iconUrl: "",
      grainUrl: "",
      behindGradient: DEFAULT_BEHIND_GRADIENT,
      innerGradient: DEFAULT_INNER_GRADIENT,
      showBehindGradient: true,
      enableTilt: true,
      miniAvatarUrl: "",
      name: "Artist Name",
      title: "Role",
      handle: "artist",
      status: "Active",
      contactText: "Contact",
      showUserInfo: true,
      ...options
    };
    
    this.rafId = null;
    this.lastUpdate = 0;
    this.isAnimating = false;
    this.init();
  }
  
  init() {
    this.setupElements();
    this.setupStyles();
    if (this.options.enableTilt) {
      this.setupEventListeners();
      this.startInitialAnimation();
    }
  }
  
  setupElements() {
    this.element.innerHTML = `
      <div class="pc-card-wrapper">
        <section class="pc-card">
          <div class="pc-inside">
            <div class="pc-shine"></div>
            <div class="pc-glare"></div>
            <div class="pc-content pc-avatar-content">
              <img
                class="avatar"
                src="${this.options.avatarUrl}"
                alt="${this.options.name} avatar"
                loading="lazy"
              />
              ${this.options.showUserInfo ? `
                <div class="pc-user-info">
                  <div class="pc-user-details">
                    <div class="pc-mini-avatar">
                      <img
                        src="${this.options.miniAvatarUrl || this.options.avatarUrl}"
                        alt="${this.options.name} mini avatar"
                        loading="lazy"
                      />
                    </div>
                    <div class="pc-user-text">
                      <div class="pc-handle">@${this.options.handle}</div>
                      <div class="pc-status">${this.options.status}</div>
                    </div>
                  </div>
                  <button class="pc-contact-btn" type="button">
                    ${this.options.contactText}
                  </button>
                </div>
              ` : ''}
            </div>
            <div class="pc-content">
              <div class="pc-details">
                <h3>${this.options.name}</h3>
                <p>${this.options.title}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
    
    this.wrapRef = this.element.querySelector('.pc-card-wrapper');
    this.cardRef = this.element.querySelector('.pc-card');
    this.contactBtn = this.element.querySelector('.pc-contact-btn');
    
    if (this.contactBtn && this.options.onContactClick) {
      this.contactBtn.addEventListener('click', this.options.onContactClick);
    }
  }
  
  setupStyles() {
    const cardStyle = {
      '--icon': this.options.iconUrl ? `url(${this.options.iconUrl})` : 'none',
      '--grain': this.options.grainUrl ? `url(${this.options.grainUrl})` : 'none',
      '--behind-gradient': this.options.showBehindGradient ? this.options.behindGradient : 'none',
      '--inner-gradient': this.options.innerGradient,
    };
    
    Object.entries(cardStyle).forEach(([property, value]) => {
      this.wrapRef.style.setProperty(property, value);
    });
  }
  
  clamp(value, min = 0, max = 100) {
    return Math.min(Math.max(value, min), max);
  }
  
  round(value, precision = 3) {
    return parseFloat(value.toFixed(precision));
  }
  
  adjust(value, fromMin, fromMax, toMin, toMax) {
    return this.round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));
  }
  
  easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  
  updateCardTransform(offsetX, offsetY) {
    // Throttle updates for performance
    const now = performance.now();
    if (now - this.lastUpdate < ANIMATION_CONFIG.THROTTLE_DELAY) {
      return;
    }
    this.lastUpdate = now;
    
    const width = this.cardRef.clientWidth;
    const height = this.cardRef.clientHeight;
    
    const percentX = this.clamp((100 / width) * offsetX);
    const percentY = this.clamp((100 / height) * offsetY);
    
    const centerX = percentX - 50;
    const centerY = percentY - 50;
    
    // Reduce sensitivity by scaling down the rotation values
    const rotationScale = 0.3; // Reduced from 1.0 to 0.3
    
    const properties = {
      '--pointer-x': `${percentX}%`,
      '--pointer-y': `${percentY}%`,
      '--background-x': `${this.adjust(percentX, 0, 100, 42, 58)}%`, // Reduced range
      '--background-y': `${this.adjust(percentY, 0, 100, 42, 58)}%`, // Reduced range
      '--pointer-from-center': `${this.clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
      '--pointer-from-top': `${percentY / 100}`,
      '--pointer-from-left': `${percentX / 100}`,
      '--rotate-x': `${this.round(-(centerX / 5) * rotationScale)}deg`,
      '--rotate-y': `${this.round((centerY / 4) * rotationScale)}deg`,
    };
    
    // Use requestAnimationFrame for smooth updates
    if (!this.isAnimating) {
      this.isAnimating = true;
      requestAnimationFrame(() => {
        Object.entries(properties).forEach(([property, value]) => {
          this.wrapRef.style.setProperty(property, value);
        });
        this.isAnimating = false;
      });
    }
  }
  
  createSmoothAnimation(duration, startX, startY) {
    const startTime = performance.now();
    const targetX = this.wrapRef.clientWidth / 2;
    const targetY = this.wrapRef.clientHeight / 2;
    
    const animationLoop = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = this.clamp(elapsed / duration);
      const easedProgress = this.easeInOutCubic(progress);
      
      const currentX = this.adjust(easedProgress, 0, 1, startX, targetX);
      const currentY = this.adjust(easedProgress, 0, 1, startY, targetY);
      
      this.updateCardTransform(currentX, currentY);
      
      if (progress < 1) {
        this.rafId = requestAnimationFrame(animationLoop);
      }
    };
    
    this.rafId = requestAnimationFrame(animationLoop);
  }
  
  handlePointerMove = (event) => {
    if (!this.options.enableTilt) return;
    
    const rect = this.cardRef.getBoundingClientRect();
    this.updateCardTransform(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
  }
  
  handlePointerEnter = () => {
    if (!this.options.enableTilt) return;
    
    this.cancelAnimation();
    this.wrapRef.classList.add('active');
    this.cardRef.classList.add('active');
  }
  
  handlePointerLeave = (event) => {
    if (!this.options.enableTilt) return;
    
    this.createSmoothAnimation(
      ANIMATION_CONFIG.SMOOTH_DURATION,
      event.offsetX,
      event.offsetY
    );
    this.wrapRef.classList.remove('active');
    this.cardRef.classList.remove('active');
  }
  
  setupEventListeners() {
    this.cardRef.addEventListener('pointerenter', this.handlePointerEnter);
    this.cardRef.addEventListener('pointermove', this.handlePointerMove);
    this.cardRef.addEventListener('pointerleave', this.handlePointerLeave);
  }
  
  startInitialAnimation() {
    const initialX = this.wrapRef.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    
    this.updateCardTransform(initialX, initialY);
    this.createSmoothAnimation(
      ANIMATION_CONFIG.INITIAL_DURATION,
      initialX,
      initialY
    );
  }
  
  cancelAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  destroy() {
    this.cancelAnimation();
    if (this.cardRef) {
      this.cardRef.removeEventListener('pointerenter', this.handlePointerEnter);
      this.cardRef.removeEventListener('pointermove', this.handlePointerMove);
      this.cardRef.removeEventListener('pointerleave', this.handlePointerLeave);
    }
    if (this.contactBtn && this.options.onContactClick) {
      this.contactBtn.removeEventListener('click', this.options.onContactClick);
    }
  }
}

// Function to create profile card
function createProfileCard(element, options) {
  return new ProfileCard(element, options);
}

// Make available globally
window.ProfileCard = ProfileCard;
window.createProfileCard = createProfileCard;