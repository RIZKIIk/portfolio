import { escapeHtml, safeHttpUrl } from '../core/helpers.js';

// Build one project card from escaped content and links restricted to HTTP(S).
export function createProjectCard(project) {
    const title = escapeHtml(project.title || 'Proyek');
    const description = escapeHtml(project.description || '');
    const tags = (Array.isArray(project.tech_stack) ? project.tech_stack : [])
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join('');
    const demoUrl = safeHttpUrl(project.demo_url);
    const githubUrl = safeHttpUrl(project.github_url);
    const imageUrl = safeHttpUrl(project.image_url) || 'media/projects/portfolio.svg';
    const demoLink = demoUrl
        ? `<a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-sm">Lihat demo <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
        : '';
    const githubLink = githubUrl
        ? `<a href="${escapeHtml(githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-project-source">Kode sumber <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
        : '';

    const card = document.createElement('article');
    card.className = 'project-card reveal-bottom active';
    card.innerHTML = `<div class="project-img"><img src="${escapeHtml(imageUrl)}" alt="Gambar proyek ${title}" loading="lazy" decoding="async" data-fallback="media/projects/portfolio.svg"></div><div class="project-info"><h3>${title}</h3><p>${description}</p><div class="project-tags">${tags}</div><div class="project-links">${demoLink}${githubLink}</div></div>`;
    return card;
}
