import { safeHttpUrl } from '../core/helpers.js';
import { fetchPublishedSiteSettings } from '../services/portfolio-repository.js';

// Apply remote profile/background settings; keep built-in assets if the request fails.
export async function initializeSiteSettings(client, applyBackgroundSettings) {
    if (!client) return;

    try {
        const settings = await fetchPublishedSiteSettings(client);
        if (!settings) return;

        const profileUrl = safeHttpUrl(settings.profile_image_url);
        const profileImage = document.getElementById('profile-image');
        if (profileImage && profileUrl) profileImage.src = profileUrl;

        applyBackgroundSettings({
            imageUrl: safeHttpUrl(settings.background_image_url),
            videoUrl: safeHttpUrl(settings.background_video_url)
        });
    } catch (error) {
        console.warn('Pengaturan portfolio gagal dimuat dari Supabase:', error);
    }
}
