// ============================================================================
// script.js - Logika Interaktif untuk Portofolio Rizki Afandi
// File ini mengelola semua fungsionalitas JavaScript, termasuk animasi,
// interaksi pengguna, dan penyesuaian tema.
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('img[data-fallback]').forEach((image) => {
        image.addEventListener('error', () => {
            if (image.dataset.fallbackApplied) return;
            image.dataset.fallbackApplied = 'true';
            image.src = image.dataset.fallback;
        });
    });

    const loadPublishedProjects = async () => {
        const config = window.PORTFOLIO_CONFIG || {};
        if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) return;

        const { data, error } = await window.supabase
            .createClient(config.supabaseUrl, config.supabaseAnonKey)
            .from('projects')
            .select('title, description, image_url, tech_stack, demo_url, github_url')
            .eq('published', true)
            .order('created_at', { ascending: false });

        if (error || !Array.isArray(data)) return;

        const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[character]));
        const safeProjectUrl = (value) => {
            if (!value) return '';
            try {
                const url = new URL(String(value), window.location.href);
                return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
            } catch (error) {
                return '';
            }
        };
        const projectGrid = document.querySelector('.projects-grid');
        if (!projectGrid) return;
        if (!data.length) {
            projectGrid.replaceChildren(Object.assign(document.createElement('p'), {
                className: 'project-empty-state',
                textContent: 'Belum ada proyek yang ditayangkan.'
            }));
            return;
        }

        projectGrid.innerHTML = data.map((project) => {
            const title = escapeHtml(project.title || 'Proyek');
            const description = escapeHtml(project.description || '');
            const tags = (Array.isArray(project.tech_stack) ? project.tech_stack : [])
                .map((tag) => `<span>${escapeHtml(tag)}</span>`)
                .join('');
            const demoUrl = safeProjectUrl(project.demo_url);
            const githubUrl = safeProjectUrl(project.github_url);
            const imageUrl = safeProjectUrl(project.image_url) || 'media/projects/portfolio.svg';
            const demoLink = demoUrl ? `<a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-sm">Lihat demo <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>` : '';
            const githubLink = githubUrl ? `<a href="${escapeHtml(githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-project-source">Kode sumber <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>` : '';
            return `<article class="project-card reveal-bottom active"><div class="project-img"><img src="${escapeHtml(imageUrl)}" alt="Gambar proyek ${title}" loading="lazy" decoding="async" data-fallback="media/projects/portfolio.svg"></div><div class="project-info"><h3>${title}</h3><p>${description}</p><div class="project-tags">${tags}</div><div class="project-links">${demoLink}${githubLink}</div></div></article>`;
        }).join('');

        projectGrid.querySelectorAll('img[data-fallback]').forEach((image) => {
            image.addEventListener('error', () => {
                if (image.dataset.fallbackApplied) return;
                image.dataset.fallbackApplied = 'true';
                image.src = image.dataset.fallback;
            });
        });
    };

    const projectConfig = window.PORTFOLIO_CONFIG || {};
    if (projectConfig.supabaseUrl && projectConfig.supabaseAnonKey) {
        if (window.supabase) {
            loadPublishedProjects();
        } else {
            const supabaseLoader = document.createElement('script');
            supabaseLoader.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            supabaseLoader.async = true;
            supabaseLoader.addEventListener('load', loadPublishedProjects, { once: true });
            document.head.appendChild(supabaseLoader);
        }
    }

    // 1. Logika Preloader
    const preloader = document.getElementById('preloader');
    // Event listener untuk menyembunyikan preloader setelah semua konten dimuat
    window.addEventListener('load', () => {
        setTimeout(hidePreloader, 500); // Slight delay for a smoother entrance
    });

    // Safety fallback: Sembunyikan preloader setelah 5 detik jika 'load' event tidak terpicu
    setTimeout(hidePreloader, 1500);

    function hidePreloader() {
        if (!preloader) return;
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
    }

    // 2. Kontrol Video Latar Belakang & Tombol Mute
    const bgVideo = document.getElementById('bgVideo');
    const muteToggle = document.getElementById('mute-toggle');
    const muteIcon = muteToggle ? muteToggle.querySelector('i') : null;
    const backgroundContainer = document.querySelector('.video-bg-container');
    const backgroundToggle = document.getElementById('background-toggle');
    const backgroundIcon = backgroundToggle ? backgroundToggle.querySelector('i') : null;
    const backgroundStorageKey = 'portfolio-background';

    const updateMuteControl = (isVideo) => {
        if (!muteToggle || !muteIcon || !bgVideo) return;
        muteToggle.hidden = !isVideo;
        muteToggle.setAttribute('aria-pressed', String(isVideo && !bgVideo.muted));
        muteToggle.setAttribute('aria-label', bgVideo.muted ? 'Aktifkan suara video' : 'Bisukan suara video');
        muteIcon.classList.toggle('fa-volume-mute', bgVideo.muted);
        muteIcon.classList.toggle('fa-volume-up', !bgVideo.muted);
    };

    const applyBackground = (background) => {
        const useImage = background === 'image';
        backgroundContainer?.classList.toggle('image-mode', useImage);
        if (backgroundIcon) {
            backgroundIcon.classList.toggle('fa-image', !useImage);
            backgroundIcon.classList.toggle('fa-video', useImage);
        }
        if (backgroundToggle) {
            backgroundToggle.setAttribute('aria-label', useImage ? 'Gunakan video latar' : 'Gunakan gambar latar');
        }
        if (bgVideo) {
            if (useImage) {
                bgVideo.muted = true;
                bgVideo.pause();
            } else {
                bgVideo.play().catch(() => {});
            }
        }
        updateMuteControl(!useImage);
        try { localStorage.setItem(backgroundStorageKey, background); } catch (_) { /* Storage may be disabled. */ }
    };

    let savedBackground = null;
    try { savedBackground = localStorage.getItem(backgroundStorageKey); } catch (_) { /* Image remains the default. */ }
    const initialBackground = !prefersReducedMotion && savedBackground === 'video' ? 'video' : 'image';
    applyBackground(initialBackground);

    bgVideo?.addEventListener('error', () => {
        backgroundContainer?.classList.add('image-mode');
        bgVideo.muted = true;
        bgVideo.pause();
        updateMuteControl(false);
        if (backgroundToggle) backgroundToggle.setAttribute('aria-label', 'Video tidak tersedia; menggunakan gambar latar');
        try { localStorage.setItem(backgroundStorageKey, 'image'); } catch (_) { /* Ignore unavailable storage. */ }
    });

    backgroundToggle?.addEventListener('click', () => {
        const nextBackground = backgroundContainer?.classList.contains('image-mode') ? 'video' : 'image';
        applyBackground(nextBackground);
    });

    if (bgVideo && muteToggle && muteIcon) {
        updateMuteControl(!backgroundContainer?.classList.contains('image-mode'));
        muteToggle.addEventListener('click', () => {
            if (backgroundContainer?.classList.contains('image-mode')) return;
            bgVideo.muted = !bgVideo.muted;
            updateMuteControl(true);
            if (!bgVideo.muted) bgVideo.play().catch(() => {});
        });
    }

    // 3. Efek Ripple (Riak) Saat Klik
    document.addEventListener('click', (e) => {
        if (prefersReducedMotion) return;
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });

    // 4. Navigasi Mobile (Hamburger Menu)
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        const menuIcon = menuToggle.querySelector('i');
        const setMenuOpen = (isOpen) => {
            navLinks.classList.toggle('active', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');
            menuIcon?.classList.toggle('fa-bars', !isOpen);
            menuIcon?.classList.toggle('fa-times', isOpen);
        };

        menuToggle.addEventListener('click', () => {
            setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenuOpen(false));
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navLinks.classList.contains('active')) {
                setMenuOpen(false);
                menuToggle.focus();
            }
        });

        document.addEventListener('click', (event) => {
            if (navLinks.classList.contains('active') && !event.target.closest('.navbar')) {
                setMenuOpen(false);
            }
        });
    }

    // Typing Animation
    const typingText = document.getElementById('typing-text');
    const phrases = ["Rizqi Afandi", "Web Developer", "Siswa RPL", "UI Designer"];
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let isDeleting = true;

    function typeEffect() {
        if (!typingText) return;
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            typingText.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--; // Hapus satu karakter
        } else {
            typingText.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++; // Tambah satu karakter
        }

        let typingSpeed = isDeleting ? 70 : 150;

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) { // Pindah langsung agar judul tidak sempat kosong
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            charIndex = 1;
            typingText.textContent = phrases[phraseIndex].substring(0, charIndex);
            typingSpeed = 150;
        }

        setTimeout(typeEffect, typingSpeed);
    }
    if (typingText && !prefersReducedMotion) {
        setTimeout(typeEffect, 1000); // Mulai animasi setelah 1 detik
    } else if (typingText) {
        typingText.textContent = phrases[0];
    }

    // 6. Pemicu Animasi Awal (Hero Section)
    const revealsInitial = document.querySelectorAll('.hero .reveal-top, .hero .reveal-bottom, .hero .reveal-left, .hero .reveal-right');
    revealsInitial.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('active');
        }, 300 * (index + 1)); // Efek staggered (muncul berurutan)
    });

    // 7. Logika Pengganti Tema (Dark/Light Mode)
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    const applyTheme = (isLight) => {
        body.classList.toggle('light-mode', isLight);
        if (icon) {
            icon.classList.toggle('fa-sun', isLight);
            icon.classList.toggle('fa-moon', !isLight);
        }
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
            themeToggle.setAttribute('aria-label', 'Tema warna');
        }
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#f5f8f6' : '#07111a');
        try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (_) { /* Theme still applies for this session. */ }
    };

    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch (_) { /* Use default theme. */ }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(savedTheme === 'light' || (!savedTheme && prefersLight));

    if (themeToggle && icon) {
        themeToggle.addEventListener('click', () => {
            const isLight = !body.classList.contains('light-mode');
            applyTheme(isLight);
        });
    }

    // 8. Animasi Progress Bar Skill
    const skillsSection = document.getElementById('skills');
    const skillBars = document.querySelectorAll('.progress-bar');

    // Fungsi untuk menganimasikan lebar progress bar
    const animateSkillBars = () => {
        skillBars.forEach(bar => {
            const progress = bar.getAttribute('data-progress');
            bar.style.width = progress + '%';
        });
    };

    // Opsi untuk Intersection Observer skill section
    const skillsObserverOptions = {
        root: null, // Menggunakan viewport sebagai root
        rootMargin: '0px',
        threshold: 0.2 // Memicu saat 20% dari elemen terlihat
    };
    // Intersection Observer untuk memicu animasi progress bar saat skill section terlihat
    const skillsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkillBars();
                observer.unobserve(entry.target); // Berhenti mengamati setelah animasi dipicu
            }
        });
    }, skillsObserverOptions);

    if (skillsSection) {
        skillsObserver.observe(skillsSection); // Mulai mengamati skill section
    }

    // 9. Animasi Reveal Saat Scroll (Fade-in dan Slide)
    const reveals = document.querySelectorAll('[class*="reveal-"]');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Tambahkan sedikit delay untuk efek staggered (muncul berurutan)
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 }); // Memicu saat 10% dari elemen terlihat

    reveals.forEach(el => revealObserver.observe(el)); // Mulai mengamati semua elemen reveal

    // 10. Kirim pesan kontak langsung ke WhatsApp
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const formBtn = document.getElementById('form-submit');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(contactForm);

            const name = data.get('name').trim();
            const email = data.get('email').trim();
            const message = data.get('message').trim();
            const contactMessage = [
                'Halo Rizki,',
                '',
                'Saya ingin berdiskusi tentang portfolio Anda.',
                '',
                '*Data Pengirim*',
                `Nama: ${name}`,
                `Email: ${email}`,
                '',
                '*Pesan*',
                message,
                '',
                '_Dikirim dari website portfolio Rizki Afandi_'
            ].join('\n');

            const whatsappUrl = `https://wa.me/6285649507734?text=${encodeURIComponent(contactMessage)}`;
            let whatsappTab = null;
            try {
                whatsappTab = window.open('about:blank', '_blank');
                if (whatsappTab) {
                    whatsappTab.opener = null;
                    whatsappTab.location.href = whatsappUrl;
                }
            } catch (error) {
                whatsappTab = null;
            }

            if (formStatus) {
                formStatus.replaceChildren();
                formStatus.style.color = 'var(--accent-strong)';
                formStatus.append(document.createTextNode(
                    whatsappTab
                        ? 'WhatsApp dibuka di tab baru. Tinjau pesan lalu tekan Kirim. Isian formulir tetap tersimpan. '
                        : 'Tab WhatsApp diblokir. Isian formulir tetap tersimpan; buka pesan melalui tautan ini: '
                ));
                const retryLink = document.createElement('a');
                retryLink.href = whatsappUrl;
                retryLink.target = '_blank';
                retryLink.rel = 'noopener noreferrer';
                retryLink.textContent = whatsappTab ? 'Buka lagi' : 'Buka WhatsApp';
                formStatus.append(retryLink);
            }
        });
    }

    // 11. Bagikan portfolio atau salin link jika Web Share tidak tersedia
    const shareButton = document.getElementById('share-portfolio');
    const shareStatus = document.getElementById('share-status');
    let shareStatusTimer;

    const showShareStatus = (message) => {
        if (!shareStatus) return;
        clearTimeout(shareStatusTimer);
        shareStatus.textContent = message;
        shareStatusTimer = setTimeout(() => {
            shareStatus.textContent = '';
        }, 3500);
    };

    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const shareData = {
                title: 'Rizki Afandi | Portfolio',
                text: 'Lihat portfolio Rizki Afandi, Junior Software Developer.',
                url: window.location.href.split('#')[0]
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    showShareStatus('Portfolio siap dibagikan.');
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareData.url);
                    showShareStatus('Link portfolio berhasil disalin.');
                } else {
                    throw new Error('Share is not supported');
                }
            } catch (error) {
                if (error.name !== 'AbortError') showShareStatus('Link belum tersalin. Silakan salin URL halaman ini.');
            }
        });
    }

    // 12. ScrollSpy: Highlight active nav link on scroll
    const navbar = document.querySelector('.navbar');
    const backToTop = document.getElementById('back-to-top');
    const scrollProgress = document.getElementById('scroll-progress');
    const sections = document.querySelectorAll('section, header');
    const navItems = document.querySelectorAll('.nav-links a');

    const handleScrollSpy = () => {
        let current = "";
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 150) {
                current = section.getAttribute("id") || "";
            }
        });

        navItems.forEach((link) => {
            const isCurrent = current !== "" && link.getAttribute("href") === `#${current}`;
            link.classList.toggle("active", isCurrent);
            if (isCurrent) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    window.addEventListener('scroll', handleScrollSpy);

    // Header & Progress Effect
    window.addEventListener('scroll', () => {
        // Update Scroll Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (scrollProgress) scrollProgress.style.width = scrolled + "%";

        // Navbar & Back to Top visibility
        if (window.scrollY > 50) {
            if (navbar) navbar.classList.add('scrolled');
            if (backToTop) backToTop.classList.add('show');
        } else {
            if (navbar) navbar.classList.remove('scrolled');
            if (backToTop) backToTop.classList.remove('show');
        }
    });

    // 12. Logika Akordeon (Services/FAQ)
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.toggle('active');
            header.setAttribute('aria-expanded', String(isOpen));
            item.querySelector('.accordion-content').setAttribute('aria-hidden', String(!isOpen));
        });
    });

    // 13. Smooth Scroll untuk Tombol Back to Top
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }

    // 14. Dynamic Copyright Year
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});
