// ===================== PHOTO TAGS =====================

// Add tag UI to lightbox bar
function initTags() {
    // Add tags section to lightbox
    const lightboxBar = document.querySelector('.lightbox-bar');
    if (lightboxBar) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'lightbox-tags';
        tagsDiv.id = 'lightboxTags';
        tagsDiv.innerHTML = `
            <div class="tags-list" id="tagsList"></div>
            <div class="tags-add" id="tagsAdd">
                <input type="text" id="tagsInput" placeholder="Add tag..." maxlength="20">
                <button id="tagsSubmitBtn">+</button>
            </div>
        `;
        lightboxBar.parentElement.insertBefore(tagsDiv, lightboxBar.nextSibling);
    }

    // Add tags to photo overlay
    const origRender = window.renderGallery;
}

// Local storage for offline tags
const LOCAL_TAGS_KEY = 'photoStoreLocalTags';

function getLocalTags(photoId) {
    const all = JSON.parse(localStorage.getItem(LOCAL_TAGS_KEY) || '{}');
    return all[photoId] || [];
}

function saveLocalTag(photoId, tag) {
    const all = JSON.parse(localStorage.getItem(LOCAL_TAGS_KEY) || '{}');
    if (!all[photoId]) all[photoId] = [];
    if (!all[photoId].includes(tag)) {
        all[photoId].push(tag);
    }
    localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(all));
}

async function loadTags(photoId) {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;
    
    let serverTags = [];
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`/api/tags/${photoId}`, { signal: controller.signal });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.tags)) {
                serverTags = data.tags;
            }
        }
    } catch (e) {
        console.warn('Server offline for tags:', e.message);
    }
    
    // Merge with local tags
    const localTags = getLocalTags(photoId);
    const allTags = [...new Set([...serverTags, ...localTags])];
    
    if (allTags.length === 0) {
        tagsList.innerHTML = '';
        return;
    }
    
    tagsList.innerHTML = allTags.map(t => `<span class="tag-chip">#${escapeHtml(t)}</span>`).join('');
}

async function addTag(photoId, tag) {
    if (!tag.trim()) return;
    const cleanTag = tag.trim().toLowerCase();
    
    // Save locally first (works offline!)
    saveLocalTag(photoId, cleanTag);
    
    // Try server
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`/api/tags/${photoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: [cleanTag] }),
            signal: controller.signal
        });
    } catch (e) {
        console.warn('Server offline, tag saved locally:', e.message);
    }
    
    loadTags(photoId);
}

document.addEventListener('DOMContentLoaded', () => {
    const tagsInput = document.getElementById('tagsInput');
    const tagsSubmit = document.getElementById('tagsSubmitBtn');
    
    if (tagsSubmit && tagsInput) {
        tagsSubmit.addEventListener('click', () => {
            const photoId = window.currentLightboxPhotoId;
            if (photoId) addTag(photoId, tagsInput.value);
            tagsInput.value = '';
        });
        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const photoId = window.currentLightboxPhotoId;
                if (photoId) addTag(photoId, tagsInput.value);
                tagsInput.value = '';
            }
        });
    }
});
