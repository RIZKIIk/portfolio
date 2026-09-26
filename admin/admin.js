(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const adminEmail = (config.adminEmail || '').trim().toLowerCase();
  const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.adminEmail && window.supabase);
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
  const projectSubmitButton = projectForm.querySelector('[type="submit"]');
  const storageBucket = 'portfolio-project-images';
  const maxSourceImageBytes = 6 * 1024 * 1024;
  const maxStoredImageBytes = 3 * 1024 * 1024;
  let allProjects = [];
  let client;
  let previewObjectUrl = '';

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
    imageFileName.textContent = 'Belum ada gambar dipilih';
    setStatus(imageUploadStatus, '');
  };

  const optimizeImage = async (file) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) throw new Error('Pilih gambar JPG, PNG, atau WebP.');
    if (file.size > maxSourceImageBytes) throw new Error('Ukuran gambar maksimal 6 MB.');
    if (!('createImageBitmap' in window)) throw new Error('Browser ini belum mendukung optimasi gambar. Coba browser versi terbaru.');

    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) {
        throw new Error('Dimensi gambar terlalu besar. Gunakan gambar di bawah 40 megapiksel.');
      }
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Gambar tidak dapat diproses oleh browser.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const optimized = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
      if (!optimized) throw new Error('Gambar gagal dioptimalkan. Coba file gambar lain.');
      if (optimized.size > maxStoredImageBytes) throw new Error('Hasil gambar masih terlalu besar. Pilih gambar yang lebih kecil.');
      return optimized;
    } finally {
      bitmap.close();
    }
  };

  const createStoragePath = () => {
    if (crypto.randomUUID) return `projects/${crypto.randomUUID()}.webp`;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return `projects/${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}.webp`;
  };

  const uploadProjectImage = async (file) => {
    const image = await optimizeImage(file);
    const path = createStoragePath();
    const { error } = await client.storage.from(storageBucket).upload(path, image, {
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
    const { data } = client.storage.from(storageBucket).getPublicUrl(path);
    return { path, url: data.publicUrl };
  };

  const managedStoragePath = (imageUrl) => {
    try {
      const url = new URL(imageUrl);
      const supabaseOrigin = new URL(config.supabaseUrl).origin;
      const prefix = `/storage/v1/object/public/${storageBucket}/`;
      if (url.origin !== supabaseOrigin || !url.pathname.startsWith(prefix)) return '';
      const path = decodeURIComponent(url.pathname.slice(prefix.length));
      return /^projects\/(?:[0-9a-f-]{36}|[0-9a-f]{32})\.webp$/i.test(path) ? path : '';
    } catch {
      return '';
    }
  };

  const removeManagedImage = async (imageUrl) => {
    const path = managedStoragePath(imageUrl);
    if (!path) return;
    const { error } = await client.storage.from(storageBucket).remove([path]);
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
    const query = projectSearch.value.trim().toLowerCase();
    const status = projectFilter.value;
    return allProjects.filter((project) => {
      const matchesQuery = !query || String(project.title || '').toLowerCase().includes(query) || (project.tech_stack || []).some((tag) => String(tag).toLowerCase().includes(query));
      const matchesStatus = status === 'all' || (status === 'published' ? project.published : !project.published);
      return matchesQuery && matchesStatus;
    });
  };

  const renderProjects = (projects) => {
    const fragment = document.createDocumentFragment();
    if (!projects.length) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'Belum ada project. Tambahkan project pertama Anda.';
      projectList.replaceChildren(emptyState);
      return;
    }
    projects.forEach((project) => {
      const item = document.createElement('article');
      item.className = 'project-item';
      const main = document.createElement('div');
      main.className = 'project-item-main';
      const image = document.createElement('img');
      image.alt = '';
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      image.src = normalizeHttpUrl(project.image_url) || '../media/projects/portfolio.svg';
      image.addEventListener('error', () => { image.src = '../media/projects/portfolio.svg'; }, { once: true });
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
  };

  const loadProjects = async () => {
    const { data, error } = await client.from('projects').select('id,title,description,image_url,tech_stack,demo_url,github_url,published,created_at').order('created_at', { ascending: false });
    if (error) {
      setStatus(formStatus, error.message, true);
      return;
    }
    allProjects = data || [];
    renderProjects(filteredProjects());
  };

  const importLegacyProjects = async () => {
    importLegacyButton.disabled = true;
    const originalLabel = importLegacyButton.textContent;
    importLegacyButton.textContent = 'Mengimpor…';
    try {
      const { data: existing, error: readError } = await client.from('projects').select('title');
      if (readError) {
        setStatus(formStatus, readError.message, true);
      } else {
        const existingTitles = new Set((existing || []).map((project) => String(project.title || '').toLowerCase()));
        const missing = legacyProjects.filter((project) => !existingTitles.has(project.title.toLowerCase()));
        if (!missing.length) {
          setStatus(formStatus, 'Semua proyek lama sudah ada di database.');
        } else {
          const { error } = await client.from('projects').insert(missing);
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

  if (!hasConfig) {
    setupNotice.hidden = false;
  } else {
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
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
        const query = project.id
          ? client.from('projects').update(payload).eq('id', project.id)
          : client.from('projects').insert(payload);
        const { error } = await query;
        if (error) {
          if (uploadedImage) await client.storage.from(storageBucket).remove([uploadedImage.path]);
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
        if (uploadedImage && !databaseSaved) await client.storage.from(storageBucket).remove([uploadedImage.path]);
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
        const { data, error } = await client.from('projects').select('id,title,description,image_url,tech_stack,demo_url,github_url,published').eq('id', editId).single();
        if (error) setStatus(formStatus, error.message, true);
        else if (data) fillForm(data);
      }
      if (deleteId && window.confirm('Hapus proyek ini?')) {
        const { error } = await client.from('projects').delete().eq('id', deleteId);
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
    projectSearch.addEventListener('input', () => renderProjects(filteredProjects()));
    projectFilter.addEventListener('change', () => renderProjects(filteredProjects()));
    ['project-title', 'project-description', 'project-image', 'project-tech', 'project-demo', 'project-github', 'project-published'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', updatePreview));
    previewMedia.addEventListener('error', () => {
      previewMedia.hidden = true;
      projectPreview.classList.remove('has-image');
    });
    updatePreview();
  }
})();
