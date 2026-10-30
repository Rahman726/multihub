// ===================== COMMENTS =====================

function initComments() {
    // Add comments section after lightbox bar
    const lightboxBar = document.querySelector('.lightbox-bar');
    if (!lightboxBar) return;
    
    const commentsSection = document.createElement('div');
    commentsSection.className = 'lightbox-comments';
    commentsSection.id = 'lightboxComments';
    commentsSection.innerHTML = `
        <div class="comments-header">
            <h4>💬 Comments</h4>
        </div>
        <div class="comments-list" id="commentsList"></div>
        <div class="comments-add">
            <input type="text" id="commentInput" placeholder="Write a comment..." maxlength="200">
            <button id="commentSubmitBtn">Post</button>
        </div>
    `;
    
    lightboxBar.parentElement.appendChild(commentsSection);
    
    document.getElementById('commentSubmitBtn')?.addEventListener('click', postComment);
    document.getElementById('commentInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') postComment();
    });
}

// Local storage keys for offline comments
const LOCAL_COMMENTS_KEY = 'photoStoreLocalComments';

// Get local comments for a photo
function getLocalComments(photoId) {
    const all = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY) || '{}');
    return all[photoId] || [];
}

// Save a comment locally
function saveLocalComment(photoId, comment) {
    const all = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY) || '{}');
    if (!all[photoId]) all[photoId] = [];
    all[photoId].unshift(comment);
    // Keep max 50 comments per photo locally
    if (all[photoId].length > 50) all[photoId].length = 50;
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(all));
}

async function postComment() {
    const input = document.getElementById('commentInput');
    const text = input?.value.trim();
    if (!text) return;
    
    const photoId = window.currentLightboxPhotoId;
    const username = currentUser?.name || 'Anonymous';
    if (!photoId) return;
    
    // Create comment object
    const comment = {
        id: Date.now(),
        user: username,
        text: text,
        time: new Date().toISOString()
    };
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`/api/comments/${photoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: username, text }),
            signal: controller.signal
        });
        if (res.ok) {
            input.value = '';
            loadComments(photoId);
            return;
        }
    } catch (e) {
        console.warn('Server offline, saving comment locally:', e.message);
    }
    
    // Save locally (offline fallback)
    saveLocalComment(photoId, comment);
    input.value = '';
    loadComments(photoId);
    showToast('💬 Comment saved (offline)');
}

async function loadComments(photoId) {
    const list = document.getElementById('commentsList');
    if (!list) return;
    
    let allComments = [];
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`/api/comments/${photoId}`, { signal: controller.signal });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.comments)) {
                allComments = data.comments;
            }
        }
    } catch (e) {
        console.warn('Server offline, loading local comments:', e.message);
    }
    
    // Merge with local comments (local ones are newer)
    const localComments = getLocalComments(photoId);
    const serverIds = new Set(allComments.map(c => c.id));
    const newLocal = localComments.filter(c => !serverIds.has(c.id));
    allComments = [...newLocal, ...allComments];
    
    if (allComments.length === 0) {
        list.innerHTML = '<p class="comments-empty">No comments yet. Be the first!</p>';
        return;
    }
    
    list.innerHTML = allComments.map(c => `
        <div class="comment-item">
            <div class="comment-avatar">${(c.user || 'A').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}</div>
            <div class="comment-body">
                <strong>${escapeHtml(c.user || 'Anonymous')}</strong>
                <p>${escapeHtml(c.text)}</p>
                <small>${timeAgo(c.time)}</small>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
