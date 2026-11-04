// ===================== ENHANCED ADMIN DASHBOARD =====================
// Beautiful admin panel with real-time stats tracking for:
// 👥 Total Users | 🤖 AI Generations | 🎮 Games Played | 📥 Downloads

let adminInitialized = false;
let currentAdminTab = 'overview';
let adminSessionVerified = false;
const ADMIN_CODE_KEY = 'photoStoreAdminCode';

// ===================== ADMIN CODE SYSTEM =====================
// Secret code protection for the admin panel

let adminFailedAttempts = 0;
let adminLockedUntil = 0;

function getStoredAdminCode() {
    try {
        const stored = localStorage.getItem(ADMIN_CODE_KEY);
        if (!stored) return '';
        // Decode from base64 obfuscation
        try { return atob(stored); } catch(e) { return stored; }
    } catch (e) { return ''; }
}

function setStoredAdminCode(code) {
    try {
        // Obfuscate with base64 (not true security but prevents casual snooping)
        localStorage.setItem(ADMIN_CODE_KEY, btoa(code));
        return true;
    } catch (e) { return false; }
}

function isAdminCodeSet() {
    const code = getStoredAdminCode();
    return code && code.length >= 4;
}

function verifyAdminCode(enteredCode) {
    const now = Date.now();
    
    // Check if locked due to too many failed attempts
    if (adminLockedUntil > now) {
        const remaining = Math.ceil((adminLockedUntil - now) / 1000);
        showToast(`⏳ ${remaining}s wait...`);
        return false;
    }

    const storedCode = getStoredAdminCode();
    if (!storedCode) {
        // No code set yet — anyone can access to set it up
        adminFailedAttempts = 0;
        return true;
    }

    if (enteredCode === storedCode) {
        // Reset on success
        adminFailedAttempts = 0;
        return true;
    }

    // Failed attempt
    adminFailedAttempts++;
    if (adminFailedAttempts >= 3) {
        // Lock for 10 seconds after 3 failed attempts
        adminLockedUntil = now + 10000;
        adminFailedAttempts = 0;
        if (typeof showToast === 'function') showToast('🔒 Too many wrong attempts! Wait 10 seconds.');
    }

    return false;
}

function showAdminGateModal(callback) {
    // Remove existing gate
    const existingGate = document.getElementById('adminGateModal');
    if (existingGate) existingGate.remove();

    const gate = document.createElement('div');
    gate.className = 'admin-gate-modal';
    gate.id = 'adminGateModal';
    gate.innerHTML = `
        <div class="admin-gate-overlay"></div>
        <div class="admin-gate-content">
            <div class="admin-gate-icon">🔒</div>
            <h3>Admin Access Required</h3>
            <p>Apna admin secret code enter karein</p>
            <div class="admin-gate-input-wrap">
                <input type="password" id="adminGateCode" placeholder="Enter secret code..." maxlength="20" autocomplete="off" />
                <button class="admin-gate-submit" id="adminGateSubmit">🔓 Unlock</button>
            </div>
            <p class="admin-gate-error" id="adminGateError"></p>
        </div>
    `;
    document.body.appendChild(gate);

    // Animate in
    requestAnimationFrame(() => gate.classList.add('open'));

    const codeInput = document.getElementById('adminGateCode');
    const submitBtn = document.getElementById('adminGateSubmit');
    const errorEl = document.getElementById('adminGateError');

    function attemptUnlock() {
        const enteredCode = codeInput.value.trim();
        if (!enteredCode) {
            errorEl.textContent = '⚠️ Please enter a code!';
            codeInput.focus();
            return;
        }
        
        // Check if currently locked
        if (adminLockedUntil > Date.now()) {
            const remaining = Math.ceil((adminLockedUntil - Date.now()) / 1000);
            errorEl.textContent = '🔒 Too many wrong attempts! Wait ' + remaining + 's...';
            codeInput.value = '';
            return;
        }

        if (verifyAdminCode(enteredCode)) {
            adminSessionVerified = true;
            gate.classList.remove('open');
            setTimeout(() => {
                gate.remove();
                if (typeof callback === 'function') callback();
            }, 300);
        } else {
            // Check if we just got locked
            if (adminLockedUntil > Date.now()) {
                errorEl.textContent = '🔒 Too many wrong attempts! Wait 10 seconds...';
            } else {
                errorEl.textContent = '❌ Wrong code! Try again. (' + (3 - adminFailedAttempts) + ' attempts left)';
            }
            codeInput.value = '';
            codeInput.focus();
            // Shake animation only if not locked
            if (adminLockedUntil <= Date.now()) {
                codeInput.style.animation = 'none';
                setTimeout(() => codeInput.style.animation = 'adminShake 0.4s ease', 10);
            }
        }
    }

    submitBtn.addEventListener('click', attemptUnlock);
    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptUnlock();
    });
    codeInput.addEventListener('input', () => {
        errorEl.textContent = '';
    });

    codeInput.focus();

    // Close on overlay click or Escape key
    function closeGate() {
        gate.classList.remove('open');
        setTimeout(() => gate.remove(), 300);
        document.removeEventListener('keydown', gateKeyHandler);
    }

    function gateKeyHandler(e) {
        if (e.key === 'Escape') closeGate();
    }
    document.addEventListener('keydown', gateKeyHandler);

    gate.querySelector('.admin-gate-overlay').addEventListener('click', closeGate);
}

function showAdminCodeSetupModal() {
    // If code is already set, just verify
    if (isAdminCodeSet()) {
        showAdminGateModal(() => {
            document.getElementById('adminPanelBtn')?.click();
        });
        return;
    }

    // Remove existing setup modal
    const existingSetup = document.getElementById('adminSetupModal');
    if (existingSetup) existingSetup.remove();

    const setup = document.createElement('div');
    setup.className = 'admin-gate-modal';
    setup.id = 'adminSetupModal';
    setup.innerHTML = `
        <div class="admin-gate-overlay"></div>
        <div class="admin-gate-content setup">
            <div class="admin-gate-icon">🔐</div>
            <h3>Set Admin Secret Code</h3>
            <p>Pehli baar admin! Apna secret code set karein (4+ characters)</p>
            <div class="admin-gate-input-wrap">
                <input type="password" id="adminSetupCode" placeholder="Enter new secret code..." maxlength="20" autocomplete="off" />
            </div>
            <div class="admin-gate-input-wrap" style="margin-top: 10px;">
                <input type="password" id="adminSetupCodeConfirm" placeholder="Confirm code..." maxlength="20" autocomplete="off" />
            </div>
            <button class="admin-gate-submit" id="adminSetupSubmit">✅ Set Code</button>
            <p class="admin-gate-error" id="adminSetupError"></p>
        </div>
    `;
    document.body.appendChild(setup);
    requestAnimationFrame(() => setup.classList.add('open'));

    const codeInput = document.getElementById('adminSetupCode');
    const confirmInput = document.getElementById('adminSetupCodeConfirm');
    const submitBtn = document.getElementById('adminSetupSubmit');
    const errorEl = document.getElementById('adminSetupError');

    function setupCode() {
        const code = codeInput.value.trim();
        const confirm = confirmInput.value.trim();

        if (!code || code.length < 4) {
            errorEl.textContent = '⚠️ Code kam se kam 4 characters ka hona chahiye!';
            return;
        }
        if (code !== confirm) {
            errorEl.textContent = '❌ Codes match nahi kar rahe! Dobara likhein.';
            confirmInput.value = '';
            confirmInput.focus();
            return;
        }

        setStoredAdminCode(code);
        adminSessionVerified = true;
        setup.classList.remove('open');
        setTimeout(() => {
            setup.remove();
            if (typeof showToast === 'function') showToast('🔐 Admin code set successfully!');
        }, 300);
    }

    submitBtn.addEventListener('click', setupCode);
    confirmInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') setupCode();
    });
    codeInput.addEventListener('input', () => errorEl.textContent = '');
    confirmInput.addEventListener('input', () => errorEl.textContent = '');

    codeInput.focus();

    // Close on overlay click or Escape key
    function closeSetup() {
        setup.classList.remove('open');
        setTimeout(() => setup.remove(), 300);
        document.removeEventListener('keydown', setupKeyHandler);
    }

    function setupKeyHandler(e) {
        if (e.key === 'Escape') closeSetup();
    }
    document.addEventListener('keydown', setupKeyHandler);

    setup.querySelector('.admin-gate-overlay').addEventListener('click', closeSetup);
}

function initAdmin() {
    if (adminInitialized) return;
    adminInitialized = true;

    // Track app open
    if (typeof trackEvent === 'function') {
        trackEvent('app_open');
    }

    // Check if current user is admin
    if (!checkAdminStatus()) return;

    // Reset session on page load
    adminSessionVerified = false;

    // Add admin button to navbar actions
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const adminBtn = document.getElementById('adminPanelBtn') || document.createElement('button');
        if (!document.getElementById('adminPanelBtn')) {
            adminBtn.id = 'adminPanelBtn';
            adminBtn.className = 'nav-admin-btn';
            adminBtn.title = 'Admin Dashboard';
            adminBtn.innerHTML = '⚙️';
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // If already verified in this session, open panel directly
                if (adminSessionVerified) {
                    toggleAdminPanel();
                    return;
                }
                // If no code is set, show setup modal
                if (!isAdminCodeSet()) {
                    showAdminCodeSetupModal();
                    return;
                }
                // Otherwise show gate modal
                showAdminGateModal(() => {
                    toggleAdminPanel();
                });
            });
            // Insert before dark mode toggle
            const darkToggle = document.getElementById('darkModeToggle');
            if (darkToggle) {
                navActions.insertBefore(adminBtn, darkToggle);
            } else {
                navActions.appendChild(adminBtn);
            }
        }
    }

    // Build admin panel HTML
    buildAdminPanel();

    // Admin tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            currentAdminTab = tab.dataset.tab;
            const content = document.getElementById(`adminTab${currentAdminTab.charAt(0).toUpperCase() + currentAdminTab.slice(1)}`);
            if (content) content.classList.add('active');
            refreshAdminTab(currentAdminTab);
        });
    });
}

function checkAdminStatus() {
    // Check admin flag in localStorage
    let isAdmin = localStorage.getItem('photoStoreAdmin') === 'true';

    // If user is logged in and is the first user, auto-promote to admin
    if (typeof currentUser !== 'undefined' && currentUser && !isAdmin) {
        try {
            const localUsers = JSON.parse(localStorage.getItem('photoStoreLocalUsers') || '{}');
            const userKeys = Object.keys(localUsers);
            if (userKeys.length > 0 && localUsers[userKeys[0]]?.id === currentUser.id) {
                isAdmin = true;
                localStorage.setItem('photoStoreAdmin', 'true');
            }
        } catch (e) {
            // Ignore errors
        }
    }

    return isAdmin;
}

function buildAdminPanel() {
    // Remove existing panel if any
    const oldPanel = document.getElementById('adminPanel');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.id = 'adminPanel';
    panel.style.display = 'none';
    panel.innerHTML = `
        <div class="admin-container">
            <div class="admin-header">
                <div class="admin-header-top">
                    <div>
                        <h2>⚙️ Admin Dashboard</h2>
                        <p class="admin-subtitle">App ki mukammal jaankari ek jagah</p>
                    </div>
                    <div class="admin-header-actions">
                        <button class="admin-refresh-btn" id="adminRefreshBtn" title="Refresh data">🔄</button>
                        <button class="admin-reset-stats-btn" id="adminResetStatsBtn" title="Reset all stats">🗑️</button>
                        <button class="admin-close-btn" id="adminCloseBtn">✕ Close</button>
                    </div>
                </div>
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="overview">📊 Overview</button>
                    <button class="admin-tab" data-tab="users">👥 Users</button>
                    <button class="admin-tab" data-tab="photos">🖼️ Photos</button>
                    <button class="admin-tab" data-tab="settings">⚡ Settings</button>
                </div>
            </div>

            <div class="admin-content">

                <!-- ===== OVERVIEW TAB ===== -->
                <div class="admin-tab-content active" id="adminTabOverview">
                    <div class="admin-stats-marquee">
                        <div class="admin-stat-card-large">
                            <div class="admin-stat-icon-bg users">👥</div>
                            <div class="admin-stat-info">
                                <span class="admin-stat-number" id="adminTotalUsers">0</span>
                                <span class="admin-stat-label">Total Users</span>
                            </div>
                        </div>
                        <div class="admin-stat-card-large">
                            <div class="admin-stat-icon-bg ai">🤖</div>
                            <div class="admin-stat-info">
                                <span class="admin-stat-number" id="adminAiGenerations">0</span>
                                <span class="admin-stat-label">AI Generations</span>
                            </div>
                        </div>
                        <div class="admin-stat-card-large">
                            <div class="admin-stat-icon-bg games">🎮</div>
                            <div class="admin-stat-info">
                                <span class="admin-stat-number" id="adminGamesPlayed">0</span>
                                <span class="admin-stat-label">Games Played</span>
                            </div>
                        </div>
                        <div class="admin-stat-card-large">
                            <div class="admin-stat-icon-bg downloads">📥</div>
                            <div class="admin-stat-info">
                                <span class="admin-stat-number" id="adminDownloads">0</span>
                                <span class="admin-stat-label">Downloads</span>
                            </div>
                        </div>
                    </div>

                    <div class="admin-secondary-stats">
                        <div class="admin-stat-card-sm">
                            <span class="admin-sm-icon">📸</span>
                            <span class="admin-sm-number" id="adminTotalPhotos">0</span>
                            <span class="admin-sm-label">Photos</span>
                        </div>
                        <div class="admin-stat-card-sm">
                            <span class="admin-sm-icon">👁️</span>
                            <span class="admin-sm-number" id="adminTotalViews">0</span>
                            <span class="admin-sm-label">Views</span>
                        </div>
                        <div class="admin-stat-card-sm">
                            <span class="admin-sm-icon">⭐</span>
                            <span class="admin-sm-number" id="adminTotalRatings">0</span>
                            <span class="admin-sm-label">Ratings</span>
                        </div>
                        <div class="admin-stat-card-sm">
                            <span class="admin-sm-icon">💬</span>
                            <span class="admin-sm-number" id="adminTotalComments">0</span>
                            <span class="admin-sm-label">Comments</span>
                        </div>
                        <div class="admin-stat-card-sm">
                            <span class="admin-sm-icon">📂</span>
                            <span class="admin-sm-number" id="adminTotalAlbums">0</span>
                            <span class="admin-sm-label">Albums</span>
                        </div>
                        <div class="admin-stat-card-sm">
                            <span class="admin-sm-icon">💎</span>
                            <span class="admin-sm-number" id="adminPremiumUsers">0</span>
                            <span class="admin-sm-label">Premium</span>
                        </div>
                    </div>

                    <div class="admin-chart-section">
                        <h3>📈 App Activity Overview</h3>
                        <div class="admin-chart-container">
                            <canvas id="adminChartCanvas" width="900" height="280"></canvas>
                        </div>
                    </div>
                </div>

                <!-- ===== USERS TAB ===== -->
                <div class="admin-tab-content" id="adminTabUsers">
                    <div class="admin-users-header">
                        <h3>👥 Registered Users</h3>
                        <span class="admin-badge" id="adminUserCount">0</span>
                    </div>
                    <div class="admin-search-bar">
                        <input type="text" id="adminUserSearch" placeholder="🔍 Search users by name, email..." />
                    </div>
                    <div class="admin-table-wrapper">
                        <table class="admin-table" id="adminUsersTable">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                    <th>Plan</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="adminUsersBody">
                                <tr><td colspan="6" class="admin-loading">⏳ Loading users...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ===== PHOTOS TAB ===== -->
                <div class="admin-tab-content" id="adminTabPhotos">
                    <div class="admin-users-header">
                        <h3>🖼️ Photo Gallery</h3>
                        <span class="admin-badge" id="adminPhotoCount">0</span>
                    </div>
                    <div class="admin-photos-grid" id="adminPhotosGrid">
                        <p class="admin-loading">⏳ Loading photos...</p>
                    </div>
                </div>

                <!-- ===== SETTINGS TAB ===== -->
                <div class="admin-tab-content" id="adminTabSettings">
                    <div class="admin-card">
                        <h3>⚡ Site Settings</h3>
                        <div class="admin-settings-form">
                            <div class="admin-setting">
                                <label>Allow Public Signup</label>
                                <input type="checkbox" id="adminAllowSignup" checked>
                            </div>
                            <div class="admin-setting">
                                <label>Max AI Generations/Day (Free)</label>
                                <input type="number" id="adminMaxFreeGen" value="5" min="1" max="100">
                            </div>
                            <div class="admin-setting">
                                <label>Maintenance Mode</label>
                                <input type="checkbox" id="adminMaintenanceMode">
                            </div>
                            <div class="admin-setting">
                                <label>Site Name</label>
                                <input type="text" id="adminSiteName" value="PhotoStore">
                            </div>
                            <button class="admin-save-btn" id="adminSaveSettings">💾 Save Settings</button>
                        </div>
                    </div>
                    <div class="admin-card" style="margin-top: 20px;">
                        <h3>🔐 Admin Secret Code</h3>
                        <div class="admin-settings-form">
                            <div class="admin-setting">
                                <label>Current Code</label>
                                <span style="font-size:0.85rem;color:var(--text-light);" id="adminCodeStatus">••••••</span>
                            </div>
                            <div class="admin-setting">
                                <label>New Code</label>
                                <input type="password" id="adminNewCode" placeholder="Enter new code (4+ chars)" maxlength="20" style="width:180px;" />
                            </div>
                            <div class="admin-setting">
                                <label>Confirm Code</label>
                                <input type="password" id="adminConfirmCode" placeholder="Confirm new code" maxlength="20" style="width:180px;" />
                            </div>
                            <button class="admin-save-btn" id="adminChangeCodeBtn" style="background:#8e44ad;">🔐 Change Code</button>
                        </div>
                    </div>
                    <div class="admin-card" style="margin-top: 20px;">
                        <h3>📦 Server Info</h3>
                        <div class="admin-server-info" id="adminServerInfo">
                            <div class="admin-info-row"><span>Node.js</span><span id="adminNodeVersion">—</span></div>
                            <div class="admin-info-row"><span>Uptime</span><span id="adminUptime">—</span></div>
                            <div class="admin-info-row"><span>Memory Usage</span><span id="adminMemory">—</span></div>
                            <div class="admin-info-row"><span>Total Users</span><span id="adminTotalUsersInfo">—</span></div>
                            <div class="admin-info-row"><span>Total Photos</span><span id="adminTotalPhotosInfo">—</span></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    // Insert panel before gallery section
    const gallerySection = document.getElementById('gallery');
    if (gallerySection) {
        gallerySection.parentElement.insertBefore(panel, gallerySection);
    } else {
        document.body.appendChild(panel);
    }

    // Event listeners
    document.getElementById('adminCloseBtn')?.addEventListener('click', toggleAdminPanel);
    document.getElementById('adminRefreshBtn')?.addEventListener('click', () => {
        refreshAdminTab(currentAdminTab);
        if (typeof showToast === 'function') showToast('🔄 Stats refreshed!');
    });
    document.getElementById('adminResetStatsBtn')?.addEventListener('click', () => {
    // resetAllStats() already shows its own toast inside stats-tracker.js
    if (typeof resetAllStats === 'function' && resetAllStats()) {
        refreshAdminTab('overview');
    }
    });

    // User search
    document.getElementById('adminUserSearch')?.addEventListener('input', (e) => {
        filterAdminUsers(e.target.value);
    });

    // Settings save
    document.getElementById('adminSaveSettings')?.addEventListener('click', saveAdminSettings);

    // Change admin code
    document.getElementById('adminChangeCodeBtn')?.addEventListener('click', changeAdminCode);
}

function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const gallery = document.getElementById('gallery');
    const hero = document.getElementById('heroMini');
    const filters = document.querySelector('.filters-section');
    const mapSection = document.getElementById('mapSection');
    const explore = document.getElementById('exploreSection');
    const dash = document.getElementById('dashboardSection');

    if (!panel) return;
    const isOpen = panel.style.display !== 'none';

    if (isOpen) {
        panel.style.display = 'none';
        if (gallery) gallery.style.display = '';
        if (hero) hero.style.display = '';
        if (filters) filters.style.display = '';
    } else {
        panel.style.display = 'block';
        if (gallery) gallery.style.display = 'none';
        if (mapSection) mapSection.style.display = 'none';
        if (explore) explore.style.display = 'none';
        if (dash) dash.style.display = 'none';
        if (hero) hero.style.display = 'none';
        if (filters) filters.style.display = 'none';
        refreshAdminTab(currentAdminTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function refreshAdminTab(tab) {
    switch (tab) {
        case 'overview':
            loadAdminOverview();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'photos':
            loadAdminPhotos();
            break;
        case 'settings':
            loadAdminSettings();
            break;
    }
}

// ===================== OVERVIEW TAB =====================
function loadAdminOverview() {
    const stats = typeof getStats === 'function' ? getStats() : null;

    // Primary stats from tracker
    document.getElementById('adminTotalUsers').textContent = typeof getTotalUsers === 'function' ? getTotalUsers() : (stats?.totalUsers || 0);
    document.getElementById('adminAiGenerations').textContent = stats?.totalAiGenerations || 0;
    document.getElementById('adminGamesPlayed').textContent = stats?.totalGamesPlayed || 0;
    document.getElementById('adminDownloads').textContent = stats?.totalDownloads || 0;

    // Secondary stats
    document.getElementById('adminTotalPhotos').textContent = typeof photos !== 'undefined' ? photos.length : 0;
    document.getElementById('adminTotalAlbums').textContent = (() => {
        try { return JSON.parse(localStorage.getItem('photoStoreLocalAlbums') || '[]').length; } catch(e) { return 0; }
    })();
    document.getElementById('adminPremiumUsers').textContent = (() => {
        try {
            return Object.values(JSON.parse(localStorage.getItem('photoStoreLocalUsers') || '{}'))
                .filter(u => u.plan && u.plan !== 'free').length;
        } catch(e) { return 0; }
    })();
    document.getElementById('adminTotalRatings').textContent = stats?.totalRatings || '—';
    document.getElementById('adminTotalComments').textContent = stats?.totalComments || '—';
    document.getElementById('adminTotalViews').textContent = stats?.totalViews || '—';

    // Try server for more stats
    fetch('/api/stats', { signal: AbortSignal.timeout(3000) })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (data) {
                document.getElementById('adminTotalViews').textContent = data.totalViews || 0;
                document.getElementById('adminTotalRatings').textContent = data.totalRatings || 0;
                document.getElementById('adminTotalComments').textContent = data.totalComments || 0;
                document.getElementById('adminTotalAlbums').textContent = data.totalAlbums || 0;
            }
        })
        .catch(() => {});

    drawAdminChart();
}

function drawAdminChart() {
    const canvas = document.getElementById('adminChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background
    const isDark = document.documentElement.classList.contains('dark-mode');
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f8f9fc';
    ctx.fillRect(0, 0, width, height);

    // Draw stats bars
    const stats = typeof getStats === 'function' ? getStats() : null;
    if (!stats) {
        ctx.fillStyle = isDark ? '#fff' : '#333';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet. Start using the app!', width / 2, height / 2);
        return;
    }

    const bars = [
        { label: 'Users', value: typeof getTotalUsers === 'function' ? getTotalUsers() : stats.totalUsers, color: '#4ECDC4' },
        { label: 'AI Gen', value: stats.totalAiGenerations, color: '#a29bfe' },
        { label: 'Games', value: stats.totalGamesPlayed, color: '#f5576c' },
        { label: 'Downloads', value: stats.totalDownloads, color: '#fdcb6e' }
    ];

    const maxVal = Math.max(...bars.map(b => b.value), 1);
    const padding = { top: 30, bottom: 40, left: 50, right: 30 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barW = chartW / bars.length * 0.6;
    const gap = chartW / bars.length;

    // Draw Y-axis gridlines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxVal * (1 - i / 4)), padding.left - 8, y + 3);
    }

    // Draw bars with gradient
    bars.forEach((bar, i) => {
        const x = padding.left + gap * i + (gap - barW) / 2;
        const barH = (bar.value / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        // Rounded rect
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barW - radius, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
        ctx.lineTo(x + barW, padding.top + chartH);
        ctx.lineTo(x, padding.top + chartH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH);
        gradient.addColorStop(0, bar.color);
        gradient.addColorStop(1, bar.color + '60');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Value on top
        ctx.fillStyle = isDark ? '#fff' : '#333';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bar.value, x + barW / 2, y - 8);

        // Label below
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(bar.label, x + barW / 2, padding.top + chartH + 18);

        // Emoji above value
        const emojis = ['👥', '🤖', '🎮', '📥'];
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(emojis[i], x + barW / 2, y - 28);
    });
}

// ===================== USERS TAB =====================
async function loadAdminUsers() {
    const tbody = document.getElementById('adminUsersBody');
    const count = document.getElementById('adminUserCount');
    if (!tbody) return;

    // Get local users
    let usersList = [];
    try {
        const localUsers = JSON.parse(localStorage.getItem('photoStoreLocalUsers') || '{}');
        usersList = Object.values(localUsers);
    } catch (e) {}

    // Try server for more users
    try {
        const res = await fetch('/api/admin/users', { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const data = await res.json();
            if (data.users) usersList = data.users;
        }
    } catch (e) {}

    if (count) count.textContent = usersList.length;

    if (usersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-loading">No users found. Sign up first!</td></tr>';
        return;
    }

    tbody.innerHTML = usersList.map(u => {
        const plan = u.plan || 'free';
        const planBadge = plan === 'free' ? '🆓 Free' : plan === 'basic' ? '⭐ Basic' : plan === 'pro' ? '💎 Pro' : '🆓 Free';
        const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown';
        return `
            <tr>
                <td class="admin-id">${u.id || '—'}</td>
                <td><strong>${u.name || 'Unknown'}</strong></td>
                <td class="admin-email">${u.email || '—'}</td>
                <td>${joined}</td>
                <td><span class="admin-plan-badge ${plan}">${planBadge}</span></td>
                <td class="admin-actions-cell">
                    <button class="admin-action-btn promote" data-id="${u.id}" title="Promote user">⭐</button>
                    <button class="admin-action-btn remove" data-id="${u.id}" title="Remove user">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');

    // Event listeners
    tbody.querySelectorAll('.admin-action-btn.promote').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const name = prompt('Plan name (basic/pro):');
            if (name && (name === 'basic' || name === 'pro')) {
                promoteUser(id, name);
            }
        });
    });

    tbody.querySelectorAll('.admin-action-btn.remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Remove this user?')) removeUser(id);
        });
    });
}

function filterAdminUsers(query) {
    const rows = document.querySelectorAll('#adminUsersBody tr');
    const q = query.toLowerCase();
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

function promoteUser(userId, plan) {
    fetch(`/api/admin/users/${userId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
    }).catch(() => {});
    showToast(`⭐ User upgraded to ${plan}!`);
    loadAdminUsers();
}

function removeUser(userId) {
    fetch(`/api/admin/users/${userId}`, { method: 'DELETE' }).catch(() => {});
    showToast('🗑️ User removed');
    loadAdminUsers();
}

// ===================== PHOTOS TAB =====================
function loadAdminPhotos() {
    const grid = document.getElementById('adminPhotosGrid');
    const count = document.getElementById('adminPhotoCount');
    if (!grid) return;

    const allPhotos = typeof photos !== 'undefined' ? photos : [];
    if (count) count.textContent = allPhotos.length;

    if (allPhotos.length === 0) {
        grid.innerHTML = '<p class="admin-loading">No photos yet. Generate some AI images!</p>';
        return;
    }

    grid.innerHTML = allPhotos.slice(0, 30).map(p => `
        <div class="admin-photo-item" data-id="${p.id}">
            <img src="${p.image}" alt="${p.title || 'Photo'}" loading="lazy">
            <div class="admin-photo-overlay">
                <span class="admin-photo-title">${p.title || 'Untitled'}</span>
                <button class="admin-photo-delete" data-id="${p.id}" title="Delete photo">🗑️</button>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.admin-photo-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            if (confirm('Delete this photo permanently?')) deletePhoto(id);
        });
    });
}

async function deletePhoto(photoId) {
    const idx = typeof photos !== 'undefined' ? photos.findIndex(p => p.id === photoId) : -1;
    if (idx >= 0) {
        photos.splice(idx, 1);
        const allPhotos = [...photos, ...(window.infinitePhotos || [])];
        if (typeof renderGallery === 'function') renderGallery(allPhotos);
        fetch(`/api/photos/${photoId}`, { method: 'DELETE' }).catch(() => {});
        const item = document.querySelector(`.admin-photo-item[data-id="${photoId}"]`);
        if (item) item.remove();
        showToast('🗑️ Photo deleted');
        const count = document.getElementById('adminPhotoCount');
        if (count) count.textContent = photos.length;
    }
}

// ===================== SETTINGS TAB =====================
function loadAdminSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('photoStoreAdminSettings') || '{}');
        const allowSignup = document.getElementById('adminAllowSignup');
        const maxFreeGen = document.getElementById('adminMaxFreeGen');
        const maintenance = document.getElementById('adminMaintenanceMode');
        const siteName = document.getElementById('adminSiteName');

        if (allowSignup) allowSignup.checked = settings.allowSignup !== false;
        if (maxFreeGen) maxFreeGen.value = settings.maxFreeGen || 5;
        if (maintenance) maintenance.checked = settings.maintenanceMode || false;
        if (siteName) siteName.value = settings.siteName || 'PhotoStore';
    } catch (e) {}
}

function saveAdminSettings() {
    const settings = {
        allowSignup: document.getElementById('adminAllowSignup')?.checked ?? true,
        maxFreeGen: document.getElementById('adminMaxFreeGen')?.value ?? 5,
        maintenanceMode: document.getElementById('adminMaintenanceMode')?.checked ?? false,
        siteName: document.getElementById('adminSiteName')?.value || 'PhotoStore'
    };
    localStorage.setItem('photoStoreAdminSettings', JSON.stringify(settings));
    showToast('💾 Settings saved!');
    if (settings.siteName) document.title = settings.siteName;
}

function changeAdminCode() {
    const newCode = document.getElementById('adminNewCode')?.value?.trim();
    const confirmCode = document.getElementById('adminConfirmCode')?.value?.trim();
    const statusEl = document.getElementById('adminCodeStatus');

    if (!newCode || newCode.length < 4) {
        showToast('⚠️ Code kam se kam 4 characters ka hona chahiye!');
        return;
    }
    if (newCode !== confirmCode) {
        showToast('❌ Codes match nahi kar rahe! Dobara likhein.');
        document.getElementById('adminConfirmCode').value = '';
        document.getElementById('adminConfirmCode').focus();
        return;
    }

    // Verify old code first (if one exists)
    const oldCode = getStoredAdminCode();
    if (oldCode) {
        const oldInput = prompt('🔒 Current admin code likhein change confirm karne ke liye:');
        if (!oldInput || oldInput !== oldCode) {
            showToast('❌ Wrong current code!');
            return;
        }
    }

    setStoredAdminCode(newCode);
    document.getElementById('adminNewCode').value = '';
    document.getElementById('adminConfirmCode').value = '';
    if (statusEl) statusEl.textContent = '✅ Set on ' + new Date().toLocaleDateString();
    showToast('🔐 Admin code updated successfully!');
}
