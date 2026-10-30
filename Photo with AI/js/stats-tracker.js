// ===================== STATS TRACKER =====================
// Tracks all important app events in localStorage for the admin dashboard
// Usage: trackEvent('ai_generated', { prompt: '...' })

const PHOTOSTORE_STATS_KEY = 'photostore_app_stats';

function getDefaultStats() {
    return {
        totalUsers: 0,
        totalAiGenerations: 0,
        totalGamesPlayed: 0,
        totalDownloads: 0,
        totalAppOpens: 0,
        lastReset: Date.now(),
        eventHistory: []
    };
}

function loadStats() {
    try {
        const data = localStorage.getItem(PHOTOSTORE_STATS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Merge with defaults to handle new keys
            const defaults = getDefaultStats();
            for (const key in defaults) {
                if (!(key in parsed)) parsed[key] = defaults[key];
            }
            return parsed;
        }
    } catch (e) {
        console.warn('Stats load failed:', e);
    }
    return getDefaultStats();
}

function saveStats(stats) {
    try {
        localStorage.setItem(PHOTOSTORE_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.warn('Stats save failed:', e);
    }
}

// Track any event type and increment its counter
function trackEvent(eventType, details = {}) {
    const stats = loadStats();

    switch (eventType) {
        case 'app_open':
            stats.totalAppOpens++;
            break;
        case 'user_signup':
            stats.totalUsers++;
            break;
        case 'ai_generated':
            stats.totalAiGenerations++;
            break;
        case 'game_played':
            stats.totalGamesPlayed++;
            break;
        case 'image_downloaded':
            stats.totalDownloads++;
            break;
        default:
            break;
    }

    // Keep last 100 events in history
    stats.eventHistory = stats.eventHistory || [];
    stats.eventHistory.unshift({
        type: eventType,
        timestamp: Date.now(),
        ...details
    });
    if (stats.eventHistory.length > 100) {
        stats.eventHistory.length = 100;
    }

    saveStats(stats);
    return stats;
}

// Get current stats (for admin dashboard)
function getStats() {
    return loadStats();
}

// Reset all stats (admin action)
function resetAllStats() {
    if (confirm('⚠️ Kya aap saare app stats reset karna chahte hain? Yeh wapas nahi aayenge!')) {
        saveStats(getDefaultStats());
        if (typeof showToast === 'function') showToast('📊 All stats reset!');
        return true;
    }
    return false;
}

// Track signups by intercepting user creation
function trackUserSignup(userName) {
    trackEvent('user_signup', { name: userName });
}

// Compute totals from local users (for accuracy)
function getLocalUserCount() {
    try {
        const localUsers = JSON.parse(localStorage.getItem('photoStoreLocalUsers') || '{}');
        return Object.keys(localUsers).length;
    } catch (e) {
        return 0;
    }
}

// Get total unique users who used the app
function getTotalUsers() {
    return getLocalUserCount();
}
