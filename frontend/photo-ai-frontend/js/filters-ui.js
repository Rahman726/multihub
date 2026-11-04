// ===================== INSTAGRAM-STYLE FILTERS =====================

const photoFilters = {
    none: { name: 'Normal', filter: '' },
    clarendon: { name: 'Clarendon', filter: 'brightness(1.1) contrast(1.15) saturate(1.2)' },
    gingham: { name: 'Gingham', filter: 'brightness(1.05) contrast(0.9) saturate(0.8) sepia(0.05)' },
    valencia: { name: 'Valencia', filter: 'brightness(1.08) contrast(1.05) sepia(0.08) saturate(1.1)' },
    xpro2: { name: 'X-Pro II', filter: 'brightness(1.1) contrast(1.2) saturate(1.3) sepia(0.1)' },
    lark: { name: 'Lark', filter: 'brightness(1.1) contrast(0.95) saturate(1.1)' },
    reyes: { name: 'Reyes', filter: 'brightness(0.95) contrast(0.85) saturate(0.7) sepia(0.15)' },
    juno: { name: 'Juno', filter: 'brightness(1.05) contrast(1.05) saturate(1.3) hue-rotate(-10deg)' },
    slumber: { name: 'Slumber', filter: 'brightness(0.95) contrast(0.9) saturate(0.7) hue-rotate(190deg)' },
    crema: { name: 'Crema', filter: 'brightness(1.05) contrast(0.95) sepia(0.1) saturate(0.85)' },
    ludwig: { name: 'Ludwig', filter: 'brightness(1.05) contrast(1.05) saturate(0.9)' },
    aden: { name: 'Aden', filter: 'brightness(1.05) contrast(0.9) saturate(0.85) hue-rotate(330deg)' },
    perpetua: { name: 'Perpetua', filter: 'brightness(1.05) contrast(1.05) saturate(1.1) sepia(0.05)' },
    amaro: { name: 'Amaro', filter: 'brightness(1.1) contrast(0.95) saturate(1.1) sepia(0.05)' },
    mayfair: { name: 'Mayfair', filter: 'brightness(1.05) contrast(1.05) saturate(1.1) hue-rotate(-5deg)' },
    rise: { name: 'Rise', filter: 'brightness(1.1) contrast(0.9) saturate(1.05) sepia(0.05)' },
    hudson: { name: 'Hudson', filter: 'brightness(1.1) contrast(1.1) saturate(1.1) hue-rotate(190deg)' }
};

let currentPhotoFilter = 'none';

function initPhotoFilters() {
    // Add filter toggle button to lightbox
    const lightboxActions = document.querySelector('.lightbox-actions');
    if (!lightboxActions) return;
    
    const filterBtn = document.createElement('button');
    filterBtn.className = 'lightbox-action-btn filter-btn-toggle';
    filterBtn.id = 'filterToggleBtn';
    filterBtn.innerHTML = '🎨 Filter';
    
    lightboxActions.insertBefore(filterBtn, lightboxActions.firstChild);
    
    // Filter picker dropdown
    const filterPicker = document.createElement('div');
    filterPicker.className = 'filter-picker';
    filterPicker.id = 'filterPicker';
    filterPicker.style.display = 'none';
    
    let filterHtml = '<div class="filter-picker-header"><h4>Choose Filter</h4></div><div class="filter-picker-grid">';
    Object.entries(photoFilters).forEach(([key, val]) => {
        filterHtml += `<button class="filter-picker-btn ${key === 'none' ? 'active' : ''}" data-filter="${key}">${val.name}</button>`;
    });
    filterHtml += '</div>';
    filterPicker.innerHTML = filterHtml;
    
    document.querySelector('.lightbox-content')?.appendChild(filterPicker);
    
    filterBtn.addEventListener('click', () => {
        filterPicker.style.display = filterPicker.style.display === 'none' ? 'block' : 'none';
    });
    
    filterPicker.querySelectorAll('.filter-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterName = btn.dataset.filter;
            currentPhotoFilter = filterName;
            
            filterPicker.querySelectorAll('.filter-picker-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const lbImg = document.getElementById('lightboxImage');
            if (lbImg) {
                const filterVal = photoFilters[filterName]?.filter || '';
                lbImg.style.filter = filterVal;
            }
            
            filterPicker.style.display = 'none';
            showToast(`Filter: ${photoFilters[filterName]?.name || 'Normal'} applied`);
        });
    });
    
    // Close filter picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-picker') && !e.target.closest('.filter-btn-toggle')) {
            filterPicker.style.display = 'none';
        }
    });
}
