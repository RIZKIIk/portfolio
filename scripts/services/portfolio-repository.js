// Keep Supabase queries in one place so UI modules depend on data, not query details.
export async function fetchPublishedProjects(client) {
    const { data, error } = await client
        .from('projects')
        .select('title, description, image_url, tech_stack, demo_url, github_url')
        .eq('published', true)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) throw new TypeError('Daftar proyek dari Supabase tidak valid.');
    return data;
}

export async function fetchPublishedSiteSettings(client) {
    const { data, error } = await client
        .from('site_settings')
        .select('profile_image_url,background_image_url,background_video_url')
        .eq('id', 'main')
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
}
