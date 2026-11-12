// Apply the saved or device theme before the page content is painted.
(() => {
    let preference = 'system';
    try {
        const savedPreference = localStorage.getItem('themePreference');
        if (['system', 'light', 'dark'].includes(savedPreference)) {
            preference = savedPreference;
        }
    } catch {
        // The device preference still works when browser storage is blocked.
    }

    const followsLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = preference === 'system' ? (followsLight ? 'light' : 'dark') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    document.body?.classList.toggle('light-mode', theme === 'light');
})();
