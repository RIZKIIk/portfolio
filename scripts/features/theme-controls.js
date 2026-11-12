const preferenceKey = 'themePreference';
const preferences = new Set(['system', 'light', 'dark']);

function readPreference() {
    try {
        const saved = localStorage.getItem(preferenceKey);
        return preferences.has(saved) ? saved : 'system';
    } catch {
        return 'system';
    }
}

function writePreference(preference) {
    try {
        localStorage.setItem(preferenceKey, preference);
    } catch {
        // Keep the selected theme for this page even when storage is blocked.
    }
}

const preferenceLabel = (preference) => ({
    system: 'Sesuai perangkat',
    light: 'Terang',
    dark: 'Gelap'
})[preference];

function initializeThemeControls() {
    const root = document.documentElement;
    const body = document.body;
    const picker = document.querySelector('[data-theme-picker]');
    const themeButton = picker?.querySelector('#theme-toggle');
    const menuToggle = picker?.querySelector('#theme-menu-toggle');
    const menu = picker?.querySelector('#theme-menu');
    const iconStage = picker?.querySelector('.theme-icon-stage');
    const options = [...(menu?.querySelectorAll('[data-theme-choice]') || [])];
    const colorScheme = window.matchMedia('(prefers-color-scheme: light)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!picker || !themeButton || !menuToggle || !menu || picker.dataset.themeControlsReady === 'true') return;
    picker.dataset.themeControlsReady = 'true';

    let preference = readPreference();
    let iconTimer;
    let transitionTimer;

    const resolveTheme = (selected = preference) => (
        selected === 'system' ? (colorScheme.matches ? 'light' : 'dark') : selected
    );

    const closeMenu = (returnFocus = false) => {
        menu.hidden = true;
        menuToggle.setAttribute('aria-expanded', 'false');
        if (returnFocus) menuToggle.focus();
    };

    const updateLabels = (theme) => {
        const currentPreference = preferenceLabel(preference);
        const nextTheme = theme === 'light' ? 'gelap' : 'terang';
        themeButton.setAttribute('aria-label', `Tema ${currentPreference}. Klik untuk beralih ke mode ${nextTheme}.`);
        themeButton.setAttribute('title', `Beralih ke mode ${nextTheme}`);
        themeButton.setAttribute('aria-pressed', String(theme === 'light'));
        menuToggle.setAttribute('aria-label', `Pilih tema. Saat ini ${currentPreference}.`);
        options.forEach((option) => {
            option.setAttribute('aria-pressed', String(option.dataset.themeChoice === preference));
        });
    };

    const updateTheme = (nextPreference, { animate = false, save = true } = {}) => {
        const previousTheme = root.dataset.theme || resolveTheme();
        const previousPreference = preference;
        const nextTheme = resolveTheme(nextPreference);
        const preferenceChanged = nextPreference !== previousPreference;
        preference = nextPreference;

        root.dataset.theme = nextTheme;
        root.dataset.themePreference = preference;
        body.classList.toggle('light-mode', nextTheme === 'light');
        picker.dataset.themeEffective = nextTheme;
        picker.dataset.themePreference = preference;
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            'content', nextTheme === 'light' ? '#f5f8f6' : '#07111a'
        );
        updateLabels(nextTheme);
        if (save && preferenceChanged) writePreference(preference);

        if (!animate || reduceMotion.matches || (!preferenceChanged && previousTheme === nextTheme)) return;

        if (previousTheme !== nextTheme) {
            body.classList.add('theme-transitioning');
            window.clearTimeout(transitionTimer);
            transitionTimer = window.setTimeout(() => body.classList.remove('theme-transitioning'), 650);
        }

        if (!iconStage || !preferenceChanged) return;
        window.clearTimeout(iconTimer);
        iconStage.className = 'theme-icon-stage';
        void iconStage.offsetWidth;
        iconStage.classList.add(`animate-from-${previousPreference}`, `animate-to-${nextPreference}`);
        iconTimer = window.setTimeout(() => {
            iconStage.className = 'theme-icon-stage';
        }, 650);
    };

    updateTheme(preference, { save: false });

    themeButton.addEventListener('click', () => {
        closeMenu();
        updateTheme(resolveTheme() === 'light' ? 'dark' : 'light', { animate: true });
    });

    menuToggle.addEventListener('click', () => {
        const shouldOpen = menu.hidden;
        menu.hidden = !shouldOpen;
        menuToggle.setAttribute('aria-expanded', String(shouldOpen));
        if (shouldOpen) {
            menu.querySelector(`[data-theme-choice="${preference}"]`)?.focus();
        }
    });

    options.forEach((option) => {
        option.addEventListener('click', () => {
            updateTheme(option.dataset.themeChoice, { animate: true });
            closeMenu(true);
        });
    });

    document.addEventListener('pointerdown', (event) => {
        if (!picker.contains(event.target) && !menu.hidden) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (menu.hidden) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu(true);
            return;
        }

        const currentIndex = options.indexOf(document.activeElement);
        if (currentIndex < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? options.length - 1
                : (currentIndex + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length;
        options[nextIndex]?.focus();
    });

    const handleDeviceChange = () => {
        if (preference === 'system') updateTheme('system', { animate: true, save: false });
    };
    if (typeof colorScheme.addEventListener === 'function') {
        colorScheme.addEventListener('change', handleDeviceChange);
    } else {
        colorScheme.addListener(handleDeviceChange);
    }
}

initializeThemeControls();
