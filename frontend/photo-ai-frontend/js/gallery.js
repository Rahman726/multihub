// ===================== DOM =====================
const masonryGrid = document.getElementById('masonryGrid');
const noResults = document.getElementById('noResults');

// ===================== GALLERY =====================
function renderGallery(photosToRender, append = false) {
    filteredPhotos = photosToRender;
    if (!append) masonryGrid.innerHTML = '';

    if (photosToRender.length === 0 && !append) {
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';

    photosToRender.forEach((photo, i) => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.style.animationDelay = `${(append ? 0 : i) * 0.03}s`;
        const isFav = favorites.includes(photo.id);
        item.innerHTML = `
            <img src="${photo.image}" alt="${photo.title}" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-overlay-top">
                    <div class="photo-actions">
                        <button class="photo-action-btn fav-btn ${isFav ? 'fav-active' : ''}" data-id="${photo.id}" title="Favorite">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                        <button class="photo-action-btn download-btn" data-id="${photo.id}" title="Download">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                    </div>
                </div>
                <div class="photo-overlay-bottom">
                    <div class="photo-photographer">
                        <div class="photo-avatar">${photo.artist.split(' ').map(n => n[0]).join('')}</div>
                        <span class="photo-name">${photo.artist}</span>
                    </div>
                </div>
            </div>
        `;

        // Click image to open lightbox
        item.addEventListener('click', (e) => {
            if (e.target.closest('.photo-action-btn')) return;
            openLightbox(photosToRender.indexOf(photo));
        });

        // Favorite button
        item.querySelector('.fav-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(photo.id);
        });

        // Download button
        item.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            simulateDownload(photo);
        });

        // Image error fallback — show colored placeholder with title initials
        const img = item.querySelector('img');
        const color = photo.placeholderColor || '#667eea';
        const initials = photo.title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
        
        function showFallback(el) {
            if (!el || !el.parentNode || el.parentNode.querySelector('.photo-fallback')) return;
            el.outerHTML = `<div class="photo-fallback" style="background:${color}">
                <span style="font-size:2rem;font-weight:700;color:rgba(255,255,255,0.8);">${initials || '📷'}</span>
                <span style="font-size:0.75rem;color:rgba(255,255,255,0.6);text-align:center;padding:0 12px;">${photo.title}</span>
            </div>`;
        }
        
        img.onerror = function() {
            showFallback(this);
        };
        
        // Also check after load — some placeholders load as valid images (empty SVGs, etc.)
        img.onload = function() {
            // If image has 0 dimensions or is tiny, it's likely a placeholder
            if (this.naturalWidth === 0 || this.naturalHeight === 0 || 
                (this.naturalWidth < 10 && this.naturalHeight < 10)) {
                showFallback(this);
            }
        };

        masonryGrid.appendChild(item);
    });
}
