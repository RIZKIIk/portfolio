// Shared DOM, URL, and storage helpers used across portfolio features.
export function initializeImageFallbacks(root = document) {
    root.querySelectorAll('img[data-fallback]').forEach((image) => {
        image.addEventListener('error', () => {
            if (image.dataset.fallbackApplied) return;
            image.dataset.fallbackApplied = 'true';
            image.src = image.dataset.fallback;
        });
    });
}

export function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

export function safeHttpUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';

    try {
        const url = new URL(value, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

export function readStorage(key) {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeStorage(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // The feature still works for this visit when browser storage is disabled.
    }
}
