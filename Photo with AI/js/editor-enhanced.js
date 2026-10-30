// ===================== ADVANCED PHOTO EDITOR =====================

let editorCanvas = null;
let editorCtx = null;
let editorImage = null;
let editorOriginalImage = null;
let editorFilters = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
    blur: 0
};

function initAdvancedEditor() {
    // Add Edit button in lightbox actions
    const lightboxActions = document.querySelector('.lightbox-actions');
    if (!lightboxActions) return;

    const editBtn = document.createElement('button');
    editBtn.className = 'lightbox-action-btn';
    editBtn.id = 'editorOpenBtn';
    editBtn.innerHTML = '🎨 Edit Photo';
    editBtn.addEventListener('click', openAdvancedEditor);
    lightboxActions.appendChild(editBtn);

    // Create editor modal
    const editorModal = document.createElement('div');
    editorModal.className = 'editor-modal';
    editorModal.id = 'editorModal';
    editorModal.innerHTML = `
        <div class="editor-overlay" id="editorOverlay"></div>
        <div class="editor-panel" id="editorPanel">
            <div class="editor-modal-header">
                <h3>🎨 Photo Editor</h3>
                <div class="editor-modal-actions">
                    <button class="editor-btn editor-reset-btn" id="editorResetBtn">🔄 Reset</button>
                    <button class="editor-btn editor-save-btn" id="editorSaveBtn">💾 Save</button>
                    <button class="editor-close-btn" id="editorCloseBtn">✕</button>
                </div>
            </div>
            <div class="editor-modal-body">
                <div class="editor-canvas-wrapper">
                    <canvas id="editorCanvas"></canvas>
                    <div class="editor-watermark" id="editorWatermark">PhotoStore</div>
                </div>
                <div class="editor-sidebar">
                    <!-- Adjustments -->
                    <div class="editor-section">
                        <h4>🔆 Adjust</h4>
                        <div class="editor-slider-group">
                            <label>Brightness</label>
                            <input type="range" min="0" max="200" value="100" class="editor-slider" data-filter="brightness">
                            <span class="editor-slider-value">100%</span>
                        </div>
                        <div class="editor-slider-group">
                            <label>Contrast</label>
                            <input type="range" min="0" max="200" value="100" class="editor-slider" data-filter="contrast">
                            <span class="editor-slider-value">100%</span>
                        </div>
                        <div class="editor-slider-group">
                            <label>Saturation</label>
                            <input type="range" min="0" max="200" value="100" class="editor-slider" data-filter="saturate">
                            <span class="editor-slider-value">100%</span>
                        </div>
                    </div>

                    <!-- Effects -->
                    <div class="editor-section">
                        <h4>✨ Effects</h4>
                        <div class="editor-slider-group">
                            <label>Sepia</label>
                            <input type="range" min="0" max="100" value="0" class="editor-slider" data-filter="sepia">
                            <span class="editor-slider-value">0%</span>
                        </div>
                        <div class="editor-slider-group">
                            <label>Grayscale</label>
                            <input type="range" min="0" max="100" value="0" class="editor-slider" data-filter="grayscale">
                            <span class="editor-slider-value">0%</span>
                        </div>
                        <div class="editor-slider-group">
                            <label>Hue Rotate</label>
                            <input type="range" min="0" max="360" value="0" class="editor-slider" data-filter="hueRotate">
                            <span class="editor-slider-value">0°</span>
                        </div>
                        <div class="editor-slider-group">
                            <label>Blur</label>
                            <input type="range" min="0" max="10" value="0" step="0.5" class="editor-slider" data-filter="blur">
                            <span class="editor-slider-value">0px</span>
                        </div>
                    </div>

                    <!-- Filters -->
                    <div class="editor-section">
                        <h4>🎨 Preset Filters</h4>
                        <div class="editor-presets">
                            <button class="editor-preset" data-preset="normal">Normal</button>
                            <button class="editor-preset" data-preset="vintage">Vintage</button>
                            <button class="editor-preset" data-preset="noir">Noir</button>
                            <button class="editor-preset" data-preset="warm">Warm</button>
                            <button class="editor-preset" data-preset="cool">Cool</button>
                            <button class="editor-preset" data-preset="dramatic">Dramatic</button>
                            <button class="editor-preset" data-preset="pastel">Pastel</button>
                            <button class="editor-preset" data-preset="neon">Neon</button>
                        </div>
                    </div>

                    <!-- Text Overlay -->
                    <div class="editor-section">
                        <h4>✏️ Add Text</h4>
                        <input type="text" class="editor-text-input" id="editorTextInput" placeholder="Type your text..." maxlength="50">
                        <div class="editor-text-controls">
                            <input type="color" id="editorTextColor" value="#ffffff">
                            <select id="editorTextSize">
                                <option value="24">Small</option>
                                <option value="36" selected>Medium</option>
                                <option value="48">Large</option>
                                <option value="64">XL</option>
                            </select>
                            <select id="editorTextPosition">
                                <option value="top">Top</option>
                                <option value="center" selected>Center</option>
                                <option value="bottom">Bottom</option>
                            </select>
                        </div>
                        <button class="editor-btn editor-apply-text-btn" id="editorApplyText">✏️ Apply Text</button>
                    </div>

                    <!-- Aspect Ratio -->
                    <div class="editor-section">
                        <h4>📐 Aspect Ratio</h4>
                        <div class="editor-aspect-btns">
                            <button class="editor-aspect-btn active" data-aspect="original">Original</button>
                            <button class="editor-aspect-btn" data-aspect="1:1">1:1</button>
                            <button class="editor-aspect-btn" data-aspect="4:3">4:3</button>
                            <button class="editor-aspect-btn" data-aspect="16:9">16:9</button>
                            <button class="editor-aspect-btn" data-aspect="3:4">3:4</button>
                            <button class="editor-aspect-btn" data-aspect="9:16">9:16</button>
                        </div>
                    </div>

                    <!-- Download -->
                    <div class="editor-section">
                        <button class="editor-download-btn" id="editorDownloadBtn">⬇ Download Edited Photo</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(editorModal);

    // Event listeners
    document.getElementById('editorCloseBtn')?.addEventListener('click', closeAdvancedEditor);
    document.getElementById('editorOverlay')?.addEventListener('click', closeAdvancedEditor);
    document.getElementById('editorResetBtn')?.addEventListener('click', resetEditor);
    document.getElementById('editorSaveBtn')?.addEventListener('click', saveEditedPhoto);
    document.getElementById('editorDownloadBtn')?.addEventListener('click', downloadEditedPhoto);
    document.getElementById('editorApplyText')?.addEventListener('click', applyTextToCanvas);

    // Slider events
    document.querySelectorAll('.editor-slider').forEach(slider => {
        slider.addEventListener('input', () => {
            const filter = slider.dataset.filter;
            const value = parseInt(slider.value);
            editorFilters[filter] = value;
            updateSliderValue(slider);
            applyEditorFilters();
        });
    });

    // Preset filters
    document.querySelectorAll('.editor-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            applyPresetFilter(btn.dataset.preset);
            document.querySelectorAll('.editor-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Aspect ratio buttons
    document.querySelectorAll('.editor-aspect-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.editor-aspect-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyAspectRatio(btn.dataset.aspect);
        });
    });

    // Text color/position changes trigger re-render
    document.getElementById('editorTextInput')?.addEventListener('input', applyTextToCanvas);
    document.getElementById('editorTextColor')?.addEventListener('input', applyTextToCanvas);
    document.getElementById('editorTextSize')?.addEventListener('change', applyTextToCanvas);
    document.getElementById('editorTextPosition')?.addEventListener('change', applyTextToCanvas);
}

function updateSliderValue(slider) {
    const span = slider.parentElement.querySelector('.editor-slider-value');
    if (span) {
        const filter = slider.dataset.filter;
        const val = editorFilters[filter];
        if (filter === 'hueRotate') span.textContent = `${val}°`;
        else if (filter === 'blur') span.textContent = `${val}px`;
        else span.textContent = `${val}%`;
    }
}

function openAdvancedEditor() {
    const photo = window.currentLightboxPhoto;
    if (!photo) {
        showToast('Open a photo first');
        return;
    }

    const modal = document.getElementById('editorModal');
    if (!modal) return;

    modal.style.display = 'block';
    document.getElementById('editorOverlay').classList.add('open');
    document.getElementById('editorPanel').classList.add('open');
    document.body.style.overflow = 'hidden';

    // Load image into canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        editorOriginalImage = img;
        editorImage = img;
        initEditorCanvas(img);
    };
    img.onerror = () => {
        showToast('Failed to load image for editing', 'error');
        closeAdvancedEditor();
    };
    img.src = photo.fullImage || photo.image;
}

function closeAdvancedEditor() {
    const modal = document.getElementById('editorModal');
    if (!modal) return;
    document.getElementById('editorOverlay').classList.remove('open');
    document.getElementById('editorPanel').classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
    editorCanvas = null;
    editorCtx = null;
}

function initEditorCanvas(img) {
    const canvas = document.getElementById('editorCanvas');
    if (!canvas) return;

    const maxWidth = 500;
    const maxHeight = 400;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;

    if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
    }
    if (h > maxHeight) {
        w = (w * maxHeight) / h;
        h = maxHeight;
    }

    canvas.width = w;
    canvas.height = h;
    editorCanvas = canvas;
    editorCtx = canvas.getContext('2d');

    // Reset filters
    resetEditorFilters();
    drawEditorImage();
}

function resetEditorFilters() {
    editorFilters = {
        brightness: 100,
        contrast: 100,
        saturate: 100,
        sepia: 0,
        grayscale: 0,
        hueRotate: 0,
        blur: 0
    };

    document.querySelectorAll('.editor-slider').forEach(slider => {
        const filter = slider.dataset.filter;
        const defaults = { brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0 };
        slider.value = defaults[filter] || 0;
        updateSliderValue(slider);
    });

    document.querySelectorAll('.editor-preset').forEach(b => b.classList.remove('active'));
    document.querySelector('.editor-preset[data-preset="normal"]')?.classList.add('active');
}

function drawEditorImage() {
    if (!editorCtx || !editorImage) return;
    
    const canvas = editorCanvas;
    editorCtx.clearRect(0, 0, canvas.width, canvas.height);
    editorCtx.drawImage(editorImage, 0, 0, canvas.width, canvas.height);
}

function applyEditorFilters() {
    if (!editorCtx || !editorImage) return;
    
    const canvas = editorCanvas;
    const ctx = editorCtx;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = getFilterString();
    ctx.drawImage(editorImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
}

function getFilterString() {
    const f = editorFilters;
    return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) sepia(${f.sepia}%) grayscale(${f.grayscale}%) hue-rotate(${f.hueRotate}deg) blur(${f.blur}px)`;
}

function applyPresetFilter(preset) {
    const presets = {
        normal: { brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0 },
        vintage: { brightness: 90, contrast: 110, saturate: 80, sepia: 40, grayscale: 0, hueRotate: 0, blur: 0 },
        noir: { brightness: 100, contrast: 130, saturate: 0, sepia: 0, grayscale: 100, hueRotate: 0, blur: 0 },
        warm: { brightness: 105, contrast: 100, saturate: 120, sepia: 15, grayscale: 0, hueRotate: 10, blur: 0 },
        cool: { brightness: 100, contrast: 100, saturate: 110, sepia: 0, grayscale: 0, hueRotate: 200, blur: 0 },
        dramatic: { brightness: 80, contrast: 150, saturate: 110, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0 },
        pastel: { brightness: 115, contrast: 90, saturate: 70, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0 },
        neon: { brightness: 110, contrast: 120, saturate: 150, sepia: 0, grayscale: 0, hueRotate: 180, blur: 0 }
    };

    const p = presets[preset];
    if (!p) return;

    editorFilters = { ...p };

    // Update sliders
    document.querySelectorAll('.editor-slider').forEach(slider => {
        const filter = slider.dataset.filter;
        if (p[filter] !== undefined) {
            slider.value = p[filter];
            updateSliderValue(slider);
        }
    });

    applyEditorFilters();
}

function resetEditor() {
    resetEditorFilters();
    if (editorOriginalImage) {
        editorImage = editorOriginalImage;
        drawEditorImage();
        applyEditorFilters();
    }
    showToast('🔄 Editor reset');
}

function applyTextToCanvas() {
    const text = document.getElementById('editorTextInput')?.value;
    if (!text) {
        applyEditorFilters();
        return;
    }

    const canvas = editorCanvas;
    const ctx = editorCtx;
    if (!ctx || !editorImage) return;

    // Re-draw image with filters
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = getFilterString();
    ctx.drawImage(editorImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // Draw text
    const color = document.getElementById('editorTextColor')?.value || '#ffffff';
    const size = parseInt(document.getElementById('editorTextSize')?.value || '36');
    const position = document.getElementById('editorTextPosition')?.value || 'center';

    ctx.font = `bold ${size}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = size / 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = color;
    
    let y;
    const padding = 30;
    switch (position) {
        case 'top': y = padding + size / 2; break;
        case 'bottom': y = canvas.height - padding - size / 2; break;
        default: y = canvas.height / 2;
    }
    
    ctx.fillText(text, canvas.width / 2, y);
    ctx.shadowColor = 'transparent';
}

function applyAspectRatio(aspect) {
    if (!editorCanvas || !editorImage) return;

    const canvas = editorCanvas;
    const ctx = editorCtx;
    let w = canvas.width;
    let h = canvas.height;

    switch (aspect) {
        case '1:1': w = h = Math.min(w, h); break;
        case '4:3': w = Math.min(w, h * 4 / 3); h = w * 3 / 4; break;
        case '16:9': w = Math.min(w, h * 16 / 9); h = w * 9 / 16; break;
        case '3:4': h = Math.min(h, w * 4 / 3); w = h * 3 / 4; break;
        case '9:16': h = Math.min(h, w * 16 / 9); w = h * 9 / 16; break;
        default: return; // original
    }

    canvas.width = w;
    canvas.height = h;
    applyEditorFilters();
    applyTextToCanvas();
}

function downloadEditedPhoto() {
    if (!editorCanvas) return;
    
    // Apply current filters and text to final output
    applyEditorFilters();
    applyTextToCanvas();
    
    const link = document.createElement('a');
    link.download = `edited-photo-${Date.now()}.png`;
    link.href = editorCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ Photo downloaded!');
}

function saveEditedPhoto() {
    if (!editorCanvas) return;
    
    // Apply filters and text
    applyEditorFilters();
    applyTextToCanvas();
    
    const dataUrl = editorCanvas.toDataURL('image/png');
    
    // Create a photo data entry
    const photo = window.currentLightboxPhoto;
    if (!photo) return;
    
    const editedPhoto = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: `${photo.title} (Edited)`,
        artist: currentUser?.name || 'AI Artist',
        category: 'edited',
        aspect: 'square',
        image: dataUrl,
        fullImage: dataUrl,
        placeholderColor: '#8e44ad',
        editedFrom: photo.id,
        createdAt: new Date().toISOString()
    };
    
    // Add to photos
    photos.unshift(editedPhoto);
    renderGallery(photos);
    showToast('✅ Edited photo saved to gallery!');
    closeAdvancedEditor();
}
