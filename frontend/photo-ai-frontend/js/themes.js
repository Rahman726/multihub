// ===================== SEASONAL THEMES =====================

const themes = {
    christmas: {
        name: 'Christmas 🎄',
        start: { month: 12, day: 20 },
        end: { month: 12, day: 31 },
        colors: {
            accent: '#e74c3c',
            accentHover: '#c0392b',
            accentLight: 'rgba(231, 76, 60, 0.1)',
            secondary: '#27ae60'
        },
        message: '🎄 Merry Christmas!'
    },
    diwali: {
        name: 'Diwali 🪔',
        start: { month: 10, day: 28 },
        end: { month: 11, day: 5 },
        colors: {
            accent: '#f39c12',
            accentHover: '#e67e22',
            accentLight: 'rgba(243, 156, 18, 0.1)',
            secondary: '#e74c3c'
        },
        message: '🪔 Happy Diwali!'
    },
    eid: {
        name: 'Eid 🌙',
        start: { month: 3, day: 29 },
        end: { month: 4, day: 2 },
        colors: {
            accent: '#2ecc71',
            accentHover: '#27ae60',
            accentLight: 'rgba(46, 204, 113, 0.1)',
            secondary: '#3498db'
        },
        message: '🌙 Eid Mubarak!'
    },
    newyear: {
        name: 'New Year 🎆',
        start: { month: 12, day: 30 },
        end: { month: 1, day: 2 },
        colors: {
            accent: '#9b59b6',
            accentHover: '#8e44ad',
            accentLight: 'rgba(155, 89, 182, 0.1)',
            secondary: '#f1c40f'
        },
        message: '🎆 Happy New Year!'
    }
};

function initThemes() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    let activeTheme = null;
    
    for (const [, theme] of Object.entries(themes)) {
        const start = theme.start;
        const end = theme.end;
        
        // Handle cross-year themes (e.g., Dec 30 - Jan 2)
        if (start.month <= end.month || (start.month === 12 && end.month === 1)) {
            if (currentMonth === start.month && currentDay >= start.day) {
                activeTheme = theme;
                break;
            }
            if (currentMonth === end.month && currentDay <= end.day) {
                activeTheme = theme;
                break;
            }
            // Cross-year check
            if (start.month === 12 && currentMonth === 12 && currentDay >= start.day) {
                activeTheme = theme;
                break;
            }
            if (end.month === 1 && currentMonth === 1 && currentDay <= end.day) {
                activeTheme = theme;
                break;
            }
        } else {
            if (currentMonth > start.month || (currentMonth === start.month && currentDay >= start.day)) {
                if (currentMonth < end.month || (currentMonth === end.month && currentDay <= end.day)) {
                    activeTheme = theme;
                    break;
                }
            }
        }
    }
    
    if (activeTheme) {
        const root = document.documentElement;
        root.style.setProperty('--accent', activeTheme.colors.accent);
        root.style.setProperty('--accent-hover', activeTheme.colors.accentHover);
        root.style.setProperty('--accent-light', activeTheme.colors.accentLight);
        
        // Show theme banner
        const banner = document.createElement('div');
        banner.className = 'theme-banner';
        banner.textContent = activeTheme.message;
        document.body.prepend(banner);
        
        // Also show toast
        setTimeout(() => {
            showToast(activeTheme.message);
        }, 1000);
    }
}
