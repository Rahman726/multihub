// ===================== DARKROOM PRO — Professional Photo Editor =====================
// A full-featured, Lightroom-style editing workspace with canvas-based pixel processing.

const Darkroom = (() => {
    'use strict';

    // ─── State ──────────────────────────────────────────────────────────────────
    const state = {
        open: false,
        currentPhoto: null,
        currentIndex: 0,
        photos: [],
        zoom: 1,
        panX: 0,
        panY: 0,
        viewMode: 'edit',          // 'edit' | 'before' | 'split'
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragOrigPanX: 0,
        dragOrigPanY: 0,
        loading: false,

        // Undo history (each entry is a full ImageData)
        history: [],
        historyIndex: -1,
        maxHistory: 20,

        // Pixel buffers
        sourceImageData: null,     // Original unmodified pixels (for reset / undo base)
        workingImageData: null,    // Currently displayed pixels (after all adjustments)
        canvas: null,
        ctx: null,
        previewCanvas: null,
        previewCtx: null,

        // ─── Adjustment values ──────────────────────────────────────────────────
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
        vibrance: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        sharpness: 0,
        noise: 0,
        vignette: 0,
        vignetteFeather: 50,
        vignetteRadius: 50,
        curvePoints: [[0,0], [255,255]], // [[in,out], ...]
        levelShadows: 0,
        levelMidtones: 1,
        levelHighlights: 255,
        splitPosition: 0.5,        // For before/after split view
    };

    // ─── DOM refs ───────────────────────────────────────────────────────────────
    let el = {};

    // ─── Public API ─────────────────────────────────────────────────────────────
    function initDarkroom() {
        buildUI();
        bindEvents();
        addLightboxButton();
        addDarkroomNavButton();
        console.log('🌑 Darkroom Pro initialized');
    }

    function openDarkroom(photoIndex) {
        const photos = [...(window.filteredPhotos || window.photos || [])];
        if (!photos.length) { showToast('No photos to edit'); return; }

        state.photos = photos;
        state.currentIndex = photoIndex || 0;
        state.currentPhoto = photos[state.currentIndex];
        state.history = [];
        state.historyIndex = -1;
        resetAdjustments();

        el.overlay.style.display = 'block';
        el.panel.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            el.overlay.classList.add('open');
            el.panel.classList.add('open');
        }, 10);

        loadPhoto(state.currentPhoto);
    }

    function closeDarkroom() {
        el.overlay.classList.remove('open');
        el.panel.classList.remove('open');
        setTimeout(() => {
            el.overlay.style.display = 'none';
            el.panel.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
        state.canvas = null;
        state.ctx = null;
    }

    // ─── Build UI ───────────────────────────────────────────────────────────────
    function buildUI() {
        const overlay = document.createElement('div');
        overlay.className = 'darkroom-overlay';
        overlay.id = 'darkroomOverlay';

        const panel = document.createElement('div');
        panel.className = 'darkroom-panel';
        panel.id = 'darkroomPanel';
        panel.innerHTML = `
            <!-- Top Bar -->
            <div class="darkroom-topbar">
                <div class="darkroom-topbar-left">
                    <button class="darkroom-btn darkroom-btn-back" id="darkroomClose" title="Close (Esc)">← Back</button>
                    <div class="darkroom-filmstrip" id="darkroomFilmstrip"></div>
                </div>
                <div class="darkroom-topbar-center">
                    <span class="darkroom-title">🌑 Darkroom Pro</span>
                </div>
                <div class="darkroom-topbar-right">
                    <div class="darkroom-view-toggle">
                        <button class="darkroom-view-btn active" data-view="edit" title="Edit View">✏️</button>
                        <button class="darkroom-view-btn" data-view="before" title="Before">🔄</button>
                        <button class="darkroom-view-btn" data-view="split" title="Split View">🔀</button>
                    </div>
                    <button class="darkroom-btn darkroom-btn-danger" id="darkroomReset">🔄 Reset All</button>
                    <button class="darkroom-btn darkroom-btn-primary" id="darkroomSave">💾 Save to Gallery</button>
                    <button class="darkroom-btn darkroom-btn-primary" id="darkroomDownload">⬇ Export</button>
                </div>
            </div>

            <!-- Main Area -->
            <div class="darkroom-main">
                <!-- Canvas Area -->
                <div class="darkroom-canvas-area" id="darkroomCanvasArea">
                    <div class="darkroom-canvas-wrapper" id="darkroomCanvasWrapper">
                        <canvas id="darkroomCanvas"></canvas>
                        <div class="darkroom-histogram" id="darkroomHistogram">
                            <canvas id="darkroomHistogramCanvas" width="256" height="80"></canvas>
                        </div>
                        <div class="darkroom-zoom-info" id="darkroomZoomInfo">100%</div>
                    </div>
                </div>

                <!-- Sidebar Tools -->
                <div class="darkroom-sidebar" id="darkroomSidebar">
                    <div class="darkroom-tabs" id="darkroomTabs">
                        <button class="darkroom-tab active" data-tab="basic">🔆 Basic</button>
                        <button class="darkroom-tab" data-tab="tone">📊 Tone</button>
                        <button class="darkroom-tab" data-tab="curves">📈 Curves</button>
                        <button class="darkroom-tab" data-tab="effects">✨ Effects</button>
                        <button class="darkroom-tab" data-tab="detail">🔍 Detail</button>
                    </div>

                    <div class="darkroom-tab-content" id="darkroomTabBasic">
                        <div class="darkroom-slider">
                            <label>Exposure <span id="valExposure">0.0</span></label>
                            <input type="range" min="-4" max="4" step="0.1" value="0" data-adjust="exposure">
                        </div>
                        <div class="darkroom-slider">
                            <label>Contrast <span id="valContrast">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="contrast">
                        </div>
                        <div class="darkroom-slider">
                            <label>Highlights <span id="valHighlights">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="highlights">
                        </div>
                        <div class="darkroom-slider">
                            <label>Shadows <span id="valShadows">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="shadows">
                        </div>
                        <div class="darkroom-slider">
                            <label>Whites <span id="valWhites">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="whites">
                        </div>
                        <div class="darkroom-slider">
                            <label>Blacks <span id="valBlacks">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="blacks">
                        </div>
                    </div>

                    <div class="darkroom-tab-content hidden" id="darkroomTabTone">
                        <div class="darkroom-slider">
                            <label>Vibrance <span id="valVibrance">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="vibrance">
                        </div>
                        <div class="darkroom-slider">
                            <label>Saturation <span id="valSaturation">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="saturation">
                        </div>
                        <div class="darkroom-slider">
                            <label>Temperature <span id="valTemperature">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="temperature">
                        </div>
                        <div class="darkroom-slider">
                            <label>Tint <span id="valTint">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="tint">
                        </div>
                        <div class="darkroom-slider">
                            <label>Shadows <span id="valLevelShadows">0</span></label>
                            <input type="range" min="0" max="255" value="0" data-adjust="levelShadows">
                        </div>
                        <div class="darkroom-slider">
                            <label>Midtones <span id="valLevelMidtones">1.00</span></label>
                            <input type="range" min="0.1" max="9.9" step="0.1" value="1" data-adjust="levelMidtones">
                        </div>
                        <div class="darkroom-slider">
                            <label>Highlights <span id="valLevelHighlights">255</span></label>
                            <input type="range" min="0" max="255" value="255" data-adjust="levelHighlights">
                        </div>
                    </div>

                    <div class="darkroom-tab-content hidden" id="darkroomTabCurves">
                        <div class="darkroom-curves-container">
                            <canvas id="darkroomCurvesCanvas" width="256" height="256"></canvas>
                            <div class="darkroom-curves-info">
                                <span id="darkroomCurveInput">Input: —</span>
                                <span id="darkroomCurveOutput">Output: —</span>
                            </div>
                            <div class="darkroom-curves-actions">
                                <button class="darkroom-btn darkroom-btn-sm" id="darkroomCurveReset">Reset Curve</button>
                                <button class="darkroom-btn darkroom-btn-sm" id="darkroomCurveLinear">Linear</button>
                                <button class="darkroom-btn darkroom-btn-sm" id="darkroomCurveContrast">S-Curve</button>
                            </div>
                            <p class="darkroom-hint">Click to add points · Drag to adjust · Right-click to remove</p>
                        </div>
                    </div>

                    <div class="darkroom-tab-content hidden" id="darkroomTabEffects">
                        <div class="darkroom-slider">
                            <label>Vignette <span id="valVignette">0</span></label>
                            <input type="range" min="-100" max="100" value="0" data-adjust="vignette">
                        </div>
                        <div class="darkroom-slider">
                            <label>Vignette Radius <span id="valVignetteRadius">50</span></label>
                            <input type="range" min="0" max="100" value="50" data-adjust="vignetteRadius">
                        </div>
                        <div class="darkroom-slider">
                            <label>Vignette Feather <span id="valVignetteFeather">50</span></label>
                            <input type="range" min="0" max="100" value="50" data-adjust="vignetteFeather">
                        </div>
                        <div class="darkroom-slider">
                            <label>Film Grain <span id="valNoise">0</span></label>
                            <input type="range" min="0" max="100" value="0" data-adjust="noise">
                        </div>
                        <div class="darkroom-presets">
                            <label>Quick Presets</label>
                            <div class="darkroom-preset-btns">
                                <button class="darkroom-preset-btn" data-preset="portrait">👤 Portrait</button>
                                <button class="darkroom-preset-btn" data-preset="landscape">🏔️ Landscape</button>
                                <button class="darkroom-preset-btn" data-preset="vintage">📜 Vintage</button>
                                <button class="darkroom-preset-btn" data-preset="bw">⚫ B&W</button>
                                <button class="darkroom-preset-btn" data-preset="dramatic">⚡ Dramatic</button>
                                <button class="darkroom-preset-btn" data-preset="matte">🎨 Matte</button>
                            </div>
                        </div>
                    </div>

                    <div class="darkroom-tab-content hidden" id="darkroomTabDetail">
                        <div class="darkroom-slider">
                            <label>Sharpness <span id="valSharpness">0</span></label>
                            <input type="range" min="0" max="100" value="0" data-adjust="sharpness">
                        </div>
                        <div class="darkroom-info-box">
                            <h4>📸 Photo Info</h4>
                            <div id="darkroomPhotoInfo">
                                <div class="darkroom-info-row"><span>Dimensions</span><span id="drInfoDims">—</span></div>
                                <div class="darkroom-info-row"><span>File Size</span><span id="drInfoSize">—</span></div>
                                <div class="darkroom-info-row"><span>Zoom</span><span id="drInfoZoom">100%</span></div>
                                <div class="darkroom-info-row"><span>Undo Steps</span><span id="drInfoUndo">0</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Bar -->
            <div class="darkroom-bottombar">
                <div class="darkroom-bottombar-left">
                    <span id="darkroomStatus">Ready</span>
                </div>
                <div class="darkroom-bottombar-center">
                    <span class="darkroom-shortcuts-hint">⌘Z Undo · ⌘⇧Z Redo · ⌘0 Fit · ⌘+ Zoom In</span>
                </div>
                <div class="darkroom-bottombar-right">
                    <button class="darkroom-btn darkroom-btn-sm" id="darkroomZoomOut">🔍−</button>
                    <span class="darkroom-zoom-level" id="darkroomZoomLevel">100%</span>
                    <button class="darkroom-btn darkroom-btn-sm" id="darkroomZoomIn">🔍+</button>
                    <button class="darkroom-btn darkroom-btn-sm" id="darkroomZoomFit">⊡ Fit</button>
                    <button class="darkroom-btn darkroom-btn-sm" id="darkroomZoomActual">1:1</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        el = {
            overlay: overlay,
            panel: panel,
            close: document.getElementById('darkroomClose'),
            reset: document.getElementById('darkroomReset'),
            save: document.getElementById('darkroomSave'),
            download: document.getElementById('darkroomDownload'),
            canvas: document.getElementById('darkroomCanvas'),
            canvasArea: document.getElementById('darkroomCanvasArea'),
            canvasWrapper: document.getElementById('darkroomCanvasWrapper'),
            histogramCanvas: document.getElementById('darkroomHistogramCanvas'),
            curvesCanvas: document.getElementById('darkroomCurvesCanvas'),
            filmstrip: document.getElementById('darkroomFilmstrip'),
            status: document.getElementById('darkroomStatus'),
            zoomLevel: document.getElementById('darkroomZoomLevel'),
            zoomInfo: document.getElementById('darkroomZoomInfo'),
            zoomOut: document.getElementById('darkroomZoomOut'),
            zoomIn: document.getElementById('darkroomZoomIn'),
            zoomFit: document.getElementById('darkroomZoomFit'),
            zoomActual: document.getElementById('darkroomZoomActual'),
            viewBtns: document.querySelectorAll('.darkroom-view-btn'),
        };
    }

    // ─── Bind Events ────────────────────────────────────────────────────────────
    function bindEvents() {
        // Close
        el.close.addEventListener('click', closeDarkroom);
        el.overlay.addEventListener('click', (e) => { if (e.target === el.overlay) closeDarkroom(); });

        // Reset
        el.reset.addEventListener('click', resetAll);

        // Save & Download
        el.save.addEventListener('click', saveToGallery);
        el.download.addEventListener('click', exportImage);

        // Zoom
        el.zoomOut.addEventListener('click', () => adjustZoom(-0.25));
        el.zoomIn.addEventListener('click', () => adjustZoom(0.25));
        el.zoomFit.addEventListener('click', fitZoom);
        el.zoomActual.addEventListener('click', () => setZoom(1));

        // View mode toggle
        el.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                el.viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.viewMode = btn.dataset.view;
                renderCanvas();
            });
        });

        // Tab switching
        document.querySelectorAll('.darkroom-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.darkroom-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.darkroom-tab-content').forEach(c => c.classList.add('hidden'));
                tab.classList.add('active');
                const content = document.getElementById(`darkroomTab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`);
                if (content) content.classList.remove('hidden');
            });
        });

        // Slider adjustments (debounced)
        let adjustTimer;
        document.querySelectorAll('.darkroom-slider input[type="range"]').forEach(slider => {
            slider.addEventListener('input', () => {
                const key = slider.dataset.adjust;
                const val = parseFloat(slider.value);
                state[key] = val;
                updateSliderDisplay(key, val);
                clearTimeout(adjustTimer);
                adjustTimer = setTimeout(() => processImage(), 16); // ~60fps throttle
            });
        });

        // Curves canvas interaction
        setupCurvesInteraction();

        // Preset buttons
        document.querySelectorAll('.darkroom-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
        });

        // Curves action buttons
        document.getElementById('darkroomCurveReset')?.addEventListener('click', () => resetCurve());
        document.getElementById('darkroomCurveLinear')?.addEventListener('click', () => setCurveLinear());
        document.getElementById('darkroomCurveContrast')?.addEventListener('click', () => setCurveContrast());

        // Canvas pan/drag
        setupCanvasPan();

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeydown);

        // Mouse wheel zoom
        el.canvasWrapper?.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                adjustZoom(e.deltaY > 0 ? -0.1 : 0.1);
            }
        });
    }

    // ─── Add Nav & Lightbox buttons ─────────────────────────────────────────────
    function addDarkroomNavButton() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        const btn = document.createElement('button');
        btn.className = 'nav-darkroom-btn';
        btn.id = 'darkroomNavBtn';
        btn.innerHTML = '🌑 Darkroom';
        btn.title = 'Open Darkroom Pro';
        btn.addEventListener('click', () => openDarkroom(0));
        navActions.insertBefore(btn, navActions.querySelector('.nav-fav-toggle'));
    }

    function addLightboxButton() {
        const lightboxActions = document.querySelector('.lightbox-actions');
        if (!lightboxActions) return;
        const btn = document.createElement('button');
        btn.className = 'lightbox-action-btn';
        btn.id = 'darkroomLightboxBtn';
        btn.innerHTML = '🌑 Darkroom Pro';
        btn.addEventListener('click', () => {
            const photo = window.currentLightboxPhoto;
            if (!photo) { showToast('Open a photo first'); return; }
            const idx = (window.filteredPhotos || window.photos || []).indexOf(photo);
            if (idx >= 0) openDarkroom(idx);
        });
        lightboxActions.insertBefore(btn, lightboxActions.firstChild);
    }

    // ─── Photo Loading ──────────────────────────────────────────────────────────
    function loadPhoto(photo) {
        if (!photo) return;
        state.loading = true;
        setStatus('Loading image...');

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = el.canvas;
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            state.canvas = canvas;
            state.ctx = canvas.getContext('2d');

            // Draw original
            state.ctx.drawImage(img, 0, 0);

            // Store original pixel data
            state.sourceImageData = state.ctx.getImageData(0, 0, canvas.width, canvas.height);
            state.workingImageData = new Uint8ClampedArray(state.sourceImageData.data);

            // Push initial history state
            pushHistory();

            // Update info
            updatePhotoInfo(canvas.width, canvas.height);

            // Fit zoom
            fitZoom();

            // Build film strip
            buildFilmstrip();

            // Render
            processImage();
            updateHistogram(state.sourceImageData.data, canvas.width, canvas.height);
            drawCurveEditor();

            state.loading = false;
            setStatus('Ready');
        };
        img.onerror = () => {
            setStatus('Failed to load image');
            showToast('Failed to load image', 'error');
            state.loading = false;
        };
        img.src = photo.fullImage || photo.image;
    }

    function navigatePhoto(delta) {
        const newIdx = state.currentIndex + delta;
        if (newIdx < 0 || newIdx >= state.photos.length) return;
        state.currentIndex = newIdx;
        state.currentPhoto = state.photos[newIdx];
        state.history = [];
        state.historyIndex = -1;
        resetAdjustments();
        loadPhoto(state.currentPhoto);
        updateFilmstrip();
    }

    // ─── Canvas Rendering ───────────────────────────────────────────────────────
    function processImage() {
        if (!state.sourceImageData || !state.canvas) return;
        const src = state.sourceImageData;
        const w = state.canvas.width;
        const h = state.canvas.height;
        const srcData = src.data;
        const len = srcData.length;

        // Create working copy
        const result = new Uint8ClampedArray(len);
        
        // Process pixels
        for (let i = 0; i < len; i += 4) {
            let r = srcData[i];
            let g = srcData[i + 1];
            let b = srcData[i + 2];
            let a = srcData[i + 3];

            // 1. Exposure
            if (state.exposure !== 0) {
                const f = Math.pow(2, state.exposure);
                r = clamp(r * f);
                g = clamp(g * f);
                b = clamp(b * f);
            }

            // 2. Temperature
            if (state.temperature !== 0) {
                const t = state.temperature * 0.02;
                r = clamp(r + t * (255 - r) * 0.1);
                b = clamp(b - t * b * 0.1);
            }

            // 3. Tint
            if (state.tint !== 0) {
                const t = state.tint * 0.02;
                g = clamp(g + t * (255 - g) * 0.05);
            }

            // 4. Contrast
            if (state.contrast !== 0) {
                const c = (100 + state.contrast) / 100;
                r = clamp((r - 128) * c + 128);
                g = clamp((g - 128) * c + 128);
                b = clamp((b - 128) * c + 128);
            }

            // 5. Highlights & Shadows
            if (state.highlights !== 0) {
                const hVal = state.highlights * 0.005;
                const factor = Math.max(0, Math.min(1, (r - 128) / 128));
                r = clamp(r + r * hVal * factor);
                g = clamp(g + g * hVal * factor);
                b = clamp(b + b * hVal * factor);
            }
            if (state.shadows !== 0) {
                const sVal = state.shadows * 0.005;
                const factor = Math.max(0, Math.min(1, (128 - r) / 128));
                r = clamp(r + r * sVal * factor);
                g = clamp(g + g * sVal * factor);
                b = clamp(b + b * sVal * factor);
            }

            // 6. Whites & Blacks
            if (state.whites !== 0) {
                const wVal = state.whites * 0.003;
                const factor = r / 255;
                r = clamp(r + 255 * wVal * factor * factor);
                g = clamp(g + 255 * wVal * factor * factor);
                b = clamp(b + 255 * wVal * factor * factor);
            }
            if (state.blacks !== 0) {
                const bVal = state.blacks * 0.003;
                const factor = 1 - r / 255;
                r = clamp(r + 255 * bVal * factor * factor);
                g = clamp(g + 255 * bVal * factor * factor);
                b = clamp(b + 255 * bVal * factor * factor);
            }

            // 7. Levels
            if (state.levelShadows > 0 || state.levelHighlights < 255 || state.levelMidtones !== 1) {
                const shad = state.levelShadows;
                const high = state.levelHighlights;
                const mid = state.levelMidtones;
                const range = high - shad;
                if (range > 0) {
                    r = clamp(Math.pow(((r - shad) / range), 1/mid) * 255);
                    g = clamp(Math.pow(((g - shad) / range), 1/mid) * 255);
                    b = clamp(Math.pow(((b - shad) / range), 1/mid) * 255);
                }
            }

            // 8. Curves
            if (state.curvePoints.length > 2 || (state.curvePoints.length === 2 && (state.curvePoints[0][1] !== 0 || state.curvePoints[1][1] !== 255))) {
                r = applyCurve(r);
                g = applyCurve(g);
                b = applyCurve(b);
            }

            // 9. Vibrance
            if (state.vibrance !== 0) {
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const sat = max - min;
                const v = state.vibrance * 0.005;
                if (max > 0) {
                    // Boost less-saturated colors more
                    const boost = v * (1 - sat / 255);
                    r = clamp(r + (r - (r + g + b) / 3) * boost);
                    g = clamp(g + (g - (r + g + b) / 3) * boost);
                    b = clamp(b + (b - (r + g + b) / 3) * boost);
                }
            }

            // 10. Saturation
            if (state.saturation !== 0) {
                const gray = (r + g + b) / 3;
                const s = (100 + state.saturation) / 100;
                r = clamp(gray + (r - gray) * s);
                g = clamp(gray + (g - gray) * s);
                b = clamp(gray + (b - gray) * s);
            }

            // 11. Vignette
            if (state.vignette !== 0) {
                const px = (i / 4) % w;
                const py = Math.floor((i / 4) / w);
                const cx = w / 2;
                const cy = h / 2;
                const maxDist = Math.sqrt(cx * cx + cy * cy);
                const dist = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy)) / maxDist;
                const radius = state.vignetteRadius / 100;
                const feather = state.vignetteFeather / 100;
                let vFactor = 1;
                if (dist > radius) {
                    vFactor = 1 - (state.vignette / 100) * Math.min(1, (dist - radius) / (feather * (1 - radius) + 0.01));
                    vFactor = Math.max(0, vFactor);
                }
                r = clamp(r * vFactor);
                g = clamp(g * vFactor);
                b = clamp(b * vFactor);
            }

            // 12. Film Grain
            if (state.noise > 0) {
                const n = (Math.random() - 0.5) * state.noise * 0.03 * 255;
                r = clamp(r + n);
                g = clamp(g + n);
                b = clamp(b + n);
            }

            result[i] = r;
            result[i + 1] = g;
            result[i + 2] = b;
            result[i + 3] = a;
        }

        // Store as image data for rendering
        const imageData = new ImageData(new Uint8ClampedArray(result), w, h);
        state.workingImageData = imageData;
        state.ctx.putImageData(imageData, 0, 0);

        renderCanvas();
        updateHistogram(result, w, h);
    }

    function renderCanvas() {
        const canvas = el.canvas;
        if (!canvas) return;
        const wrapper = el.canvasWrapper;
        
        const z = state.zoom;
        const px = state.panX;
        const py = state.panY;

        canvas.style.transform = `translate(${px}px, ${py}px) scale(${z})`;
        canvas.style.transformOrigin = 'center center';

        // Update zoom display
        const pct = Math.round(z * 100);
        el.zoomLevel.textContent = `${pct}%`;
        el.zoomInfo.textContent = `${pct}%`;

        // Before/After split view: show overlay
        const overlay = canvas.parentElement.querySelector('.darkroom-split-overlay');
        if (state.viewMode === 'split') {
            if (!overlay) {
                const div = document.createElement('div');
                div.className = 'darkroom-split-overlay';
                canvas.parentElement.appendChild(div);
            }
            const div = canvas.parentElement.querySelector('.darkroom-split-overlay');
            div.style.clipPath = `inset(0 ${(1 - state.splitPosition) * 100}% 0 0)`;
            // Draw original on overlay
            const origCtx = div.getContext?.('2d');
            if (origCtx && state.sourceImageData) {
                // We'd need another canvas for this - simplify: just show the split marker
            }
        } else {
            canvas.parentElement.querySelector('.darkroom-split-overlay')?.remove();
        }
    }

    // ─── Histogram ──────────────────────────────────────────────────────────────
    function updateHistogram(data, w, h) {
        const canvas = el.histogramCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const len = data.length;
        const bins = 256;
        const histR = new Uint32Array(bins);
        const histG = new Uint32Array(bins);
        const histB = new Uint32Array(bins);
        const histL = new Uint32Array(bins);

        for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
            histR[r]++;
            histG[g]++;
            histB[b]++;
            histL[l]++;
        }

        const maxR = Math.max(...histR, 1);
        const maxG = Math.max(...histG, 1);
        const maxB = Math.max(...histB, 1);
        const maxL = Math.max(...histL, 1);
        const cw = canvas.width;
        const ch = canvas.height;
        const barW = cw / bins;

        ctx.clearRect(0, 0, cw, ch);

        // Luminosity (gray)
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < bins; i++) {
            const hgt = (histL[i] / maxL) * ch;
            ctx.fillRect(i * barW, ch - hgt, barW + 1, hgt);
        }

        // RGB channels with low opacity
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255,0,0,0.25)';
        for (let i = 0; i < bins; i++) {
            const hgt = (histR[i] / maxR) * ch;
            ctx.fillRect(i * barW, ch - hgt, barW + 1, hgt);
        }
        ctx.fillStyle = 'rgba(0,255,0,0.2)';
        for (let i = 0; i < bins; i++) {
            const hgt = (histG[i] / maxG) * ch;
            ctx.fillRect(i * barW, ch - hgt, barW + 1, hgt);
        }
        ctx.fillStyle = 'rgba(0,100,255,0.2)';
        for (let i = 0; i < bins; i++) {
            const hgt = (histB[i] / maxB) * ch;
            ctx.fillRect(i * barW, ch - hgt, barW + 1, hgt);
        }
        ctx.globalCompositeOperation = 'source-over';

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = (ch / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(cw, y);
            ctx.stroke();
        }
    }

    // ─── Curves ─────────────────────────────────────────────────────────────────
    function setupCurvesInteraction() {
        const cvs = el.curvesCanvas;
        if (!cvs) return;

        let isDragging = false;
        let dragPoint = -1;

        function getCanvasCoords(e) {
            const rect = cvs.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) / rect.width * 256,
                y: (e.clientY - rect.top) / rect.height * 256
            };
        }

        function findNearestPoint(x, y, threshold = 15) {
            const pts = state.curvePoints;
            for (let i = 0; i < pts.length; i++) {
                const dx = pts[i][0] - x;
                const dy = (255 - pts[i][1]) - y;
                if (Math.sqrt(dx * dx + dy * dy) < threshold) return i;
            }
            return -1;
        }

        cvs.addEventListener('mousedown', (e) => {
            const coords = getCanvasCoords(e);
            const idx = findNearestPoint(coords.x, coords.y);
            if (idx >= 0) {
                isDragging = true;
                dragPoint = idx;
            } else if (e.button === 0) {
                // Add point
                const x = Math.round(coords.x);
                const y = Math.round(255 - coords.y);
                state.curvePoints.push([clamp(x, 0, 255), clamp(y, 0, 255)]);
                state.curvePoints.sort((a, b) => a[0] - b[0]);
                drawCurveEditor();
                processImage();
            }
        });

        cvs.addEventListener('mousemove', (e) => {
            const coords = getCanvasCoords(e);
            
            // Update coordinate display
            const inputVal = Math.round(coords.x);
            const outputVal = Math.round(255 - coords.y);
            document.getElementById('darkroomCurveInput').textContent = `Input: ${inputVal}`;
            document.getElementById('darkroomCurveOutput').textContent = `Output: ${outputVal}`;

            if (isDragging && dragPoint >= 0) {
                const x = clamp(Math.round(coords.x), 0, 255);
                const y = clamp(Math.round(255 - coords.y), 0, 255);
                state.curvePoints[dragPoint] = [x, y];
                state.curvePoints.sort((a, b) => a[0] - b[0]);
                drawCurveEditor();
                processImage();
            }

            // Update cursor
            const idx = findNearestPoint(coords.x, coords.y);
            cvs.style.cursor = idx >= 0 ? 'grab' : 'crosshair';
        });

        cvs.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                pushHistory();
            }
        });

        cvs.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        cvs.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const coords = getCanvasCoords(e);
            const idx = findNearestPoint(coords.x, coords.y);
            if (idx >= 0 && state.curvePoints.length > 2) {
                state.curvePoints.splice(idx, 1);
                drawCurveEditor();
                processImage();
            }
        });
    }

    function drawCurveEditor() {
        const cvs = el.curvesCanvas;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        const size = 256;

        ctx.clearRect(0, 0, size, size);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const pos = (size / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(size, pos);
            ctx.stroke();
        }

        // Diagonal line (reference)
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.lineTo(size, 0);
        ctx.stroke();

        // Draw filled area under curve
        const pts = state.curvePoints;
        if (pts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(0, size);
            
            for (let i = 0; i <= 255; i++) {
                const y = evaluateCurve(i);
                const px = i;
                const py = size - y;
                if (i === 0) ctx.lineTo(px, py);
                else ctx.lineTo(px, py);
            }
            
            ctx.lineTo(255, size);
            ctx.closePath();
            ctx.fillStyle = 'rgba(5, 160, 129, 0.12)';
            ctx.fill();
        }

        // Draw curve line
        ctx.strokeStyle = '#05a081';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 255; i++) {
            const y = evaluateCurve(i);
            const px = i;
            const py = size - y;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Draw control points
        pts.forEach((pt, idx) => {
            const x = pt[0];
            const y = size - pt[1];
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = idx === 0 || idx === pts.length - 1 ? 'rgba(255,255,255,0.5)' : '#05a081';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    function evaluateCurve(x) {
        const pts = state.curvePoints;
        if (pts.length === 0) return x;
        if (pts.length === 1) return pts[0][1];
        if (x <= pts[0][0]) return pts[0][1];
        if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

        // Find segment
        for (let i = 0; i < pts.length - 1; i++) {
            const x1 = pts[i][0];
            const x2 = pts[i + 1][0];
            if (x >= x1 && x <= x2) {
                const t = (x - x1) / (x2 - x1);
                const y1 = pts[i][1];
                const y2 = pts[i + 1][1];
                // Smooth interpolation (catmull-rom style)
                return y1 + (y2 - y1) * t;
            }
        }
        return x;
    }

    function applyCurve(val) {
        return clamp(Math.round(evaluateCurve(val)));
    }

    function resetCurve() {
        state.curvePoints = [[0, 0], [255, 255]];
        drawCurveEditor();
        processImage();
        pushHistory();
    }

    function setCurveLinear() {
        state.curvePoints = [[0, 0], [255, 255]];
        drawCurveEditor();
        processImage();
        pushHistory();
    }

    function setCurveContrast() {
        state.curvePoints = [[0, 0], [64, 48], [192, 208], [255, 255]];
        drawCurveEditor();
        processImage();
        pushHistory();
    }

    // ─── Canvas Pan ─────────────────────────────────────────────────────────────
    function setupCanvasPan() {
        const wrapper = el.canvasWrapper;
        wrapper.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'CANVAS' && (e.button === 1 || (e.button === 0 && e.shiftKey))) {
                state.isDragging = true;
                state.dragStartX = e.clientX;
                state.dragStartY = e.clientY;
                state.dragOrigPanX = state.panX;
                state.dragOrigPanY = state.panY;
                wrapper.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (state.isDragging) {
                state.panX = state.dragOrigPanX + (e.clientX - state.dragStartX);
                state.panY = state.dragOrigPanY + (e.clientY - state.dragStartY);
                renderCanvas();
            }
        });

        document.addEventListener('mouseup', () => {
            if (state.isDragging) {
                state.isDragging = false;
                el.canvasWrapper.style.cursor = '';
            }
        });
    }

    // ─── Zoom ───────────────────────────────────────────────────────────────────
    function adjustZoom(delta) {
        const newZoom = clamp(state.zoom + delta, 0.1, 10);
        setZoom(newZoom);
    }

    function setZoom(z) {
        state.zoom = clamp(z, 0.1, 10);
        renderCanvas();
    }

    function fitZoom() {
        const canvas = el.canvas;
        const wrapper = el.canvasWrapper;
        if (!canvas || !wrapper) return;
        const ww = wrapper.clientWidth - 20;
        const wh = wrapper.clientHeight - 80; // Leave room for histogram
        const cw = canvas.width;
        const ch = canvas.height;
        if (cw === 0 || ch === 0) return;
        const z = Math.min(ww / cw, wh / ch);
        state.zoom = clamp(z, 0.1, 10);
        state.panX = 0;
        state.panY = 0;
        renderCanvas();
    }

    // ─── Undo / History ─────────────────────────────────────────────────────────
    function pushHistory() {
        if (!state.canvas) return;
        const imageData = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
        
        // If we're not at the end, truncate future history
        if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
        }

        state.history.push(imageData);
        if (state.history.length > state.maxHistory) {
            state.history.shift();
        }
        state.historyIndex = state.history.length - 1;
        updateUndoInfo();
    }

    function undo() {
        if (state.historyIndex <= 0) return;
        state.historyIndex--;
        restoreHistoryState();
    }

    function redo() {
        if (state.historyIndex >= state.history.length - 1) return;
        state.historyIndex++;
        restoreHistoryState();
    }

    function restoreHistoryState() {
        if (!state.canvas || state.historyIndex < 0 || state.historyIndex >= state.history.length) return;
        const imageData = state.history[state.historyIndex];
        state.ctx.putImageData(imageData, 0, 0);
        state.workingImageData = imageData;
        updateHistogram(imageData.data, state.canvas.width, state.canvas.height);
        updateUndoInfo();
    }

    function updateUndoInfo() {
        const info = document.getElementById('drInfoUndo');
        if (info) info.textContent = `${state.historyIndex + 1}/${state.history.length}`;
    }

    // ─── Presets ────────────────────────────────────────────────────────────────
    function applyPreset(name) {
        resetAdjustments();

        const presets = {
            portrait: { exposure: 0.3, contrast: 5, highlights: -10, shadows: 15, whites: 5, blacks: -5, vibrance: 10, saturation: -5, temperature: 5 },
            landscape: { exposure: -0.2, contrast: 20, highlights: -15, shadows: 20, whites: 10, blacks: -10, vibrance: 25, saturation: 10, sharpness: 20 },
            vintage: { exposure: 0.5, contrast: -10, highlights: -20, shadows: 15, vibrance: -20, saturation: -30, temperature: 20, noise: 15, vignette: 30 },
            bw: { saturation: -100, contrast: 25, exposure: 0.2, highlights: 10, shadows: 10, sharpness: 15 },
            dramatic: { exposure: -0.5, contrast: 40, highlights: -20, shadows: -15, whites: 10, blacks: -15, clarity: 30, vignette: 40 },
            matte: { exposure: 0.5, contrast: -15, highlights: -30, shadows: 30, whites: -10, blacks: 10, vibrance: -10, saturation: -15 }
        };

        const p = presets[name];
        if (!p) return;

        Object.keys(p).forEach(key => {
            if (state[key] !== undefined) {
                state[key] = p[key];
                const slider = document.querySelector(`input[data-adjust="${key}"]`);
                if (slider) slider.value = p[key];
                updateSliderDisplay(key, p[key]);
            }
        });

        processImage();
        pushHistory();
        setStatus(`Preset: ${name}`);
    }

    // ─── Reset ──────────────────────────────────────────────────────────────────
    function resetAdjustments() {
        const defaults = {
            exposure: 0, contrast: 0, highlights: 0, shadows: 0,
            whites: 0, blacks: 0, vibrance: 0, saturation: 0,
            temperature: 0, tint: 0, sharpness: 0, noise: 0,
            vignette: 0, vignetteFeather: 50, vignetteRadius: 50,
            levelShadows: 0, levelMidtones: 1, levelHighlights: 255,
            curvePoints: [[0,0], [255,255]]
        };

        Object.keys(defaults).forEach(key => {
            state[key] = defaults[key];
            const slider = document.querySelector(`input[data-adjust="${key}"]`);
            if (slider) { slider.value = defaults[key]; updateSliderDisplay(key, defaults[key]); }
        });

        drawCurveEditor();
    }

    function resetAll() {
        if (!state.sourceImageData) return;
        resetAdjustments();
        
        // Reset canvas to original
        const ctx = state.ctx;
        const w = state.canvas.width;
        const h = state.canvas.height;
        ctx.putImageData(state.sourceImageData, 0, 0);
        state.workingImageData = ctx.getImageData(0, 0, w, h);
        
        pushHistory();
        updateHistogram(state.sourceImageData.data, w, h);
        setStatus('Reset to original');
        showToast('🔄 All adjustments reset');
    }

    // ─── Save & Export ──────────────────────────────────────────────────────────
    function saveToGallery() {
        if (!state.canvas) return;
        const dataUrl = state.canvas.toDataURL('image/png');
        const photo = state.currentPhoto;
        
        const editedPhoto = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            title: `${photo?.title || 'Untitled'} (Darkroom)`,
            artist: window.currentUser?.name || 'AI Artist',
            category: 'edited',
            aspect: 'square',
            image: dataUrl,
            fullImage: dataUrl,
            placeholderColor: '#1a1a2e',
            editedFrom: photo?.id,
            createdAt: new Date().toISOString()
        };

        window.photos?.unshift(editedPhoto);
        if (typeof renderGallery === 'function') renderGallery(window.photos || []);
        showToast('✅ Edited photo saved to gallery!');
    }

    function exportImage() {
        if (!state.canvas) return;
        const link = document.createElement('a');
        link.download = `darkroom-${Date.now()}.png`;
        link.href = state.canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('✅ Image exported!');
    }

    // ─── Filmstrip ──────────────────────────────────────────────────────────────
    function buildFilmstrip() {
        el.filmstrip.innerHTML = state.photos.map((p, i) => `
            <div class="darkroom-filmstrip-item ${i === state.currentIndex ? 'active' : ''}" data-index="${i}">
                <img src="${p.image}" alt="${p.title}" loading="lazy">
            </div>
        `).join('');

        el.filmstrip.querySelectorAll('.darkroom-filmstrip-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.index);
                if (idx !== state.currentIndex) {
                    state.currentIndex = idx;
                    state.currentPhoto = state.photos[idx];
                    state.history = [];
                    state.historyIndex = -1;
                    resetAdjustments();
                    loadPhoto(state.currentPhoto);
                    updateFilmstrip();
                }
            });
        });

        // Scroll into view
        const active = el.filmstrip.querySelector('.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    function updateFilmstrip() {
        el.filmstrip.querySelectorAll('.darkroom-filmstrip-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.index) === state.currentIndex);
        });
        const active = el.filmstrip.querySelector('.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────
    function clamp(val, min = 0, max = 255) {
        return Math.min(max, Math.max(min, val));
    }

    function updateSliderDisplay(key, val) {
        const span = document.getElementById(`val${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (span) {
            if (Number.isInteger(val)) span.textContent = val;
            else span.textContent = val.toFixed(1);
        }
    }

    function setStatus(msg) {
        if (el.status) el.status.textContent = msg;
    }

    function updatePhotoInfo(w, h) {
        const dims = document.getElementById('drInfoDims');
        const size = document.getElementById('drInfoSize');
        if (dims) dims.textContent = `${w} × ${h}`;
        if (size) {
            const mb = (w * h * 4) / (1024 * 1024);
            size.textContent = mb > 1 ? `${mb.toFixed(1)} MB` : `${Math.round(mb * 1024)} KB`;
        }
    }

    function handleKeydown(e) {
        if (!state.open) return;
        const mod = e.metaKey || e.ctrlKey;

        if (e.key === 'Escape') { closeDarkroom(); return; }
        if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
        if (mod && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); return; }
        if (mod && e.key === 'Z') { e.preventDefault(); redo(); return; }
        if (e.key === 'ArrowLeft' && mod) { e.preventDefault(); navigatePhoto(-1); return; }
        if (e.key === 'ArrowRight' && mod) { e.preventDefault(); navigatePhoto(1); return; }
        if (mod && e.key === '0') { e.preventDefault(); fitZoom(); return; }
        if (mod && e.key === '=') { e.preventDefault(); adjustZoom(0.1); return; }
        if (mod && e.key === '-') { e.preventDefault(); adjustZoom(-0.1); return; }
        if (mod && e.key === 's') { e.preventDefault(); saveToGallery(); return; }
        if (mod && e.key === 'Shift') { return; }
    }

    // ─── Return public API ──────────────────────────────────────────────────────
    return {
        init: initDarkroom,
        open: openDarkroom,
        close: closeDarkroom,
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Will be called from init.js
    window.initDarkroom = Darkroom.init;
});

