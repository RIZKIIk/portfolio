import { initializeBackgroundControls } from './scripts/features/background.js';
import { initializeAnimations } from './scripts/features/animations.js';
import { initializeAccordion } from './scripts/features/accordion.js';
import { initializeContactForm } from './scripts/features/contact-form.js';
import { initializeFooter } from './scripts/features/footer.js';
import { initializeHeroTyping } from './scripts/features/hero-typing.js';
import { initializeMobileMenu } from './scripts/features/mobile-menu.js';
import { initializePortfolioSharing } from './scripts/features/sharing.js';
import { initializePreloader } from './scripts/features/preloader.js';
import { initializeProjectGallery } from './scripts/features/project-gallery.js';
import { initializeScrollUi } from './scripts/features/scroll-ui.js';
import { initializeSkills } from './scripts/features/skills.js';
import { initializeSiteSettings } from './scripts/features/site-settings.js';
import { initializeTheme } from './scripts/features/theme.js';
import { initializeImageFallbacks } from './scripts/core/helpers.js';
import { createSupabaseClient } from './scripts/services/supabase-client.js';

// This file only connects the page features; each module owns one responsibility.
function initializePortfolio() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initializeImageFallbacks();
    const applyBackgroundSettings = initializeBackgroundControls();
    initializeMobileMenu();
    initializeHeroTyping();
    initializeTheme();
    initializeSkills();
    initializeAnimations(prefersReducedMotion);
    initializeContactForm();
    initializePortfolioSharing();
    initializePreloader();
    initializeScrollUi(prefersReducedMotion);
    initializeAccordion();
    initializeFooter();

    void initializeRemoteContent(applyBackgroundSettings);
}

// Remote content is optional; each feature keeps its static page fallback on failure.
async function initializeRemoteContent(applyBackgroundSettings) {
    try {
        const client = await createSupabaseClient(window.PORTFOLIO_CONFIG || {});
        if (!client) return;

        const results = await Promise.allSettled([
            initializeProjectGallery(client),
            initializeSiteSettings(client, applyBackgroundSettings)
        ]);
        results.forEach((result) => {
            if (result.status === 'rejected') {
                console.error('Inisialisasi konten portfolio gagal:', result.reason);
            }
        });
    } catch (error) {
        console.error('Koneksi konten portfolio gagal:', error);
    }
}

initializePortfolio();
