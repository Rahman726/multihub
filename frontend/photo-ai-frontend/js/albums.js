// ===================== USER ALBUMS =====================

function initAlbums() {
    // Create albums modal first (before any early returns)
    const albumsModal = document.createElement('div');
    albumsModal.className = 'albums-modal';
    albumsModal.id = 'albumsModal';
    albumsModal.style.display = 'none';
    albumsModal.innerHTML = `
        <div class="albums-overlay" id="albumsOverlay"></div>
        <div class="albums-panel" id="albumsPanel">
            <div class="albums-header">
                <h3>📂 My Albums</h3>
                <button class="albums-close" id="albumsClose">✕</button>
            </div>
            <div class="albums-body">
                <div class="albums-create">
                    <input type="text" id="albumNameInput" placeholder="New album name..." maxlength="30">
                    <button id="albumCreateBtn">Create</button>
                </div>
                <div class="albums-list" id="albumsList">
                    <p class="albums-empty">No albums yet. Create your first one!</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(albumsModal);
    
    // Event listeners for modal
    document.getElementById('albumsClose')?.addEventListener('click', closeAlbums);
    document.getElementById('albumsOverlay')?.addEventListener('click', closeAlbums);
    document.getElementById('albumCreateBtn')?.addEventListener('click', createAlbum);
    document.getElementById('albumNameInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') createAlbum();
    });

    // Hook Collections nav link to open albums modal
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.trim() === 'Collections') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Close other full-page sections
                const explore = document.getElementById('exploreSection');
                const dash = document.getElementById('dashboardSection');
                if (explore) explore.style.display = 'none';
                if (dash) dash.style.display = 'none';
                openAlbums();
            });
        }
    });

    // Add albums button to navbar (optional, may not exist on mobile)
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const albumsBtn = document.createElement('button');
        albumsBtn.className = 'nav-albums-btn';
        albumsBtn.id = 'albumsBtn';
        albumsBtn.innerHTML = '📂 Albums';
        navActions.insertBefore(albumsBtn, navActions.querySelector('.nav-fav-toggle'));
        albumsBtn.addEventListener('click', openAlbums);
    }
    

    
    // Add "Add to Album" button in lightbox
    const lightboxActions = document.querySelector('.lightbox-actions');
    if (lightboxActions) {
        const addToAlbumBtn = document.createElement('button');
        addToAlbumBtn.className = 'lightbox-action-btn';
        addToAlbumBtn.id = 'addToAlbumBtn';
        addToAlbumBtn.innerHTML = '📂 Add to Album';
        addToAlbumBtn.addEventListener('click', showAlbumPicker);
        lightboxActions.appendChild(addToAlbumBtn);
    }
}

function openAlbums() {
    document.getElementById('albumsModal').style.display = 'block';
    document.getElementById('albumsOverlay').classList.add('open');
    document.getElementById('albumsPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
    loadAlbumsList();
}

function closeAlbums() {
    document.getElementById('albumsModal').style.display = 'none';
    document.getElementById('albumsOverlay').classList.remove('open');
    document.getElementById('albumsPanel').classList.remove('open');
    document.body.style.overflow = '';
}

// Local storage for offline albums
const LOCAL_ALBUMS_KEY = 'photoStoreLocalAlbums';

function getLocalAlbums() {
    return JSON.parse(localStorage.getItem(LOCAL_ALBUMS_KEY) || '[]');
}

function saveLocalAlbums(albums) {
    localStorage.setItem(LOCAL_ALBUMS_KEY, JSON.stringify(albums));
}

async function createAlbum() {
    const input = document.getElementById('albumNameInput');
    const name = input?.value.trim();
    if (!name) return;
    
    const user = currentUser?.name || 'Anonymous';
    
    const newAlbum = {
        id: Date.now(),
        name,
        user,
        photos: [],
        createdAt: new Date().toISOString()
    };
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch('/api/albums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, user }),
            signal: controller.signal
        });
        if (res.ok) {
            input.value = '';
            loadAlbumsList();
            showToast(`Album "${name}" created! 🎉`);
            return;
        }
    } catch (e) {
        console.warn('Server offline, saving album locally:', e.message);
    }
    
    // Save locally (offline fallback)
    const localAlbums = getLocalAlbums();
    localAlbums.unshift(newAlbum);
    saveLocalAlbums(localAlbums);
    input.value = '';
    loadAlbumsList();
    showToast(`Album "${name}" created (offline)! 🎉`);
}

async function loadAlbumsList() {
    const list = document.getElementById('albumsList');
    if (!list) return;
    
    let serverAlbums = [];
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch('/api/albums', { signal: controller.signal });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.albums)) {
                serverAlbums = data.albums;
            }
        }
    } catch (e) {
        console.warn('Server offline for albums:', e.message);
    }
    
    // Merge with local albums
    const localAlbums = getLocalAlbums();
    const serverIds = new Set(serverAlbums.map(a => a.id));
    const newLocals = localAlbums.filter(a => !serverIds.has(a.id));
    const allAlbums = [...newLocals, ...serverAlbums];
    
    if (allAlbums.length === 0) {
        list.innerHTML = '<p class="albums-empty">No albums yet. Create your first one!</p>';
        return;
    }
    
    list.innerHTML = allAlbums.map(album => `
        <div class="album-item" data-id="${album.id}">
            <div class="album-icon">📁</div>
            <div class="album-info">
                <strong>${escapeHtml(album.name)}</strong>
                <small>${album.photos?.length || 0} photos</small>
            </div>
        </div>
    `).join('');
}

async function showAlbumPicker() {
    const photoId = window.currentLightboxPhotoId;
    if (!photoId || !currentUser) {
        showToast('Login to add photos to albums');
        return;
    }
    
    let serverAlbums = [];
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch('/api/albums', { signal: controller.signal });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.albums)) {
                serverAlbums = data.albums;
            }
        }
    } catch (e) {
        console.warn('Server offline for album picker:', e.message);
    }
    
    // Merge with local albums
    const localAlbums = getLocalAlbums();
    const serverIds = new Set(serverAlbums.map(a => a.id));
    const newLocals = localAlbums.filter(a => !serverIds.has(a.id));
    const allAlbums = [...newLocals, ...serverAlbums];
    
    if (allAlbums.length === 0) {
        showToast('Create an album first!');
        return;
    }
    
    // Simple prompt-based album picker
    const albumNames = allAlbums.map((a, i) => `${i + 1}. ${a.name} (${a.photos?.length || 0} photos)`).join('\n');
    const choice = prompt(`Select album:\n\n${albumNames}\n\nEnter number (1-${allAlbums.length}):`);
    if (!choice) return;
    
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < allAlbums.length) {
        const album = allAlbums[idx];
        
        // Try server
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 3000);
            
            const addRes = await fetch(`/api/albums/${album.id}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoId }),
                signal: controller.signal
            });
            if (addRes.ok) {
                showToast(`Added to "${album.name}" 📂`);
                return;
            }
        } catch (e) {
            console.warn('Server offline, saving to album locally:', e.message);
        }
        
        // Save locally
        const localAlbumsAll = getLocalAlbums();
        const targetAlbum = localAlbumsAll.find(a => a.id === album.id);
        if (targetAlbum) {
            if (!targetAlbum.photos.includes(photoId)) {
                targetAlbum.photos.push(photoId);
            }
            saveLocalAlbums(localAlbumsAll);
            showToast(`Added to "${album.name}" (offline) 📂`);
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
