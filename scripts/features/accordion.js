// Keep FAQ accordion visibility and its accessible expanded state synchronized.
export function initializeAccordion() {
    document.querySelectorAll('.accordion-header').forEach((header) => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.toggle('active');
            header.setAttribute('aria-expanded', String(isOpen));
            item.querySelector('.accordion-content')
                ?.setAttribute('aria-hidden', String(!isOpen));
        });
    });
}
