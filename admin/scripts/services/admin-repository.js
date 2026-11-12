const PROJECT_FIELDS = 'id,title,description,image_url,tech_stack,demo_url,github_url,published,created_at';
const EDITABLE_PROJECT_FIELDS = 'id,title,description,image_url,tech_stack,demo_url,github_url,published';
const SITE_SETTINGS_FIELDS = 'profile_image_url,background_image_url,background_video_url';

/**
 * Membungkus operasi database dan Storage yang dipakai dashboard admin.
 *
 * @param {object} client Client Supabase yang sudah terautentikasi.
 * @param {string} storageBucket Nama bucket Storage aset portofolio.
 * @returns {object} Operasi data admin dengan bentuk hasil Supabase.
 */
export function createAdminRepository(client, storageBucket) {
    return {
        listProjects() {
            return client.from('projects')
                .select(PROJECT_FIELDS)
                .order('created_at', { ascending: false });
        },

        listProjectTitles() {
            return client.from('projects').select('title');
        },

        findProjectById(projectId) {
            return client.from('projects')
                .select(EDITABLE_PROJECT_FIELDS)
                .eq('id', projectId)
                .single();
        },

        insertProjects(projects) {
            return client.from('projects').insert(projects);
        },

        saveProject(project, projectId) {
            const query = projectId
                ? client.from('projects').update(project).eq('id', projectId)
                : client.from('projects').insert(project);
            return query;
        },

        deleteProject(projectId) {
            return client.from('projects').delete().eq('id', projectId);
        },

        getSiteSettings() {
            return client.from('site_settings')
                .select(SITE_SETTINGS_FIELDS)
                .eq('id', 'main')
                .maybeSingle();
        },

        saveSiteSettings(settings) {
            return client.from('site_settings').upsert(settings, { onConflict: 'id' });
        },

        uploadAsset(path, file, options) {
            return client.storage.from(storageBucket).upload(path, file, options);
        },

        getAssetUrl(path) {
            return client.storage.from(storageBucket).getPublicUrl(path).data.publicUrl;
        },

        removeAssets(paths) {
            return client.storage.from(storageBucket).remove(paths);
        }
    };
}
