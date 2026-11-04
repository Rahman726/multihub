const express = require('express');
const path = require('path');
const app = express();
const PORT = 2000;

// Serve AI Chat page
app.get('/ai-chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'ai-chat', 'index.html'));
});

// SPA fallback
app.get('/ai-chat/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'ai-chat', 'index.html'));
});

// Hub root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch all
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`🤖 AI Chat: http://localhost:${PORT}/ai-chat`);
});