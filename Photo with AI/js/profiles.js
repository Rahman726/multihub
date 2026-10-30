// ===================== USER PROFILES =====================

function initProfiles() {
    // Add profile button in navbar when logged in
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    // Watch for login state changes
    const profileObserver = new MutationObserver(() => {
        updateProfileUI();
    });
    profileObserver.observe(loginBtn, { childList: true, characterData: true, subtree: true });
    
    updateProfileUI();
}

function updateProfileUI() {
    const existing = document.getElementById('profileBtn');
    if (currentUser && !existing) {
        const profileBtn = document.createElement('button');
        profileBtn.className = 'profile-btn';
        profileBtn.id = 'profileBtn';
        profileBtn.innerHTML = `👤 ${currentUser.name?.split(' ')[0] || 'Profile'}`;
        
        const aiBtn = document.getElementById('aiGenerateBtn');
        if (aiBtn) {
            aiBtn.parentElement?.insertBefore(profileBtn, aiBtn);
        }
        
        profileBtn.addEventListener('click', openProfile);
    } else if (!currentUser && existing) {
        existing.remove();
    }
}

function openProfile() {
    if (!currentUser) {
        showToast('Login to view profile');
        return;
    }
    
    // Get user's photos from sharedPhotos
    const userPhotos = photos.filter(p => p.artist === currentUser.name).slice(0, 20);
    const favedPhotos = favorites.map(id => photos.find(p => p.id === id)).filter(Boolean);
    
    // Create modal or use existing
    let profileModal = document.getElementById('profileModal');
    if (!profileModal) {
        profileModal = document.createElement('div');
        profileModal.className = 'profile-modal';
        profileModal.id = 'profileModal';
        document.body.appendChild(profileModal);
    }
    
    profileModal.innerHTML = `
        <div class="profile-overlay" id="profileOverlay"></div>
        <div class="profile-panel" id="profilePanel">
            <button class="profile-close" id="profileClose">✕</button>
            <div class="profile-header">
                <div class="profile-avatar-large">${currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}</div>
                <h2>${currentUser.name}</h2>
                <p>${currentUser.email}</p>
            </div>
            <div class="profile-tabs">
                <button class="profile-tab active" data-tab="uploads">📸 My Photos (${userPhotos.length})</button>
                <button class="profile-tab" data-tab="favorites">♥ Favorites (${favorites.length})</button>
            </div>
            <div class="profile-content" id="profileContent">
                <div class="profile-grid" id="profileGrid">
                    ${userPhotos.length > 0 ? userPhotos.map(p => `
                        <div class="profile-photo-item">
                            <img src="${p.image}" alt="${p.title}" loading="lazy">
                        </div>
                    `).join('') : '<p class="profile-empty">No photos yet</p>'}
                </div>
            </div>
        </div>
    `;
    
    profileModal.style.display = 'block';
    setTimeout(() => {
        document.getElementById('profileOverlay')?.classList.add('open');
        document.getElementById('profilePanel')?.classList.add('open');
    }, 10);
    document.body.style.overflow = 'hidden';
    
    // Close handlers
    document.getElementById('profileClose')?.addEventListener('click', closeProfile);
    document.getElementById('profileOverlay')?.addEventListener('click', closeProfile);
    
    // Tab switching
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const grid = document.getElementById('profileGrid');
            if (tab.dataset.tab === 'uploads') {
                grid.innerHTML = userPhotos.length > 0 ? userPhotos.map(p => `
                    <div class="profile-photo-item"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
                `).join('') : '<p class="profile-empty">No photos yet</p>';
            } else {
                grid.innerHTML = favedPhotos.length > 0 ? favedPhotos.map(p => `
                    <div class="profile-photo-item"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
                `).join('') : '<p class="profile-empty">No favorites yet</p>';
            }
        });
    });
}

function closeProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        document.getElementById('profileOverlay')?.classList.remove('open');
        document.getElementById('profilePanel')?.classList.remove('open');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        document.body.style.overflow = '';
    }
}
