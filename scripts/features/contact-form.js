// Turn the validated contact form into a ready-to-send WhatsApp message.
export function initializeContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const message = String(formData.get('message') || '').trim();
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
        } catch {
            whatsappTab = null;
        }

        if (!status) return;
        status.replaceChildren();
        status.style.color = 'var(--accent-strong)';
        status.append(document.createTextNode(
            whatsappTab
                ? 'WhatsApp dibuka di tab baru. Tinjau pesan lalu tekan Kirim. Isian formulir tetap tersimpan. '
                : 'Tab WhatsApp diblokir. Isian formulir tetap tersimpan; buka pesan melalui tautan ini: '
        ));
        const retryLink = document.createElement('a');
        retryLink.href = whatsappUrl;
        retryLink.target = '_blank';
        retryLink.rel = 'noopener noreferrer';
        retryLink.textContent = whatsappTab ? 'Buka lagi' : 'Buka WhatsApp';
        status.append(retryLink);
    });
}
