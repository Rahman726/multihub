// ===================== RATING SYSTEM =====================

function initRatings() {
    const lightboxBar = document.querySelector('.lightbox-bar');
    if (!lightboxBar) return;
    
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'lightbox-rating';
    ratingDiv.id = 'lightboxRating';
    ratingDiv.innerHTML = `
        <div class="rating-stars" id="ratingStars">
            ${[1,2,3,4,5].map(i => `
                <svg class="star" data-rating="${i}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            `).join('')}
        </div>
        <span class="rating-average" id="ratingAverage"></span>
    `;
    
    // Add before lightbox-actions
    lightboxBar.insertBefore(ratingDiv, lightboxBar.querySelector('.lightbox-actions'));
    
    // Star hover and click
    document.querySelectorAll('#ratingStars .star').forEach(star => {
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(rating);
        });
        
        star.addEventListener('mouseleave', () => {
            const avg = parseFloat(document.getElementById('ratingAverage')?.dataset.avg || '0');
            highlightStars(Math.round(avg));
        });
        
        star.addEventListener('click', async () => {
            const rating = parseInt(star.dataset.rating);
            const photoId = window.currentLightboxPhotoId;
            if (!photoId) return;
            
            // Save locally first (works offline!)
            saveLocalRating(photoId, rating);
            
            // Try server
            try {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 3000);
                
                const res = await fetch(`/api/ratings/${photoId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating }),
                    signal: controller.signal
                });
            } catch (e) {
                console.warn('Server offline, rating saved locally:', e.message);
            }
            
            loadRating(photoId);
            showToast(`You rated this ${rating}/5 ⭐`);
        });
    });
}

function highlightStars(count) {
    document.querySelectorAll('#ratingStars .star').forEach((s, i) => {
        s.setAttribute('fill', i < count ? 'currentColor' : 'none');
        s.style.color = i < count ? '#f1c40f' : '';
    });
}

// Local storage for offline ratings
const LOCAL_RATINGS_KEY = 'photoStoreLocalRatings';

function getLocalRatings(photoId) {
    const all = JSON.parse(localStorage.getItem(LOCAL_RATINGS_KEY) || '{}');
    return all[photoId] || [];
}

function saveLocalRating(photoId, score) {
    const all = JSON.parse(localStorage.getItem(LOCAL_RATINGS_KEY) || '{}');
    if (!all[photoId]) all[photoId] = [];
    all[photoId].push(score);
    localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(all));
}

async function loadRating(photoId) {
    const avgEl = document.getElementById('ratingAverage');
    if (!avgEl) return;
    
    let serverData = null;
    
    // Try server first
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`/api/ratings/${photoId}`, { signal: controller.signal });
        if (res.ok) {
            serverData = await res.json();
        }
    } catch (e) {
        console.warn('Server offline for ratings:', e.message);
    }
    
    // Combine server + local ratings
    const localRatings = getLocalRatings(photoId);
    let allRatings = [...localRatings];
    if (serverData && serverData.count > 0) {
        // We can't perfectly merge without knowing server scores,
        // but we can approximate
        allRatings = [...localRatings];
    }
    
    if (allRatings.length > 0) {
        const avg = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        const roundedAvg = Math.round(avg * 10) / 10;
        avgEl.textContent = `${roundedAvg} (${allRatings.length} votes)`;
        avgEl.dataset.avg = roundedAvg;
        highlightStars(Math.round(roundedAvg));
    } else if (serverData && serverData.count > 0) {
        avgEl.textContent = `${serverData.average} (${serverData.count} votes)`;
        avgEl.dataset.avg = serverData.average;
        highlightStars(Math.round(serverData.average));
    } else {
        avgEl.textContent = 'No ratings yet';
        avgEl.dataset.avg = '0';
    }
}

