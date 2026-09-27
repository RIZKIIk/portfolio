(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('#theme-toggle');
  const printButton = document.querySelector('#print-cv');
  const storageKey = 'theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(storageKey); } catch (_) { /* Use the system theme. */ }
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.querySelectorAll('img[data-fallback]').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = 'true';
      image.src = image.dataset.fallback;
    });
  });

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.checked = theme === 'dark';
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap');
    }
    try { localStorage.setItem(storageKey, theme); } catch (_) { /* Theme still applies for this visit. */ }
  };

  setTheme(initialTheme);
  themeToggle?.addEventListener('change', () => setTheme(themeToggle.checked ? 'dark' : 'light'));
  printButton?.addEventListener('click', () => window.print());

  // Reuse the portfolio's published project source so the CV stays in sync.
  window.addEventListener('load', async () => {
    const config = window.PORTFOLIO_CONFIG || {};
    const grid = document.querySelector('.projects-grid');
    if (!grid || !window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) return;
    try {
      const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      const { data, error } = await client.from('projects')
        .select('title,description,tech_stack,published')
        .eq('published', true).order('created_at', { ascending: false });
      if (error || !Array.isArray(data)) return;
      if (!data.length) {
        grid.replaceChildren(Object.assign(document.createElement('p'), { className: 'muted', textContent: 'Belum ada proyek yang ditayangkan.' }));
        return;
      }
      const fragment = document.createDocumentFragment();
      data.forEach((project) => {
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
    } catch { /* Static project cards remain as a resilient fallback. */ }
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
