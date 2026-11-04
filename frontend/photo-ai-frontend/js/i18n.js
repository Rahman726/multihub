// ===================== I18N / MULTI-LANGUAGE =====================
const translations = {
    en: {
        siteTitle: 'PhotoStore',
        tagline: 'The best free stock photos shared by talented creators.',
        search: 'Search for free photos',
        trending: 'Trending:',
        explore: 'Explore',
        collections: 'Collections',
        aiGenerate: '✨ AI Generate',
        login: 'Login',
        submit: 'Submit a photo',
        all: 'All',
        aiGenerated: '✨ AI Generated',
        noresults: 'No photos found',
        createTitle: 'Create Your Own Picture',
        favorites: 'My Favorites',
        noFavs: 'No favorites yet',
        download: 'Free download',
        share: 'Share',
        slideshow: 'Slideshow',
        comments: 'Comments',
        albums: 'Albums',
        dashboard: 'Dashboard',
        notifications: 'Notifications',
        profile: 'Profile'
    },
    hi: {
        siteTitle: 'फोटोस्टोर',
        tagline: 'प्रतिभाशाली रचनाकारों द्वारा साझा की गई सर्वश्रेष्ठ मुफ्त स्टॉक तस्वीरें।',
        search: 'मुफ्त फोटो खोजें',
        trending: 'ट्रेंडिंग:',
        explore: 'एक्सप्लोर',
        collections: 'संग्रह',
        aiGenerate: '✨ AI बनाएं',
        login: 'लॉगिन',
        submit: 'फोटो सबमिट करें',
        all: 'सभी',
        aiGenerated: '✨ AI जनरेटेड',
        noresults: 'कोई फोटो नहीं मिली',
        createTitle: 'अपनी खुद की तस्वीर बनाएं',
        favorites: 'पसंदीदा',
        noFavs: 'अभी तक कोई पसंदीदा नहीं',
        download: 'मुफ्त डाउनलोड',
        share: 'शेयर करें',
        slideshow: 'स्लाइडशो',
        comments: 'टिप्पणियाँ',
        albums: 'एल्बम',
        dashboard: 'डैशबोर्ड',
        notifications: 'सूचनाएं',
        profile: 'प्रोफाइल'
    },
    ur: {
        siteTitle: 'فوٹواسٹور',
        tagline: 'باصلاحیت تخلیق کاروں کے اشتراک کردہ بہترین مفت اسٹاک فوٹوز۔',
        search: 'مفت فوٹوز تلاش کریں',
        trending: 'ٹرینڈنگ:',
        explore: 'دریافت کریں',
        collections: 'مجموعے',
        aiGenerate: '✨ AI بنائیں',
        login: 'لاگ ان',
        submit: 'فوٹو جمع کروائیں',
        all: 'تمام',
        aiGenerated: '✨ AI تخلیق کردہ',
        noresults: 'کوئی فوٹو نہیں ملا',
        createTitle: 'اپنی خود کی تصویر بنائیں',
        favorites: 'پسندیدہ',
        noFavs: 'ابھی تک کوئی پسندیدہ نہیں',
        download: 'مفت ڈاؤن لوڈ',
        share: 'شیئر کریں',
        slideshow: 'سلائیڈ شو',
        comments: 'تبصرے',
        albums: 'البمز',
        dashboard: 'ڈیش بورڈ',
        notifications: 'اطلاعات',
        profile: 'پروفائل'
    }
};

let currentLang = localStorage.getItem('photoStoreLang') || 'en';

function initI18n() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-toggle';
    langBtn.id = 'langToggle';
    langBtn.textContent = currentLang === 'en' ? '🌐 EN' : currentLang === 'hi' ? '🌐 HI' : '🌐 UR';
    langBtn.title = 'Change language';
    
    const langMenu = document.createElement('div');
    langMenu.className = 'lang-menu';
    langMenu.id = 'langMenu';
    langMenu.innerHTML = `
        <button class="lang-option" data-lang="en">🇬🇧 English</button>
        <button class="lang-option" data-lang="hi">🇮🇳 हिन्दी</button>
        <button class="lang-option" data-lang="ur">🇵🇰 اردو</button>
    `;
    
    navActions.insertBefore(langBtn, navActions.firstChild);
    document.querySelector('.navbar .nav-container')?.appendChild(langMenu);
    
    langBtn.addEventListener('click', () => {
        langMenu.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lang-toggle') && !e.target.closest('.lang-menu')) {
            langMenu.classList.remove('open');
        }
    });
    
    langMenu.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            currentLang = opt.dataset.lang;
            localStorage.setItem('photoStoreLang', currentLang);
            langBtn.textContent = currentLang === 'en' ? '🌐 EN' : currentLang === 'hi' ? '🌐 HI' : '🌐 UR';
            langMenu.classList.remove('open');
            applyTranslations();
            showToast(`Language changed to ${opt.textContent.trim()}`);
        });
    });
    
    applyTranslations();
}

function t(key) {
    return translations[currentLang]?.[key] || translations.en[key] || key;
}

function applyTranslations() {
    // Dynamic text replacements
    const title = document.querySelector('.hero-title');
    if (title) title.textContent = t('tagline');
    
    const searchInputs = document.querySelectorAll('#heroSearchInput, #navSearchInput');
    searchInputs.forEach(inp => inp.placeholder = t('search'));
    
    const trendingLabel = document.querySelector('.trending-label');
    if (trendingLabel) trendingLabel.textContent = t('trending');
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && !currentUser) loginBtn.textContent = t('login');
    
    const aiBtn = document.getElementById('aiGenerateBtn');
    if (aiBtn) aiBtn.textContent = t('aiGenerate');
    
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(f => {
        if (f.dataset.category === 'all') f.textContent = t('all');
        if (f.dataset.category === 'ai') f.textContent = t('aiGenerated');
    });
    
    // Change document title
    document.title = t('siteTitle') + ' — ' + t('tagline').substring(0, 40);
}
