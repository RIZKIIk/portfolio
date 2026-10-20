// Keep the copyright year current without requiring a yearly content edit.
export function initializeFooter() {
    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());
}
