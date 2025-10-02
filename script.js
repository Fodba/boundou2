// ===================================
// BOUNDOU - FIL ROUGE DU DESTIN
// JavaScript pour animations avancées
// ===================================

// === CONFIGURATION ===
const CONFIG = {
    thread: {
        color: '#D32F2F',
        glowColor: '#FFD700',
        width: 3,
        segments: 50,
        amplitude: 80,
        frequency: 0.01,
        speed: 0.02
    },
    particles: {
        count: 15,
        color: '#FFD700',
        size: 3,
        speed: 1
    },
    breakpoint: {
        mobile: 767,
        tablet: 1023
    }
};

// === ÉTAT GLOBAL ===
let canvas, ctx;
let scrollProgress = 0;
let threadBroken = false;
let threadReconnected = false;
let particles = [];
let rafId = null;
let isMobile = false;

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initMobileMenu();
    initScrollAnimations();
    initHeroAnimation();
    initParticles();
    initIntersectionObserver();
    
    // Démarrer la boucle d'animation
    animate();
    
    // Gestion du resize
    window.addEventListener('resize', debounce(handleResize, 250));
    
    console.log('🎭 Fil Rouge du Destin initialisé');
});

// === CANVAS & FIL ROUGE ===
function initCanvas() {
    canvas = document.getElementById('redThreadCanvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    window.addEventListener('scroll', () => {
        scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    });
}

function resizeCanvas() {
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    isMobile = window.innerWidth <= CONFIG.breakpoint.mobile;
}

function drawThread() {
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * CONFIG.thread.speed * 0.001;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Déterminer l'état du fil basé sur le scroll
    const specialtySection = document.querySelector('.specialty');
    const specialtyTop = specialtySection ? specialtySection.offsetTop : 0;
    const specialtyHeight = specialtySection ? specialtySection.offsetHeight : 0;
    const scrollY = window.scrollY;
    
    // Le fil se brise dans le hero (0-20%)
    threadBroken = scrollProgress > 0.05 && scrollProgress < 0.35;
    
    // Le fil se reconnecte dans la section spécialité (35-55%)
    threadReconnected = scrollProgress > 0.35;
    
    if (threadBroken && !threadReconnected) {
        // Fil cassé - deux morceaux séparés
        drawBrokenThread(centerX, centerY, time);
    } else if (threadReconnected) {
        // Fil reconnecté avec effet de guérison
        drawReconnectedThread(centerX, centerY, time);
    } else {
        // Fil intact au début
        drawIntactThread(centerX, centerY, time);
    }
}

function drawIntactThread(centerX, centerY, time) {
    const points = [];
    const startY = centerY - 200;
    const endY = centerY + 200;
    
    for (let i = 0; i <= CONFIG.thread.segments; i++) {
        const t = i / CONFIG.thread.segments;
        const y = startY + (endY - startY) * t;
        const x = centerX + Math.sin(t * Math.PI * 4 + time) * CONFIG.thread.amplitude * (isMobile ? 0.5 : 1);
        points.push({ x, y });
    }
    
    drawThreadPath(points, CONFIG.thread.color, CONFIG.thread.width);
    drawGlow(points);
}

function drawBrokenThread(centerX, centerY, time) {
    const gapSize = 100 + Math.sin(time) * 20;
    
    // Partie supérieure
    const upperPoints = [];
    const startY = centerY - 300;
    const breakY = centerY - gapSize / 2;
    
    for (let i = 0; i <= CONFIG.thread.segments / 2; i++) {
        const t = i / (CONFIG.thread.segments / 2);
        const y = startY + (breakY - startY) * t;
        const x = centerX + Math.sin(t * Math.PI * 2 + time) * CONFIG.thread.amplitude * 0.7 * (isMobile ? 0.5 : 1);
        upperPoints.push({ x, y });
    }
    
    // Partie inférieure
    const lowerPoints = [];
    const resumeY = centerY + gapSize / 2;
    const endY = centerY + 300;
    
    for (let i = 0; i <= CONFIG.thread.segments / 2; i++) {
        const t = i / (CONFIG.thread.segments / 2);
        const y = resumeY + (endY - resumeY) * t;
        const x = centerX + Math.sin(t * Math.PI * 2 + time + Math.PI) * CONFIG.thread.amplitude * 0.7 * (isMobile ? 0.5 : 1);
        lowerPoints.push({ x, y });
    }
    
    drawThreadPath(upperPoints, CONFIG.thread.color, CONFIG.thread.width);
    drawThreadPath(lowerPoints, CONFIG.thread.color, CONFIG.thread.width);
    
    // Effet de déchirure aux extrémités
    drawTearEffect(upperPoints[upperPoints.length - 1]);
    drawTearEffect(lowerPoints[0]);
}

function drawReconnectedThread(centerX, centerY, time) {
    const healProgress = Math.min((scrollProgress - 0.35) / 0.2, 1);
    
    const points = [];
    const startY = centerY - 250;
    const endY = centerY + 250;
    
    for (let i = 0; i <= CONFIG.thread.segments; i++) {
        const t = i / CONFIG.thread.segments;
        const y = startY + (endY - startY) * t;
        
        // Zone de reconnexion au milieu
        const distanceFromCenter = Math.abs(t - 0.5);
        const healEffect = distanceFromCenter < 0.2 ? (1 - distanceFromCenter / 0.2) * healProgress : 0;
        
        const x = centerX + Math.sin(t * Math.PI * 4 + time) * CONFIG.thread.amplitude * (1 - healEffect * 0.5) * (isMobile ? 0.5 : 1);
        points.push({ x, y });
    }
    
    drawThreadPath(points, CONFIG.thread.color, CONFIG.thread.width + healProgress * 2);
    drawGlow(points, 1 + healProgress * 2);
    
    // Effet de guérison lumineux au centre
    if (healProgress > 0) {
        const healPoint = points[Math.floor(points.length / 2)];
        drawHealingEffect(healPoint, healProgress);
    }
}

function drawThreadPath(points, color, width) {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
}

function drawGlow(points, intensity = 1) {
    if (points.length < 2) return;
    
    ctx.shadowBlur = 15 * intensity;
    ctx.shadowColor = CONFIG.thread.glowColor;
    
    ctx.beginPath();
    ctx.strokeStyle = CONFIG.thread.glowColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3 * intensity;
    
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

function drawTearEffect(point) {
    const sparkCount = 5;
    
    for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + Date.now() * 0.003;
        const radius = 10 + Math.sin(Date.now() * 0.005 + i) * 5;
        const x = point.x + Math.cos(angle) * radius;
        const y = point.y + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.thread.color;
        ctx.fill();
        
        ctx.shadowBlur = 5;
        ctx.shadowColor = CONFIG.thread.glowColor;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.thread.glowColor;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawHealingEffect(point, progress) {
    const radius = 30 * progress;
    
    // Gradient radial pour effet de lumière
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    gradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * progress})`);
    gradient.addColorStop(0.5, `rgba(255, 165, 0, ${0.3 * progress})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Particules qui tournent
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Date.now() * 0.005;
        const r = radius * 0.7;
        const x = point.x + Math.cos(angle) * r;
        const y = point.y + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.thread.glowColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONFIG.thread.glowColor;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// === PARTICULES ===
function initParticles() {
    particles = [];
    
    for (let i = 0; i < CONFIG.particles.count; i++) {
        particles.push({
            x: Math.random() * (canvas?.width || window.innerWidth),
            y: Math.random() * (canvas?.height || window.innerHeight),
            vx: (Math.random() - 0.5) * CONFIG.particles.speed,
            vy: (Math.random() - 0.5) * CONFIG.particles.speed,
            size: Math.random() * CONFIG.particles.size + 1,
            alpha: Math.random() * 0.5 + 0.3
        });
    }
}

function updateParticles() {
    if (!threadReconnected || !ctx) return;
    
    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Rebond sur les bords
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // Dessin
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.particles.color;
        ctx.globalAlpha = particle.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONFIG.particles.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    });
}

// === ANIMATION HERO ===
function initHeroAnimation() {
    const hands = document.querySelectorAll('.hand');
    const threadSvg = document.querySelector('.thread-svg');
    
    if (!hands.length || !threadSvg) return;
    
    // Animation de rupture après 4 secondes
    setTimeout(() => {
        hands.forEach(hand => {
            hand.style.animation = 'none';
        });
        
        // Écarter les mains
        hands[0].style.transform = 'translateX(-50px)';
        hands[1].style.transform = 'translateX(50px)';
        
        // Effet de rupture sur le SVG
        const threadPath = document.getElementById('thread-path');
        if (threadPath) {
            threadPath.style.strokeDasharray = '10, 10';
            threadPath.style.opacity = '0.5';
        }
        
        // Faire trembler
        setTimeout(() => {
            hands.forEach(hand => {
                hand.style.transition = 'transform 0.1s';
                hand.style.transform += ' rotate(5deg)';
            });
            
            setTimeout(() => {
                hands.forEach(hand => {
                    hand.style.transform += ' rotate(-10deg)';
                });
            }, 100);
        }, 500);
        
    }, 4000);
}

// === SCROLL ANIMATIONS ===
function initScrollAnimations() {
    // Animation des statistiques au scroll
    animateCounters();
    
    // Animation du taux de réussite
    animateSuccessRate();
    
    // Parallax sur les symboles
    window.addEventListener('scroll', () => {
        const symbols = document.querySelectorAll('.adinkra-symbol');
        const scrolled = window.scrollY;
        
        symbols.forEach((symbol, index) => {
            const speed = 0.5 + index * 0.2;
            symbol.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
        });
    });
}

function animateCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const text = target.textContent;
                
                // Animation de compteur pour les nombres
                if (text.includes('/')) {
                    const parts = text.split('/');
                    animateCounter(target, 0, parseInt(parts[0]), 1000, parts[1]);
                }
                
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, start, end, duration, suffix = '') {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + (suffix ? '/' + suffix : '');
    }, 16);
}

function animateSuccessRate() {
    const successNumber = document.querySelector('.success-number');
    
    if (!successNumber) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(successNumber, 0, 87, 2000, '%');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(successNumber);
}

// === INTERSECTION OBSERVER ===
function initIntersectionObserver() {
    const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, options);
    
    // Observer les éléments à animer
    const animatables = document.querySelectorAll('.case-item, .step-item, .testimonial-card, .other-item');
    animatables.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Style pour les éléments animés
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// === MENU MOBILE ===
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!toggle || !navLinks) return;
    
    toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        
        toggle.setAttribute('aria-expanded', !isOpen);
        navLinks.classList.toggle('mobile-open');
        document.body.classList.toggle('menu-open');
        
        // Animation du hamburger
        toggle.classList.toggle('active');
    });
    
    // Fermer le menu lors du clic sur un lien
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('mobile-open');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        });
    });
    
    // Style pour le menu mobile
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 767px) {
            .nav-links {
                position: fixed;
                top: 70px;
                left: 0;
                right: 0;
                background: rgba(10, 10, 10, 0.98);
                backdrop-filter: blur(20px);
                flex-direction: column;
                padding: 2rem;
                gap: 1.5rem;
                transform: translateY(-100%);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
                pointer-events: none;
                z-index: 999;
            }
            
            .nav-links.mobile-open {
                display: flex;
                transform: translateY(0);
                opacity: 1;
                pointer-events: all;
            }
            
            .mobile-menu-toggle {
                width: 30px;
                height: 25px;
                position: relative;
                cursor: pointer;
            }
            
            .mobile-menu-toggle::before,
            .mobile-menu-toggle::after,
            .hamburger {
                content: '';
                position: absolute;
                width: 100%;
                height: 3px;
                background: #fff;
                transition: all 0.3s ease;
            }
            
            .mobile-menu-toggle::before {
                top: 0;
            }
            
            .hamburger {
                top: 50%;
                transform: translateY(-50%);
            }
            
            .mobile-menu-toggle::after {
                bottom: 0;
            }
            
            .mobile-menu-toggle.active::before {
                transform: translateY(11px) rotate(45deg);
            }
            
            .mobile-menu-toggle.active .hamburger {
                opacity: 0;
            }
            
            .mobile-menu-toggle.active::after {
                transform: translateY(-11px) rotate(-45deg);
            }
            
            .menu-open {
                overflow: hidden;
            }
        }
    `;
    document.head.appendChild(style);
}

// === BOUCLE D'ANIMATION ===
function animate() {
    drawThread();
    updateParticles();
    rafId = requestAnimationFrame(animate);
}

// === GESTION DU RESIZE ===
function handleResize() {
    resizeCanvas();
    initParticles();
}

// === UTILITAIRES ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === SMOOTH SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// === EFFETS HOVER AMÉLIORÉS ===
function initEnhancedHovers() {
    // Effet de lueur sur les CTA
    const ctaButtons = document.querySelectorAll('.btn-primary, .nav-cta, .contact-btn');
    
    ctaButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function(e) {
            this.style.transition = 'all 0.3s ease';
            this.style.filter = 'brightness(1.2)';
        });
        
        btn.addEventListener('mouseleave', function(e) {
            this.style.filter = 'brightness(1)';
        });
    });
    
    // Effet de profondeur sur les cards
    const cards = document.querySelectorAll('.case-item, .testimonial-card, .other-item');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// Initialiser les hovers améliorés
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initEnhancedHovers, 1000);
});

// === PERFORMANCE MONITORING ===
if (window.performance && window.performance.navigation.type === 1) {
    console.log('🔄 Page rechargée');
}

// === CLEANUP ===
window.addEventListener('beforeunload', () => {
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    console.log('👋 Nettoyage effectué');
});