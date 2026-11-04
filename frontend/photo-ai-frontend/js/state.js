// ===================== STATE =====================
let favorites = JSON.parse(localStorage.getItem('photoStoreFavorites') || '[]');
let currentFilter = 'all';
let currentLightboxIndex = -1;
let filteredPhotos = [...photos];
let searchQuery = '';
