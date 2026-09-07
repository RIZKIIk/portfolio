(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const adminEmail = (config.adminEmail || '').trim().toLowerCase();
  const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
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
  let allProjects = [];
  let client;

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

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

  const fields = () => ({
    id: document.querySelector('#project-id').value,
    title: document.querySelector('#project-title').value.trim(),
    description: document.querySelector('#project-description').value.trim(),
    image_url: document.querySelector('#project-image').value.trim(),
    tech_stack: document.querySelector('#project-tech').value.split(',').map((tag) => tag.trim()).filter(Boolean),
    demo_url: document.querySelector('#project-demo').value.trim() || null,
    github_url: document.querySelector('#project-github').value.trim() || null,
    published: document.querySelector('#project-published').checked
  });

  const isHttpUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const resetForm = () => {
    projectForm.reset();
    document.querySelector('#project-id').value = '';
    document.querySelector('#project-published').checked = true;
    formTitle.textContent = 'Tambah project';
    submitLabel.textContent = 'Simpan project';
    cancelEdit.hidden = true;
    setStatus(formStatus, '');
  };

  const fillForm = (project) => {
    document.querySelector('#project-id').value = project.id;
    document.querySelector('#project-title').value = project.title;
    document.querySelector('#project-description').value = project.description;
    document.querySelector('#project-image').value = project.image_url;
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

  const updatePreview = () => {
    const project = fields();
    const image = isHttpUrl(project.image_url) ? escapeHtml(project.image_url) : '';
    projectPreview.innerHTML = `<div class="preview-media" style="${image ? `background-image:url('${image}')` : ''}"></div><div class="preview-content"><span class="eyebrow">${project.published ? 'Published' : 'Draft'}</span><h3>${escapeHtml(project.title || 'Nama project Anda')}</h3><p>${escapeHtml(project.description || 'Isi form untuk melihat preview project.')}</p><div class="chips">${project.tech_stack.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div><div class="preview-links">${project.demo_url ? 'Lihat Demo' : ''}${project.github_url ? 'Source Code' : ''}</div></div>`;
  };

  const filteredProjects = () => {
    const query = projectSearch.value.trim().toLowerCase();
    const status = projectFilter.value;
    return allProjects.filter((project) => {
      const matchesQuery = !query || project.title.toLowerCase().includes(query) || (project.tech_stack || []).some((tag) => tag.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || (status === 'published' ? project.published : !project.published);
      return matchesQuery && matchesStatus;
    });
  };

  const renderProjects = (projects) => {
    projectList.innerHTML = '';
    if (!projects.length) {
      projectList.innerHTML = '<p class="empty-state">Belum ada project. Tambahkan project pertama Anda.</p>';
      return;
    }
    projects.forEach((project) => {
      const item = document.createElement('article');
      item.className = 'project-item';
      item.innerHTML = `
        <div class="project-item-main">
          <img src="${escapeHtml(project.image_url)}" alt="" loading="lazy">
          <div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p><div class="chips">${(project.tech_stack || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div></div>
        </div>
        <div class="project-item-actions"><span class="badge ${project.published ? 'badge-live' : ''}">${project.published ? 'Published' : 'Draft'}</span><button class="text-button" data-edit="${project.id}" type="button">Edit</button><button class="danger-button" data-delete="${project.id}" type="button">Hapus</button></div>`;
      projectList.appendChild(item);
    });
  };

  const loadProjects = async () => {
    const { data, error } = await client.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      setStatus(formStatus, error.message, true);
      return;
    }
    allProjects = data || [];
    renderProjects(filteredProjects());
  };

  const importLegacyProjects = async () => {
    importLegacyButton.disabled = true;
    importLegacyButton.textContent = 'Mengimpor...';
    const { data: existing, error: readError } = await client.from('projects').select('title');
    if (readError) {
      setStatus(formStatus, readError.message, true);
    } else {
      const existingTitles = new Set((existing || []).map((project) => project.title));
      const missing = legacyProjects.filter((project) => !existingTitles.has(project.title));
      if (!missing.length) {
        setStatus(formStatus, 'Semua project lama sudah ada di database.');
      } else {
        const { error } = await client.from('projects').insert(missing);
        if (error) setStatus(formStatus, error.message, true);
        else setStatus(formStatus, `${missing.length} project lama berhasil diimpor.`);
      }
      await loadProjects();
    }
    importLegacyButton.disabled = false;
    importLegacyButton.textContent = 'Import project lama';
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
    client.auth.getSession().then(({ data }) => {
      if (data.session) showDashboard();
      else authView.hidden = false;
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
      const { error } = await client.auth.signInWithPassword({ email, password: document.querySelector('#login-password').value });
      if (error) setStatus(authStatus, error.message, true);
      else showDashboard();
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
      setStatus(recoveryUpdateStatus, 'Password berhasil diubah. Silakan login kembali.');
      setTimeout(showLogin, 1800);
    });

    document.querySelector('#logout-button').addEventListener('click', async () => {
      await client.auth.signOut();
      dashboardView.hidden = true;
      loginForm.reset();
      resetForm();
      authView.hidden = false;
    });

    projectForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const project = fields();
      if (!isHttpUrl(project.image_url) || (project.demo_url && !isHttpUrl(project.demo_url)) || (project.github_url && !isHttpUrl(project.github_url))) {
        setStatus(formStatus, 'URL gambar, demo, dan GitHub harus menggunakan http:// atau https://.', true);
        return;
      }
      const duplicate = allProjects.some((item) => item.title.toLowerCase() === project.title.toLowerCase() && item.id !== project.id);
      if (duplicate) {
        setStatus(formStatus, 'Nama project tersebut sudah ada. Gunakan nama yang berbeda.', true);
        return;
      }
      const query = project.id ? client.from('projects').update(project).eq('id', project.id) : client.from('projects').insert({ title: project.title, description: project.description, image_url: project.image_url, tech_stack: project.tech_stack, demo_url: project.demo_url, github_url: project.github_url, published: project.published });
      const { error } = await query;
      if (error) {
        setStatus(formStatus, error.message, true);
        return;
      }
      setStatus(formStatus, project.id ? 'Project berhasil diperbarui.' : 'Project berhasil ditambahkan.');
      resetForm();
      loadProjects();
    });

    projectList.addEventListener('click', async (event) => {
      const editId = event.target.dataset.edit;
      const deleteId = event.target.dataset.delete;
      if (editId) {
        const { data } = await client.from('projects').select('*').eq('id', editId).single();
        if (data) fillForm(data);
      }
      if (deleteId && window.confirm('Hapus project ini?')) {
        const { error } = await client.from('projects').delete().eq('id', deleteId);
        if (error) setStatus(formStatus, error.message, true);
        else loadProjects();
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
    updatePreview();
  }
})();
