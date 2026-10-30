// ===================== INFINITE SCROLL =====================
// Generates unlimited photos on-the-fly using picsum.photos

const categories = ['nature', 'architecture', 'travel', 'wildlife', 'food', 'technology', 'fashion', 'abstract', 'portrait'];
const artists = [
    'Alex Turner', 'Sarah Chen', 'Marco Rossi', 'Yuki Tanaka',
    'Emma Wilson', 'Raj Patel', 'Sophie Martin', 'Liam O\'Brien',
    'Aisha Khan', 'Carlos Silva', 'Mia Johnson', 'David Kim',
    'Olivia Brown', 'Noah Garcia', 'Isabella Lee', 'Ethan Davis',
    'Luna Park', 'Felix Wong', 'Zara Ali', 'Oscar Lindgren'
];
const titles = [
    'Serene Sunset', 'Morning Dew', 'City Lights', 'Ocean Waves',
    'Mountain Peak', 'Golden Hour', 'Forest Path', 'Starry Night',
    'Urban Jungle', 'Coastal View', 'Autumn Colors', 'Spring Bloom',
    'Desert Dunes', 'Rainy Street', 'Crystal Lake', 'Rolling Hills',
    'Twilight Sky', 'Garden Paradise', 'Harbor View', 'Alpine Meadow',
    'River Bend', 'Cloud Atlas', 'Misty Valley', 'Sunrise Glow',
    'Moonlit Beach', 'Canyon Deep', 'Frozen Lake', 'Wild Meadow',
    'Coral Reef', 'Lavender Fields', 'Bamboo Forest', 'Waterfall Dream',
    'Vintage Cafe', 'Street Market', 'Neon Nights', 'Rooftop View',
    'Coastal Trail', 'Maple Lane', 'Snowy Peak', 'Desert Bloom',
    'Tropical Paradise', 'Historic Alley', 'Glass Tower', 'Ocean Drive',
    'Sunset Pier', 'Mountain Lake', 'City Park', 'Garden Path',
    'Coastal Sunrise', 'Wildflower Hill', 'Crystal Cave', 'Amber Waves',
    'Silver Falls', 'Emerald Valley', 'Sapphire Coast', 'Ruby Ridge'
];

const aspects = [
    { type: 'landscape', w: 600, h: 400, fw: 1200, fh: 800 },
    { type: 'portrait', w: 600, h: 800, fw: 1200, fh: 1600 },
    { type: 'square', w: 600, h: 600, fw: 1200, fh: 1200 },
    { type: 'landscape', w: 600, h: 375, fw: 1200, fh: 750 },
    { type: 'portrait', w: 600, h: 900, fw: 1200, fh: 1800 },
    { type: 'landscape', w: 600, h: 338, fw: 1200, fh: 675 },
];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

let generatedCount = 0;
let isLoadingMore = false;
let infinitePage = 0;
// Track ALL generated infinite scroll photos (global so filters.js can access)
window.infinitePhotos = [];
const BATCH_SIZE = 24;
const INFINITE_BASE_ID = 10000;

// Color palette for fallback placeholders when images don't load
const placeholderColors = [
    '#667eea', '#764ba2', '#e74c3c', '#f39c12', '#2ecc71',
    '#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
    '#16a085', '#c0392b', '#8e44ad', '#2c3e50', '#d35400'
];

// Generate a batch of unique photos using picsum.photos
function generatePhotoBatch(count) {
    const batch = [];
    for (let i = 0; i < count; i++) {
        const picsumId = ((generatedCount + i + (infinitePage * 53)) % 640) + 58;
        const aspect = aspects[(generatedCount + i) % aspects.length];
        const category = categories[(generatedCount + i) % categories.length];
        const artist = artists[(generatedCount + i) % artists.length];
        const title = titles[(generatedCount + i) % titles.length];
        const color = placeholderColors[(generatedCount + i) % placeholderColors.length];

        batch.push({
            id: INFINITE_BASE_ID + generatedCount + i,
            title: title,
            artist: artist,
            category: category,
            aspect: aspect.type,
            image: `https://picsum.photos/id/${picsumId}/${aspect.w}/${aspect.h}`,
            fullImage: `https://picsum.photos/id/${picsumId}/${aspect.fw}/${aspect.fh}`,
            placeholderColor: color,
            generated: true
        });
    }
    generatedCount += count;
    return batch;
}

// Load more photos (triggered by scroll)
async function loadMoreInfinite() {
    if (isLoadingMore) return;
    isLoadingMore = true;

    // Show loading indicator
    const loadingEl = document.getElementById('infiniteLoading');
    if (loadingEl) loadingEl.classList.add('visible');

    // Simulate slight delay for smooth UX
    await new Promise(r => setTimeout(r, 300));

    const newPhotos = generatePhotoBatch(BATCH_SIZE);
    window.infinitePhotos = window.infinitePhotos.concat(newPhotos); // Track all generated photos
    renderGallery(newPhotos, true);
    infinitePage++;

    if (loadingEl) loadingEl.classList.remove('visible');
    isLoadingMore = false;
}

// Initialize infinite scroll
function initInfiniteScroll() {
    // Generate initial batch and merge with any server/AI photos (they stay at top)
    const initialPhotos = generatePhotoBatch(BATCH_SIZE);
    // Track these for applyFilters() so uploads don't lose infinite scroll photos
    window.infinitePhotos = initialPhotos.slice();
    const allInitial = [...photos, ...initialPhotos];
    renderGallery(allInitial);
    infinitePage = 1;

    // Create loading indicator
    const gallerySection = document.querySelector('.gallery-section .container');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'infinite-loading';
    loadingDiv.id = 'infiniteLoading';
    loadingDiv.innerHTML = '<div class="infinite-spinner"></div><span>Loading more photos...</span>';
    gallerySection.appendChild(loadingDiv);

    // Throttled scroll listener
    let scrollTimer;
    window.addEventListener('scroll', () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const clientHeight = window.innerHeight;

            // Load more when within 400px of bottom
            if (scrollHeight - scrollTop - clientHeight < 400) {
                loadMoreInfinite();
            }
        }, 100);
    });
}
