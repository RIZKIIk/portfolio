let supabaseLibraryPromise;

// Load the optional Supabase browser library only when remote portfolio data is configured.
export async function createSupabaseClient(config) {
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
    if (window.supabase) {
        return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    }

    if (!supabaseLibraryPromise) {
        supabaseLibraryPromise = new Promise((resolve) => {
            const library = document.createElement('script');
            library.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            library.async = true;
            library.addEventListener('load', () => resolve(window.supabase || null), { once: true });
            library.addEventListener('error', () => {
                console.error('Library Supabase gagal dimuat; portfolio memakai konten bawaan.');
                resolve(null);
            }, { once: true });
            document.head.appendChild(library);
        });
    }

    const supabase = await supabaseLibraryPromise;
    return supabase
        ? supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
        : null;
}
