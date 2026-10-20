// Share the portfolio with the native share sheet or copy its URL as a fallback.
export function initializePortfolioSharing() {
    const button = document.getElementById('share-portfolio');
    const status = document.getElementById('share-status');
    if (!button || !status) return;

    let statusTimer;
    const showStatus = (message) => {
        window.clearTimeout(statusTimer);
        status.textContent = message;
        statusTimer = window.setTimeout(() => {
            status.textContent = '';
        }, 3500);
    };

    button.addEventListener('click', async () => {
        const shareData = {
            title: 'Rizki Afandi | Portfolio',
            text: 'Lihat portfolio Rizki Afandi, Junior Software Developer.',
            url: window.location.href.split('#')[0]
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showStatus('Portfolio siap dibagikan.');
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareData.url);
                showStatus('Link portfolio berhasil disalin.');
            } else {
                throw new Error('Berbagi tidak didukung di browser ini.');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Link portfolio gagal dibagikan:', error);
                showStatus('Link belum tersalin. Silakan salin URL halaman ini.');
            }
        }
    });
}
