// ===================== DASHBOARD =====================

function initDashboard() {
    // Add dashboard link to footer or collections nav
    const collectionsLink = document.querySelector('.nav-link[href="#"]');
    if (collectionsLink && collectionsLink.textContent.trim() === 'Collections') {
        const dashLink = collectionsLink.cloneNode(true);
        dashLink.textContent = '📊 Dashboard';
        dashLink.href = '#';
        dashLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleDashboard();
        });
        collectionsLink.parentElement.appendChild(dashLink);
    }
    
    // Create dashboard section
    const gallerySection = document.querySelector('.gallery-section');
    if (!gallerySection) return;
    
    const dashSection = document.createElement('section');
    dashSection.className = 'dashboard-section';
    dashSection.id = 'dashboardSection';
    dashSection.style.display = 'none';
    dashSection.innerHTML = `
        <div class="container">
            <div class="dash-header">
                <h2>📊 Dashboard</h2>
                <p>Your PhotoStore stats at a glance</p>
            </div>
            <div class="dash-grid" id="dashGrid">
                <div class="dash-card">
                    <div class="dash-icon">🖼️</div>
                    <div class="dash-stat" id="dashPhotos">0</div>
                    <div class="dash-label">Total Photos</div>
                </div>
                <div class="dash-card">
                    <div class="dash-icon">👁️</div>
                    <div class="dash-stat" id="dashViews">0</div>
                    <div class="dash-label">Total Views</div>
                </div>
                <div class="dash-card">
                    <div class="dash-icon">⭐</div>
                    <div class="dash-stat" id="dashRatings">0</div>
                    <div class="dash-label">Total Ratings</div>
                </div>
                <div class="dash-card">
                    <div class="dash-icon">💬</div>
                    <div class="dash-stat" id="dashComments">0</div>
                    <div class="dash-label">Comments</div>
                </div>
                <div class="dash-card">
                    <div class="dash-icon">📂</div>
                    <div class="dash-stat" id="dashAlbums">0</div>
                    <div class="dash-label">Albums</div>
                </div>
                <div class="dash-card">
                    <div class="dash-icon">♥</div>
                    <div class="dash-stat" id="dashFavorites">0</div>
                    <div class="dash-label">Your Favorites</div>
                </div>
            </div>
            <div class="dash-recent" id="dashRecent">
                <h3>Recent Activity</h3>
                <div class="dash-activity-list" id="dashActivity">
                    <p class="dash-empty">No activity yet. Start exploring!</p>
                </div>
            </div>
        </div>
    `;
    
    gallerySection.parentElement.insertBefore(dashSection, gallerySection);
}

function toggleDashboard() {
    const dash = document.getElementById('dashboardSection');
    const gallery = document.querySelector('.gallery-section');
    const hero = document.getElementById('hero');
    const filters = document.querySelector('.filters-section');
    
    if (!dash) return;
    const isOpen = dash.style.display !== 'none';
    
    if (isOpen) {
        dash.style.display = 'none';
        gallery.style.display = '';
        if (hero) hero.style.display = '';
        if (filters) filters.style.display = '';
    } else {
        dash.style.display = 'block';
        gallery.style.display = 'none';
        if (hero) hero.style.display = 'none';
        if (filters) filters.style.display = 'none';
        loadDashboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function loadDashboard() {
    // Local stats (always available)
    const localStats = {
        totalPhotos: photos.length + (window.infinitePhotos?.length || 0),
        totalFavorites: favorites.length,
        totalLocalAlbums: JSON.parse(localStorage.getItem('photoStoreLocalAlbums') || '[]').length,
        totalLocalComments: Object.values(JSON.parse(localStorage.getItem('photoStoreLocalComments') || '{}')).reduce((a, b) => a + b.length, 0),
        totalLocalRatings: Object.values(JSON.parse(localStorage.getItem('photoStoreLocalRatings') || '{}')).reduce((a, b) => a + b.length, 0)
    };
    
    let stats = null;
    
    // Try server for additional stats
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch('/api/stats', { signal: controller.signal });
        if (res.ok) {
            stats = await res.json();
        }
    } catch (e) {
        console.warn('Server offline for dashboard:', e.message);
    }
    
    // Combine server + local stats
    document.getElementById('dashPhotos').textContent = stats?.totalPhotos || localStats.totalPhotos;
    document.getElementById('dashViews').textContent = stats?.totalViews || '—';
    document.getElementById('dashRatings').textContent = stats?.totalRatings || localStats.totalLocalRatings || '—';
    document.getElementById('dashComments').textContent = stats?.totalComments || localStats.totalLocalComments || '—';
    document.getElementById('dashAlbums').textContent = stats?.totalAlbums || localStats.totalLocalAlbums || '—';
    document.getElementById('dashFavorites').textContent = favorites.length || '—';
    
    // Recent activity
    const activity = document.getElementById('dashActivity');
    if (activity) {
        const items = [];
        items.push(`<div class="activity-item"><span>📸</span><span>${localStats.totalPhotos} photos in gallery</span></div>`);
        items.push(`<div class="activity-item"><span>♥</span><span>${favorites.length} favorites saved</span></div>`);
        if (localStats.totalLocalAlbums > 0) {
            items.push(`<div class="activity-item"><span>📂</span><span>${localStats.totalLocalAlbums} albums created</span></div>`);
        }
        if (localStats.totalLocalComments > 0) {
            items.push(`<div class="activity-item"><span>💬</span><span>${localStats.totalLocalComments} comments posted</span></div>`);
        }
        if (stats?.totalViews > 0) {
            items.push(`<div class="activity-item"><span>👁️</span><span>${stats.totalViews} total views</span></div>`);
        }
        
        activity.innerHTML = items.join('');
    }
}
