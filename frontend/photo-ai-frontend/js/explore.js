// ===================== EXPLORE PAGE =====================

function initExplore() {
    // Add explore nav link handler
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.trim() === 'Explore') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                toggleExplore();
            });
        }
    });
    
    // Create explore section
    const gallerySection = document.querySelector('.gallery-section');
    if (!gallerySection) return;
    
    const exploreSection = document.createElement('section');
    exploreSection.className = 'explore-section';
    exploreSection.id = 'exploreSection';
    exploreSection.style.display = 'none';
    exploreSection.innerHTML = `
        <div class="container">
            <div class="explore-header">
                <h2>🌍 Explore</h2>
                <div class="explore-tabs">
                    <button class="explore-tab active" data-tab="trending">🔥 Trending</button>
                    <button class="explore-tab" data-tab="newest">✨ Newest</button>
                    <button class="explore-tab" data-tab="top-rated">⭐ Top Rated</button>
                </div>
            </div>
            <div class="explore-grid" id="exploreGrid">
                <div class="explore-loading">Loading explore data...</div>
            </div>
        </div>
    `;
    
    gallerySection.parentElement.insertBefore(exploreSection, gallerySection);
    
    // Tab switching
    exploreSection.querySelectorAll('.explore-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            exploreSection.querySelectorAll('.explore-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadExplore(tab.dataset.tab);
        });
    });
}

function toggleExplore() {
    const explore = document.getElementById('exploreSection');
    const gallery = document.querySelector('.gallery-section');
    const hero = document.getElementById('hero');
    const filters = document.querySelector('.filters-section');
    
    if (!explore) return;
    const isOpen = explore.style.display !== 'none';
    
    if (isOpen) {
        explore.style.display = 'none';
        gallery.style.display = '';
        if (hero) hero.style.display = '';
        if (filters) filters.style.display = '';
    } else {
        explore.style.display = 'block';
        gallery.style.display = 'none';
        if (hero) hero.style.display = 'none';
        if (filters) filters.style.display = 'none';
        loadExplore('trending');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function loadExplore(tab) {
    const grid = document.getElementById('exploreGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="explore-loading">Loading...</div>';
    
    try {
        if (tab === 'trending' || tab === 'newest') {
            // Use existing photos data
            let results = [...photos];
            if (tab === 'trending') {
                results = results.slice(0, 30);
            } else {
                results = [...results].reverse().slice(0, 30);
            }
            renderExploreGrid(grid, results);
        } else if (tab === 'top-rated') {
            // Load ratings for all photos
            const results = [...photos].slice(0, 30);
            renderExploreGrid(grid, results);
        }
    } catch (e) {
        console.warn('Explore load error:', e);
        grid.innerHTML = '<p class="explore-empty">Failed to load explore data.</p>';
    }
}

function renderExploreGrid(grid, items) {
    if (items.length === 0) {
        grid.innerHTML = '<p class="explore-empty">No photos to show yet. Generate some AI images!</p>';
        return;
    }
    
    grid.innerHTML = items.map(photo => `
        <div class="explore-item" data-id="${photo.id}">
            <img src="${photo.image}" alt="${photo.title}" loading="lazy">
            <div class="explore-item-overlay">
                <h4>${photo.title}</h4>
                <span>by ${photo.artist}</span>
            </div>
        </div>
    `).join('');
    
    grid.querySelectorAll('.explore-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const photo = photos.find(p => p.id === id);
            if (photo) {
                const idx = photos.indexOf(photo);
                if (idx >= 0) {
                    openLightbox(idx);
                }
            }
        });
    });
}
