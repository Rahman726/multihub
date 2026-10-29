let currentPage = 1;
let currentPhotos = [];
let currentPhotoIndex = 0;
let currentCategory = 'all';
let currentSearchTerm = '';

const photoGrid = document.getElementById('photoGrid');
const loadingEl = document.getElementById('loading');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Lightbox elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const closeLightbox = document.getElementById('closeLightbox');
const prevPhoto = document.getElementById('prevPhoto');
const nextPhoto = document.getElementById('nextPhoto');

// Picsum Photos API - unlimited photos
async function fetchPhotos(page = 1, limit = 20) {
    showLoading(true);
    
    try {
        // Use Picsum Photos for random/unlimited photos
        const photos = [];
        for (let i = 0; i < limit; i++) {
            const id = (page - 1) * limit + i + 1 + Math.floor(Math.random() * 1000);
            photos.push({
                id: id,
                url: `https://picsum.photos/seed/${id + currentPage}/800/600`,
                thumb: `https://picsum.photos/seed/${id + currentPage}/400/300`,
                author: `Photographer ${id % 100}`,
                title: `Photo ${id}`
            });
        }
        
        setTimeout(() => {
            displayPhotos(photos);
            showLoading(false);
        }, 300); // Small delay for better UX
    } catch (error) {
        console.error('Error fetching photos:', error);
        showLoading(false);
    }
}

function displayPhotos(photos) {
    currentPhotos = [...currentPhotos, ...photos];
    
    photos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.thumb}" alt="${photo.title}" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-author">${photo.author}</div>
            </div>
        `;
        
        photoItem.addEventListener('click', () => {
            openLightbox(currentPhotos.length - photos.length + index);
        });
        
        photoGrid.appendChild(photoItem);
    });
}

function showLoading(show) {
    if (show) {
        loadingEl.classList.remove('hidden');
        loadMoreBtn.disabled = true;
    } else {
        loadingEl.classList.add('hidden');
        loadMoreBtn.disabled = false;
    }
}

function openLightbox(index) {
    currentPhotoIndex = index;
    const photo = currentPhotos[index];
    lightboxImg.src = photo.url;
    lightboxTitle.textContent = `${photo.title} by ${photo.author}`;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeLightboxFunc() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function navigatePhoto(direction) {
    if (direction === 'prev') {
        currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length;
    } else {
        currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
    }
    const photo = currentPhotos[currentPhotoIndex];
    lightboxImg.src = photo.url;
    lightboxTitle.textContent = `${photo.title} by ${photo.author}`;
}

// Event Listeners
loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchPhotos(currentPage);
});

searchBtn.addEventListener('click', () => {
    currentSearchTerm = searchInput.value.trim();
    if (currentSearchTerm) {
        photoGrid.innerHTML = '';
        currentPhotos = [];
        currentPage = 1;
        // Simulate search with different seeds
        fetchPhotosSearch(currentSearchTerm);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

randomBtn.addEventListener('click', () => {
    photoGrid.innerHTML = '';
    currentPhotos = [];
    currentPage = 1;
    currentSearchTerm = '';
    searchInput.value = '';
    currentCategory = 'all';
    filterBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
    fetchPhotos(currentPage);
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        photoGrid.innerHTML = '';
        currentPhotos = [];
        currentPage = 1;
        currentSearchTerm = '';
        searchInput.value = '';
        fetchPhotos(currentPage);
    });
});

async function fetchPhotosSearch(term) {
    showLoading(true);
    const photos = [];
    for (let i = 0; i < 20; i++) {
        const id = i + 10000 + Math.floor(Math.random() * 5000);
        photos.push({
            id: id,
            url: `https://picsum.photos/seed/${term.replace(/\s+/g, '')}${id}/800/600`,
            thumb: `https://picsum.photos/seed/${term.replace(/\s+/g, '')}${id}/400/300`,
            author: `Search Result ${i + 1}`,
            title: `${term} - Photo ${i + 1}`
        });
    }
    setTimeout(() => {
        displayPhotos(photos);
        showLoading(false);
    }, 300);
}

// Lightbox events
closeLightbox.addEventListener('click', closeLightboxFunc);

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightboxFunc();
    }
});

prevPhoto.addEventListener('click', () => navigatePhoto('prev'));
nextPhoto.addEventListener('click', () => navigatePhoto('next'));

document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    
    if (e.key === 'Escape') {
        closeLightboxFunc();
    } else if (e.key === 'ArrowLeft') {
        navigatePhoto('prev');
    } else if (e.key === 'ArrowRight') {
        navigatePhoto('next');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchPhotos(currentPage);
});
