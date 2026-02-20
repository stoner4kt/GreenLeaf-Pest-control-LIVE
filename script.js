const servicesGrid = document.querySelector(".services-grid");


// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Services Data
// Update services data to include image paths
const services = [
    {
        id: 1,
        title: "Whole House Fumigation",
        price: "R850",
        icon: "🏠",
        image: "images/house.jpeg",
        color: "#2a6e3f",
        features: [
            "Complete property treatment",
            "Eco-friendly fumigants",
            "2-week follow-up inspection",
            "Family & pet safe after 4 hours"
        ]
    },
    {
        id: 2,
        title: "Bed Bugs Treatment",
        price: "R750",
        icon: "🛏️",
        image: "images/bedbugs.jpeg",
        color: "#e74c3c",
        features: [
            "Heat treatment or chemical",
            "Mattress & furniture safe",
            "Guaranteed elimination",
            "Follow-up inspection included"
        ]
    },
    {
        id: 3,
        title: "Cockroaches Elimination",
        price: "R650",
        icon: "🪳",
        image: "images/cockroaches.jpeg",
        color: "#8e44ad",
        features: [
            "Bait & spray treatment",
            "Targets nests & hiding spots",
            "Monthly maintenance available",
            "Child & pet friendly solutions"
        ]
    },
    {
        id: 4,
        title: "Rats/Mice Control",
        price: "R600",
        icon: "🐭",
        image: "images/rat&mice.jpeg",
        color: "#34495e",
        features: [
            "Humane trapping methods",
            "Entry point identification",
            "Sanitation recommendations",
            "Prevention strategies"
        ]
    },
    {
        id: 5,
        title: "Ants Extermination",
        price: "R650",
        icon: "🐜",
        image: "images/ants.jpeg",
        color: "#d35400",
        features: [
            "Colony elimination",
            "Indoor & outdoor treatment",
            "Long-lasting barrier spray",
            "Safe for gardens & plants"
        ]
    },
    {
        id: 6,
        title: "Yard Spraying",
        price: "R800",
        icon: "🌳",
        image: "images/yard.jpeg",
        color: "#27ae60",
        features: [
            "Mosquito & tick control",
            "Perimeter protection",
            "Pet-friendly after drying",
            "Lasts up to 3 months"
        ]
    }
];

// Update initializeServices function to include images
function initializeServices() {
    servicesGrid.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        
        serviceCard.innerHTML = `
            <div class="service-image-container">
                <img src="${service.image}" 
                     alt="${service.title}" 
                     class="service-image image-loading"
                     onload="this.classList.remove('image-loading'); this.classList.add('loaded')"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'service-icon-large\'>${service.icon}</div>'">
            </div>
            <div class="service-header" style="background-color: ${service.color}">
                <div class="service-icon">${service.icon}</div>
                <h3 class="service-title">${service.title}</h3>
                <div class="service-price">${service.price}</div>
            </div>
            <div class="service-body">
                <ul class="service-features">
                    ${service.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                </ul>
                <a href="contact.html" class="btn btn-primary service-btn" data-service="${service.title}">
                    Book This Service
                </a>
            </div>
        `;
        
        servicesGrid.appendChild(serviceCard);
    });
}

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
    // Initialize services
    initializeServices();
    
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