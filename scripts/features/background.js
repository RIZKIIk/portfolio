import { readStorage, safeHttpUrl, writeStorage } from '../core/helpers.js';

// Owns image/video selection, lazy video loading, and the related accessible controls.
export function initializeBackgroundControls() {
    const video = document.getElementById('bgVideo');
    const container = document.querySelector('.video-bg-container');
    const muteButton = document.getElementById('mute-toggle');
    const muteIcon = muteButton?.querySelector('i');
    const backgroundButton = document.getElementById('background-toggle');
    const backgroundIcon = backgroundButton?.querySelector('i');
    const image = container?.querySelector('.background-image');
    const videoSource = video?.querySelector('source[data-src]');
    let customVideoUrl = '';

    const setVideoSource = () => {
        if (!video) return;
        const sourceUrl = customVideoUrl || videoSource?.dataset.src;
        if (!sourceUrl || video.getAttribute('src') === sourceUrl) return;

        video.src = sourceUrl;
        video.load();
    };

    const updateMuteControl = (isVideo) => {
        if (!muteButton || !muteIcon || !video) return;
        muteButton.hidden = !isVideo;
        muteButton.setAttribute('aria-pressed', String(isVideo && !video.muted));
        muteButton.setAttribute('aria-label', video.muted ? 'Aktifkan suara video' : 'Bisukan suara video');
        muteIcon.classList.toggle('fa-volume-mute', video.muted);
        muteIcon.classList.toggle('fa-volume-up', !video.muted);
    };

    const setBackground = (useImage, persist = true) => {
        container?.classList.toggle('image-mode', useImage);
        backgroundIcon?.classList.toggle('fa-image', !useImage);
        backgroundIcon?.classList.toggle('fa-video', useImage);

        if (backgroundButton) {
            backgroundButton.setAttribute('aria-label', useImage ? 'Gunakan video latar' : 'Gunakan gambar latar');
        }

        if (video) {
            if (useImage) {
                video.muted = true;
                video.pause();
            } else {
                setVideoSource();
                video.play().catch(() => {});
            }
        }

        updateMuteControl(!useImage);
        if (persist) writeStorage('portfolio-background', useImage ? 'image' : 'video');
    };

    backgroundButton?.addEventListener('click', () => {
        setBackground(!container?.classList.contains('image-mode'));
    });

    video?.addEventListener('error', () => {
        setBackground(true);
        if (backgroundButton) {
            backgroundButton.setAttribute('aria-label', 'Video tidak tersedia; menggunakan gambar latar');
        }
    });

    muteButton?.addEventListener('click', () => {
        if (!video || container?.classList.contains('image-mode')) return;
        video.muted = !video.muted;
        updateMuteControl(true);
        if (!video.muted) video.play().catch(() => {});
    });

    // Respect a returning visitor's choice; image mode is the lightweight first-visit default.
    setBackground(readStorage('portfolio-background') !== 'video', false);

    return ({ imageUrl, videoUrl }) => {
        if (image && imageUrl) {
            image.src = imageUrl;
            image.addEventListener('error', () => {
                image.src = 'media/foto.jpg';
            }, { once: true });
        }

        if (video) video.poster = imageUrl || 'media/foto.jpg';
        customVideoUrl = safeHttpUrl(videoUrl);

        // Do not fetch a remote video unless the visitor has selected video mode.
        if (customVideoUrl && !container?.classList.contains('image-mode')) {
            setVideoSource();
            video?.play().catch(() => {});
        }
    };
}
