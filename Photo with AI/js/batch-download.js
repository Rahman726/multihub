// ===================== BATCH DOWNLOAD =====================

function initBatchDownload() {
    const gallerySection = document.querySelector('.gallery-section .container');
    if (!gallerySection) return;
    
    // Create batch download bar
    const batchBar = document.createElement('div');
    batchBar.className = 'batch-bar';
    batchBar.id = 'batchBar';
    batchBar.style.display = 'none';
    batchBar.innerHTML = `
        <span class="batch-count" id="batchCount">0 selected</span>
        <button class="batch-download-btn" id="batchDownloadBtn">⬇️ Download Selected</button>
        <button class="batch-clear-btn" id="batchClearBtn">✕ Clear</button>
    `;
    gallerySection.insertBefore(batchBar, document.getElementById('masonryGrid'));
    
    let selectedBatch = new Set();
    
    // Add batch select capability to photo items
    function addBatchCheckboxes() {
        document.querySelectorAll('.photo-item').forEach(item => {
            if (item.dataset.batchInit) return;
            item.dataset.batchInit = 'true';
            
            const checkbox = document.createElement('div');
            checkbox.className = 'batch-checkbox';
            checkbox.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                const img = item.querySelector('img');
                const src = img?.src || '';
                const alt = img?.alt || 'photo';
                
                if (selectedBatch.has(src)) {
                    selectedBatch.delete(src);
                    item.classList.remove('batch-selected');
                } else {
                    selectedBatch.add(src);
                    item.classList.add('batch-selected');
                }
                
                updateBatchUI();
            });
            
            item.prepend(checkbox);
        });
    }
    
    // Watch for new photos
    const observer = new MutationObserver(addBatchCheckboxes);
    observer.observe(document.getElementById('masonryGrid'), { childList: true, subtree: true });
    
    // Initial setup
    setTimeout(addBatchCheckboxes, 500);
    
    function updateBatchUI() {
        const count = selectedBatch.size;
        document.getElementById('batchCount').textContent = `${count} selected`;
        document.getElementById('batchBar').style.display = count > 0 ? 'flex' : 'none';
    }
    
    document.getElementById('batchDownloadBtn')?.addEventListener('click', async () => {
        if (selectedBatch.size === 0) return;
        
        showToast(`Downloading ${selectedBatch.size} photos...`);
        
        // Download each photo individually (browser opens multiple tabs)
        selectedBatch.forEach((url, idx) => {
            setTimeout(() => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `photo-${idx+1}-${Date.now()}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }, idx * 500);
        });
        
        selectedBatch.clear();
        document.querySelectorAll('.photo-item.batch-selected').forEach(item => item.classList.remove('batch-selected'));
        updateBatchUI();
        showToast(`Downloading ${selectedBatch.size > 0 ? 'remaining' : 'all'} photos...`);
    });
    
    document.getElementById('batchClearBtn')?.addEventListener('click', () => {
        selectedBatch.clear();
        document.querySelectorAll('.photo-item.batch-selected').forEach(item => item.classList.remove('batch-selected'));
        updateBatchUI();
    });
}
