// ============================================================================
// script.js - Logika Interaktif untuk Portofolio Rizki Afandi
// File ini mengelola semua fungsionalitas JavaScript, termasuk animasi,
// interaksi pengguna, dan penyesuaian tema.
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Logika Preloader
    const preloader = document.getElementById('preloader');
    // Event listener untuk menyembunyikan preloader setelah semua konten dimuat
    window.addEventListener('load', () => {
        setTimeout(hidePreloader, 500); // Slight delay for a smoother entrance
    });

    // Safety fallback: Sembunyikan preloader setelah 5 detik jika 'load' event tidak terpicu
    setTimeout(hidePreloader, 5000);

    function hidePreloader() {
        if (!preloader) return;
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
    }

    // 2. Kontrol Video Latar Belakang & Tombol Mute
    const bgVideo = document.getElementById('bgVideo');
    const muteToggle = document.getElementById('mute-toggle');
    const muteIcon = muteToggle.querySelector('i');

    // Inisialisasi ikon mute berdasarkan status muted video saat ini
    // Jika video tidak muted secara default (misal, browser mengizinkan autoplay dengan suara)
    if (!bgVideo.muted) {
        muteIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
        // Mencoba memutar video dengan suara jika tidak muted.
        // Perlu diingat, banyak browser memblokir autoplay dengan suara tanpa interaksi pengguna.
        // Pengguna mungkin perlu berinteraksi dengan halaman (misal: klik) agar suara bisa diputar.
        // Error ini normal jika browser memblokir autoplay.
        bgVideo.play().catch(error => console.warn("Autoplay with sound blocked or failed:", error));
    }

    // Event listener untuk tombol mute/unmute
    muteToggle.addEventListener('click', () => {
        bgVideo.muted = !bgVideo.muted;
        if (bgVideo.muted) {
            // Jika dimatikan, ganti ikon ke volume-mute
            muteIcon.classList.replace('fa-volume-up', 'fa-volume-mute');
        } else {
            // Jika dihidupkan, ganti ikon ke volume-up dan coba putar video
            muteIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
            // Memastikan video diputar jika sebelumnya di-pause atau di-mute
            bgVideo.play().catch(error => console.warn("Failed to play video after unmute:", error));
        }
    });

    // 3. Efek Ripple (Riak) Saat Klik
    document.addEventListener('click', (e) => {
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

    // Toggle menu navigasi mobile saat tombol diklik
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        // Mengganti ikon hamburger dengan ikon 'X' dan sebaliknya
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Menutup menu navigasi mobile saat salah satu link di dalamnya diklik
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active'); // Sembunyikan menu
            menuToggle.querySelector('i').classList.replace('fa-times', 'fa-bars'); // Kembalikan ikon ke hamburger
        });
    });

    // Typing Animation
    const typingText = document.getElementById('typing-text');
    const phrases = ["Rizki Afandi", "Web Developer", "Anak RPL", "UI Designer"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
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
        } else if (isDeleting && charIndex === 0) { // Jika sudah selesai menghapus
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length; // Pindah ke frasa berikutnya
            typingSpeed = 500; // Jeda sebelum mengetik frasa baru
        }

        setTimeout(typeEffect, typingSpeed);
    }
    setTimeout(typeEffect, 1000); // Mulai animasi setelah 1 detik

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
    const icon = themeToggle.querySelector('i');

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode'); // Toggle kelas light-mode pada body
        
        if (body.classList.contains('light-mode')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light'); // Simpan preferensi tema
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark'); // Simpan preferensi tema
        }
    });

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

    // 10. Logika Formulir Kontak (Kirim ke WhatsApp)
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Mengambil data dari input
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            // PENTING: Ganti nomor di bawah ini dengan nomor WhatsApp Anda (gunakan kode negara, misal: 62)
            const myPhoneNumber = "6285649507734"; // Ganti dengan nomor asli Anda
            const waMessage = `Halo Rizki Afandi!\n\nNama: ${name}\nEmail: ${email}\n\nPesan:\n${message}`;
            const whatsappUrl = `https://wa.me/${myPhoneNumber}?text=${encodeURIComponent(waMessage)}`;

            // Membuka WhatsApp di tab baru
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            
            // Simple visual feedback
            formStatus.style.color = '#10b981';
            formStatus.innerText = `Mengalihkan ke WhatsApp... Terima kasih, ${name}!`;
        });
    }

    // Header Scroll Effect
    const navbar = document.querySelector('.navbar');
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            backToTop.classList.add('show');
        } else {
            navbar.classList.remove('scrolled');
            backToTop.classList.remove('show');
        }
    });

    // 12. Logika Akordeon (Services/FAQ)
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            // Optional: Close other items
            // document.querySelectorAll('.accordion-item').forEach(i => i !== item && i.classList.remove('active'));
            item.classList.toggle('active');
        });
    });

    // 13. Smooth Scroll untuk Tombol Back to Top
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 14. Dynamic Copyright Year
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});