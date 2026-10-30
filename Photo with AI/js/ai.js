// ===================== AI IMAGE GENERATION =====================

const aiOverlay = document.getElementById('aiOverlay');
const aiModal = document.getElementById('aiModal');
const aiGenerateBtn = document.getElementById('aiGenerateBtn');
const aiClose = document.getElementById('aiClose');
const aiForm = document.getElementById('aiForm');
const aiPrompt = document.getElementById('aiPrompt');
const aiStyle = document.getElementById('aiStyle');
const aiAspect = document.getElementById('aiAspect');
const aiSubmitBtn = document.getElementById('aiSubmitBtn');
const aiResult = document.getElementById('aiResult');
const aiGeneratedImage = document.getElementById('aiGeneratedImage');
const aiDownloadBtn = document.getElementById('aiDownloadBtn');
const aiCreateNewBtn = document.getElementById('aiCreateNewBtn');
const aiAddToGalleryBtn = document.getElementById('aiAddToGalleryBtn');
const aiCharCount = document.getElementById('aiCharCount');
const aiSuggestions = document.getElementById('aiSuggestions');
const suggestionChips = document.querySelectorAll('.ai-chip');

let currentGeneratedImageUrl = null;
let lastPrompt = '';
let lastStyle = 'vivid';
let lastAspect = '1024x1024';

// Character count
if (aiPrompt) {
    aiPrompt.addEventListener('input', () => {
        const count = aiPrompt.value.length;
        aiCharCount.textContent = count;
    });
}

// Suggestion chips
suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
        aiPrompt.value = chip.dataset.prompt;
        aiPrompt.dispatchEvent(new Event('input'));
        aiPrompt.focus();
    });
});

// Open AI Modal
aiGenerateBtn.addEventListener('click', () => {
    aiOverlay.style.display = 'block';
    aiModal.style.display = 'block';
    aiModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => aiPrompt.focus(), 300);
});

// Close AI Modal
function closeAIModal() {
    aiOverlay.style.display = 'none';
    aiModal.style.display = 'none';
    aiModal.classList.remove('open');
    document.body.style.overflow = '';
    aiResult.style.display = 'none';
    aiForm.style.display = 'flex';
    aiSuggestions.style.display = '';
}

aiClose.addEventListener('click', closeAIModal);
aiOverlay.addEventListener('click', closeAIModal);

// Handle AI Image Generation
// Generate Pollinations.ai URL directly on the client (no server needed!)
function generateImageUrl(prompt, style, aspect) {
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);
    
    // Parse aspect ratio
    let width = 1024, height = 1024;
    if (aspect) {
        const parts = aspect.split('x');
        if (parts.length === 2) {
            width = parseInt(parts[0]) || 1024;
            height = parseInt(parts[1]) || 1024;
        }
    }
    
    // Style-specific model selection
    let model = 'flux';
    if (style === 'anime') model = 'flux';
    else if (style === 'sketch') model = 'flux';
    
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&enhance=true`;
}

aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prompt = aiPrompt.value.trim();
    const style = aiStyle.value;
    const aspect = aiAspect.value;

    if (!prompt) {
        showToast('Please enter a prompt');
        return;
    }

    lastPrompt = prompt;
    lastStyle = style;
    lastAspect = aspect;

    aiSubmitBtn.disabled = true;
    aiSubmitBtn.classList.add('loading');
    aiResult.style.display = 'none';

    try {
        // Try server first for better features
        let imageUrl = null;
        let serverOffline = false;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, style, aspect }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.imageUrl) {
                    imageUrl = data.imageUrl;
                }
            }
        } catch (serverErr) {
            serverOffline = true;
            console.log('Server offline for AI, using client-side generation:', serverErr.message);
        }
        
        // If server failed, generate URL directly (no server needed!)
        if (!imageUrl) {
            imageUrl = generateImageUrl(prompt, style, aspect);
            if (serverOffline) {
                showToast('✨ Generating (offline mode)...');
            }
        }
        
        if (imageUrl) {
            currentGeneratedImageUrl = imageUrl;
            aiGeneratedImage.src = imageUrl;
            aiResult.style.display = 'block';
            aiForm.style.display = 'none';
            aiSuggestions.style.display = 'none';
            showToast('✨ Image generated!');
            
            // Track AI generation
            if (typeof trackEvent === 'function') {
                trackEvent('ai_generated', { prompt, style });
            }
        } else {
            showToast('Failed to generate image');
        }
    } catch (error) {
        console.error('AI Error:', error);
        
        // Last resort: generate URL directly
        try {
            const fallbackUrl = generateImageUrl(prompt, style, aspect);
            currentGeneratedImageUrl = fallbackUrl;
            aiGeneratedImage.src = fallbackUrl;
            aiResult.style.display = 'block';
            aiForm.style.display = 'none';
            aiSuggestions.style.display = 'none';
            showToast('✨ Image generated (direct mode)!');
            
            // Track AI generation (fallback path)
            if (typeof trackEvent === 'function') {
                trackEvent('ai_generated', { prompt, style });
            }
        } catch (e2) {
            showToast('Failed to generate image. Try again.');
        }
    } finally {
        aiSubmitBtn.disabled = false;
        aiSubmitBtn.classList.remove('loading');
    }
});

// Download
aiDownloadBtn.addEventListener('click', async () => {
    if (!currentGeneratedImageUrl) return;
    try {
        const response = await fetch(currentGeneratedImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-generated-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Image downloaded!', 'success');
    } catch (error) {
        showToast('Failed to download image', 'error');
    }
});

// Create New — back to form
aiCreateNewBtn.addEventListener('click', () => {
    aiForm.style.display = 'flex';
    aiResult.style.display = 'none';
    aiPrompt.value = '';
    aiStyle.value = 'vivid';
    aiAspect.value = '1024x1024';
    aiSuggestions.style.display = '';
    aiPrompt.dispatchEvent(new Event('input'));
});

// Add to Gallery — save to shared gallery
function calcAspect(aspect) {
    if (!aspect) return 'square';
    const parts = aspect.split('x');
    if (parts.length === 2) {
        const w = parseInt(parts[0]), h = parseInt(parts[1]);
        if (w > h) return 'landscape';
        if (h > w) return 'portrait';
    }
    return 'square';
}

function addToGalleryAndRender(photoData) {
    photos.unshift(photoData);
    const allPhotos = [...photos, ...(window.infinitePhotos || [])];
    renderGallery(allPhotos);
}

aiAddToGalleryBtn.addEventListener('click', async function() {
    if (!currentGeneratedImageUrl) {
        showToast('No image to add', 'error');
        return;
    }
    
    const originalText = aiAddToGalleryBtn.textContent;
    aiAddToGalleryBtn.disabled = true;
    aiAddToGalleryBtn.textContent = '⏳ Saving...';
    
    let artistName = 'AI Artist';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.name) {
        artistName = currentUser.name;
    }
    
    const photoId = Date.now() + Math.floor(Math.random() * 1000);
    
    const photoData = {
        id: photoId,
        title: lastPrompt || 'AI Generated Image',
        artist: artistName,
        category: 'ai',
        aspect: calcAspect(lastAspect),
        image: currentGeneratedImageUrl,
        fullImage: currentGeneratedImageUrl,
        placeholderColor: '#8e44ad'
    };
    
    try {
        const response = await fetch('/api/photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photoData)
        });
        
        if (response.ok) {
            addToGalleryAndRender(photoData);
            showToast('✅ Added to gallery!', 'success');
        } else {
            try {
                const errData = await response.json();
                showToast(errData.error || 'Failed to save', 'error');
            } catch(e) {
                showToast('Server error', 'error');
            }
        }
    } catch (error) {
        console.error('Add to Gallery error:', error);
        showToast('Saved locally (offline)', 'info');
        addToGalleryAndRender(photoData);
    }
    
    aiAddToGalleryBtn.disabled = false;
    aiAddToGalleryBtn.textContent = originalText;
});
