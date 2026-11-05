const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 2000;

// Middleware
app.use(cors());
app.use(express.json());

// Disable caching for development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ===================== HUB AUTHENTICATION =====================
// Use the QuizAI backend for authentication
const QUIZ_BACKEND_URL = 'http://127.0.0.1:8000';

// Photo with AI backend
const PHOTO_AI_BACKEND_URL = 'http://127.0.0.1:9001';

// Proxy auth requests to QuizAI backend
app.post('/api/login', async (req, res) => {
    try {
        const response = await fetch(`${QUIZ_BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const response = await fetch(`${QUIZ_BACKEND_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

// Proxy all Quiz API requests to QuizAI backend
app.all('/api/quiz*', async (req, res) => {
    try {
        const url = `${QUIZ_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}) },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

app.all('/api/answer*', async (req, res) => {
    try {
        const url = `${QUIZ_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}) },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

app.all('/api/leaderboard*', async (req, res) => {
    try {
        const url = `${QUIZ_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}) },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

app.all('/api/results*', async (req, res) => {
    try {
        const url = `${QUIZ_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}) },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

app.all('/api/me*', async (req, res) => {
    try {
        const url = `${QUIZ_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}) },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

app.all('/api/history*', async (req, res) => {
    try {
        const url = `${QUIZ_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}) },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ detail: 'Connection error' });
    }
});

// ===================== PHOTO WITH AI API PROXY =====================
// Proxy Photo with AI API requests
app.all('/api/ai/generate', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}/api/ai/generate`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/chat', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}/api/chat`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/photos', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}/api/photos`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/tags/*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/ratings/*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/comments/*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/albums*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/notifications*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/views/*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/auth/*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

app.all('/api/user/*', async (req, res) => {
    try {
        const url = `${PHOTO_AI_BACKEND_URL}${req.originalUrl}`;
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Connection error' });
    }
});

// Quiz App at /quiz/
app.use('/quiz', express.static(path.join(__dirname, 'frontend', 'speedy-quiz-frontend'), {
    index: 'index.html'
}));

// Quran App at /quran/
app.use('/quran', express.static(path.join(__dirname, 'frontend', 'quran-frontend'), {
    index: 'index.html'
}));

// Photo Store at /photostore/
app.use('/photostore', express.static(path.join(__dirname, 'frontend', 'photo-store-frontend'), {
    index: 'index.html'
}));

// Photo With AI at /photoai/
app.use('/photoai', express.static(path.join(__dirname, 'frontend', 'photo-ai-frontend'), {
    index: false // Disable automatic index serving
}));

// Serve hub-specific index.html for Photo AI (no PWA)
app.get('/photoai', (req, res) => {
    res.sendFile(path.join(__dirname, 'Photo with AI', 'index-hub.html'));
});

// AI Chat at /ai-chat/ (uses Ollama local AI)
app.use('/ai-chat', express.static(path.join(__dirname, 'frontend', 'ai-chat')));

// SPA fallback for AI Chat
app.get('/ai-chat/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'ai-chat', 'index.html'));
});

// SPA fallback for each app
app.get('/quiz/*', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'speedy-quiz', 'index.html')));
app.get('/quran/*', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'quran-frontend', 'index.html')));
app.get('/photostore/*', (req, res) => res.sendFile(path.join(__dirname, 'photo store', 'index.html')));
app.get('/photoai/*', (req, res) => res.sendFile(path.join(__dirname, 'Photo with AI', 'index.html')));

// Hub (root) - the main app selector - now AFTER app routes so they take priority
app.use(express.static(__dirname, {
    index: 'index.html'
}));

// SPA fallback for hub (root) - must be after all other routes
app.get('*', (req, res) => {
    // If it's an API request, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    // Otherwise serve the hub index.html
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===================== START QUIZ BACKEND =====================
// Start the Python QuizAI backend on port 8000
let quizBackendProcess;

function startQuizBackend() {
    console.log('Starting QuizAI backend on port 8000...');
    quizBackendProcess = spawn('python', ['main.py'], {
        cwd: path.join(__dirname, 'backend'),
        shell: true
    });

    quizBackendProcess.stdout.on('data', (data) => {
        console.log(`[Quiz Backend] ${data}`);
    });

    quizBackendProcess.stderr.on('data', (data) => {
        console.error(`[Quiz Backend Error] ${data}`);
    });

    quizBackendProcess.on('close', (code) => {
        console.log(`[Quiz Backend] exited with code ${code}`);
    });
}

// ===================== START PHOTO WITH AI BACKEND =====================
// Start the Photo with AI backend on port 9002
let photoAIProcess;

function startPhotoAIBackend() {
    console.log('Starting Photo with AI backend on port 9002...');
    photoAIProcess = spawn('node', ['ai-server/server.js'], {
        cwd: path.join(__dirname, 'Photo with AI'),
        shell: true
    });

    photoAIProcess.stdout.on('data', (data) => {
        console.log(`[Photo AI Backend] ${data}`);
    });

    photoAIProcess.stderr.on('data', (data) => {
        console.error(`[Photo AI Backend Error] ${data}`);
    });

    photoAIProcess.on('close', (code) => {
        console.log(`[Photo AI Backend] exited with code ${code}`);
    });
}

// ===================== START SERVER =====================
if (require.main === module) {
    // Start QuizAI backend
    startQuizBackend();

    // Start Photo with AI backend
    startPhotoAIBackend();

    // Start Hub server
    app.listen(PORT, () => {
        console.log(`🚀 App Hub running on http://localhost:${PORT}`);
        console.log(`📂 Hub: http://localhost:${PORT}/`);
        console.log(`⚡ Quiz: http://localhost:${PORT}/quiz/`);
        console.log(`🕌 Quran: http://localhost:${PORT}/quran/`);
        console.log(`📸 Photo Store: http://localhost:${PORT}/photostore/`);
        console.log(`✨ Photo with AI: http://localhost:${PORT}/photoai/`);
    });

    // Cleanup on exit
    process.on('SIGINT', () => {
        if (quizBackendProcess) {
            quizBackendProcess.kill();
        }
        if (photoAIProcess) {
            photoAIProcess.kill();
        }
        process.exit(0);
    });
}

module.exports = app;
