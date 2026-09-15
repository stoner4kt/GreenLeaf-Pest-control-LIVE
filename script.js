// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Add image lazy loading function
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px' // Start loading 50px before image enters viewport
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Update DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    initializeAnimations();
    
    // Initialize lazy loading for images
    lazyLoadImages();
    
    // Initialize navbar functionality
    initializeNavbar();
    
    // Preload important images
    preloadImages([
        'images/technician.jpg',
        'images/hero-bg.jpg',
        'images/before-after.jpg'
    ]);
});

// Navbar functionality
function initializeNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Initialize GSAP Animations
function initializeAnimations() {
    // Hero animation
    gsap.from('.hero-title', {
        opacity: 0,
        y: 50,
        duration: 1,
        delay: 0.2
    });
    
    gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.4
    });
    
    gsap.from('.hero-buttons', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.6
    });
    
    gsap.from('.trust-indicators', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.8
    });
}

// Image preloading function
function preloadImages(imageArray) {
    imageArray.forEach(imageSrc => {
        const img = new Image();
        img.src = imageSrc;
    });
}

// Handle image errors gracefully
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        
        // Add fallback content
        if (parent.classList.contains('service-image-container')) {
            parent.innerHTML = '<div class="service-icon-large"><i class="fas fa-bug"></i></div>';
        }
    }
}, true);