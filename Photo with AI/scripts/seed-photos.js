// ===================== SEED SCRIPT =====================
// Generates default free stock photos into data/photos.json
// Uses picsum.photos (free, no API key) for images

const fs = require('fs');
const path = require('path');

const PHOTOS_FILE = path.join(__dirname, '..', 'data', 'photos.json');

const categories = {
    nature: ['nature', 'landscape', 'outdoor', 'scenic'],
    architecture: ['architecture', 'building', 'city', 'urban'],
    travel: ['travel', 'adventure', 'explore', 'wanderlust'],
    wildlife: ['wildlife', 'animals', 'birds', 'nature'],
    food: ['food', 'cuisine', 'dining', 'cooking'],
    technology: ['technology', 'tech', 'digital', 'modern'],
    fashion: ['fashion', 'style', 'trend', 'beauty'],
    abstract: ['abstract', 'art', 'creative', 'design'],
    portrait: ['portrait', 'people', 'face', 'character']
};

const artists = [
    'Alex Turner', 'Sarah Chen', 'Marco Rossi', 'Yuki Tanaka',
    'Emma Wilson', 'Raj Patel', 'Sophie Martin', 'Liam O\'Brien',
    'Aisha Khan', 'Carlos Silva', 'Mia Johnson', 'David Kim',
    'Olivia Brown', 'Noah Garcia', 'Isabella Lee', 'Ethan Davis'
];

const photoTitles = [
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
    'Coastal Sunrise', 'Urban Canvas', 'Wildflower Hill', 'Crystal Cave'
];

// Aspect ratios with different heights for masonry layout
const aspects = [
    { type: 'landscape', thumbW: 600, thumbH: 400, fullW: 1200, fullH: 800 },
    { type: 'portrait', thumbW: 600, thumbH: 800, fullW: 1200, fullH: 1600 },
    { type: 'square', thumbW: 600, thumbH: 600, fullW: 1200, fullH: 1200 },
    { type: 'landscape', thumbW: 600, thumbH: 375, fullW: 1200, fullH: 750 },
    { type: 'portrait', thumbW: 600, thumbH: 900, fullW: 1200, fullH: 1800 },
    { type: 'landscape', thumbW: 600, thumbH: 338, fullW: 1200, fullH: 675 },
];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickArtist(name) {
    // Make same artist always get same avatar initials
    return name;
}

// Generate 48 photos using picsum.photos (free, no API key needed)
const photos = [];
for (let i = 0; i < 48; i++) {
    const catKeys = Object.keys(categories);
    const category = catKeys[i % catKeys.length];
    const aspect = aspects[i % aspects.length];
    const picsumId = i + 10; // picsum IDs 10-57 are reliable
    const artist = artists[i % artists.length];
    const title = photoTitles[i % photoTitles.length];

    photos.push({
        id: 1000 + i,
        title: title,
        artist: artist,
        category: category,
        aspect: aspect.type,
        image: `https://picsum.photos/id/${picsumId}/${aspect.thumbW}/${aspect.thumbH}`,
        fullImage: `https://picsum.photos/id/${picsumId}/${aspect.fullW}/${aspect.fullH}`,
        createdAt: new Date(Date.now() - (48 - i) * 86400000).toISOString()
    });
}

// Ensure data directory exists
const dataDir = path.dirname(PHOTOS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Write photos.json
fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8');
console.log(`✅ Successfully seeded ${photos.length} photos to ${PHOTOS_FILE}`);
