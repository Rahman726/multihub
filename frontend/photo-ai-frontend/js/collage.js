// ===================== PHOTO COLLAGE =====================

function initCollage() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    const collageBtn = document.createElement('button');
    collageBtn.className = 'nav-upload-btn';
    collageBtn.style.background = '#9b59b6';
    collageBtn.id = 'collageBtn';
    collageBtn.textContent = '🖼️ Collage';
    
    navActions.insertBefore(collageBtn, navActions.querySelector('.nav-fav-toggle'));
    
    // Create collage modal
    const modal = document.createElement('div');
    modal.className = 'collage-modal';
    modal.id = 'collageModal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="collage-overlay" id="collageOverlay"></div>
        <div class="collage-panel" id="collagePanel">
            <div class="collage-header">
                <h3>🖼️ Photo Collage</h3>
                <button class="collage-close" id="collageClose">✕</button>
            </div>
            <div class="collage-body">
                <div class="collage-layouts">
                    <label>Choose Layout:</label>
                    <div class="collage-layout-options">
                        <button class="collage-layout-btn active" data-layout="grid2">2 Photos</button>
                        <button class="collage-layout-btn" data-layout="grid3">3 Photos</button>
                        <button class="collage-layout-btn" data-layout="grid4">4 Photos</button>
                        <button class="collage-layout-btn" data-layout="heart">❤️ Heart</button>
                    </div>
                </div>
                <div class="collage-gallery" id="collageGallery">
                    <p class="collage-hint">Click photos to add to collage (max 4)</p>
                    <div class="collage-photos-grid" id="collagePhotosGrid">
                        ${photos.slice(0, 20).map(p => `
                            <div class="collage-photo-select" data-id="${p.id}">
                                <img src="${p.image}" alt="${p.title}">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="collage-preview" id="collagePreview">
                    <canvas id="collageCanvas" width="600" height="600"></canvas>
                </div>
                <button class="collage-download" id="collageDownload">Download Collage ⬇️</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    let selectedPhotos = [];
    
    collageBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        document.getElementById('collageOverlay').classList.add('open');
        document.getElementById('collagePanel').classList.add('open');
        document.body.style.overflow = 'hidden';
        selectedPhotos = [];
        updateCollageGallery();
    });
    
    document.getElementById('collageClose')?.addEventListener('click', closeCollage);
    document.getElementById('collageOverlay')?.addEventListener('click', closeCollage);
    
    function closeCollage() {
        modal.style.display = 'none';
        document.getElementById('collageOverlay').classList.remove('open');
        document.getElementById('collagePanel').classList.remove('open');
        document.body.style.overflow = '';
    }
    
    // Layout selection
    document.querySelectorAll('.collage-layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.collage-layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateCollageGallery();
        });
    });
    
    // Photo selection
    document.getElementById('collagePhotosGrid')?.addEventListener('click', (e) => {
        const photoDiv = e.target.closest('.collage-photo-select');
        if (!photoDiv) return;
        const id = parseInt(photoDiv.dataset.id);
        
        if (photoDiv.classList.contains('selected')) {
            selectedPhotos = selectedPhotos.filter(p => p !== id);
            photoDiv.classList.remove('selected');
        } else {
            const layout = document.querySelector('.collage-layout-btn.active')?.dataset.layout || 'grid2';
            const max = layout === 'grid2' ? 2 : layout === 'grid3' ? 3 : 4;
            if (selectedPhotos.length >= max) {
                showToast(`Max ${max} photos allowed for this layout`, 'error');
                return;
            }
            selectedPhotos.push(id);
            photoDiv.classList.add('selected');
        }
        
        updateCollagePreview();
    });
    
    document.getElementById('collageDownload')?.addEventListener('click', downloadCollage);
    
    function updateCollageGallery() {
        const grid = document.getElementById('collagePhotosGrid');
        if (grid) {
            grid.innerHTML = photos.slice(0, 20).map(p => `
                <div class="collage-photo-select ${selectedPhotos.includes(p.id) ? 'selected' : ''}" data-id="${p.id}">
                    <img src="${p.image}" alt="${p.title}">
                </div>
            `).join('');
        }
    }
    
    function updateCollagePreview() {
        const canvas = document.getElementById('collageCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const layout = document.querySelector('.collage-layout-btn.active')?.dataset.layout || 'grid2';
        
        ctx.clearRect(0, 0, 600, 600);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, 600, 600);
        
        if (selectedPhotos.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Select photos to create collage', 300, 300);
            return;
        }
        
        const imgs = selectedPhotos.map(id => photos.find(p => p.id === id)).filter(Boolean);
        
        // Simple layout drawing
        if (layout === 'grid2' && imgs.length >= 1) {
            drawCollageImages(ctx, imgs.slice(0, 2), [
                { x: 0, y: 0, w: 300, h: 600 },
                { x: 300, y: 0, w: 300, h: 600 }
            ]);
        } else if (layout === 'grid3' && imgs.length >= 1) {
            drawCollageImages(ctx, imgs.slice(0, 3), [
                { x: 0, y: 0, w: 300, h: 300 },
                { x: 300, y: 0, w: 300, h: 300 },
                { x: 0, y: 300, w: 600, h: 300 }
            ]);
        } else if (layout === 'grid4' && imgs.length >= 1) {
            drawCollageImages(ctx, imgs.slice(0, 4), [
                { x: 0, y: 0, w: 300, h: 300 },
                { x: 300, y: 0, w: 300, h: 300 },
                { x: 0, y: 300, w: 300, h: 300 },
                { x: 300, y: 300, w: 300, h: 300 }
            ]);
        } else if (layout === 'heart' && imgs.length >= 1) {
            drawCollageImages(ctx, imgs.slice(0, 4), [
                { x: 150, y: 50, w: 300, h: 250 },
                { x: 0, y: 200, w: 600, h: 400 }
            ]);
        }
    }
    
    async function drawCollageImages(ctx, imgs, positions) {
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const imgEl = new Image();
                imgEl.crossOrigin = 'anonymous';
                imgEl.onload = () => resolve(imgEl);
                imgEl.onerror = () => resolve(null);
                imgEl.src = src;
            });
        };
        
        // Load all images in parallel
        const loadedImages = await Promise.all(
            imgs.map(img => loadImage(img.fullImage || img.image))
        );
        
        // Draw loaded images
        loadedImages.forEach((imgEl, i) => {
            if (!imgEl || i >= positions.length) return;
            const pos = positions[i];
            ctx.drawImage(imgEl, pos.x, pos.y, pos.w, pos.h);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);
        });
    }
    
    function downloadCollage() {
        const canvas = document.getElementById('collageCanvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `collage-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Collage downloaded! 🎉');
    }
}
