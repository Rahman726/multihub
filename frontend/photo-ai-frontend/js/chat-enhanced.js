// ===================== ENHANCED AI CHAT ASSISTANT =====================

let chatHistory = [];
let chatInitialized = false;

function initEnhancedChat() {
    if (chatInitialized) return;
    chatInitialized = true;

    // Add chat button to navbar
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const chatBtn = document.createElement('button');
        chatBtn.className = 'nav-chat-btn';
        chatBtn.id = 'chatToggleBtn';
        chatBtn.innerHTML = '💬 AI Chat';
        chatBtn.addEventListener('click', toggleChatPanel);
        navActions.insertBefore(chatBtn, navActions.querySelector('.nav-fav-toggle'));
    }

    // Create chat panel
    const chatPanel = document.createElement('div');
    chatPanel.className = 'chat-panel';
    chatPanel.id = 'chatPanel';
    chatPanel.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-info">
                <span class="chat-avatar">🤖</span>
                <div>
                    <strong>AI Assistant</strong>
                    <small>Ask me to generate images!</small>
                </div>
            </div>
            <button class="chat-close-btn" id="chatCloseBtn">✕</button>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="chat-message chat-bot">
                <div class="chat-bubble">
                    👋 Hi! I'm your AI assistant. Tell me what kind of image you want to create and I'll help you generate it!
                    <br><br>
                    <strong>Try saying:</strong>
                    <br>• "Create a sunset mountain landscape"
                    <br>• "Generate a cyberpunk city"
                    <br>• "Make a cute cat wizard"
                </div>
            </div>
        </div>
        <div class="chat-input-area">
            <div class="chat-suggestions" id="chatSuggestions">
                <button class="chat-chip" data-prompt="Create a beautiful sunset mountain landscape with golden light">🌅 Mountains</button>
                <button class="chat-chip" data-prompt="Generate a cyberpunk city with neon lights and flying cars">🌃 Cyberpunk</button>
                <button class="chat-chip" data-prompt="Make a cute fluffy cat wearing a wizard hat">🐱 Cat Wizard</button>
                <button class="chat-chip" data-prompt="Create an underwater city with glass domes and ancient ruins">🌊 Underwater</button>
            </div>
            <div class="chat-input-row">
                <input type="text" id="chatInput" placeholder="Describe the image you want..." autocomplete="off">
                <button id="chatSendBtn">➤</button>
            </div>
        </div>
    `;
    document.body.appendChild(chatPanel);

    // Event listeners
    document.getElementById('chatCloseBtn')?.addEventListener('click', toggleChatPanel);
    document.getElementById('chatSendBtn')?.addEventListener('click', sendChatMessage);
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Suggestion chips
    document.querySelectorAll('.chat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.getElementById('chatInput').value = chip.dataset.prompt;
            sendChatMessage();
        });
    });

    // Load chat history
    loadChatHistory();
}

function toggleChatPanel() {
    const panel = document.getElementById('chatPanel');
    const btn = document.getElementById('chatToggleBtn');
    if (!panel) return;

    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open');
    btn.classList.toggle('active');

    if (!isOpen) {
        setTimeout(() => {
            document.getElementById('chatInput')?.focus();
            scrollChatToBottom();
        }, 300);
    }
}

function scrollChatToBottom() {
    const messages = document.getElementById('chatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
}

function addChatMessage(text, isUser = false) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const div = document.createElement('div');
    div.className = `chat-message ${isUser ? 'chat-user' : 'chat-bot'}`;
    div.innerHTML = `<div class="chat-bubble">${text}</div>`;
    messages.appendChild(div);
    scrollChatToBottom();

    // Save to history
    chatHistory.push({ role: isUser ? 'user' : 'assistant', content: text });
    saveChatHistory();
}

function addTypingIndicator() {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const div = document.createElement('div');
    div.className = 'chat-message chat-bot';
    div.id = 'chatTyping';
    div.innerHTML = `<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(div);
    scrollChatToBottom();
}

function removeTypingIndicator() {
    const typing = document.getElementById('chatTyping');
    if (typing) typing.remove();
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    addChatMessage(message, true);

    // Check if user wants to generate an image
    const isGenerateRequest = /^(create|generate|make|draw|paint|show me|imagine)/i.test(message) || 
                              /image|picture|photo|art/i.test(message);

    if (isGenerateRequest) {
        addTypingIndicator();
        
        // Generate image
        try {
            const style = message.includes('anime') ? 'anime' : 
                         message.includes('sketch') ? 'sketch' : 'vivid';
            const aspect = '1024x1024';
            
            const imageUrl = generateImageUrl(message, style, aspect);
            
            setTimeout(() => {
                removeTypingIndicator();
                addChatMessage(`✨ Here's your image!<br><br>
                    <div class="chat-image-result" onclick="openAIChatImage('${imageUrl}', '${message.replace(/'/g, "\\'")}')">
                        <img src="${imageUrl}" alt="${message}" loading="lazy">
                        <div class="chat-image-actions">
                            <button onclick="event.stopPropagation();downloadChatImage('${imageUrl}')">⬇ Download</button>
                            <button onclick="event.stopPropagation();addChatImageToGallery('${imageUrl}', '${message.replace(/'/g, "\\'")}')">📂 Add to Gallery</button>
                        </div>
                    </div>
                    <br><small>Prompt: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"</small>
                `, false);
            }, 1500);
        } catch (e) {
            removeTypingIndicator();
            addChatMessage('❌ Sorry, I failed to generate the image. Please try again!');
        }
    } else {
        // Send to AI chat API
        addTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a helpful AI assistant for PhotoStore. Help users create amazing AI images. Be concise and friendly. If they ask for an image, tell them to use "create", "generate", or "make" followed by their description.' },
                        ...chatHistory.slice(-10)
                    ]
                })
            });

            if (response.ok) {
                const data = await response.json();
                removeTypingIndicator();
                const reply = data.reply || 'Sorry, I could not process that.';
                addChatMessage(reply, false);
            } else {
                throw new Error('Server error');
            }
        } catch (e) {
            removeTypingIndicator();
            addChatMessage('🤖 I\'m in offline mode! Try saying "create [description]" to generate an image directly!', false);
        }
    }
}

function openAIChatImage(url, prompt) {
    // Set AI modal with this image
    currentGeneratedImageUrl = url;
    lastPrompt = prompt;
    const img = document.getElementById('aiGeneratedImage');
    if (img) {
        img.src = url;
        document.getElementById('aiResult').style.display = 'block';
        document.getElementById('aiForm').style.display = 'none';
        document.getElementById('aiSuggestions').style.display = 'none';
    }
    
    // Open AI modal
    document.getElementById('aiOverlay').style.display = 'block';
    document.getElementById('aiModal').style.display = 'block';
    document.getElementById('aiModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function downloadChatImage(url) {
    fetch(url)
        .then(r => r.blob())
        .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ai-generated-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast('⬇ Image downloaded!');
        })
        .catch(() => showToast('❌ Failed to download', 'error'));
}

function addChatImageToGallery(url, prompt) {
    if (typeof currentGeneratedImageUrl !== 'undefined' && typeof aiAddToGalleryBtn !== 'undefined') {
        currentGeneratedImageUrl = url;
        lastPrompt = prompt;
        aiAddToGalleryBtn?.click();
    } else {
        showToast('Open AI Generator first to add to gallery', 'info');
    }
}

function saveChatHistory() {
    try {
        localStorage.setItem('photoStoreChatHistory', JSON.stringify(chatHistory.slice(-50)));
    } catch (e) {
        // Storage full - ignore
    }
}

function loadChatHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem('photoStoreChatHistory') || '[]');
        if (saved.length > 0) {
            chatHistory = saved;
        }
    } catch (e) {
        // Ignore
    }
}
