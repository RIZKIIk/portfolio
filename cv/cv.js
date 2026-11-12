import { fetchPublishedProjects, fetchPublishedSiteSettings } from '../scripts/services/portfolio-repository.js';
import { createSupabaseClient } from '../scripts/services/supabase-client.js';

(() => {
  const printButton = document.querySelector('#print-cv');

  document.querySelectorAll('img[data-fallback]').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = 'true';
      image.src = image.dataset.fallback;
    });
  });

  printButton?.addEventListener('click', () => window.print());

  // Reuse the portfolio's published project source so the CV stays in sync.
  window.addEventListener('load', async () => {
    const config = window.PORTFOLIO_CONFIG || {};
    try {
      const client = await createSupabaseClient(config);
      if (!client) return;
      const settings = await fetchPublishedSiteSettings(client);
      const profileImage = document.querySelector('.profile-image');
      if (settings?.profile_image_url && profileImage) profileImage.src = settings.profile_image_url;

      const grid = document.querySelector('.projects-grid');
      if (!grid) return;
      const projects = await fetchPublishedProjects(client);
      if (!projects.length) {
        grid.replaceChildren(Object.assign(document.createElement('p'), { className: 'muted', textContent: 'Belum ada proyek yang ditayangkan.' }));
        return;
      }
      const fragment = document.createDocumentFragment();
      projects.forEach((project) => {
        const card = document.createElement('article');
        card.className = 'panel project-card';
        const title = document.createElement('h3'); title.textContent = project.title || 'Proyek';
        const chips = document.createElement('div'); chips.className = 'chips';
        (Array.isArray(project.tech_stack) ? project.tech_stack : []).forEach((tech) => {
          const chip = document.createElement('span'); chip.textContent = tech; chips.append(chip);
        });
        const description = document.createElement('p'); description.textContent = project.description || '';
        card.append(title, chips, description); fragment.append(card);
      });
      grid.replaceChildren(fragment);
    } catch (error) {
      console.warn('Konten CV gagal dimuat dari Supabase:', error);
    }
  }, { once: true });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.panel, .content-section, .sidebar');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    document.body.classList.add('is-ready');
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
  window.addEventListener('load', () => document.body.classList.add('is-ready'), { once: true });
})();
