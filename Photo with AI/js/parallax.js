// ===================== PARALLAX SCROLLING =====================

function initParallax() {
    const gallerySection = document.querySelector('.gallery-section');
    if (!gallerySection) return;
    
    // Use only scroll listener with requestAnimationFrame for smooth parallax
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                document.querySelectorAll('.photo-item').forEach(item => {
                    const img = item.querySelector('img');
                    const rect = item.getBoundingClientRect();
                    if (img && rect.top < window.innerHeight + 100 && rect.bottom > -100) {
                        const speed = 0.04;
                        const centerOffset = (rect.top + rect.height/2 - window.innerHeight/2) * speed;
                        const offset = Math.min(20, Math.max(-20, centerOffset));
                        img.style.transform = `translateY(${offset}px) scale(1.02)`;
                    }
                });
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Initial trigger for items already visible
    window.dispatchEvent(new Event('scroll'));
}
