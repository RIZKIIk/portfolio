/**
 * Filter project records by title, technology, and publication state.
 *
 * @param {Array<object>} projects Project records from the admin repository.
 * @param {string} searchText Search term entered by the administrator.
 * @param {string} statusFilter Selected publication filter.
 * @returns {Array<object>} Matching project records.
 */
export function filterProjects(projects, searchText, statusFilter) {
    const query = searchText.trim().toLowerCase();
    return projects.filter((project) => {
        const matchesQuery = !query
            || String(project.title || '').toLowerCase().includes(query)
            || (project.tech_stack || []).some((tag) => String(tag).toLowerCase().includes(query));
        const matchesStatus = statusFilter === 'all'
            || (statusFilter === 'published' ? project.published : !project.published);
        return matchesQuery && matchesStatus;
    });
}

/**
 * Render project records into the admin list without inserting remote text as HTML.
 *
 * @param {HTMLElement} projectList List container.
 * @param {Array<object>} projects Project records to display.
 * @param {(value: string) => string} normalizeHttpUrl HTTPS URL validator.
 */
export function renderProjectList(projectList, projects, normalizeHttpUrl) {
    if (!projects.length) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Belum ada project. Tambahkan project pertama Anda.';
        projectList.replaceChildren(emptyState);
        return;
    }

    const fragment = document.createDocumentFragment();
    projects.forEach((project) => {
        const item = document.createElement('article');
        item.className = 'project-item';
        const main = document.createElement('div');
        main.className = 'project-item-main';
        const image = document.createElement('img');
        image.alt = '';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';
        image.src = normalizeHttpUrl(project.image_url) || '../media/project-previews/portfolio.svg';
        image.addEventListener('error', () => {
            image.src = '../media/project-previews/portfolio.svg';
        }, { once: true });

        const details = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = project.title || 'Project tanpa nama';
        const description = document.createElement('p');
        description.textContent = project.description || '';
        const chips = document.createElement('div');
        chips.className = 'chips';
        (project.tech_stack || []).slice(0, 12).forEach((tag) => {
            const chip = document.createElement('span');
            chip.textContent = tag;
            chips.appendChild(chip);
        });
        details.append(title, description, chips);
        main.append(image, details);

        const actions = document.createElement('div');
        actions.className = 'project-item-actions';
        const status = document.createElement('span');
        status.className = project.published ? 'badge badge-live' : 'badge';
        status.textContent = project.published ? 'Ditayangkan' : 'Draft';
        const editButton = document.createElement('button');
        editButton.className = 'text-button';
        editButton.dataset.edit = String(project.id);
        editButton.type = 'button';
        editButton.textContent = 'Ubah';
        const deleteButton = document.createElement('button');
        deleteButton.className = 'danger-button';
        deleteButton.dataset.delete = String(project.id);
        deleteButton.type = 'button';
        deleteButton.textContent = 'Hapus';
        actions.append(status, editButton, deleteButton);
        item.append(main, actions);
        fragment.appendChild(item);
    });
    projectList.replaceChildren(fragment);
}
