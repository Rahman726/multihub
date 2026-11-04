// ===================== NOTIFICATIONS =====================

function initNotifications() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    const notifBtn = document.createElement('button');
    notifBtn.className = 'notif-btn';
    notifBtn.id = 'notifBtn';
    notifBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="notif-count" id="notifCount"></span>
    `;
    navActions.insertBefore(notifBtn, navActions.querySelector('.nav-fav-toggle'));
    
    // Create notif panel
    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.id = 'notifPanel';
    panel.innerHTML = `
        <div class="notif-header">
            <h4>🔔 Notifications</h4>
        </div>
        <div class="notif-list" id="notifList">
            <p class="notif-empty">No notifications yet</p>
        </div>
    `;
    document.querySelector('.navbar .nav-container')?.appendChild(panel);
    
    notifBtn.addEventListener('click', () => {
        panel.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notif-panel') && !e.target.closest('.notif-btn')) {
            panel.classList.remove('open');
        }
    });
    
    // Poll for notifications only when online
    setInterval(() => {
        if (navigator.onLine) {
            checkNotifications();
        }
    }, 30000);
    
    // Check on page load too
    setTimeout(checkNotifications, 2000);
    
    // Show offline notification style
    if (!navigator.onLine) {
        showOfflineNotifications();
    }
}

function showOfflineNotifications() {
    const list = document.getElementById('notifList');
    const count = document.getElementById('notifCount');
    if (list) {
        list.innerHTML = `
            <div class="notif-item">
                <span class="notif-icon">📡</span>
                <div class="notif-text">
                    <p>You are offline. Notifications will update when you reconnect.</p>
                    <small>Just now</small>
                </div>
            </div>
            <div class="notif-item">
                <span class="notif-icon">✅</span>
                <div class="notif-text">
                    <p>Core features still work offline!</p>
                    <small>Just now</small>
                </div>
            </div>
        `;
    }
    if (count) {
        count.textContent = '!';
        count.classList.add('visible');
    }
}

async function checkNotifications() {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch('/api/notifications', { signal: controller.signal });
        if (res.ok) {
            const data = await res.json();
            const list = document.getElementById('notifList');
            const count = document.getElementById('notifCount');
            
            if (data.notifications?.length > 0) {
                if (count) {
                    count.textContent = data.notifications.length;
                    count.classList.add('visible');
                }
                if (list) {
                    list.innerHTML = data.notifications.map(n => `
                        <div class="notif-item">
                            <span class="notif-icon">${n.icon || '💬'}</span>
                            <div class="notif-text">
                                <p>${escapeHtml(n.message)}</p>
                                <small>${n.time || 'Just now'}</small>
                            </div>
                        </div>
                    `).join('');
                }
            } else {
                if (list) {
                    list.innerHTML = '<p class="notif-empty">No notifications yet</p>';
                }
                if (count) {
                    count.classList.remove('visible');
                }
            }
        }
    } catch (e) {
        // Silent fail
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
