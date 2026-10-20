// Hide the loading screen after load, with a timeout for slow or stalled requests.
export function initializePreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const hide = () => {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
    };

    window.addEventListener('load', () => window.setTimeout(hide, 500), { once: true });
    window.setTimeout(hide, 1500);
}
