// Coordinate scroll progress, active navigation, navbar state, and back-to-top.
export function initializeScrollUi(prefersReducedMotion) {
    const navbar = document.querySelector('.navbar');
    const backToTop = document.getElementById('back-to-top');
    const scrollProgress = document.getElementById('scroll-progress');
    const sections = document.querySelectorAll('section, header');
    const navItems = document.querySelectorAll('.nav-links a');

    const updateScrollState = () => {
        let currentSection = '';
        sections.forEach((section) => {
            if (window.scrollY >= section.offsetTop - 150) {
                currentSection = section.id || '';
            }
        });

        navItems.forEach((link) => {
            const isCurrent = currentSection && link.getAttribute('href') === `#${currentSection}`;
            link.classList.toggle('active', Boolean(isCurrent));
            if (isCurrent) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percentage = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
        if (scrollProgress) scrollProgress.style.width = `${percentage}%`;

        const isScrolled = window.scrollY > 50;
        navbar?.classList.toggle('scrolled', isScrolled);
        backToTop?.classList.toggle('show', isScrolled);
    };

    window.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();

    backToTop?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    });
}
