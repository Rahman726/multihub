// ===================== SLIDESHOW =====================

let slideshowInterval = null;

function initSlideshow() {
    // Add slideshow button to lightbox
    const lightboxActions = document.querySelector('.lightbox-actions');
    if (!lightboxActions) return;
    
    const slideshowBtn = document.createElement('button');
    slideshowBtn.className = 'lightbox-action-btn slideshow-btn';
    slideshowBtn.id = 'slideshowBtn';
    slideshowBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Slideshow
    `;
    
    lightboxActions.insertBefore(slideshowBtn, lightboxActions.firstChild);
    
    slideshowBtn.addEventListener('click', startSlideshow);
    
    // Add fullscreen button
    const fsBtn = document.createElement('button');
    fsBtn.className = 'lightbox-action-btn fs-btn';
    fsBtn.id = 'fullscreenBtn';
    fsBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
    `;
    lightboxActions.appendChild(fsBtn);
    
    fsBtn.addEventListener('click', toggleFullscreen);
}

function startSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
        document.getElementById('slideshowBtn').textContent = 'Slideshow';
        document.getElementById('slideshowBtn').classList.remove('active');
        return;
    }
    
    document.getElementById('slideshowBtn').innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        Stop
    `;
    document.getElementById('slideshowBtn').classList.add('active');
    
    slideshowInterval = setInterval(() => {
        if (typeof navigateLightbox === 'function') {
            navigateLightbox(1);
        }
    }, 3000);
}

function toggleFullscreen() {
    const el = document.querySelector('.lightbox-content') || document.documentElement;
    if (!document.fullscreenElement) {
        el.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
}

// Stop slideshow when lightbox closes
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        const lb = document.getElementById('lightbox');
        if (lb && !lb.classList.contains('open') && slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
        }
    });
    const lb = document.getElementById('lightbox');
    if (lb) observer.observe(lb, { attributes: true, attributeFilter: ['class'] });
});
