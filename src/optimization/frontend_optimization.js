// Frontend Performance Optimization Techniques

// Lazy loading for images
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

// Bundle optimization with dynamic imports
const loadGameModule = async () => {
  // Load only when needed
  const { SlapEngine } = await import('./game.js');
  return new SlapEngine();
};

// Efficient animation using requestAnimationFrame
const optimizeAnimation = (element, targetX, targetY) => {
  let start = null;
  
  const animate = (timestamp) => {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    
    // Update element position
    element.style.left = `${targetX * (progress / 1000)}px`;
    element.style.top = `${targetY * (progress / 1000)}px`;
    
    // Continue animation until complete
    if (progress < 1000) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

// Memory management for game objects
const manageMemory = (gameObjects) => {
  // Remove unused objects
  const activeObjects = gameObjects.filter(obj => obj.active);
  
  // Clear references to help garbage collection
  gameObjects.forEach(obj => {
    if (!obj.active) {
      obj.element = null;
      obj.data = null;
    }
  });
  
  return activeObjects;
};

// Optimize responsive design
const optimizeResponsiveDesign = () => {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    // Reduce visual effects on mobile
    document.body.classList.add('mobile-optimized');
    
    // Simplify animations
    document.body.classList.add('reduced-motion');
  } else {
    // Full effects on desktop
    document.body.classList.remove('mobile-optimized');
    document.body.classList.remove('reduced-motion');
  }
};

// Cache frequently accessed DOM elements
const cacheDOMElements = () => {
  const cachedElements = {
    gameContainer: document.getElementById('game-container'),
    powerSlider: document.getElementById('power-slider'),
    angleSlider: document.getElementById('angle-slider'),
    scoreDisplay: document.getElementById('score-display'),
    comboDisplay: document.getElementById('combo-display')
  };
  
  return cachedElements;
};

// Implement efficient event handling
const setupEfficientEvents = (elements) => {
  // Use event delegation where possible
  elements.gameContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('slap-target')) {
      // Handle slap target click
      handleSlapTargetClick(e.target);
    }
  });
  
  // Throttle slider events
  let throttleTimeout;
  const throttle = (func, delay) => {
    return (...args) => {
      if (!throttleTimeout) {
        func.apply(this, args);
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, delay);
      }
    };
  };
  
  elements.powerSlider.addEventListener('input', throttle((e) => {
    updatePowerDisplay(e.target.value);
  }, 100));
  
  elements.angleSlider.addEventListener('input', throttle((e) => {
    updateAngleDisplay(e.target.value);
  }, 100));
};

module.exports = {
  lazyLoadImages,
  loadGameModule,
  optimizeAnimation,
  manageMemory,
  optimizeResponsiveDesign,
  cacheDOMElements,
  setupEfficientEvents
};