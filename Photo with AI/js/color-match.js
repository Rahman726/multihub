// ===================== AUTO COLOR MATCH =====================

function initColorMatch() {
    // Color match feature is currently disabled (upload removed)
}

function getDominantColor(img) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 100, 100);
    
    const imageData = ctx.getImageData(0, 0, 100, 100);
    const data = imageData.data;
    
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }
    
    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
    };
}

function colorToCategory(color) {
    const { r, g, b } = color;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max > 0 ? (max - min) / max : 0;
    
    if (g > r && g > b && g > 80) return 'nature';
    if (b > r && b > g && b > 80) return r > 100 ? 'travel' : 'abstract';
    if (r > g && r > b && r > 100) {
        if (g > 60) return 'food';
        return 'fashion';
    }
    if (saturation < 0.3) return 'architecture';
    if ((r + g + b) / 3 > 200) return 'abstract';
    return 'other';
}
