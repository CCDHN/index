/**
 * main.js
 * Handles the "Liquid Network" animation and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Priority: UI functionality first
    initMobileMenu();
    initThemeToggle(); // Initialize theme toggle
    initSmoothScroll();

    // Animation last, with error handling
    try {
        initAnimation();
    } catch (e) {
        console.warn('Animation failed to initialize:', e);
    }
});

/**
 * Theme Toggle
 */
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const icon = toggleBtn.querySelector('.icon');

    // Check saved preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);

        // Dispatch event for animation to pick up changes
        document.dispatchEvent(new Event('themeChanged'));
    });

    function updateIcon(theme) {
        icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

/**
 * 1. Mobile Menu Toggle
 */
function initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav-menu');

    if (btn && nav) {
        btn.addEventListener('click', () => {
            nav.classList.toggle('active');
            // Animate hamburger to X
            btn.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                btn.classList.remove('active');
            });
        });
    }
}

/**
 * 2. Smooth Scroll
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 3. Animated Background (Ported from CodePen)
 * Original inspiration: https://codepen.io/MarcoGuglielmelli/pen/ExGYae
 */
function initAnimation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const target = { x: width / 2, y: height / 2 };

    const largeHeader = document.getElementById('inicio');
    // largeHeader.style.height = height + 'px'; // Avoid overriding CSS height if possible, or keep it strict

    const canvas = document.getElementById('demo-canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Color Config
    let particleRGB = '255, 255, 255';
    let lineRGB = '58, 134, 255';

    function updateColors() {
        const style = getComputedStyle(document.body);
        particleRGB = style.getPropertyValue('--particle-rgb').trim() || '255, 255, 255';
        lineRGB = style.getPropertyValue('--particle-line-rgb').trim() || '58, 134, 255';
    }

    // Initial load
    updateColors();

    // Listen for theme changes
    document.addEventListener('themeChanged', updateColors);

    // Points configuration
    let points = [];
    const spacing = width / 20; // Grid spacing

    for (let x = 0; x < width; x = x + spacing) {
        for (let y = 0; y < height; y = y + spacing) {
            const px = x + Math.random() * spacing;
            const py = y + Math.random() * spacing;
            const p = {
                x: px,
                originX: px,
                y: py,
                originY: py,
                vx: (Math.random() - 0.5) * 0.5, // Velocity X
                vy: (Math.random() - 0.5) * 0.5  // Velocity Y
            };
            points.push(p);
        }
    }

    // Find 5 closest points
    for (let i = 0; i < points.length; i++) {
        const closest = [];
        const p1 = points[i];
        for (let j = 0; j < points.length; j++) {
            const p2 = points[j];
            if (!(p1 == p2)) {
                let placed = false;
                for (let k = 0; k < 5; k++) {
                    if (!placed) {
                        if (closest[k] == undefined) {
                            closest[k] = p2;
                            placed = true;
                        }
                    }
                }

                for (let k = 0; k < 5; k++) {
                    if (!placed) {
                        if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                            closest[k] = p2;
                            placed = true;
                        }
                    }
                }
            }
        }
        p1.closest = closest;
    }

    // Assign circles
    for (let i in points) {
        const c = new Circle(points[i], 2 + Math.random() * 2);
        points[i].circle = c;
    }

    // Event Listeners
    if (!('ontouchstart' in window)) {
        window.addEventListener('mousemove', mouseMove);
    }
    window.addEventListener('resize', resize); // Removed scroll check for simplicity

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (let i in points) {
            const p = points[i];

            // Move points (Vanilla JS substitution for GSAP)
            p.x += p.vx;
            p.y += p.vy;

            // Bounce back if too far from origin
            if (Math.abs(p.x - p.originX) > 50) p.vx *= -1;
            if (Math.abs(p.y - p.originY) > 50) p.vy *= -1;

            // Randomly flip direction occasionally for organic feel
            if (Math.random() < 0.01) p.vx *= -1;
            if (Math.random() < 0.01) p.vy *= -1;

            // Detect points in range of mouse
            // Increased thresholds for better visibility:
            // Sqrt(10000) = 100px, Sqrt(40000) = 200px, Sqrt(80000) = ~280px
            if (Math.abs(getDistance(target, p)) < 10000) {
                p.active = 0.4;
                p.circle.active = 0.7; // Slightly brighter
            } else if (Math.abs(getDistance(target, p)) < 40000) {
                p.active = 0.2;
                p.circle.active = 0.4;
            } else if (Math.abs(getDistance(target, p)) < 80000) {
                p.active = 0.05;
                p.circle.active = 0.15;
            } else {
                p.active = 0;
                p.circle.active = 0;
            }

            drawLines(p);
            p.circle.draw();
        }
        requestAnimationFrame(animate);
    }

    // Canvas Drawing Helpers
    function drawLines(p) {
        if (!p.active) return;
        for (let i in p.closest) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.closest[i].x, p.closest[i].y);

            // Use lineRGB variable
            ctx.strokeStyle = 'rgba(' + lineRGB + ',' + p.active + ')';
            ctx.stroke();
        }
    }

    function Circle(pos, rad) {
        this.pos = pos;
        this.radius = rad;
        this.draw = function () {
            if (!this.active) return;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
            // Use particleRGB variable
            ctx.fillStyle = 'rgba(' + particleRGB + ',' + this.active + ')';
            ctx.fill();
        };
    }

    // Utils
    function getDistance(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }

    function mouseMove(e) {
        let posx = 0, posy = 0;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        target.x = posx;
        target.y = posy;
    }

    // Store initial width to ignore vertical-only resizes on mobile
    let lastWidth = window.innerWidth;

    function resize() {
        const newWidth = window.innerWidth;
        if (newWidth !== lastWidth) {
            lastWidth = newWidth;
            window.location.reload();
        }
    }

    animate();
}
