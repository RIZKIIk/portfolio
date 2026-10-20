// Animate skill meters once the skills section enters the viewport.
export function initializeSkills() {
    const section = document.getElementById('skills');
    const bars = document.querySelectorAll('.progress-bar');
    if (!section || !bars.length) return;

    const animateBars = () => {
        bars.forEach((bar) => {
            bar.style.width = `${bar.dataset.progress}%`;
        });
    };

    if (!('IntersectionObserver' in window)) {
        animateBars();
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateBars();
            currentObserver.unobserve(entry.target);
        });
    }, { threshold: 0.2 });

    observer.observe(section);
}
