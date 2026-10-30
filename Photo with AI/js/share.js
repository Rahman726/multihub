// ===================== SHARE BUTTON =====================

function initShare() {
    const lightboxActions = document.querySelector('.lightbox-actions');
    if (!lightboxActions) return;
    
    const shareBtn = document.createElement('button');
    shareBtn.className = 'lightbox-action-btn share-btn';
    shareBtn.id = 'lightboxShareBtn';
    shareBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share
    `;
    
    // Share dropdown
    const shareDropdown = document.createElement('div');
    shareDropdown.className = 'share-dropdown';
    shareDropdown.id = 'shareDropdown';
    shareDropdown.innerHTML = `
        <button class="share-option" data-platform="whatsapp">
            <span>💬 WhatsApp</span>
        </button>
        <button class="share-option" data-platform="facebook">
            <span>📘 Facebook</span>
        </button>
        <button class="share-option" data-platform="twitter">
            <span>🐦 Twitter</span>
        </button>
        <button class="share-option" data-platform="copy">
            <span>🔗 Copy Link</span>
        </button>
    `;
    
    lightboxActions.insertBefore(shareBtn, lightboxActions.firstChild);
    lightboxActions.appendChild(shareDropdown);
    
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareDropdown.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-dropdown') && !e.target.closest('.share-btn')) {
            shareDropdown.classList.remove('open');
        }
    });
    
    shareDropdown.querySelectorAll('.share-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const platform = opt.dataset.platform;
            const photo = window.currentLightboxPhoto;
            if (!photo) return;
            
            const url = window.location.origin + '/?photo=' + photo.id;
            const text = `Check out "${photo.title}" by ${photo.artist} on PhotoStore!`;
            
            switch (platform) {
                case 'whatsapp':
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                    break;
                case 'facebook':
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                    break;
                case 'twitter':
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                    break;
                case 'copy':
                    navigator.clipboard.writeText(url).then(() => {
                        showToast('Link copied to clipboard! 📋');
                    }).catch(() => {
                        showToast('Failed to copy link', 'error');
                    });
                    break;
            }
            shareDropdown.classList.remove('open');
        });
    });
}
