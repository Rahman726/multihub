// ===================== SOCIAL FEATURES =====================

const FOLLOW_KEY = 'photoStoreFollowing';
const ACTIVITY_KEY = 'photoStoreActivity';

function initSocial() {
    // Add Activity nav link
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        const activityLink = document.createElement('a');
        activityLink.className = 'nav-link';
        activityLink.href = '#';
        activityLink.innerHTML = '🔥 Activity';
        activityLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleActivityFeed();
        });
        navLinks.appendChild(activityLink);

        const leaderboardLink = document.createElement('a');
        leaderboardLink.className = 'nav-link';
        leaderboardLink.href = '#';
        leaderboardLink.innerHTML = '🏆 Leaders';
        leaderboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLeaderboard();
        });
        navLinks.appendChild(leaderboardLink);
    }

    // Add Follow button in lightbox
    const lightboxPhotographer = document.querySelector('.lightbox-photographer');
    if (lightboxPhotographer) {
        const followBtn = document.createElement('button');
        followBtn.className = 'social-follow-btn';
        followBtn.id = 'followBtn';
        followBtn.innerHTML = '＋ Follow';
        followBtn.addEventListener('click', toggleFollow);
        lightboxPhotographer.appendChild(followBtn);
    }

    // Create Activity section
    const gallerySection = document.querySelector('.gallery-section');
    if (!gallerySection) return;

    const activitySection = document.createElement('section');
    activitySection.className = 'activity-section';
    activitySection.id = 'activitySection';
    activitySection.style.display = 'none';
    activitySection.innerHTML = `
        <div class="container">
            <div class="activity-header">
                <h2>🔥 Activity Feed</h2>
                <button class="activity-close-btn" id="activityCloseBtn">← Back</button>
            </div>
            <div class="activity-feed" id="activityFeed">
                <div class="activity-loading">Loading activity...</div>
            </div>
        </div>
    `;
    gallerySection.parentElement.insertBefore(activitySection, gallerySection);

    // Create Leaderboard section
    const leaderboardSection = document.createElement('section');
    leaderboardSection.className = 'leaderboard-section';
    leaderboardSection.id = 'leaderboardSection';
    leaderboardSection.style.display = 'none';
    leaderboardSection.innerHTML = `
        <div class="container">
            <div class="leaderboard-header">
                <h2>🏆 Leaderboard</h2>
                <p>Top creators this week</p>
                <button class="leaderboard-close-btn" id="leaderboardCloseBtn">← Back</button>
            </div>
            <div class="leaderboard-list" id="leaderboardList">
                <div class="activity-loading">Loading leaderboard...</div>
            </div>
        </div>
    `;
    gallerySection.parentElement.insertBefore(leaderboardSection, gallerySection);

    // Close buttons
    document.getElementById('activityCloseBtn')?.addEventListener('click', toggleActivityFeed);
    document.getElementById('leaderboardCloseBtn')?.addEventListener('click', toggleLeaderboard);

    // Track user activity
    trackActivity('visited', '🌟', 'Visited PhotoStore');
}

// ===================== FOLLOW SYSTEM =====================

function getFollowing() {
    return JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]');
}

function saveFollowing(following) {
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(following));
}

function toggleFollow() {
    if (!currentUser) {
        showToast('Login to follow users');
        return;
    }

    const photo = window.currentLightboxPhoto;
    if (!photo || photo.artist === currentUser.name) {
        showToast('You cannot follow yourself 😄');
        return;
    }

    const following = getFollowing();
    const idx = following.indexOf(photo.artist);
    
    if (idx >= 0) {
        following.splice(idx, 1);
        saveFollowing(following);
        document.getElementById('followBtn').innerHTML = '＋ Follow';
        document.getElementById('followBtn').classList.remove('following');
        showToast(`Unfollowed ${photo.artist}`);
    } else {
        following.push(photo.artist);
        saveFollowing(following);
        document.getElementById('followBtn').innerHTML = '✓ Following';
        document.getElementById('followBtn').classList.add('following');
        showToast(`Following ${photo.artist}!`);
        trackActivity('follow', '👤', `Started following ${photo.artist}`);
    }
}

function updateFollowButton() {
    const photo = window.currentLightboxPhoto;
    const btn = document.getElementById('followBtn');
    if (!btn || !photo) return;

    const following = getFollowing();
    const isFollowing = following.includes(photo.artist);
    btn.innerHTML = isFollowing ? '✓ Following' : '＋ Follow';
    btn.classList.toggle('following', isFollowing);
    btn.style.display = currentUser && photo.artist !== currentUser.name ? '' : 'none';
}

// ===================== ACTIVITY FEED =====================

function getActivity() {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
}

function saveActivity(activity) {
    const all = getActivity();
    all.unshift(activity);
    if (all.length > 100) all.length = 100;
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(all));
}

function trackActivity(type, icon, message) {
    if (!currentUser) return;
    const activity = {
        type,
        icon,
        message,
        user: currentUser.name,
        time: new Date().toISOString()
    };
    saveActivity(activity);
}

function toggleActivityFeed() {
    const section = document.getElementById('activitySection');
    const gallery = document.querySelector('.gallery-section');
    const hero = document.getElementById('heroMini');
    const filters = document.querySelector('.filters-section');
    const leaderboard = document.getElementById('leaderboardSection');
    const mapSection = document.getElementById('mapSection');

    if (!section) return;
    const isOpen = section.style.display !== 'none';

    if (isOpen) {
        section.style.display = 'none';
        if (gallery) gallery.style.display = '';
        if (hero) hero.style.display = '';
        if (filters) filters.style.display = '';
        if (leaderboard) leaderboard.style.display = 'none';
    } else {
        section.style.display = 'block';
        if (gallery) gallery.style.display = 'none';
        if (hero) hero.style.display = 'none';
        if (filters) filters.style.display = 'none';
        if (leaderboard) leaderboard.style.display = 'none';
        if (mapSection) mapSection.style.display = 'none';
        loadActivityFeed();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function loadActivityFeed() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    const allActivity = getActivity();
    
    if (allActivity.length === 0) {
        feed.innerHTML = '<div class="activity-empty">No activity yet. Start exploring!</div>';
        return;
    }

    // Group activity by user
    const grouped = {};
    allActivity.forEach(a => {
        if (!grouped[a.user]) grouped[a.user] = [];
        grouped[a.user].push(a);
    });

    feed.innerHTML = allActivity.slice(0, 50).map(a => {
        const time = new Date(a.time);
        const timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="activity-item">
                <span class="activity-icon">${a.icon}</span>
                <div class="activity-body">
                    <strong>${a.user}</strong>
                    <p>${a.message}</p>
                    <small>${timeStr}</small>
                </div>
            </div>
        `;
    }).join('');
}

// ===================== LEADERBOARD =====================

function toggleLeaderboard() {
    const section = document.getElementById('leaderboardSection');
    const gallery = document.querySelector('.gallery-section');
    const hero = document.getElementById('heroMini');
    const filters = document.querySelector('.filters-section');
    const activity = document.getElementById('activitySection');
    const mapSection = document.getElementById('mapSection');

    if (!section) return;
    const isOpen = section.style.display !== 'none';

    if (isOpen) {
        section.style.display = 'none';
        if (gallery) gallery.style.display = '';
        if (hero) hero.style.display = '';
        if (filters) filters.style.display = '';
    } else {
        section.style.display = 'block';
        if (gallery) gallery.style.display = 'none';
        if (hero) hero.style.display = 'none';
        if (filters) filters.style.display = 'none';
        if (activity) activity.style.display = 'none';
        if (mapSection) mapSection.style.display = 'none';
        loadLeaderboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function loadLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;

    // Count photos per artist
    const artistCounts = {};
    photos.forEach(p => {
        if (p.artist) {
            artistCounts[p.artist] = (artistCounts[p.artist] || 0) + 1;
        }
    });

    // Get favorites count per artist
    const artistFavs = {};
    favorites.forEach(favId => {
        const photo = photos.find(p => p.id === favId);
        if (photo && photo.artist) {
            artistFavs[photo.artist] = (artistFavs[photo.artist] || 0) + 1;
        }
    });

    // Merge and sort
    const entries = Object.entries(artistCounts).map(([artist, count]) => ({
        artist,
        photos: count,
        favorites: artistFavs[artist] || 0,
        score: count * 2 + (artistFavs[artist] || 0) * 3
    }));

    entries.sort((a, b) => b.score - a.score);

    if (entries.length === 0) {
        list.innerHTML = '<div class="activity-empty">No creators yet. Generate some AI images!</div>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    list.innerHTML = entries.slice(0, 20).map((entry, i) => `
        <div class="leaderboard-item ${i < 3 ? 'leaderboard-top' : ''}">
            <div class="leaderboard-rank">${i < 3 ? medals[i] : `#${i + 1}`}</div>
            <div class="leaderboard-avatar">${entry.artist.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
            <div class="leaderboard-info">
                <strong>${entry.artist}</strong>
                <div class="leaderboard-stats">
                    <span>📸 ${entry.photos} photos</span>
                    <span>❤️ ${entry.favorites} favorites</span>
                </div>
            </div>
            <div class="leaderboard-score">${entry.score} pts</div>
        </div>
    `).join('');
}

// Override lightbox open to update follow button
const originalOpenLightbox = window.openLightbox;
window.openLightbox = function(index) {
    if (originalOpenLightbox) originalOpenLightbox(index);
    setTimeout(updateFollowButton, 100);
};
