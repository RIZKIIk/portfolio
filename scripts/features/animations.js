// Owns entrance/reveal effects and the optional click ripple decoration.
export function initializeAnimations(prefersReducedMotion) {
    if (prefersReducedMotion) {
        document.querySelectorAll('[class*="reveal-"]').forEach((element) => {
            element.classList.add('active');
        });
        return;
    }

    document.addEventListener('click', (event) => {
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        document.body.append(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });

    const heroReveals = document.querySelectorAll(
        '.hero .reveal-top, .hero .reveal-bottom, .hero .reveal-left, .hero .reveal-right'
    );
    heroReveals.forEach((element, index) => {
        window.setTimeout(() => element.classList.add('active'), 300 * (index + 1));
    });

    const reveals = document.querySelectorAll('[class*="reveal-"]');
    if (!('IntersectionObserver' in window)) {
        reveals.forEach((element) => element.classList.add('active'));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            window.setTimeout(() => entry.target.classList.add('active'), 100);
            currentObserver.unobserve(entry.target);
        });
    }, { threshold: 0.1 });

    reveals.forEach((element) => observer.observe(element));
}
