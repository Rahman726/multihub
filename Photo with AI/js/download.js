// ===================== DOWNLOAD & INSTALL =====================

let downloadInProgress = false;

// Toggle download button loading state
function setDownloadLoading(loading) {
    downloadInProgress = loading;
    document.querySelectorAll('.download-btn, #lightboxDownload, .ai-download-btn').forEach(btn => {
        btn.classList.toggle('loading', loading);
    });
}

// Properly download an image as a file (works on mobile + PC)
async function downloadImage(url, filename) {
    try {
        setDownloadLoading(true);
        showToast('📥 Preparing download...');

        // Fetch the image as a blob
        const response = await fetch(url, {
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || `photo-${Date.now()}.jpg`;
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up after a delay
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            setDownloadLoading(false);
        }, 1000);
        
        showToast('✅ Photo saved to your device!');
        
        // Track download event
        if (typeof trackEvent === 'function') {
            trackEvent('image_downloaded', { filename });
        }
        
        return true;
    } catch (error) {
        setDownloadLoading(false);
        console.error('Download failed:', error);
        // Fallback: open in new tab (user can save manually)
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            showToast('📱 Long-press the image and select "Save Image"', 'info');
        } else {
            showToast('⚠️ Right-click the image and select "Save image as..."', 'warning');
        }
        window.open(url, '_blank');
        return false;
    }
}

// Enhanced simulateDownload with proper blob download
async function simulateDownload(photo) {
    if (downloadInProgress) return;
    const filename = `${photo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    const url = photo.fullImage || photo.image;
    await downloadImage(url, filename);
}

// ===================== PWA INSTALL =====================

let deferredPrompt = null;
let installPromptEvent = null;
let isAppInstalled = false;
let installPromptDismissed = false;

// Check if app is already installed
function checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        ('standalone' in navigator && navigator.standalone)) {
        isAppInstalled = true;
        return true;
    }
    return false;
}

// Initialize PWA install support — works on Chrome, Edge, Samsung Internet, etc.
function initPWAInstall() {
    const alreadyInstalled = checkIfInstalled();
    
    if (alreadyInstalled) {
        hideAllInstallButtons();
        return;
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showAllInstallButtons();
    });

    // Show install button immediately (don't wait for beforeinstallprompt)
    showAllInstallButtons();

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        isAppInstalled = true;
        hideAllInstallButtons();
        showToast('✅ PhotoStore installed successfully! 🎉');
    });
    
    // Also show install button on iOS devices (they don't support beforeinstallprompt)
    detectIOSInstall();

    // Show floating install prompt after 15 seconds if user hasn't installed
    setTimeout(() => {
        if (!isAppInstalled && !installPromptDismissed) {
            showDelayedInstallPrompt();
        }
    }, 15000);

    // Connect all install buttons
    connectInstallButtons();
}

// Show a floating install prompt after a delay
function showDelayedInstallPrompt() {
    // Check if already shown or dismissed
    if (installPromptDismissed || isAppInstalled) return;
    if (document.querySelector('.install-float-prompt')) return;

    setTimeout(() => {
        if (installPromptDismissed || isAppInstalled) return;
        if (document.querySelector('.install-float-prompt')) return;

        const floatPrompt = document.createElement('div');
        floatPrompt.className = 'install-float-prompt';
        floatPrompt.innerHTML = `
            <div class="install-float-icon">📲</div>
            <div class="install-float-text">
                <strong>Install PhotoStore</strong>
                <span>Use offline, faster access</span>
            </div>
            <button class="install-float-btn" id="floatInstallBtn">Install</button>
            <button class="install-float-close" id="floatInstallClose">✕</button>
        `;
        document.body.appendChild(floatPrompt);

        // Animate in
        requestAnimationFrame(() => {
            floatPrompt.classList.add('show');
        });

        // Install button
        document.getElementById('floatInstallBtn')?.addEventListener('click', () => {
            floatPrompt.classList.remove('show');
            setTimeout(() => floatPrompt.remove(), 300);
            promptInstallApp();
        });

        // Close button
        document.getElementById('floatInstallClose')?.addEventListener('click', () => {
            installPromptDismissed = true;
            floatPrompt.classList.remove('show');
            setTimeout(() => floatPrompt.remove(), 300);
            // Also hide other install buttons temporarily
            // Don't hide permanently, user might want to install later
        });
    }, 30000); // Show after 30 seconds
}

// iOS doesn't support the beforeinstallprompt event, but we can show instructions
function detectIOSInstall() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = 'standalone' in navigator && navigator.standalone;
    
    if (isIOS && !isStandalone) {
        // Show install button with iOS instructions
        document.querySelectorAll('.install-text').forEach(el => {
            el.textContent = 'Install';
        });
        
        // Override prompt for iOS
        window.promptInstallApp = async function() {
            showIOSInstallModal();
        };
    }
}

// Show iOS-specific install instructions in a modal
function showIOSInstallModal() {
    // Remove existing modal if any
    document.querySelector('.ios-install-modal')?.remove();

    const modal = document.createElement('div');
    modal.className = 'ios-install-modal';
    modal.innerHTML = `
        <div class="ios-install-overlay"></div>
        <div class="ios-install-panel">
            <button class="ios-install-close">✕</button>
            <div class="ios-install-icon">📲</div>
            <h3>Install PhotoStore on iPhone/iPad</h3>
            <div class="ios-install-steps">
                <div class="ios-step">
                    <span class="ios-step-num">1</span>
                    <span>Tap the <strong>Share</strong> button <span class="ios-share-icon">⎙</span> in Safari</span>
                </div>
                <div class="ios-step">
                    <span class="ios-step-num">2</span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </div>
                <div class="ios-step">
                    <span class="ios-step-num">3</span>
                    <span>Tap <strong>"Add"</strong> in the top right corner</span>
                </div>
            </div>
            <button class="ios-install-done">Got it! ✅</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => {
        modal.classList.add('open');
    });

    // Close handlers
    modal.querySelector('.ios-install-close')?.addEventListener('click', () => {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
    });
    modal.querySelector('.ios-install-overlay')?.addEventListener('click', () => {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
    });
    modal.querySelector('.ios-install-done')?.addEventListener('click', () => {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
    });
}

// Connect all install buttons in the UI
function connectInstallButtons() {
    // Navbar install button
    document.getElementById('installAppBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        promptInstallApp();
    });

    // Hero install button
    document.getElementById('heroInstallBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        promptInstallApp();
    });

    // Footer install button
    document.getElementById('footerInstallBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        promptInstallApp();
    });

    // Any custom install buttons
    document.querySelectorAll('[data-install-app]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof promptInstallApp === 'function') promptInstallApp();
        });
    });
}

function showAllInstallButtons() {
    if (isAppInstalled) return;
    
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.style.display = 'flex';
        installBtn.classList.add('visible');
    }
    
    const heroBtn = document.getElementById('heroInstallBtn');
    if (heroBtn) {
        heroBtn.style.display = 'inline-flex';
        heroBtn.classList.add('visible');
    }

    const footerInstall = document.getElementById('footerInstall');
    if (footerInstall) {
        footerInstall.style.display = 'block';
    }
}

function hideAllInstallButtons() {
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.style.display = 'none';
        installBtn.classList.remove('visible');
    }
    
    const heroBtn = document.getElementById('heroInstallBtn');
    if (heroBtn) {
        heroBtn.style.display = 'none';
        heroBtn.classList.remove('visible');
    }

    const footerInstall = document.getElementById('footerInstall');
    if (footerInstall) {
        footerInstall.style.display = 'none';
    }

    // Remove floating prompt if it exists
    document.querySelector('.install-float-prompt')?.remove();
}

// Handle PWA display modes for TV, Desktop, Mobile, etc.
function setupTVMode() {
    const isTV = /tv|tizen|webOS|SMART-TV|NetCast/i.test(navigator.userAgent);
    if (isTV) {
        document.body.classList.add('tv-mode');
    }
}

// Trigger the install prompt
async function promptInstallApp() {
    // iOS handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        showIOSInstallModal();
        return;
    }

    if (!deferredPrompt) {
        // Show manual install instructions based on device
        const isMobile = /Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            showToast('📱 Open browser menu (⋮) > "Install app" or "Add to Home screen"');
        } else {
            showDesktopInstallModal();
        }
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user's response
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
        showToast('📲 Installing PhotoStore...');
    } else {
        showToast('Install cancelled');
        installPromptDismissed = true;
    }
    
    deferredPrompt = null;
}

// Show desktop install instructions modal
function showDesktopInstallModal() {
    document.querySelector('.desktop-install-modal')?.remove();

    const modal = document.createElement('div');
    modal.className = 'desktop-install-modal';
    modal.innerHTML = `
        <div class="desktop-install-overlay"></div>
        <div class="desktop-install-panel">
            <button class="desktop-install-close">✕</button>
            <div class="desktop-install-icon">🖥️</div>
            <h3>Install PhotoStore on your computer</h3>
            <p class="desktop-install-subtitle">Access PhotoStore anytime, even offline!</p>
            <div class="desktop-install-steps">
                <div class="desktop-step chrome-step">
                    <span class="desktop-step-browser">Chrome / Edge</span>
                    <span>Click the <strong>install icon</strong> <span class="install-icon-example">⎈</span> in the address bar</span>
                </div>
                <div class="desktop-step">
                    <span class="desktop-step-browser">Or</span>
                    <span>Click browser menu <strong>(⋮)</strong> > <strong>"Install PhotoStore"</strong></span>
                </div>
            </div>
            <button class="desktop-install-done">Got it! ✅</button>
        </div>
    `;
    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.add('open');
    });

    modal.querySelector('.desktop-install-close')?.addEventListener('click', () => {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
    });
    modal.querySelector('.desktop-install-overlay')?.addEventListener('click', () => {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
    });
    modal.querySelector('.desktop-install-done')?.addEventListener('click', () => {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
    });
}

// Auto-detect display mode and setup
setupTVMode();
