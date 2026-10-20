// Animate the short role/name phrases without changing the accessible static heading.
export function initializeHeroTyping() {
    const typingText = document.getElementById('typing-text');
    if (!typingText || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const phrases = ['Rizki Afandi', 'Web Developer', 'Siswa RPL', 'UI Designer'];
    let phraseIndex = 0;
    let characterIndex = phrases[0].length;
    let isDeleting = true;

    function typeNextCharacter() {
        const phrase = phrases[phraseIndex];
        characterIndex += isDeleting ? -1 : 1;
        typingText.textContent = phrase.substring(0, characterIndex);

        let delay = isDeleting ? 70 : 150;
        if (!isDeleting && characterIndex === phrase.length) {
            isDeleting = true;
            delay = 2000;
        } else if (isDeleting && characterIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            characterIndex = 1;
            typingText.textContent = phrases[phraseIndex].substring(0, characterIndex);
        }

        window.setTimeout(typeNextCharacter, delay);
    }

    window.setTimeout(typeNextCharacter, 1000);
}
