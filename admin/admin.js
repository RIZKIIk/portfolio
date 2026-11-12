import { createSupabaseClient } from '../scripts/services/supabase-client.js';
import { createAdminRepository } from './scripts/services/admin-repository.js';
import { optimizeImage, optimizeProfileImage, optimizeProjectThumbnail } from './scripts/services/image-processing.js';
import { filterProjects, renderProjectList } from './scripts/features/project-list.js';

(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const adminEmail = (config.adminEmail || '').trim().toLowerCase();
  const hasCredentials = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.adminEmail);
  const setupNotice = document.querySelector('#setup-notice');
  const authView = document.querySelector('#auth-view');
  const dashboardView = document.querySelector('#dashboard-view');
  const loginForm = document.querySelector('#login-form');
  const projectForm = document.querySelector('#project-form');
  const projectList = document.querySelector('#project-list');
  const formStatus = document.querySelector('#form-status');
  const authStatus = document.querySelector('#auth-status');
  const forgotPasswordButton = document.querySelector('#forgot-password-button');
  const forgotPasswordForm = document.querySelector('#forgot-password-form');
  const backToLogin = document.querySelector('#back-to-login');
  const recoveryUpdateForm = document.querySelector('#recovery-update-form');
  const recoveryStatus = document.querySelector('#recovery-status');
  const recoveryUpdateStatus = document.querySelector('#recovery-update-status');
  const formTitle = document.querySelector('#form-title');
  const submitLabel = document.querySelector('#submit-label');
  const cancelEdit = document.querySelector('#cancel-edit');
  const importLegacyButton = document.querySelector('#import-legacy-projects');
  const passwordPanel = document.querySelector('#password-panel');
  const passwordForm = document.querySelector('#password-form');
  const passwordStatus = document.querySelector('#password-status');
  const projectSearch = document.querySelector('#project-search');
  const projectFilter = document.querySelector('#project-filter');
  const projectPreview = document.querySelector('#project-preview');
  const projectImageUrl = document.querySelector('#project-image');
  const projectImageFile = document.querySelector('#project-image-file');
  const imageFileName = document.querySelector('#image-file-name');
  const imageUploadStatus = document.querySelector('#image-upload-status');
  const previewMedia = document.querySelector('#project-preview .preview-media');
  const previewStatus = document.querySelector('#preview-status');
  const previewTitle = document.querySelector('#preview-title');
  const previewDescription = document.querySelector('#preview-description');
  const previewChips = document.querySelector('#preview-chips');
  const previewLinks = document.querySelector('#preview-links');
  const projectCrop = {
    tools: document.querySelector('#project-crop-tools'),
    zoom: document.querySelector('#project-crop-zoom'),
    x: document.querySelector('#project-crop-x'),
    y: document.querySelector('#project-crop-y')
  };
  const projectSubmitButton = projectForm.querySelector('[type="submit"]');
  const siteSettingsForm = document.querySelector('#site-settings-form');
  const siteSettingsStatus = document.querySelector('#site-settings-status');
  const saveSiteSettingsButton = document.querySelector('#save-site-settings');
  const siteAssetFields = {
    profile: { file: document.querySelector('#settings-profile-file'), url: document.querySelector('#settings-profile-url'), preview: document.querySelector('#settings-profile-preview'), cropTools: document.querySelector('#profile-crop-tools'), zoom: document.querySelector('#settings-profile-zoom'), x: document.querySelector('#settings-profile-x'), y: document.querySelector('#settings-profile-y'), type: 'image', crop: true },
    background: { file: document.querySelector('#settings-background-file'), url: document.querySelector('#settings-background-url'), preview: document.querySelector('#settings-background-preview'), type: 'image' },
    video: { file: document.querySelector('#settings-video-file'), url: document.querySelector('#settings-video-url'), preview: document.querySelector('#settings-video-preview'), type: 'video' }
  };
  const storageBucket = 'portfolio-project-images';
  const maxSourceImageBytes = 6 * 1024 * 1024;
  const maxStoredImageBytes = 3 * 1024 * 1024;
  let allProjects = [];
  let client;
  let repository;
  let previewObjectUrl = '';
  const sitePreviewUrls = {};

  document.querySelectorAll('.password-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.passwordTarget);
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      toggle.setAttribute('aria-label', visible ? 'Tampilkan password' : 'Sembunyikan password');
      toggle.querySelector('span').textContent = visible ? '◉' : '◌';
    });
  });

  const legacyProjects = [
    { title: 'Movie Database App', description: 'Website katalog film modern dengan pencarian, filter, detail film, dan tema gelap/terang.', image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&q=80', tech_stack: ['React', 'TypeScript', 'Vite', 'TMDB'], demo_url: 'https://movie-rizz.vercel.app', github_url: null, published: true },
    { title: 'Website Portfolio', description: 'Desain web responsif modern menggunakan HTML, CSS, dan JS murni.', image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80', tech_stack: ['UI/UX', 'Responsive', 'Animation'], demo_url: 'https://rizz-portfolio.vercel.app/', github_url: 'https://github.com/RIZKIIk/portfolio', published: true },
    { title: 'Money Tracker', description: 'Aplikasi pelacakan pengeluaran dan pemasukan dengan fitur grafik dan laporan bulanan.', image_url: 'https://pencatat-keuangan-omega.vercel.app/media/icon.png', tech_stack: ['Logic', 'HTML', 'CSS', 'JavaScript'], demo_url: 'https://pencatat-keuangan-omega.vercel.app/', github_url: null, published: true }
  ];

  const setStatus = (element, message, isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.dataset.error = String(isError);
  };

  const fields = () => ({
    id: document.querySelector('#project-id').value,
    title: document.querySelector('#project-title').value.trim(),
    description: document.querySelector('#project-description').value.trim(),
    image_url: projectImageUrl.value.trim(),
    tech_stack: document.querySelector('#project-tech').value.split(',').map((tag) => tag.trim()).filter(Boolean),
    demo_url: document.querySelector('#project-demo').value.trim() || null,
    github_url: document.querySelector('#project-github').value.trim() || null,
    published: document.querySelector('#project-published').checked
  });

  const normalizeHttpUrl = (value) => {
    try {
      const url = new URL(String(value).trim());
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      return url.href;
    } catch {
      return '';
    }
  };

  const clearSelectedImage = (clearFile = true) => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
    if (clearFile) projectImageFile.value = '';
    projectCrop.tools.hidden = true;
    projectCrop.zoom.value = '1';
    projectCrop.x.value = '50';
    projectCrop.y.value = '50';
    imageFileName.textContent = 'Belum ada gambar dipilih';
    setStatus(imageUploadStatus, '');
  };

  const createStoragePath = (folder = 'projects', extension = 'webp') => {
    if (crypto.randomUUID) return `${folder}/${crypto.randomUUID()}.${extension}`;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return `${folder}/${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}.${extension}`;
  };

  const uploadProjectImage = async (file) => {
    const image = await optimizeProjectThumbnail(file, {
      zoom: projectCrop.zoom.value,
      x: projectCrop.x.value,
      y: projectCrop.y.value
    }, maxSourceImageBytes, maxStoredImageBytes);
    const path = createStoragePath();
    const { error } = await repository.uploadAsset(path, image, {
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: false
    });
    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('bucket not found')) {
        throw new Error('Bucket gambar belum dibuat. Jalankan SQL upload gambar dari admin/README.md.');
      }
      if (message.includes('row-level security') || message.includes('policy')) {
        throw new Error('Upload ditolak oleh policy Storage. Jalankan policy bucket dari admin/README.md.');
      }
      throw error;
    }
    return { path, url: repository.getAssetUrl(path) };
  };

  const updateSiteAssetPreview = (field, value = '') => {
    const preview = siteAssetFields[field];
    const source = value || (field === 'profile' ? '../media/me.jpg' : field === 'background' ? '../media/foto.jpg' : '../media/video.mp4');
    if (preview.type === 'video') {
      preview.preview.src = source;
      preview.preview.load();
    } else {
      preview.preview.src = source;
      if (field === 'profile') updateProfileCropPreview();
    }
  };

  const updateProfileCropPreview = () => {
    const profile = siteAssetFields.profile;
    const hasFile = Boolean(profile.file.files?.length);
    profile.cropTools.hidden = !hasFile;
    profile.preview.style.transform = hasFile ? `scale(${profile.zoom.value})` : '';
    profile.preview.style.objectPosition = hasFile ? `${profile.x.value}% ${profile.y.value}%` : 'center';
  };

  const loadSiteSettings = async () => {
    const { data, error } = await repository.getSiteSettings();
    if (error) {
      setStatus(siteSettingsStatus, 'Pengaturan belum dapat dimuat. Jalankan SQL site_settings dari admin/README.md.', true);
      return;
    }
    const values = {
      profile: data?.profile_image_url || '',
      background: data?.background_image_url || '',
      video: data?.background_video_url || ''
    };
    Object.entries(values).forEach(([key, value]) => {
      siteAssetFields[key].url.value = value;
      updateSiteAssetPreview(key, value);
    });
    setStatus(siteSettingsStatus, data ? 'Pengaturan website dimuat.' : 'Belum ada pengaturan tersimpan; aset bawaan sedang digunakan.');
  };

  const uploadSiteAsset = async (file, field) => {
    const isVideo = field.type === 'video';
    let body;
    let extension;
    let contentType;
    if (isVideo) {
      if (file.type !== 'video/mp4') throw new Error('Video latar harus berformat MP4.');
      if (file.size > 24 * 1024 * 1024) throw new Error('Ukuran video maksimal 24 MB.');
      body = file;
      extension = 'mp4';
      contentType = 'video/mp4';
    } else {
      body = field.crop
        ? await optimizeProfileImage(file, {
          zoom: field.zoom.value,
          x: field.x.value,
          y: field.y.value
        }, maxSourceImageBytes, maxStoredImageBytes)
        : await optimizeImage(file, maxSourceImageBytes, maxStoredImageBytes);
      extension = 'webp';
      contentType = 'image/webp';
    }
    const path = createStoragePath('settings', extension);
    const { error } = await repository.uploadAsset(path, body, {
      cacheControl: '3600', contentType, upsert: false
    });
    if (error) throw error;
    return repository.getAssetUrl(path);
  };

  const managedStoragePath = (imageUrl) => {
    try {
      const url = new URL(imageUrl);
      const supabaseOrigin = new URL(config.supabaseUrl).origin;
      const prefix = `/storage/v1/object/public/${storageBucket}/`;
      if (url.origin !== supabaseOrigin || !url.pathname.startsWith(prefix)) return '';
      const path = decodeURIComponent(url.pathname.slice(prefix.length));
      return /^(?:projects\/(?:[0-9a-f-]{36}|[0-9a-f]{32})\.webp|settings\/(?:[0-9a-f-]{36}|[0-9a-f]{32})\.(?:webp|mp4))$/i.test(path) ? path : '';
    } catch {
      return '';
    }
  };

  const removeManagedImage = async (imageUrl) => {
    const path = managedStoragePath(imageUrl);
    if (!path) return;
    const { error } = await repository.removeAssets([path]);
    if (error) console.warn('Gambar lama tidak dapat dihapus dari Storage.');
  };

  const resetForm = () => {
    clearSelectedImage();
    projectForm.reset();
    document.querySelector('#project-id').value = '';
    document.querySelector('#project-published').checked = true;
    formTitle.textContent = 'Tambah proyek';
    submitLabel.textContent = 'Simpan proyek';
    cancelEdit.hidden = true;
    setStatus(formStatus, '');
    updatePreview();
  };

  const fillForm = (project) => {
    clearSelectedImage();
    document.querySelector('#project-id').value = project.id;
    document.querySelector('#project-title').value = project.title;
    document.querySelector('#project-description').value = project.description;
    projectImageUrl.value = project.image_url || '';
    document.querySelector('#project-tech').value = (project.tech_stack || []).join(', ');
    document.querySelector('#project-demo').value = project.demo_url || '';
    document.querySelector('#project-github').value = project.github_url || '';
    document.querySelector('#project-published').checked = project.published;
    formTitle.textContent = 'Edit project';
    submitLabel.textContent = 'Simpan perubahan';
    cancelEdit.hidden = false;
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  projectImageFile.addEventListener('change', () => {
    const file = projectImageFile.files?.[0];
    clearSelectedImage(false);
    if (!file) {
      updatePreview();
      return;
    }
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type) || file.size > maxSourceImageBytes) {
      projectImageFile.value = '';
      setStatus(imageUploadStatus, acceptedTypes.includes(file.type) ? 'Ukuran gambar maksimal 6 MB.' : 'Pilih gambar JPG, PNG, atau WebP.', true);
      updatePreview();
      return;
    }
    imageFileName.textContent = `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB`;
    previewObjectUrl = URL.createObjectURL(file);
    projectCrop.tools.hidden = false;
    setStatus(imageUploadStatus, 'Gambar siap dioptimalkan saat disimpan.');
    updatePreview();
  });

  const updatePreview = () => {
    const project = fields();
    const imageUrl = previewObjectUrl || normalizeHttpUrl(project.image_url);
    previewStatus.textContent = project.published ? 'Akan ditayangkan' : 'Draft';
    previewTitle.textContent = project.title || 'Nama proyek Anda';
    previewDescription.textContent = project.description || 'Isi form untuk melihat preview project.';
    previewMedia.hidden = !imageUrl;
    previewMedia.referrerPolicy = 'no-referrer';
    previewMedia.style.transform = previewObjectUrl ? `scale(${projectCrop.zoom.value})` : '';
    previewMedia.style.objectPosition = previewObjectUrl ? `${projectCrop.x.value}% ${projectCrop.y.value}%` : 'center';
    projectPreview.classList.toggle('has-image', Boolean(imageUrl));
    if (imageUrl && previewMedia.getAttribute('src') !== imageUrl) previewMedia.src = imageUrl;
    if (!imageUrl) previewMedia.removeAttribute('src');
    previewChips.replaceChildren(...project.tech_stack.slice(0, 12).map((tag) => {
      const chip = document.createElement('span');
      chip.textContent = tag;
      return chip;
    }));
    previewLinks.replaceChildren(...[
      project.demo_url && normalizeHttpUrl(project.demo_url) ? 'Demo tersedia' : '',
      project.github_url && normalizeHttpUrl(project.github_url) ? 'GitHub tersedia' : ''
    ].filter(Boolean).map((label) => {
      const linkHint = document.createElement('span');
      linkHint.textContent = label;
      return linkHint;
    }));
  };

  const filteredProjects = () => {
    return filterProjects(allProjects, projectSearch.value, projectFilter.value);
  };

  const loadProjects = async () => {
    const { data, error } = await repository.listProjects();
    if (error) {
      setStatus(formStatus, error.message, true);
      return;
    }
    allProjects = data || [];
    renderProjectList(projectList, filteredProjects(), normalizeHttpUrl);
  };

  const importLegacyProjects = async () => {
    importLegacyButton.disabled = true;
    const originalLabel = importLegacyButton.textContent;
    importLegacyButton.textContent = 'Mengimpor…';
    try {
      const { data: existing, error: readError } = await repository.listProjectTitles();
      if (readError) {
        setStatus(formStatus, readError.message, true);
      } else {
        const existingTitles = new Set((existing || []).map((project) => String(project.title || '').toLowerCase()));
        const missing = legacyProjects.filter((project) => !existingTitles.has(project.title.toLowerCase()));
        if (!missing.length) {
          setStatus(formStatus, 'Semua proyek lama sudah ada di database.');
        } else {
          const { error } = await repository.insertProjects(missing);
          if (error) setStatus(formStatus, error.message, true);
          else setStatus(formStatus, `${missing.length} proyek lama berhasil diimpor.`);
        }
        await loadProjects();
      }
    } catch {
      setStatus(formStatus, 'Impor belum berhasil. Periksa koneksi lalu coba lagi.', true);
    } finally {
      importLegacyButton.disabled = false;
      importLegacyButton.textContent = originalLabel;
    }
  };

  const showDashboard = () => {
    authView.hidden = true;
    dashboardView.hidden = false;
    loadProjects();
    loadSiteSettings();
  };

  const showLogin = () => {
    loginForm.hidden = false;
    forgotPasswordForm.hidden = true;
    recoveryUpdateForm.hidden = true;
    setStatus(authStatus, '');
    setStatus(recoveryStatus, '');
    setStatus(recoveryUpdateStatus, '');
  };

  const showRecoveryUpdate = () => {
    authView.hidden = false;
    dashboardView.hidden = true;
    loginForm.hidden = true;
    forgotPasswordForm.hidden = true;
    recoveryUpdateForm.hidden = false;
    document.querySelector('#recovery-password').focus();
  };

  if (!hasCredentials) {
    setupNotice.hidden = false;
  } else {
    createSupabaseClient(config).then((supabaseClient) => {
      if (!supabaseClient) {
        authView.hidden = false;
        setStatus(authStatus, 'Layanan autentikasi belum termuat. Periksa koneksi lalu muat ulang halaman.', true);
        return;
      }
      client = supabaseClient;
      repository = createAdminRepository(client, storageBucket);
      initializeAuthenticatedDashboard();
    }).catch((error) => {
      authView.hidden = false;
      setStatus(authStatus, 'Layanan autentikasi belum termuat. Periksa koneksi lalu muat ulang halaman.', true);
      console.error('Inisialisasi dashboard admin gagal:', error);
    });
  }

  function initializeAuthenticatedDashboard() {
    client.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        authView.hidden = false;
        setStatus(authStatus, 'Sesi belum dapat diperiksa. Muat ulang halaman lalu coba lagi.', true);
        return;
      }
      const sessionEmail = data.session?.user?.email?.trim().toLowerCase();
      if (data.session && sessionEmail === adminEmail) {
        showDashboard();
      } else {
        if (data.session) await client.auth.signOut();
        authView.hidden = false;
      }
    }).catch(() => {
      authView.hidden = false;
      setStatus(authStatus, 'Koneksi autentikasi belum tersedia. Periksa koneksi lalu coba lagi.', true);
    });

    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') showRecoveryUpdate();
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.querySelector('#login-email').value.trim().toLowerCase();
      if (email !== adminEmail) {
        setStatus(authStatus, 'Email ini bukan email admin yang terdaftar.', true);
        return;
      }
      const submitButton = loginForm.querySelector('[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Memeriksa…';
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password: document.querySelector('#login-password').value });
        if (error) setStatus(authStatus, error.message, true);
        else if (data.user?.email?.trim().toLowerCase() === adminEmail) showDashboard();
        else {
          await client.auth.signOut();
          setStatus(authStatus, 'Akun ini tidak memiliki akses admin.', true);
        }
      } catch {
        setStatus(authStatus, 'Login belum berhasil. Periksa koneksi lalu coba lagi.', true);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Masuk';
      }
    });

    forgotPasswordButton.addEventListener('click', () => {
      loginForm.hidden = true;
      forgotPasswordForm.hidden = false;
      document.querySelector('#recovery-email').value = document.querySelector('#login-email').value;
      document.querySelector('#recovery-email').focus();
    });

    backToLogin.addEventListener('click', showLogin);

    forgotPasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.querySelector('#recovery-email').value.trim();
      if (email.toLowerCase() !== adminEmail) {
        setStatus(recoveryStatus, 'Email ini bukan email admin yang terdaftar.', true);
        return;
      }
      const localRedirect = window.location.protocol === 'file:'
        ? ''
        : `${window.location.origin}${window.location.pathname}`;
      const redirectTo = config.authRedirectUrl || localRedirect;
      if (!redirectTo) {
        setStatus(recoveryStatus, 'URL recovery belum dikonfigurasi.', true);
        return;
      }
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) setStatus(recoveryStatus, error.message, true);
      else setStatus(recoveryStatus, 'Link reset sudah dikirim. Cek inbox atau folder spam email Anda.');
    });

    recoveryUpdateForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.querySelector('#recovery-password').value;
      const confirmation = document.querySelector('#recovery-confirm-password').value;
      if (password !== confirmation) {
        setStatus(recoveryUpdateStatus, 'Konfirmasi password tidak sama.', true);
        return;
      }
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        setStatus(recoveryUpdateStatus, error.message, true);
        return;
      }
      await client.auth.signOut();
      setStatus(recoveryUpdateStatus, 'Password berhasil diubah. Silakan masuk kembali.');
      setTimeout(showLogin, 1800);
    });

    document.querySelector('#logout-button').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const { error } = await client.auth.signOut();
        if (error) {
          setStatus(formStatus, 'Keluar belum berhasil. Coba lagi.', true);
          return;
        }
        dashboardView.hidden = true;
        loginForm.reset();
        resetForm();
        authView.hidden = false;
      } catch {
        setStatus(formStatus, 'Koneksi terputus. Keluar belum berhasil.', true);
      } finally {
        button.disabled = false;
      }
    });

    projectForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const project = fields();
      const selectedFile = projectImageFile.files?.[0];
      const imageUrl = normalizeHttpUrl(project.image_url);
      const demoUrl = project.demo_url ? normalizeHttpUrl(project.demo_url) : '';
      const githubUrl = project.github_url ? normalizeHttpUrl(project.github_url) : '';
      if (!selectedFile && !imageUrl) {
        setStatus(formStatus, 'Pilih gambar dari perangkat atau isi URL gambar HTTPS.', true);
        return;
      }
      if ((project.demo_url && !demoUrl) || (project.github_url && !githubUrl)) {
        setStatus(formStatus, 'URL demo dan GitHub harus menggunakan HTTPS tanpa kredensial.', true);
        return;
      }
      if (project.title.length > 90 || project.description.length > 600 || project.tech_stack.length > 12 || project.tech_stack.some((tag) => tag.length > 32)) {
        setStatus(formStatus, 'Batas konten: nama 90 karakter, deskripsi 600, dan maksimal 12 teknologi (32 karakter per tag).', true);
        return;
      }
      const duplicate = allProjects.some((item) => item.title.toLowerCase() === project.title.toLowerCase() && item.id !== project.id);
      if (duplicate) {
        setStatus(formStatus, 'Nama proyek tersebut sudah ada. Gunakan nama yang berbeda.', true);
        return;
      }
      const submitButton = projectSubmitButton;
      const originalLabel = submitLabel.textContent;
      const previousImageUrl = allProjects.find((item) => item.id === project.id)?.image_url || '';
      let uploadedImage = null;
      let databaseSaved = false;
      submitButton.disabled = true;
      cancelEdit.disabled = true;
      submitLabel.textContent = 'Menyimpan…';
      try {
        if (selectedFile) {
          setStatus(imageUploadStatus, 'Mengoptimalkan dan mengunggah gambar…');
          uploadedImage = await uploadProjectImage(selectedFile);
          project.image_url = uploadedImage.url;
        } else {
          project.image_url = imageUrl;
        }
        project.demo_url = demoUrl || null;
        project.github_url = githubUrl || null;
        const payload = {
          title: project.title,
          description: project.description,
          image_url: project.image_url,
          tech_stack: project.tech_stack,
          demo_url: project.demo_url,
          github_url: project.github_url,
          published: project.published
        };
        const { error } = await repository.saveProject(payload, project.id);
        if (error) {
          if (uploadedImage) await repository.removeAssets([uploadedImage.path]);
          setStatus(formStatus, error.message, true);
          return;
        }
        databaseSaved = true;
        if (previousImageUrl && project.image_url !== previousImageUrl) await removeManagedImage(previousImageUrl);
        const successMessage = project.id ? 'Proyek berhasil diperbarui.' : 'Proyek berhasil ditambahkan.';
        resetForm();
        setStatus(formStatus, successMessage);
        await loadProjects();
      } catch (error) {
        if (uploadedImage && !databaseSaved) await repository.removeAssets([uploadedImage.path]);
        const message = error?.message || 'Periksa koneksi dan konfigurasi upload gambar di admin/README.md.';
        setStatus(formStatus, message, true);
      } finally {
        submitButton.disabled = false;
        cancelEdit.disabled = false;
        submitLabel.textContent = databaseSaved ? 'Simpan proyek' : originalLabel;
      }
    });

    projectList.addEventListener('click', async (event) => {
      const action = event.target.closest('button[data-edit], button[data-delete]');
      if (!action || !projectList.contains(action)) return;
      const editId = action.dataset.edit;
      const deleteId = action.dataset.delete;
      if (editId) {
        const { data, error } = await repository.findProjectById(editId);
        if (error) setStatus(formStatus, error.message, true);
        else if (data) fillForm(data);
      }
      if (deleteId && window.confirm('Hapus proyek ini?')) {
        const { error } = await repository.deleteProject(deleteId);
        if (error) setStatus(formStatus, error.message, true);
        else {
          const deletedProject = allProjects.find((project) => String(project.id) === String(deleteId));
          if (deletedProject?.image_url) await removeManagedImage(deletedProject.image_url);
          await loadProjects();
        }
      }
    });

    document.querySelector('#refresh-projects').addEventListener('click', loadProjects);
    importLegacyButton.addEventListener('click', importLegacyProjects);
    cancelEdit.addEventListener('click', resetForm);
    document.querySelector('#change-password-button').addEventListener('click', () => { passwordPanel.hidden = false; document.querySelector('#new-password').focus(); });
    document.querySelector('#cancel-password').addEventListener('click', () => { passwordPanel.hidden = true; passwordForm.reset(); setStatus(passwordStatus, ''); });
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.querySelector('#new-password').value;
      const confirmation = document.querySelector('#confirm-password').value;
      if (password !== confirmation) { setStatus(passwordStatus, 'Konfirmasi password tidak sama.', true); return; }
      const { error } = await client.auth.updateUser({ password });
      if (error) { setStatus(passwordStatus, error.message, true); return; }
      passwordForm.reset();
      setStatus(passwordStatus, 'Password berhasil diubah.');
    });
    projectSearch.addEventListener('input', () => {
      renderProjectList(projectList, filteredProjects(), normalizeHttpUrl);
    });
    projectFilter.addEventListener('change', () => {
      renderProjectList(projectList, filteredProjects(), normalizeHttpUrl);
    });
    Object.entries(siteAssetFields).forEach(([key, field]) => {
      field.file.addEventListener('change', () => {
        const file = field.file.files?.[0];
        if (sitePreviewUrls[key]) URL.revokeObjectURL(sitePreviewUrls[key]);
        sitePreviewUrls[key] = file ? URL.createObjectURL(file) : '';
        if (file) field.url.value = '';
        updateSiteAssetPreview(key, sitePreviewUrls[key] || field.url.value);
      });
      field.url.addEventListener('input', () => {
        if (!field.file.files?.length && !field.url.value.trim()) updateSiteAssetPreview(key);
      });
      field.url.addEventListener('change', () => {
        if (!field.file.files?.length) updateSiteAssetPreview(key, field.url.value.trim());
      });
    });
    ['zoom', 'x', 'y'].forEach((control) => siteAssetFields.profile[control].addEventListener('input', updateProfileCropPreview));
    ['zoom', 'x', 'y'].forEach((control) => projectCrop[control].addEventListener('input', updatePreview));
    siteSettingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      saveSiteSettingsButton.disabled = true;
      saveSiteSettingsButton.textContent = 'Mengunggah dan menyimpan…';
      try {
        const previousValues = Object.fromEntries(Object.entries(siteAssetFields).map(([key, field]) => [key, field.url.value.trim()]));
        const values = {};
        for (const [key, field] of Object.entries(siteAssetFields)) {
          const file = field.file.files?.[0];
          const url = field.url.value.trim();
          if (file) values[key] = await uploadSiteAsset(file, field);
          else if (url) {
            const validUrl = normalizeHttpUrl(url);
            if (!validUrl) throw new Error('Semua URL aset harus menggunakan HTTPS tanpa kredensial.');
            if (field.type === 'video' && !/\.mp4(?:$|[?#])/i.test(new URL(validUrl).pathname + new URL(validUrl).search)) {
              throw new Error('URL video latar harus mengarah ke file MP4.');
            }
            values[key] = validUrl;
          } else values[key] = null;
        }
        const { error } = await repository.saveSiteSettings({
          id: 'main',
          profile_image_url: values.profile,
          background_image_url: values.background,
          background_video_url: values.video,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
        for (const key of Object.keys(siteAssetFields)) {
          if (previousValues[key] && previousValues[key] !== values[key]) await removeManagedImage(previousValues[key]);
        }
        Object.entries(siteAssetFields).forEach(([key, field]) => {
          field.url.value = values[key] || '';
          field.file.value = '';
          if (sitePreviewUrls[key]) URL.revokeObjectURL(sitePreviewUrls[key]);
          sitePreviewUrls[key] = '';
          if (key === 'profile') {
            field.zoom.value = '1';
            field.x.value = '50';
            field.y.value = '50';
          }
          updateSiteAssetPreview(key, values[key]);
        });
        setStatus(siteSettingsStatus, 'Konfigurasi tersimpan. Perubahan tampil di website saat dimuat ulang.');
      } catch (error) {
        const message = error?.message || 'Konfigurasi gagal disimpan. Periksa koneksi, Storage, dan SQL site_settings.';
        setStatus(siteSettingsStatus, message, true);
      } finally {
        saveSiteSettingsButton.disabled = false;
        saveSiteSettingsButton.textContent = 'Simpan konfigurasi';
      }
    });
    ['project-title', 'project-description', 'project-image', 'project-tech', 'project-demo', 'project-github', 'project-published'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', updatePreview));
    previewMedia.addEventListener('error', () => {
      previewMedia.hidden = true;
      projectPreview.classList.remove('has-image');
    });
    updatePreview();
  }
})();
