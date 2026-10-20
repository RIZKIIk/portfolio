// Manage the mobile navigation menu and keyboard dismissal behavior.
export function initializeMobileMenu() {
    const menuButton = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!menuButton || !navLinks) return;

    const menuIcon = menuButton.querySelector('i');
    const setMenuOpen = (isOpen) => {
        navLinks.classList.toggle('active', isOpen);
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');
        menuIcon?.classList.toggle('fa-bars', !isOpen);
        menuIcon?.classList.toggle('fa-times', isOpen);
    };

    menuButton.addEventListener('click', () => {
        setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navLinks.classList.contains('active')) {
            setMenuOpen(false);
            menuButton.focus();
        }
    });

    document.addEventListener('click', (event) => {
        if (navLinks.classList.contains('active') && !event.target.closest('.navbar')) {
            setMenuOpen(false);
        }
    });
}
