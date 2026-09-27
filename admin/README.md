# Pengaturan Admin Portofolio

Dashboard ini memakai Supabase untuk satu akun admin. Policy database, bukan pemeriksaan email di browser, menjadi batas akses yang sebenarnya.

## 1. Buat tabel dan policy yang aman

Jalankan SQL berikut di Supabase SQL Editor. Policy ini menjadikan proyek yang ditayangkan dapat dibaca publik; draf dan operasi tulis hanya dapat diakses email admin. Sesuaikan alamat pada policy agar sama persis dengan `adminEmail` di `portfolio-config.js`.

Jika Supabase sudah pernah disiapkan untuk dashboard proyek, jalankan SQL ini lagi untuk membuat tabel `site_settings` dan memperbarui bucket agar menerima video MP4.

```sql
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text not null,
  tech_stack text[] not null default '{}',
  demo_url text,
  github_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

revoke all on table public.projects from anon, authenticated;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

drop policy if exists "Public can read published projects" on public.projects;
drop policy if exists "Admin can insert projects" on public.projects;
drop policy if exists "Admin can update projects" on public.projects;
drop policy if exists "Admin can delete projects" on public.projects;
drop policy if exists "Only portfolio admin can insert" on public.projects;
drop policy if exists "Only portfolio admin can update" on public.projects;
drop policy if exists "Only portfolio admin can delete" on public.projects;
drop policy if exists "Portfolio admin can read all projects" on public.projects;
drop policy if exists "Portfolio admin can insert projects" on public.projects;
drop policy if exists "Portfolio admin can update projects" on public.projects;
drop policy if exists "Portfolio admin can delete projects" on public.projects;

create policy "Public can read published projects"
on public.projects for select to anon, authenticated
using (
  published = true
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com'
);

create policy "Portfolio admin can insert projects"
on public.projects for insert to authenticated
with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com');

create policy "Portfolio admin can update projects"
on public.projects for update to authenticated
using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com')
with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com');

create policy "Portfolio admin can delete projects"
on public.projects for delete to authenticated
using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com');

create table if not exists public.site_settings (
  id text primary key check (id = 'main'),
  profile_image_url text,
  background_image_url text,
  background_video_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Portfolio admin can insert site settings" on public.site_settings;
drop policy if exists "Portfolio admin can update site settings" on public.site_settings;

create policy "Public can read site settings"
on public.site_settings for select to anon, authenticated using (true);

create policy "Portfolio admin can insert site settings"
on public.site_settings for insert to authenticated
with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com');

create policy "Portfolio admin can update site settings"
on public.site_settings for update to authenticated
using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com')
with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-project-images',
  'portfolio-project-images',
  true,
  26214400,
  array['image/webp', 'video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio admin can upload project images" on storage.objects;
drop policy if exists "Portfolio admin can delete project images" on storage.objects;

create policy "Portfolio admin can upload project images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'portfolio-project-images'
  and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com'
);

create policy "Portfolio admin can delete project images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'portfolio-project-images'
  and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'diazggs321@gmail.com'
);
```

Policy RLS lama lain yang memberi akses lebih luas kepada `anon` atau `authenticated` harus dihapus juga, baik pada `public.projects` maupun `storage.objects`. Policy yang permissive bisa membuka akses meskipun policy admin di atas sudah ada. Bucket gambar bersifat public-read agar thumbnail yang ditayangkan dapat dilihat pengunjung; upload dan hapus tetap hanya untuk email admin.

## 2. Buat user admin

Di Supabase buka **Authentication > Users > Add user**, lalu buat email/password Anda.

## 3. Isi konfigurasi

Buka `portfolio-config.js`, isi URL dan anon key dari **Project Settings > API**:

```js
window.PORTFOLIO_CONFIG = {
  supabaseUrl: 'https://PROJECT_ID.supabase.co',
  supabaseAnonKey: 'PUBLIC_ANON_KEY'
};
```

Anon key/publishable key memang dikirim ke browser dan hanya aman jika RLS serta policy di atas sudah aktif. Jangan pernah masukkan service role/secret key ke `portfolio-config.js`.

## 4. Buka dashboard

```text
/admin/
```

Setelah login, klik **Import project lama** untuk memasukkan tiga project yang sebelumnya ditulis langsung di `index.html`. Import aman dijalankan berulang kali karena project yang sudah ada dilewati berdasarkan nama.

Fitur dashboard yang tersedia:

- **Upload thumbnail proyek**: pilih JPG, PNG, atau WebP lalu atur zoom dan posisi crop rasio 16:10 sesuai pratinjau kartu. File sumber maksimal 6 MB dan hasil crop dikonversi ke WebP sebelum diunggah. URL HTTPS tetap tersedia sebagai alternatif.
- **Konfigurasi website**: panel Identitas Visual mengatur foto profil, gambar latar, dan video latar. Foto profil ikut diperbarui di halaman CV; saat upload, atur zoom dan posisi crop persegi melalui pratinjau. Gambar dikecilkan dan dikonversi ke WebP. Video MP4 maksimal 24 MB. Aset juga dapat memakai URL HTTPS. Pengaturan disimpan pada tabel `site_settings` dari SQL langkah 1.

- **Ubah password**: buka panel di header, masukkan password baru minimal 8 karakter, lalu konfirmasi.
- **Cari proyek**: cari berdasarkan nama atau teknologi.
- **Filter status**: tampilkan semua, ditayangkan, atau draft.
- **Pratinjau proyek**: lihat tampilan kartu sebelum menyimpan.
- **Lupa password**: dari halaman login klik `Lupa password?`, masukkan email admin, lalu buka link reset dari inbox.

Untuk reset password setelah deploy, tambahkan URL berikut di **Supabase → Authentication → URL Configuration → Redirect URLs**:

```text
https://rizz-portfolio.vercel.app/admin/
```

Untuk testing melalui localhost, tambahkan juga URL server lokal yang dipakai, misalnya:

```text
http://localhost:5500/portfolio/admin/
```

Link email yang dibuat dari file lokal akan diarahkan ke halaman Vercel agar tidak menghasilkan link `file://` yang tidak bisa dibuka dari email.

Jika belum dikonfigurasi, portfolio tetap memakai project statis yang sudah ada.
