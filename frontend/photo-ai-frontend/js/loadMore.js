// ===================== LOAD MORE =====================
function initLoadMore() {
    let loadPage = 1;
    loadMoreBtn.addEventListener('click', () => {
        if (photos.length === 0) {
            showToast('No photos to load. Try generating an AI image first!', 'error');
            return;
        }
        loadPage++;
        // Generate variations with new random seeds so Pollinations returns different images
        const morePhotos = photos.map(p => ({
            ...p,
            id: p.id + (loadPage * 100),
            image: p.image.replace(/seed=\d+/, 'seed=' + Math.floor(Math.random() * 999999)),
            fullImage: p.fullImage.replace(/seed=\d+/, 'seed=' + Math.floor(Math.random() * 999999))
        })).sort(() => Math.random() - 0.5).slice(0, 12);
        renderGallery(morePhotos, true);
        showToast('Loaded more photos!');
    });
}
