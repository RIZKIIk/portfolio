# Portfolio Admin Setup

Dashboard ini memakai Supabase untuk satu akun admin.

## 1. Buat tabel dan policy

Jalankan SQL berikut di Supabase SQL Editor:

```sql
create table public.projects (
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

create policy "Public can read published projects"
on public.projects for select
using (published = true or auth.uid() is not null);

create policy "Admin can insert projects"
on public.projects for insert
to authenticated
with check (auth.uid() is not null);

create policy "Admin can update projects"
on public.projects for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Admin can delete projects"
on public.projects for delete
to authenticated
using (auth.uid() is not null);
```

Untuk single-admin yang lebih ketat, ganti policy authenticated dengan pengecekan email admin Anda:

```sql
(auth.jwt() ->> 'email') = 'EMAIL_ADMIN_ANDA'
```

Gunakan policy berikut agar database juga menolak user lain. Jalankan setelah policy awal dibuat:

```sql
drop policy if exists "Admin can insert projects" on public.projects;
drop policy if exists "Admin can update projects" on public.projects;
drop policy if exists "Admin can delete projects" on public.projects;

create policy "Only portfolio admin can insert"
on public.projects for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'diazggs321@gmail.com');

create policy "Only portfolio admin can update"
on public.projects for update to authenticated
using ((auth.jwt() ->> 'email') = 'diazggs321@gmail.com')
with check ((auth.jwt() ->> 'email') = 'diazggs321@gmail.com');

create policy "Only portfolio admin can delete"
on public.projects for delete to authenticated
using ((auth.jwt() ->> 'email') = 'diazggs321@gmail.com');
```

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

Anon key boleh berada di frontend jika RLS aktif. Jangan masukkan service role key.

## 4. Buka dashboard

```text
/admin/
```

Setelah login, klik **Import project lama** untuk memasukkan tiga project yang sebelumnya ditulis langsung di `index.html`. Import aman dijalankan berulang kali karena project yang sudah ada dilewati berdasarkan nama.

Fitur dashboard yang tersedia:

- **Ubah password**: buka panel di header, masukkan password baru minimal 8 karakter, lalu konfirmasi.
- **Cari project**: cari berdasarkan nama atau teknologi.
- **Filter status**: tampilkan semua, published, atau draft.
- **Preview project**: lihat tampilan kartu sebelum menyimpan.
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
