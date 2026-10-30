const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));

// PWA headers for service worker, cache control, and offline support
app.use((req, res, next) => {
    if (req.url === '/sw.js' || req.url === '/manifest.json') {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
});

app.use(express.static(__dirname, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
        if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|webp|avif)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
        }
        if (filePath.endsWith('.json') || filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// ===================== AI IMAGE GENERATION =====================

app.post('/api/ai/generate', async (req, res) => {
    try {
        const { prompt, style, aspect } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        let width = 1024, height = 1024;
        if (aspect) {
            const parts = aspect.split('x');
            if (parts.length === 2) {
                width = parseInt(parts[0]) || 1024;
                height = parseInt(parts[1]) || 1024;
            }
        }

        const encodedPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 999999);
        const model = 'flux';
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&enhance=true`;

        res.json({ success: true, imageUrl, prompt });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate image', details: error.message });
    }
});

// ===================== AI CHAT PROXY =====================

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'sk-1209e7c31f9143c8b713206a823188dc'}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                max_tokens: 2048,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: 'AI service error', details: errorText });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Sorry, no response generated.';
        res.json({ reply });
    } catch (error) {
        console.error('Chat proxy error:', error);
        res.status(500).json({ error: 'Chat service unavailable' });
    }
});

// ===================== SPA FALLBACK =====================

app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===================== EXPORT =====================

module.exports = app;

// Start the server if called directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`AI Server running on http://localhost:${PORT}`);
    });
}
