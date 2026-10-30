// ===================== TRENDING TAGS =====================
function initTrendingTags() {
    document.querySelectorAll('.trending-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.dataset.query;
            heroSearchInput.value = query;
            navSearchInput.value = query;
            searchQuery = query;
            // Set matching filter
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.category === query);
            });
            currentFilter = query;
            applyFilters();
            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
        });
    });
}
