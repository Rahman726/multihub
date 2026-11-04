// ===================== DOM =====================
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxArtist = document.getElementById('lightboxArtist');
const lightboxCategory = document.getElementById('lightboxCategory');
const lightboxAvatar = document.getElementById('lightboxAvatar');
const lightboxDownload = document.getElementById('lightboxDownload');
const lightboxFav = document.getElementById('lightboxFav');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxBackdrop = document.getElementById('lightboxBackdrop');

// ===================== LIGHTBOX =====================
function initLightbox() {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxBackdrop.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    lightboxNext.addEventListener('click', () => navigateLightbox(1));
    lightboxFav.addEventListener('click', () => {
        if (currentLightboxIndex >= 0) toggleFavorite(filteredPhotos[currentLightboxIndex].id);
    });
    lightboxDownload.addEventListener('click', () => {
        if (currentLightboxIndex >= 0) simulateDownload(filteredPhotos[currentLightboxIndex]);
    });
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(index) {
    currentLightboxIndex = index;
    const photo = filteredPhotos[index];
    
    // Set global refs for other features
    window.currentLightboxPhoto = photo;
    window.currentLightboxPhotoId = photo.id;
    
    // Track view
    fetch(`/api/views/${photo.id}`, { method: 'POST' }).catch(() => {});
    
    lightboxImage.src = photo.fullImage || photo.image;
    lightboxImage.alt = photo.title;
    lightboxArtist.textContent = photo.artist;
    lightboxCategory.textContent = photo.category;
    lightboxAvatar.textContent = photo.artist.split(' ').map(n => n[0]).join('');
    const isFav = favorites.includes(photo.id);
    lightboxFav.classList.toggle('fav-active', isFav);
    lightboxFav.querySelector('svg').setAttribute('fill', isFav ? 'currentColor' : 'none');
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Load features data
    if (typeof loadTags === 'function') loadTags(photo.id);
    if (typeof loadRating === 'function') loadRating(photo.id);
    if (typeof loadComments === 'function') loadComments(photo.id);
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    currentLightboxIndex += dir;
    if (currentLightboxIndex < 0) currentLightboxIndex = filteredPhotos.length - 1;
    if (currentLightboxIndex >= filteredPhotos.length) currentLightboxIndex = 0;
    openLightbox(currentLightboxIndex);
}
