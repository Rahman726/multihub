// ===================== FILTERS =====================
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.category;
            applyFilters();
        });
    });
}

function applyFilters() {
    // Combine server photos AND infinite scroll photos so uploads don't lose picsum photos
    let result = [...photos, ...(window.infinitePhotos || [])];
    if (currentFilter !== 'all') {
        result = result.filter(p => p.category === currentFilter);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.artist.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }
    renderGallery(result);
}
