(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('#theme-toggle');
  const printButton = document.querySelector('#print-cv');
  const storageKey = 'theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem(storageKey);
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
    localStorage.setItem(storageKey, theme);
  };

  setTheme(initialTheme);
  themeToggle?.addEventListener('change', () => setTheme(themeToggle.checked ? 'dark' : 'light'));
  printButton?.addEventListener('click', () => window.print());

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
