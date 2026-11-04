// ===================== DOM =====================
const heroSearchInput = document.getElementById('heroSearchInput');
const heroSearchBtn = document.getElementById('heroSearchBtn');
const navSearchInput = document.getElementById('navSearchInput');
const navSearchBtn = document.getElementById('navSearchBtn');

// ===================== SEARCH =====================
function initHeroSearch() {
    heroSearchBtn.addEventListener('click', doSearch);
    heroSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
}

function initNavSearch() {
    navSearchBtn.addEventListener('click', doNavSearch);
    navSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doNavSearch(); });
}

function doSearch() {
    searchQuery = heroSearchInput.value.trim();
    navSearchInput.value = searchQuery;
    applyFilters();
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
}

function doNavSearch() {
    searchQuery = navSearchInput.value.trim();
    heroSearchInput.value = searchQuery;
    applyFilters();
    window.scrollTo({ top: document.getElementById('gallery').offsetTop - 130, behavior: 'smooth' });
}
