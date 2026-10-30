// ===================== DARK MODE =====================

// Create toggle button
const darkModeBtn = document.createElement('button');
darkModeBtn.className = 'dark-mode-toggle';
darkModeBtn.setAttribute('aria-label', 'Toggle dark mode');
darkModeBtn.innerHTML = `
    <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
`;
document.querySelector('.nav-actions')?.prepend(darkModeBtn);

// Load saved preference
const savedDark = localStorage.getItem('photoStoreDarkMode') === 'true';
if (savedDark) {
    document.documentElement.classList.add('dark-mode');
    darkModeBtn.classList.add('active');
}

// Toggle handler
darkModeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    darkModeBtn.classList.toggle('active');
    localStorage.setItem('photoStoreDarkMode', isDark);
});
