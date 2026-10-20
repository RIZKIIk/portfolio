import { initializeImageFallbacks } from '../core/helpers.js';
import { createProjectCard } from '../components/project-card.js';
import { fetchPublishedProjects } from '../services/portfolio-repository.js';

// Replace the static project cards only after remote data has loaded successfully.
export async function initializeProjectGallery(client) {
    const projectGrid = document.querySelector('.projects-grid');
    if (!client || !projectGrid) return;

    try {
        const projects = await fetchPublishedProjects(client);
        if (!projects.length) {
            projectGrid.replaceChildren(Object.assign(document.createElement('p'), {
                className: 'project-empty-state',
                textContent: 'Belum ada proyek yang ditayangkan.'
            }));
            return;
        }

        projectGrid.replaceChildren(...projects.map(createProjectCard));
        initializeImageFallbacks(projectGrid);
    } catch (error) {
        console.warn('Proyek portfolio gagal dimuat dari Supabase:', error);
    }
}
