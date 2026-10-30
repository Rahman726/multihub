// ===================== DOM =====================
const favToggle = document.getElementById('favToggle');
const favSidebar = document.getElementById('favSidebar');
const favOverlay = document.getElementById('favOverlay');
const favClose = document.getElementById('favClose');
const favCount = document.getElementById('favCount');
const favItems = document.getElementById('favItems');
const favEmpty = document.getElementById('favEmpty');

// ===================== FAVORITES =====================
function initFavorites() {
    favToggle.addEventListener('click', openFavSidebar);
    favClose.addEventListener('click', closeFavSidebar);
    favOverlay.addEventListener('click', closeFavSidebar);
}

function openFavSidebar() {
    favSidebar.classList.add('open');
    favOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeFavSidebar() {
    favSidebar.classList.remove('open');
    favOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleFavorite(photoId) {
    const idx = favorites.indexOf(photoId);
    if (idx > -1) {
        favorites.splice(idx, 1);
        showToast('Removed from favorites');
    } else {
        favorites.push(photoId);
        showToast('Added to favorites ♥');
    }
    localStorage.setItem('photoStoreFavorites', JSON.stringify(favorites));
    updateFavUI();
    // Update heart icons in gallery
    document.querySelectorAll('.fav-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        const isFav = favorites.includes(id);
        btn.classList.toggle('fav-active', isFav);
        btn.querySelector('svg').setAttribute('fill', isFav ? 'currentColor' : 'none');
    });
    // Update lightbox fav if open
    if (lightbox.classList.contains('open') && currentLightboxIndex >= 0) {
        const photo = filteredPhotos[currentLightboxIndex];
        const isFav = favorites.includes(photo.id);
        lightboxFav.classList.toggle('fav-active', isFav);
        lightboxFav.querySelector('svg').setAttribute('fill', isFav ? 'currentColor' : 'none');
    }
}

function updateFavUI() {
    const count = favorites.length;
    favCount.textContent = count;
    favCount.classList.toggle('visible', count > 0);

    favItems.querySelectorAll('.fav-item').forEach(el => el.remove());
    if (count === 0) {
        favEmpty.style.display = 'block';
    } else {
        favEmpty.style.display = 'none';
        favorites.forEach(id => {
            const photo = photos.find(p => p.id === id);
            if (!photo) return;
            const el = document.createElement('div');
            el.className = 'fav-item';
            el.innerHTML = `
                <div class="fav-item-img"><img src="${photo.image}" alt="${photo.title}"></div>
                <div class="fav-item-info">
                    <div class="fav-item-name">${photo.title}</div>
                    <div class="fav-item-artist">by ${photo.artist}</div>
                    <button class="fav-item-remove" data-id="${photo.id}">Remove</button>
                </div>
            `;
            el.querySelector('.fav-item-remove').addEventListener('click', () => toggleFavorite(photo.id));
            favItems.appendChild(el);
        });
    }
}
