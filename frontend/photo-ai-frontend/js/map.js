// ===================== INTERACTIVE MAP VIEW (GIS) =====================

// Store geo-tagged photos
const GEO_PHOTOS_KEY = 'photoStoreGeoPhotos';
let mapInstance = null;
let mapMarkers = [];
let currentMapPhotoId = null;

function initMapFeature() {
    // Add Map View nav link
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        const mapLink = document.createElement('a');
        mapLink.className = 'nav-link';
        mapLink.href = '#';
        mapLink.innerHTML = '🌍 Map';
        mapLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMapView();
        });
        navLinks.appendChild(mapLink);
    }

    // Add "Add Location" button in lightbox bar
    const lightboxBar = document.querySelector('.lightbox-bar');
    if (lightboxBar) {
        const geoBtn = document.createElement('button');
        geoBtn.className = 'lightbox-action-btn';
        geoBtn.id = 'geoTagBtn';
        geoBtn.innerHTML = '📍 Tag Location';
        geoBtn.addEventListener('click', openGeoPicker);
        lightboxBar.querySelector('.lightbox-actions')?.prepend(geoBtn);
    }
    
    // Create map section
    const gallerySection = document.querySelector('.gallery-section');
    if (!gallerySection) return;
    
    const mapSection = document.createElement('section');
    mapSection.className = 'map-section';
    mapSection.id = 'mapSection';
    mapSection.style.display = 'none';
    mapSection.innerHTML = `
        <div class="container">
            <div class="map-header">
                <h2>🌍 Photo Map</h2>
                <p>Discover photos from around the world</p>
                <div class="map-controls">
                    <button class="map-toggle-btn active" id="mapToggleAll">📍 All Photos</button>
                    <button class="map-toggle-btn" id="mapToggleMy">👤 My Photos</button>
                </div>
            </div>
            <div class="map-wrapper" id="mapWrapper">
                <div class="map-container" id="mapContainer"></div>
                <div class="map-sidebar" id="mapSidebar">
                    <div class="map-sidebar-header">
                        <h4>📍 Photo Locations</h4>
                        <span class="map-count" id="mapCount">0 tagged</span>
                    </div>
                    <div class="map-photos-list" id="mapPhotosList">
                        <p class="map-empty">No geo-tagged photos yet.<br>Click 📍 Tag Location on a photo to add it!</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    gallerySection.parentElement.insertBefore(mapSection, gallerySection);
    
    // Lazy-load Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);
}

function toggleMapView() {
    const mapSection = document.getElementById('mapSection');
    const gallery = document.querySelector('.gallery-section');
    const hero = document.getElementById('heroMini');
    const filters = document.querySelector('.filters-section');
    
    if (!mapSection) return;
    const isOpen = mapSection.style.display !== 'none';
    
    if (isOpen) {
        mapSection.style.display = 'none';
        gallery.style.display = '';
        if (hero) hero.style.display = '';
        if (filters) filters.style.display = '';
    } else {
        mapSection.style.display = 'block';
        gallery.style.display = 'none';
        if (hero) hero.style.display = 'none';
        if (filters) filters.style.display = 'none';
        initMap();
        updateMapPhotosList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function getGeoPhotos() {
    return JSON.parse(localStorage.getItem(GEO_PHOTOS_KEY) || '[]');
}

function saveGeoPhotos(geoPhotos) {
    localStorage.setItem(GEO_PHOTOS_KEY, JSON.stringify(geoPhotos));
}

function initMap() {
    const container = document.getElementById('mapContainer');
    if (!container || container._leaflet_id) return;
    
    // Load Leaflet dynamically
    if (typeof L === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => createMap(container);
        document.body.appendChild(script);
    } else {
        createMap(container);
    }
}

function createMap(container) {
    mapInstance = L.map(container).setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    }).addTo(mapInstance);
    
    // Force resize after display
    setTimeout(() => mapInstance.invalidateSize(), 300);
    
    // Add markers from stored geo photos
    const geoPhotos = getGeoPhotos();
    geoPhotos.forEach(gp => addMarkerToMap(gp));
    
    // Event listeners for toggle buttons
    document.getElementById('mapToggleAll')?.addEventListener('click', () => {
        document.querySelectorAll('.map-toggle-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('mapToggleAll').classList.add('active');
        updateMapPhotosList();
    });
    
    document.getElementById('mapToggleMy')?.addEventListener('click', () => {
        document.querySelectorAll('.map-toggle-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('mapToggleMy').classList.add('active');
        updateMapPhotosList('my');
    });
}

function addMarkerToMap(geoPhoto) {
    if (!mapInstance) return;
    
    const color = geoPhoto.category === 'ai' ? '#764ba2' : '#05a081';
    const markerIcon = L.divIcon({
        className: 'map-marker-icon',
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">📸</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
    
    const marker = L.marker([geoPhoto.lat, geoPhoto.lng], { icon: markerIcon }).addTo(mapInstance);
    
    const photo = photos.find(p => p.id === geoPhoto.photoId);
    const title = photo?.title || geoPhoto.title || 'Untitled';
    const artist = photo?.artist || geoPhoto.artist || 'Unknown';
    
    marker.bindPopup(`
        <div class="map-popup">
            <img src="${geoPhoto.imageUrl}" alt="${title}" style="width:100%;max-height:120px;object-fit:cover;border-radius:4px;margin-bottom:8px;">
            <strong style="font-size:13px;">${title}</strong>
            <p style="font-size:11px;color:#666;margin:2px 0;">by ${artist}</p>
            <p style="font-size:10px;color:#999;">${geoPhoto.location || 'Unknown location'}</p>
        </div>
    `);
    
    marker.on('click', () => {
        currentMapPhotoId = geoPhoto.photoId;
        // Highlight in sidebar
        document.querySelectorAll('.map-photo-item').forEach(el => el.classList.remove('active'));
        const sidebarItem = document.querySelector(`.map-photo-item[data-id="${geoPhoto.photoId}"]`);
        if (sidebarItem) sidebarItem.classList.add('active');
    });
    
    mapMarkers.push({ marker, geoPhoto });
}

function openGeoPicker() {
    if (!window.currentLightboxPhoto) {
        showToast('Open a photo first');
        return;
    }
    
    const photo = window.currentLightboxPhoto;
    
    // Check if already tagged
    const geoPhotos = getGeoPhotos();
    const existing = geoPhotos.find(gp => gp.photoId === photo.id);
    
    if (existing) {
        // Show option to remove
        if (confirm(`📍 Already tagged at ${existing.location || 'Unknown'}\n\nRemove location tag?`)) {
            removeGeoTag(photo.id);
        }
        return;
    }
    
    // Try geolocation API first
    if (navigator.geolocation) {
        showToast('📍 Getting your location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                saveGeoTag(photo, position.coords.latitude, position.coords.longitude, 'Current Location');
            },
            () => {
                // Geolocation failed, show search
                showLocationSearch(photo);
            },
            { timeout: 5000, enableHighAccuracy: false }
        );
    } else {
        showLocationSearch(photo);
    }
}

function showLocationSearch(photo) {
    // Simple prompt for location name
    const locationName = prompt('📍 Enter a location name (e.g., "Paris, France" or "Times Square, NY"):');
    if (!locationName) return;
    
    showToast(`🔍 Looking up "${locationName}"...`);
    
    // Use Nominatim (free geocoding)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`)
        .then(r => r.json())
        .then(data => {
            if (data && data.length > 0) {
                const place = data[0];
                saveGeoTag(photo, parseFloat(place.lat), parseFloat(place.lon), place.display_name);
            } else {
                showToast('❌ Location not found. Try a different name.', 'error');
            }
        })
        .catch(() => {
            // Fallback: let user enter coordinates
            const coords = prompt('Could not find location. Enter coordinates (lat,lng):\nExample: 48.8566,2.3522');
            if (coords) {
                const parts = coords.split(',').map(s => parseFloat(s.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    saveGeoTag(photo, parts[0], parts[1], locationName);
                } else {
                    showToast('❌ Invalid coordinates', 'error');
                }
            }
        });
}

function saveGeoTag(photo, lat, lng, locationName) {
    const geoPhotos = getGeoPhotos();
    
    // Remove existing tag for same photo
    const filtered = geoPhotos.filter(gp => gp.photoId !== photo.id);
    
    const geoPhoto = {
        photoId: photo.id,
        title: photo.title,
        artist: photo.artist,
        category: photo.category || 'general',
        imageUrl: photo.fullImage || photo.image,
        lat,
        lng,
        location: locationName || 'Unknown',
        taggedAt: new Date().toISOString(),
        userId: currentUser?.name || 'Anonymous'
    };
    
    filtered.push(geoPhoto);
    saveGeoPhotos(filtered);
    
    // Update map if open
    if (mapInstance) {
        addMarkerToMap(geoPhoto);
        if (mapMarkers.length === 1) {
            mapInstance.setView([lat, lng], 10);
        }
    }
    
    updateMapPhotosList();
    showToast(`✅ Tagged at ${locationName || '📍'}!`);
}

function removeGeoTag(photoId) {
    let geoPhotos = getGeoPhotos();
    geoPhotos = geoPhotos.filter(gp => gp.photoId !== photoId);
    saveGeoPhotos(geoPhotos);
    
    // Remove marker from map
    const markerEntry = mapMarkers.find(m => m.geoPhoto.photoId === photoId);
    if (markerEntry && mapInstance) {
        mapInstance.removeLayer(markerEntry.marker);
        mapMarkers = mapMarkers.filter(m => m.geoPhoto.photoId !== photoId);
    }
    
    updateMapPhotosList();
    showToast('📍 Location tag removed');
}

function updateMapPhotosList(filter = 'all') {
    const list = document.getElementById('mapPhotosList');
    const count = document.getElementById('mapCount');
    if (!list) return;
    
    let geoPhotos = getGeoPhotos();
    
    if (filter === 'my' && currentUser) {
        geoPhotos = geoPhotos.filter(gp => gp.userId === currentUser.name);
    }
    
    if (count) count.textContent = `${geoPhotos.length} tagged`;
    
    if (geoPhotos.length === 0) {
        list.innerHTML = '<p class="map-empty">No geo-tagged photos yet.<br>Click 📍 Tag Location on a photo to add it!</p>';
        return;
    }
    
    list.innerHTML = geoPhotos.map(gp => {
        const photo = photos.find(p => p.id === gp.photoId);
        const title = photo?.title || gp.title || 'Untitled';
        const artist = photo?.artist || gp.artist || 'Unknown';
        return `
            <div class="map-photo-item" data-id="${gp.photoId}" data-lat="${gp.lat}" data-lng="${gp.lng}">
                <img src="${gp.imageUrl}" alt="${title}" loading="lazy">
                <div class="map-photo-info">
                    <strong>${title}</strong>
                    <span>by ${artist}</span>
                    <small>📍 ${gp.location || 'Unknown'}</small>
                </div>
                <button class="map-photo-remove" data-id="${gp.photoId}" title="Remove tag">✕</button>
            </div>
        `;
    }).join('');
    
    // Click to fly to location on map
    list.querySelectorAll('.map-photo-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.map-photo-remove')) return;
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);
            if (mapInstance && !isNaN(lat) && !isNaN(lng)) {
                mapInstance.flyTo([lat, lng], 12, { duration: 1.5 });
            }
        });
        
        // Remove button
        item.querySelector('.map-photo-remove')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Remove this location tag?')) {
                removeGeoTag(parseInt(item.dataset.id));
            }
        });
    });
}
