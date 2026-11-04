// ===================== VIDEO GALLERY =====================
// Sample free-to-use video data (Pexels / public domain)
const SAMPLE_VIDEOS = [
    {
        id: 1001,
        title: 'Mountain Sunrise',
        artist: 'Nature Films',
        category: 'nature',
        thumbnail: 'https://images.pexels.com/videos/854033/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/854033/854033-sd_640_360_24fps.mp4',
        duration: '0:15',
        poster: 'https://images.pexels.com/videos/854033/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    },
    {
        id: 1002,
        title: 'Ocean Waves',
        artist: 'Coastal Media',
        category: 'nature',
        thumbnail: 'https://images.pexels.com/videos/855395/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/855395/855395-sd_640_360_24fps.mp4',
        duration: '0:30',
        poster: 'https://images.pexels.com/videos/855395/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    },
    {
        id: 1003,
        title: 'City Traffic',
        artist: 'Urban Shots',
        category: 'city',
        thumbnail: 'https://images.pexels.com/videos/3048448/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/3048448/3048448-sd_640_360_24fps.mp4',
        duration: '0:22',
        poster: 'https://images.pexels.com/videos/3048448/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    },
    {
        id: 1004,
        title: 'Forest Stream',
        artist: 'Wilderness Lab',
        category: 'nature',
        thumbnail: 'https://images.pexels.com/videos/1556963/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/1556963/1556963-sd_640_360_24fps.mp4',
        duration: '0:18',
        poster: 'https://images.pexels.com/videos/1556963/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    },
    {
        id: 1005,
        title: 'Aerial Drone',
        artist: 'SkyView Pro',
        category: 'drone',
        thumbnail: 'https://images.pexels.com/videos/3035723/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/3035723/3035723-sd_640_360_24fps.mp4',
        duration: '0:25',
        poster: 'https://images.pexels.com/videos/3035723/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    },
    {
        id: 1006,
        title: 'Night Stars',
        artist: 'AstroCapture',
        category: 'nature',
        thumbnail: 'https://images.pexels.com/videos/2838708/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/2838708/2838708-sd_640_360_24fps.mp4',
        duration: '0:20',
        poster: 'https://images.pexels.com/videos/2838708/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    },
    {
        id: 1007,
        title: 'Busy Street',
        artist: 'Urban Shots',
        category: 'city',
        thumbnail: 'https://images.pexels.com/videos/1536113/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/1536113/1536113-sd_640_360_24fps.mp4',
        duration: '0:28',
        poster: 'https://images.pexels.com/videos/1536113/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    },
    {
        id: 1008,
        title: 'Sunset Beach',
        artist: 'Coastal Media',
        category: 'nature',
        thumbnail: 'https://images.pexels.com/videos/2685760/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=480&w=360',
        videoUrl: 'https://videos.pexels.com/video-files/2685760/2685760-sd_640_360_24fps.mp4',
        duration: '0:35',
        poster: 'https://images.pexels.com/videos/2685760/thumb-1.jpg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720'
    }
];

// ─── State ──────────────────────────────────────────────────────────────────
let videoState = {
    videos: [...SAMPLE_VIDEOS],
    filteredVideos: [...SAMPLE_VIDEOS],
    currentFilter: 'all',
    currentVideo: null,
    videoFavorites: JSON.parse(localStorage.getItem('photoStoreVideoFavorites') || '[]'),
    isPlaying: false,
    videoAlbums: [],
    currentAlbumId: null,
    addVideoPendingAlbumId: null,
};

// ─── Local Storage Keys ─────────────────────────────────────────────────────
const VIDEO_ALBUMS_KEY = 'photoStoreVideoAlbums';

function getLocalVideoAlbums() {
    try { return JSON.parse(localStorage.getItem(VIDEO_ALBUMS_KEY) || '[]'); } catch { return []; }
}

function saveLocalVideoAlbums(albums) {
    localStorage.setItem(VIDEO_ALBUMS_KEY, JSON.stringify(albums));
}

// ─── DOM Refs (filled in init) ──────────────────────────────────────────────
let el = {};

// ─── Init ────────────────────────────────────────────────────────────────────
function initVideos() {
    buildUI();
    cacheDOMElements();
    bindEvents();
    loadVideoAlbums();
    renderVideoGallery(videoState.filteredVideos);
    console.log('🎬 Video Gallery initialized');
}

// ─── Build UI (adds video section, player modal, album sidebar, add-modal) ──
function buildUI() {
    // === Video Section ===
    if (!document.getElementById('videosSection')) {
        const videoSection = document.createElement('section');
        videoSection.className = 'videos-section';
        videoSection.id = 'videosSection';
        videoSection.style.display = 'none';
        videoSection.innerHTML = `
            <div class="container">
                <div class="videos-header">
                    <div class="videos-header-left">
                        <h2>🎬 Video Gallery</h2>
                        <p>Browse and discover beautiful videos</p>
                    </div>
                    <div class="videos-header-actions">
                        <button class="videos-add-btn" id="addVideoBtn">➕ Add Video</button>
                        <button class="videos-albums-btn" id="videoAlbumsBtn">📁 Video Albums</button>
                    </div>
                </div>
                <div class="videos-filter-bar" id="videosFilterBar">
                    <button class="videos-filter-btn active" data-cat="all">All</button>
                    <button class="videos-filter-btn" data-cat="nature">🌿 Nature</button>
                    <button class="videos-filter-btn" data-cat="city">🏙 City</button>
                    <button class="videos-filter-btn" data-cat="drone">🚁 Drone</button>
                    <button class="videos-filter-btn" data-cat="favorites">❤️ Favorites</button>
                </div>
                <div class="videos-grid" id="videosGrid">
                    <div class="videos-loading">Loading videos...</div>
                </div>
                <div class="videos-empty" id="videosEmpty" style="display:none;">
                    <span>🎬</span>
                    <h3>No videos found</h3>
                    <p>Try a different filter or add some videos!</p>
                </div>
            </div>
        `;
        // Insert after gallery section
        const gallery = document.getElementById('gallery');
        if (gallery) {
            gallery.parentNode.insertBefore(videoSection, gallery.nextSibling);
        } else {
            document.querySelector('.gallery-section')?.after(videoSection);
        }
    }

    // === Video Player Modal ===
    if (!document.getElementById('videoPlayerModal')) {
        const playerModal = document.createElement('div');
        playerModal.className = 'video-player-modal';
        playerModal.id = 'videoPlayerModal';
        playerModal.style.display = 'none';
        playerModal.innerHTML = `
            <div class="video-player-backdrop" id="videoPlayerBackdrop"></div>
            <div class="video-player-content">
                <button class="video-player-close" id="videoPlayerClose" title="Close (Esc)">✕</button>
                <div class="video-player-wrapper" id="videoPlayerWrapper">
                    <video id="videoPlayer" controls autoplay playsinline preload="metadata"></video>
                </div>
                <div class="video-player-bar">
                    <div class="video-player-info">
                        <strong class="video-player-title" id="videoPlayerTitle">Title</strong>
                        <span class="video-player-artist" id="videoPlayerArtist">Artist</span>
                    </div>
                    <div class="video-player-actions">
                        <button class="video-player-action-btn" id="videoPlayerFav" title="Favorite">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            <span>Favorite</span>
                        </button>
                        <button class="video-player-action-btn" id="videoPlayerAddToAlbum" title="Add to Album">
                            📁 <span>Album</span>
                        </button>
                        <button class="video-player-action-btn" id="videoPlayerDownload" title="Download">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span>Download</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(playerModal);
    }

    // === Video Albums Sidebar ===
    if (!document.getElementById('videoAlbumsModal')) {
        const albumsModal = document.createElement('div');
        albumsModal.className = 'video-albums-modal';
        albumsModal.id = 'videoAlbumsModal';
        albumsModal.style.display = 'none';
        albumsModal.innerHTML = `
            <div class="video-albums-overlay" id="videoAlbumsOverlay"></div>
            <div class="video-albums-panel" id="videoAlbumsPanel">
                <div class="video-albums-header">
                    <h3>📁 Video Albums</h3>
                    <button class="video-albums-close" id="videoAlbumsClose">✕</button>
                </div>
                <div class="video-albums-body" id="videoAlbumsBody">
                    <div class="video-albums-create">
                        <input type="text" id="videoAlbumNameInput" placeholder="New album name..." maxlength="30">
                        <button id="videoAlbumCreateBtn">Create</button>
                    </div>
                    <div class="video-albums-list" id="videoAlbumsList">
                        <p class="video-albums-empty">No albums yet. Create your first one!</p>
                    </div>
                    <div class="video-album-detail" id="videoAlbumDetail" style="display:none;">
                        <button class="video-album-back-btn" id="videoAlbumBackBtn">← Back to Albums</button>
                        <h4 id="videoAlbumDetailTitle"></h4>
                        <div class="video-album-videos" id="videoAlbumVideos"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(albumsModal);
    }

    // === Add Video Modal ===
    if (!document.getElementById('addVideoModal')) {
        const addModal = document.createElement('div');
        addModal.className = 'add-video-modal';
        addModal.id = 'addVideoModal';
        addModal.style.display = 'none';
        addModal.innerHTML = `
            <div class="add-video-overlay" id="addVideoOverlay"></div>
            <div class="add-video-panel">
                <div class="add-video-header">
                    <h3>➕ Add Video</h3>
                    <button class="add-video-close" id="addVideoClose">✕</button>
                </div>
                <div class="add-video-body">
                    <p class="add-video-desc">Paste a video URL from YouTube, Vimeo, or any direct video file link.</p>
                    <form id="addVideoForm">
                        <div class="add-video-field">
                            <label>📹 Video URL</label>
                            <input type="url" id="addVideoUrl" placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4" required>
                        </div>
                        <div class="add-video-row">
                            <div class="add-video-field">
                                <label>📝 Title</label>
                                <input type="text" id="addVideoTitle" placeholder="My Awesome Video" maxlength="60" required>
                            </div>
                            <div class="add-video-field">
                                <label>👤 Artist</label>
                                <input type="text" id="addVideoArtist" placeholder="Your Name" maxlength="30">
                            </div>
                        </div>
                        <div class="add-video-preview" id="addVideoPreview" style="display:none;">
                            <div class="add-video-preview-thumb" id="addVideoPreviewThumb"></div>
                            <span class="add-video-preview-type" id="addVideoPreviewType"></span>
                        </div>
                        <button type="submit" class="add-video-submit" id="addVideoSubmit">➕ Add to Gallery</button>
                    </form>
                    <div class="add-video-tips">
                        <p>💡 <strong>Tips:</strong></p>
                        <ul>
                            <li>YouTube: paste the full video URL</li>
                            <li>Direct MP4/WebM links work too</li>
                            <li>Vimeo links are supported</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(addModal);
    }
}

// ─── Cache DOM Elements ──────────────────────────────────────────────────────
function cacheDOMElements() {
    el = {
        // Section
        section: document.getElementById('videosSection'),
        grid: document.getElementById('videosGrid'),
        empty: document.getElementById('videosEmpty'),
        filterBar: document.getElementById('videosFilterBar'),

        // Player
        playerModal: document.getElementById('videoPlayerModal'),
        playerBackdrop: document.getElementById('videoPlayerBackdrop'),
        playerClose: document.getElementById('videoPlayerClose'),
        playerVideo: document.getElementById('videoPlayer'),
        playerWrapper: document.getElementById('videoPlayerWrapper'),
        playerTitle: document.getElementById('videoPlayerTitle'),
        playerArtist: document.getElementById('videoPlayerArtist'),
        playerFav: document.getElementById('videoPlayerFav'),
        playerAddAlbum: document.getElementById('videoPlayerAddToAlbum'),
        playerDownload: document.getElementById('videoPlayerDownload'),

        // Albums
        albumsModal: document.getElementById('videoAlbumsModal'),
        albumsOverlay: document.getElementById('videoAlbumsOverlay'),
        albumsClose: document.getElementById('videoAlbumsClose'),
        albumsBody: document.getElementById('videoAlbumsBody'),
        albumCreateBtn: document.getElementById('videoAlbumCreateBtn'),
        albumNameInput: document.getElementById('videoAlbumNameInput'),
        albumsList: document.getElementById('videoAlbumsList'),
        albumDetail: document.getElementById('videoAlbumDetail'),
        albumBackBtn: document.getElementById('videoAlbumBackBtn'),
        albumDetailTitle: document.getElementById('videoAlbumDetailTitle'),
        albumVideos: document.getElementById('videoAlbumVideos'),

        // Add Video
        addModal: document.getElementById('addVideoModal'),
        addOverlay: document.getElementById('addVideoOverlay'),
        addClose: document.getElementById('addVideoClose'),
        addForm: document.getElementById('addVideoForm'),
        addUrl: document.getElementById('addVideoUrl'),
        addTitle: document.getElementById('addVideoTitle'),
        addArtist: document.getElementById('addVideoArtist'),
        addSubmit: document.getElementById('addVideoSubmit'),
        addPreview: document.getElementById('addVideoPreview'),
        addPreviewThumb: document.getElementById('addVideoPreviewThumb'),
        addPreviewType: document.getElementById('addVideoPreviewType'),

        // Nav
        navBtn: document.getElementById('videosNavBtn'),
        albumsBtn: document.getElementById('videoAlbumsBtn'),
        addBtn: document.getElementById('addVideoBtn'),
    };
}

// ─── Bind Events ─────────────────────────────────────────────────────────────
function bindEvents() {
    // Add Videos nav button
    addVideosNavButton();

    // Filter buttons
    el.filterBar?.addEventListener('click', (e) => {
        const btn = e.target.closest('.videos-filter-btn');
        if (!btn) return;
        el.filterBar.querySelectorAll('.videos-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        videoState.currentFilter = btn.dataset.cat;
        filterVideos();
    });

    // Player close
    el.playerClose?.addEventListener('click', closeVideoPlayer);
    el.playerBackdrop?.addEventListener('click', closeVideoPlayer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (el.playerModal?.style.display === 'block') closeVideoPlayer();
            if (el.albumsModal?.style.display === 'block') closeVideoAlbums();
            if (el.addModal?.style.display === 'block') closeAddVideo();
        }
        if (e.key === 'ArrowLeft' && el.playerModal?.style.display === 'block') {
            navigatePlayerVideo(-1);
        }
        if (e.key === 'ArrowRight' && el.playerModal?.style.display === 'block') {
            navigatePlayerVideo(1);
        }
    });

    // Player actions
    el.playerFav?.addEventListener('click', () => toggleVideoFav());
    el.playerAddAlbum?.addEventListener('click', () => promptAddToAlbum());
    el.playerDownload?.addEventListener('click', () => downloadCurrentVideo());

    // Albums
    el.albumsClose?.addEventListener('click', closeVideoAlbums);
    el.albumsOverlay?.addEventListener('click', closeVideoAlbums);
    el.albumCreateBtn?.addEventListener('click', createVideoAlbum);
    el.albumNameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') createVideoAlbum();
    });
    el.albumBackBtn?.addEventListener('click', showVideoAlbumsList);

    // Albums nav button
    el.albumsBtn?.addEventListener('click', openVideoAlbums);

    // Add Video
    el.addBtn?.addEventListener('click', openAddVideo);
    el.addClose?.addEventListener('click', closeAddVideo);
    el.addOverlay?.addEventListener('click', closeAddVideo);
    el.addForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        addVideoFromForm();
    });

    // Preview URL on input
    el.addUrl?.addEventListener('input', previewVideoUrl);

    // Albums button inside player
    document.querySelectorAll('[id="videoAlbumsBtn"]').forEach(btn => {
        if (btn !== el.albumsBtn) btn.addEventListener('click', openVideoAlbums);
    });
}

// ─── Nav Button ──────────────────────────────────────────────────────────────
function addVideosNavButton() {
    if (document.getElementById('videosNavBtn')) return;
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    const btn = document.createElement('button');
    btn.className = 'nav-videos-btn';
    btn.id = 'videosNavBtn';
    btn.innerHTML = '🎬 Videos';
    btn.title = 'Browse video gallery';
    btn.addEventListener('click', toggleVideosSection);
    navActions.insertBefore(btn, navActions.querySelector('.nav-fav-toggle'));
    el.navBtn = btn;
}

// ─── Toggle Videos Section ───────────────────────────────────────────────────
function toggleVideosSection() {
    const section = el.section;
    if (!section) return;
    const isVisible = section.style.display !== 'none';
    
    if (!isVisible) {
        // Hide photo gallery elements
        document.getElementById('gallery')?.style.setProperty('display', 'none');
        document.getElementById('filtersSection')?.style.setProperty('display', 'none');
        document.querySelector('.hero-mini')?.style.setProperty('display', 'none');
        
        section.style.display = 'block';
        el.navBtn?.classList.add('active');
        
        // Load albums
        loadVideoAlbums();
    } else {
        section.style.display = 'none';
        el.navBtn?.classList.remove('active');
        
        document.getElementById('gallery')?.style.removeProperty('display');
        document.getElementById('filtersSection')?.style.removeProperty('display');
        document.querySelector('.hero-mini')?.style.removeProperty('display');
    }
}

// ─── Render Video Gallery ────────────────────────────────────────────────────
function renderVideoGallery(videos) {
    if (!el.grid) return;
    
    if (videos.length === 0) {
        el.grid.innerHTML = '';
        el.empty.style.display = 'block';
        return;
    }
    el.empty.style.display = 'none';
    
    el.grid.innerHTML = videos.map((video, i) => `
        <div class="video-card" data-id="${video.id}" style="animation-delay:${i * 0.04}s">
            <div class="video-card-thumb">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                <div class="video-card-play">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)"/><polygon points="9,7 9,17 18,12" fill="white"/></svg>
                </div>
                ${video.duration ? `<span class="video-card-duration">${video.duration}</span>` : ''}
                ${videoState.videoFavorites.includes(video.id) ? '<span class="video-card-fav-badge">❤️</span>' : ''}
            </div>
            <div class="video-card-info">
                <strong class="video-card-title">${escapeHtml(video.title)}</strong>
                <span class="video-card-artist">${escapeHtml(video.artist)}</span>
            </div>
        </div>
    `).join('');
    
    // Click to play
    el.grid.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            const video = videoState.filteredVideos.find(v => v.id === id);
            if (video) openVideoPlayer(video);
        });
    });
}

// ─── Filter Videos ───────────────────────────────────────────────────────────
function filterVideos() {
    const filter = videoState.currentFilter;
    let result;
    
    if (filter === 'favorites') {
        result = videoState.videos.filter(v => videoState.videoFavorites.includes(v.id));
    } else if (filter === 'all') {
        result = [...videoState.videos];
    } else {
        result = videoState.videos.filter(v => v.category === filter);
    }
    
    videoState.filteredVideos = result;
    renderVideoGallery(result);
}

// ─── Video Player ────────────────────────────────────────────────────────────
function openVideoPlayer(video) {
    videoState.currentVideo = video;
    if (!el.playerModal || !el.playerVideo) return;
    
    // Check if it's a YouTube URL
    const ytMatch = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    
    if (ytMatch) {
        // YouTube - use iframe
        el.playerWrapper.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0" 
                frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
        `;
        el.playerVideo.style.display = 'none';
    } else {
        // Direct video URL - use HTML5 video
        el.playerWrapper.innerHTML = `
            <video id="videoPlayer" controls autoplay playsinline preload="metadata" src="${escapeHtml(video.videoUrl)}"></video>
        `;
        // Re-cache the video element
        el.playerVideo = document.getElementById('videoPlayer');
        el.playerVideo.style.display = 'block';
    }
    
    el.playerTitle.textContent = video.title;
    el.playerArtist.textContent = video.artist;
    updatePlayerFavBtn();
    
    el.playerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        el.playerModal.classList.add('open');
        el.playerModal.querySelector('.video-player-content')?.classList.add('open');
    }, 10);
}

function closeVideoPlayer() {
    if (!el.playerModal) return;
    el.playerModal.classList.remove('open');
    el.playerModal.querySelector('.video-player-content')?.classList.remove('open');
    
    // Stop video
    if (el.playerVideo) {
        el.playerVideo.pause();
        el.playerVideo.src = '';
    }
    // Remove iframes
    const iframe = el.playerWrapper?.querySelector('iframe');
    if (iframe) iframe.src = '';
    
    setTimeout(() => {
        el.playerModal.style.display = 'none';
        document.body.style.overflow = '';
        // Restore video element
        el.playerWrapper.innerHTML = `<video id="videoPlayer" controls autoplay playsinline preload="metadata"></video>`;
        el.playerVideo = document.getElementById('videoPlayer');
    }, 300);
    
    videoState.isPlaying = false;
}

function navigatePlayerVideo(dir) {
    const currentIdx = videoState.filteredVideos.indexOf(videoState.currentVideo);
    let newIdx = currentIdx + dir;
    if (newIdx < 0) newIdx = videoState.filteredVideos.length - 1;
    if (newIdx >= videoState.filteredVideos.length) newIdx = 0;
    const nextVideo = videoState.filteredVideos[newIdx];
    if (nextVideo) openVideoPlayer(nextVideo);
}

// ─── Video Favorites ─────────────────────────────────────────────────────────
function toggleVideoFav(videoId) {
    const id = videoId || videoState.currentVideo?.id;
    if (!id) return;
    
    const idx = videoState.videoFavorites.indexOf(id);
    if (idx > -1) {
        videoState.videoFavorites.splice(idx, 1);
        showToast('Removed from video favorites');
    } else {
        videoState.videoFavorites.push(id);
        showToast('Added to video favorites ♥');
    }
    localStorage.setItem('photoStoreVideoFavorites', JSON.stringify(videoState.videoFavorites));
    updatePlayerFavBtn();
    // Re-render if favorites filter is active
    if (videoState.currentFilter === 'favorites') filterVideos();
    else renderVideoGallery(videoState.filteredVideos);
}

function updatePlayerFavBtn() {
    if (!el.playerFav || !videoState.currentVideo) return;
    const isFav = videoState.videoFavorites.includes(videoState.currentVideo.id);
    el.playerFav.classList.toggle('fav-active', isFav);
    el.playerFav.querySelector('svg')?.setAttribute('fill', isFav ? 'currentColor' : 'none');
}

// ─── Download Video ──────────────────────────────────────────────────────────
function downloadCurrentVideo() {
    if (!videoState.currentVideo) return;
    const a = document.createElement('a');
    a.href = videoState.currentVideo.videoUrl;
    a.download = `${videoState.currentVideo.title.replace(/\s+/g, '-').toLowerCase()}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('⬇ Download started');
}

// ===================== VIDEO ALBUMS =====================

async function loadVideoAlbums() {
    let serverAlbums = [];
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/video-albums', { signal: controller.signal });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.albums)) serverAlbums = data.albums;
        }
    } catch (e) {
        console.warn('Server offline for video albums:', e.message);
    }
    
    const localAlbums = getLocalVideoAlbums();
    const serverIds = new Set(serverAlbums.map(a => a.id));
    const newLocals = localAlbums.filter(a => !serverIds.has(a.id));
    videoState.videoAlbums = [...newLocals, ...serverAlbums];
}

async function createVideoAlbum() {
    const input = el.albumNameInput;
    const name = input?.value.trim();
    if (!name) return;
    
    const user = window.currentUser?.name || 'Anonymous';
    
    const newAlbum = {
        id: Date.now(),
        name,
        user,
        videos: [],
        createdAt: new Date().toISOString()
    };
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/video-albums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, user }),
            signal: controller.signal
        });
        if (res.ok) {
            input.value = '';
            await loadVideoAlbums();
            renderVideoAlbumsList();
            showToast(`Video album "${name}" created! 🎉`);
            return;
        }
    } catch (e) {
        console.warn('Server offline, saving album locally:', e.message);
    }
    
    // Save locally
    const localAlbums = getLocalVideoAlbums();
    localAlbums.unshift(newAlbum);
    saveLocalVideoAlbums(localAlbums);
    videoState.videoAlbums = localAlbums;
    input.value = '';
    renderVideoAlbumsList();
    showToast(`Video album "${name}" created (offline)! 🎉`);
}

function renderVideoAlbumsList() {
    if (!el.albumsList) return;
    
    if (videoState.videoAlbums.length === 0) {
        el.albumsList.innerHTML = '<p class="video-albums-empty">No albums yet. Create your first one!</p>';
        return;
    }
    
    el.albumsList.innerHTML = videoState.videoAlbums.map(album => `
        <div class="video-album-item" data-id="${album.id}">
            <div class="video-album-item-icon">📁</div>
            <div class="video-album-item-info">
                <strong>${escapeHtml(album.name)}</strong>
                <small>${album.videos?.length || 0} videos</small>
            </div>
        </div>
    `).join('');
    
    el.albumsList.querySelectorAll('.video-album-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            showVideoAlbumDetail(id);
        });
    });
}

function showVideoAlbumDetail(albumId) {
    const album = videoState.videoAlbums.find(a => a.id === albumId);
    if (!album) return;
    
    videoState.currentAlbumId = albumId;
    el.albumsList.style.display = 'none';
    el.albumDetailTitle.textContent = `📁 ${escapeHtml(album.name)}`;
    
    if (!album.videos || album.videos.length === 0) {
        el.albumVideos.innerHTML = `
            <div class="video-album-empty-detail">
                <p>No videos in this album yet.</p>
                <button class="video-album-add-video-btn" data-album-id="${album.id}">➕ Add from Gallery</button>
            </div>
        `;
    } else {
        el.albumVideos.innerHTML = album.videos.map(v => `
            <div class="video-album-video-item" data-video-id="${v.videoId}">
                <div class="video-album-video-thumb">
                    <img src="${v.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="60" fill="%232a2a3a"%3E%3Crect width="80" height="60"/%3E%3Ctext x="40" y="38" text-anchor="middle" fill="%23666" font-size="24"%3E🎬%3C/text%3E%3C/svg%3E'}" alt="${v.title}">
                </div>
                <div class="video-album-video-info">
                    <strong>${escapeHtml(v.title)}</strong>
                    <small>${escapeHtml(v.artist || 'Unknown')}</small>
                </div>
                <button class="video-album-video-remove" data-album-id="${album.id}" data-video-id="${v.videoId}">✕</button>
            </div>
        `).join('');
        
        // Add "Add from Gallery" button
        el.albumVideos.innerHTML += `
            <div class="video-album-add-video-wrapper">
                <button class="video-album-add-video-btn" data-album-id="${album.id}">➕ Add from Gallery</button>
            </div>
        `;
    }
    
    // Bind remove buttons
    el.albumVideos.querySelectorAll('.video-album-video-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const albumId = parseInt(btn.dataset.albumId);
            const videoId = parseInt(btn.dataset.videoId);
            await removeVideoFromAlbum(albumId, videoId);
        });
    });
    
    // Bind add buttons
    el.albumVideos.querySelectorAll('.video-album-add-video-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const albumId = parseInt(btn.dataset.albumId);
            promptAddVideoToAlbum(albumId);
        });
    });
    
    el.albumDetail.style.display = 'block';
}

function showVideoAlbumsList() {
    el.albumDetail.style.display = 'none';
    el.albumsList.style.display = 'block';
    videoState.currentAlbumId = null;
    renderVideoAlbumsList();
}

async function removeVideoFromAlbum(albumId, videoId) {
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`/api/video-albums/${albumId}/videos/${videoId}`, {
            method: 'DELETE',
            signal: controller.signal
        });
        if (res.ok) {
            await loadVideoAlbums();
            showVideoAlbumDetail(albumId);
            showToast('Video removed from album');
            return;
        }
    } catch (e) {
        console.warn('Server offline:', e.message);
    }
    
    // Local fallback
    const localAlbums = getLocalVideoAlbums();
    const album = localAlbums.find(a => a.id === albumId);
    if (album) {
        album.videos = album.videos.filter(v => v.videoId != videoId);
        saveLocalVideoAlbums(localAlbums);
        videoState.videoAlbums = localAlbums;
        showVideoAlbumDetail(albumId);
        showToast('Video removed from album (offline)');
    }
}

async function promptAddVideoToAlbum(albumId) {
    const album = videoState.videoAlbums.find(a => a.id === albumId);
    if (!album) return;
    
    // Show a selection of current gallery videos not already in the album
    const albumVideoIds = new Set((album.videos || []).map(v => v.videoId));
    const availableVideos = videoState.videos.filter(v => !albumVideoIds.has(v.id));
    
    if (availableVideos.length === 0) {
        showToast('All gallery videos are already in this album!');
        return;
    }
    
    // Quick selection via simple prompt list
    const options = availableVideos.map((v, i) => `${i + 1}. ${v.title} - ${v.artist}`).join('\n');
    const choice = prompt(`Select video to add to "${album.name}":\n\n${options}\n\nEnter number (1-${availableVideos.length}):`);
    if (!choice) return;
    
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < availableVideos.length) {
        const video = availableVideos[idx];
        await addVideoToAlbum(albumId, video);
    }
}

async function addVideoToAlbum(albumId, video) {
    // Try server
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`/api/video-albums/${albumId}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoId: video.id,
                title: video.title,
                artist: video.artist,
                thumbnail: video.thumbnail,
                videoUrl: video.videoUrl
            }),
            signal: controller.signal
        });
        if (res.ok) {
            await loadVideoAlbums();
            showVideoAlbumDetail(albumId);
            showToast(`Added "${video.title}" to album 🎉`);
            return;
        }
    } catch (e) {
        console.warn('Server offline:', e.message);
    }
    
    // Local fallback
    const localAlbums = getLocalVideoAlbums();
    const album = localAlbums.find(a => a.id === albumId);
    if (album) {
        if (!album.videos.find(v => v.videoId == video.id)) {
            album.videos.push({
                videoId: video.id,
                title: video.title,
                artist: video.artist,
                thumbnail: video.thumbnail,
                videoUrl: video.videoUrl
            });
        }
        saveLocalVideoAlbums(localAlbums);
        videoState.videoAlbums = localAlbums;
        showVideoAlbumDetail(albumId);
        showToast(`Added "${video.title}" to album (offline) 🎉`);
    }
}

function promptAddToAlbum() {
    if (!videoState.currentVideo) return;
    if (videoState.videoAlbums.length === 0) {
        showToast('Create a video album first!');
        openVideoAlbums();
        return;
    }
    
    const options = videoState.videoAlbums.map((a, i) => `${i + 1}. ${a.name} (${a.videos?.length || 0} videos)`).join('\n');
    const choice = prompt(`Add "${videoState.currentVideo.title}" to album:\n\n${options}\n\nEnter number (1-${videoState.videoAlbums.length}):`);
    if (!choice) return;
    
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < videoState.videoAlbums.length) {
        addVideoToAlbum(videoState.videoAlbums[idx].id, videoState.currentVideo);
    }
}

function openVideoAlbums() {
    if (!el.albumsModal) return;
    el.albumsModal.style.display = 'block';
    setTimeout(() => {
        el.albumsOverlay?.classList.add('open');
        el.albumsModal.querySelector('.video-albums-panel')?.classList.add('open');
    }, 10);
    document.body.style.overflow = 'hidden';
    loadVideoAlbums().then(() => renderVideoAlbumsList());
}

function closeVideoAlbums() {
    if (!el.albumsModal) return;
    el.albumsOverlay?.classList.remove('open');
    el.albumsModal.querySelector('.video-albums-panel')?.classList.remove('open');
    setTimeout(() => {
        el.albumsModal.style.display = 'none';
        document.body.style.overflow = '';
        showVideoAlbumsList();
    }, 300);
}

// ===================== ADD VIDEO =====================

function openAddVideo() {
    if (!el.addModal) return;
    el.addModal.style.display = 'block';
    setTimeout(() => el.addModal.classList.add('open'), 10);
    document.body.style.overflow = 'hidden';
    el.addForm?.reset();
    el.addPreview.style.display = 'none';
}

function closeAddVideo() {
    if (!el.addModal) return;
    el.addModal.classList.remove('open');
    setTimeout(() => {
        el.addModal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

function previewVideoUrl() {
    const url = el.addUrl?.value.trim();
    if (!url) {
        el.addPreview.style.display = 'none';
        return;
    }
    
    // Detect type
    let type = 'Direct Video';
    let embedUrl = '';
    let thumbnailUrl = '';
    
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    
    if (ytMatch) {
        type = '🎬 YouTube';
        embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    } else if (vimeoMatch) {
        type = '🎥 Vimeo';
        embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        thumbnailUrl = '';
    } else if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
        type = '📹 Direct Video';
        thumbnailUrl = '';
    }
    
    el.addPreviewType.textContent = type;
    if (thumbnailUrl) {
        el.addPreviewThumb.innerHTML = `<img src="${thumbnailUrl}" alt="Preview">`;
    } else if (ytMatch) {
        el.addPreviewThumb.innerHTML = `<img src="https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg" alt="Preview">`;
    } else {
        el.addPreviewThumb.innerHTML = `<div class="add-video-no-preview">🎬</div>`;
    }
    el.addPreview.style.display = 'flex';
}

function addVideoFromForm() {
    const url = el.addUrl?.value.trim();
    const title = el.addTitle?.value.trim();
    let artist = el.addArtist?.value.trim() || window.currentUser?.name || 'Anonymous';
    
    if (!url || !title) {
        showToast('Please fill in the URL and title');
        return;
    }
    
    // Auto-fill artist
    if (!el.addArtist?.value.trim()) {
        artist = window.currentUser?.name || 'Anonymous';
    }
    
    // Determine video URL and thumbnail
    let videoUrl = url;
    let thumbnail = '';
    let category = 'user';
    
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
        videoUrl = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
        thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
        category = 'youtube';
    }
    
    const newVideo = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title,
        artist,
        category,
        thumbnail: thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" fill="%232a2a3a"%3E%3Crect width="320" height="180"/%3E%3Ctext x="160" y="110" text-anchor="middle" fill="%23666" font-size="48"%3E🎬%3C/text%3E%3C/svg%3E',
        videoUrl,
        duration: '',
        poster: thumbnail || ''
    };
    
    videoState.videos.unshift(newVideo);
    filterVideos();
    
    closeAddVideo();
    showToast(`"${title}" added to gallery! 🎉`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ─── Auto-init ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.initVideos = initVideos;
});
