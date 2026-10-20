import { readStorage, writeStorage } from '../core/helpers.js';

// Keep the page theme, toggle state, and browser theme color in sync.
export function initializeTheme() {
    const body = document.body;
    const themeButton = document.getElementById('theme-toggle');
    const themeIcon = themeButton?.querySelector('i');

    const applyTheme = (isLight) => {
        body.classList.toggle('light-mode', isLight);
        themeIcon?.classList.toggle('fa-sun', isLight);
        themeIcon?.classList.toggle('fa-moon', !isLight);
        themeButton?.setAttribute('aria-pressed', String(isLight));
        document.querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', isLight ? '#f5f8f6' : '#07111a');
        writeStorage('theme', isLight ? 'light' : 'dark');
    };

    const savedTheme = readStorage('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(savedTheme === 'light' || (!savedTheme && prefersLight));

    themeButton?.addEventListener('click', () => {
        applyTheme(!body.classList.contains('light-mode'));
    });
}
