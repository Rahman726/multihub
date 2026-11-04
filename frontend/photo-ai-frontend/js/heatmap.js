// ===================== HEATMAP ANALYTICS =====================

function initHeatmap() {
    // Track time-based views
    const viewData = JSON.parse(localStorage.getItem('photoStoreHeatmap') || '{}');
    
    // Record visit
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const key = `${day}-${hour}`;
    viewData[key] = (viewData[key] || 0) + 1;
    localStorage.setItem('photoStoreHeatmap', JSON.stringify(viewData));
    
    // Add heatmap to dashboard
    const dashGrid = document.getElementById('dashGrid');
    if (!dashGrid) return;
    
    const heatmapCard = document.createElement('div');
    heatmapCard.className = 'dash-card heatmap-card';
    heatmapCard.id = 'heatmapCard';
    heatmapCard.innerHTML = `
        <div class="dash-icon">📊</div>
        <div class="heatmap-grid" id="heatmapGrid"></div>
        <div class="dash-label">Activity Heatmap</div>
    `;
    dashGrid.appendChild(heatmapCard);
    
    renderHeatmap(viewData);
}

function renderHeatmap(data) {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({length: 24}, (_, i) => i);
    
    let maxVal = 0;
    Object.values(data).forEach(v => { if (v > maxVal) maxVal = v; });
    
    let html = '<div class="heatmap-header"><span></span>';
    hours.forEach(h => {
        html += `<span class="heatmap-hour-label">${h}h</span>`;
    });
    html += '</div>';
    
    days.forEach((day, di) => {
        html += `<div class="heatmap-row"><span class="heatmap-day-label">${day}</span>`;
        hours.forEach(hi => {
            const key = `${di}-${hi}`;
            const val = data[key] || 0;
            const intensity = maxVal > 0 ? Math.round((val / maxVal) * 4) : 0;
            html += `<div class="heatmap-cell heatmap-cell-${intensity}" title="${day} ${hi}:00 — ${val} visits"></div>`;
        });
        html += '</div>';
    });
    
    grid.innerHTML = html;
    
    // Add legend
    const legend = document.createElement('div');
    legend.className = 'heatmap-legend';
    legend.innerHTML = `
        <span>Less</span>
        <div class="heatmap-cell heatmap-cell-0"></div>
        <div class="heatmap-cell heatmap-cell-1"></div>
        <div class="heatmap-cell heatmap-cell-2"></div>
        <div class="heatmap-cell heatmap-cell-3"></div>
        <div class="heatmap-cell heatmap-cell-4"></div>
        <span>More</span>
    `;
    grid.appendChild(legend);
}
