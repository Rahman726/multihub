const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const db = require('./js/db');

const app = express();
const PORT = process.env.PORT || 9000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-1209e7c31f9143c8b713206a823188dc';

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

// ===================== DATA LAYER =====================

// In-memory data — loaded from MongoDB or JSON files on startup
let sharedPhotos = [];
let users = [];
let photoTags = {};
let photoRatings = {};
let photoComments = {};
let albums = [];
let userNotifications = [];
let photoViews = {};

// Debounced save helper — shorter delay for serverless
const _saveTimers = {};
function debouncedSave(collection, data, delay = 200) {
    const key = collection;
    if (_saveTimers[key]) clearTimeout(_saveTimers[key]);
    _saveTimers[key] = setTimeout(async () => {
        await db.replaceAll(collection, data);
    }, delay);
}

// Load all data on startup
async function loadAllData() {
    try {
        sharedPhotos = await db.findAll('photos') || [];
    } catch (e) { sharedPhotos = db.loadJSON('photos'); }

    try {
        users = await db.findAll('users') || [];
    } catch (e) { users = db.loadJSON('users'); }

    try {
        const tags = await db.findAll('tags');
        photoTags = Array.isArray(tags) ? tags[0]?.data || {} : {};
    } catch (e) { photoTags = db.loadJSON('tags'); }

    try {
        const ratings = await db.findAll('ratings');
        photoRatings = Array.isArray(ratings) ? ratings[0]?.data || {} : {};
    } catch (e) { photoRatings = db.loadJSON('ratings'); }

    try {
        const comments = await db.findAll('comments');
        photoComments = Array.isArray(comments) ? comments[0]?.data || {} : {};
    } catch (e) { photoComments = db.loadJSON('comments'); }

    try {
        albums = await db.findAll('albums') || [];
    } catch (e) { albums = db.loadJSON('albums'); }

    try {
        const notifs = await db.findAll('notifications');
        userNotifications = Array.isArray(notifs) ? notifs : [];
    } catch (e) { userNotifications = db.loadJSON('notifications'); }

    try {
        const views = await db.findAll('views');
        photoViews = Array.isArray(views) ? views[0]?.data || {} : {};
    } catch (e) { photoViews = db.loadJSON('views'); }

    console.log(`Loaded data: ${users.length} users, ${sharedPhotos.length} photos, ${albums.length} albums`);
}

// Flush pending saves on shutdown
async function flushPendingSaves() {
    Object.keys(_saveTimers).forEach(key => {
        clearTimeout(_saveTimers[key]);
        delete _saveTimers[key];
    });

    await db.replaceAll('photos', sharedPhotos);
    await db.replaceAll('users', users);
    await db.replaceAll('tags', [{ _id: 'tags', data: photoTags }]);
    await db.replaceAll('ratings', [{ _id: 'ratings', data: photoRatings }]);
    await db.replaceAll('comments', [{ _id: 'comments', data: photoComments }]);
    await db.replaceAll('albums', albums);
    await db.replaceAll('notifications', userNotifications);
    await db.replaceAll('views', [{ _id: 'views', data: photoViews }]);
    console.log('All data flushed.');
}

// Helper function to generate token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// ===================== STARTUP =====================

// Connect to MongoDB and load data before starting
let serverStarted = false;

async function startServer() {
    if (serverStarted) return; // Prevent double start in serverless
    serverStarted = true;

    if (!db.isConnected()) {
        await db.connect();
    }
    await loadAllData();

    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Database: ${db.isConnected() ? 'MongoDB Atlas' : 'JSON files (local)'}`);
        });
    }
}

// ===================== AUTH ROUTES =====================

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const randomId = Date.now() + Math.random().toString(36).slice(2, 6);
        const email = `user-${randomId}@photostore.app`;
        const generatedPassword = Math.random().toString(36).slice(2, 12);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const user = {
            id: Date.now(),
            name: name.trim(),
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        debouncedSave('users', users);

        const token = generateToken(user);

        res.status(201).json({
            message: 'Welcome!',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || email.split('@')[0];

        let user = users.find(u => u.googleId === googleId || u.email === email);

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
            }
        } else {
            user = {
                id: Date.now(),
                name,
                email,
                googleId,
                password: '',
                avatar: payload.picture || '',
                createdAt: new Date().toISOString()
            };
            users.push(user);
            debouncedSave('users', users);
        }

        const token = generateToken(user);
        res.json({
            message: 'Google sign-in successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar || '' }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Invalid Google credential' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

app.get('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// ===================== USER ROUTES =====================

app.get('/api/user/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

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
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
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

// ===================== SHARED PHOTO STORAGE =====================

app.get('/api/photos', (req, res) => {
    res.json(sharedPhotos);
});

app.post('/api/photos', (req, res) => {
    try {
        const { id, title, artist, category, aspect, image, fullImage } = req.body;
        if (!id || !image) return res.status(400).json({ error: 'Photo id and image are required' });

        const newPhoto = {
            id,
            title: title || 'AI Generated Image',
            artist: artist || 'AI Assistant',
            category: category || 'ai',
            aspect: aspect || 'square',
            image,
            fullImage: fullImage || image,
            createdAt: new Date().toISOString()
        };

        sharedPhotos.unshift(newPhoto);
        debouncedSave('photos', sharedPhotos);

        res.status(201).json({ success: true, photo: newPhoto });
    } catch (error) {
        console.error('Failed to save photo:', error);
        res.status(500).json({ error: 'Failed to save photo' });
    }
});

// ===================== TAGS =====================

app.get('/api/tags/:photoId', (req, res) => {
    const tags = photoTags[req.params.photoId] || [];
    res.json({ tags });
});

app.post('/api/tags/:photoId', (req, res) => {
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ error: 'Tags array is required' });
    photoTags[req.params.photoId] = [...new Set([...(photoTags[req.params.photoId] || []), ...tags])];
    debouncedSave('tags', [{ _id: 'tags', data: photoTags }]);
    res.json({ tags: photoTags[req.params.photoId] });
});

// ===================== RATINGS =====================

app.post('/api/ratings/:photoId', (req, res) => {
    const { rating } = req.body;
    const score = parseInt(rating);
    if (score < 1 || score > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    if (!photoRatings[req.params.photoId]) photoRatings[req.params.photoId] = [];
    photoRatings[req.params.photoId].push(score);
    debouncedSave('ratings', [{ _id: 'ratings', data: photoRatings }]);

    const ratings = photoRatings[req.params.photoId];
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    res.json({ average: Math.round(avg * 10) / 10, count: ratings.length });
});

app.get('/api/ratings/:photoId', (req, res) => {
    const ratings = photoRatings[req.params.photoId] || [];
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    res.json({ average: Math.round(avg * 10) / 10, count: ratings.length });
});

// ===================== COMMENTS =====================

app.get('/api/comments/:photoId', (req, res) => {
    res.json({ comments: photoComments[req.params.photoId] || [] });
});

app.post('/api/comments/:photoId', (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: 'User and text are required' });

    if (!photoComments[req.params.photoId]) photoComments[req.params.photoId] = [];
    const comment = { id: Date.now(), user, text, time: new Date().toISOString() };
    photoComments[req.params.photoId].unshift(comment);
    debouncedSave('comments', [{ _id: 'comments', data: photoComments }]);
    res.status(201).json({ comment });
});

// ===================== ALBUMS =====================

app.post('/api/albums', (req, res) => {
    const { name, user } = req.body;
    if (!name || !user) return res.status(400).json({ error: 'Name and user are required' });

    const album = { id: Date.now(), name, user, photos: [], createdAt: new Date().toISOString() };
    albums.push(album);
    debouncedSave('albums', albums);
    res.status(201).json({ album });
});

app.get('/api/albums', (req, res) => {
    res.json({ albums });
});

app.get('/api/albums/:id', (req, res) => {
    const album = albums.find(a => a.id == req.params.id);
    if (!album) return res.status(404).json({ error: 'Album not found' });
    res.json({ album });
});

app.post('/api/albums/:id/photos', (req, res) => {
    const album = albums.find(a => a.id == req.params.id);
    if (!album) return res.status(404).json({ error: 'Album not found' });
    const { photoId } = req.body;
    if (!album.photos.includes(photoId)) album.photos.push(photoId);
    debouncedSave('albums', albums);
    res.json({ album });
});

app.delete('/api/albums/:id/photos/:photoId', (req, res) => {
    const album = albums.find(a => a.id == req.params.id);
    if (!album) return res.status(404).json({ error: 'Album not found' });
    album.photos = album.photos.filter(p => p != req.params.photoId);
    debouncedSave('albums', albums);
    res.json({ album });
});

// ===================== NOTIFICATIONS =====================

app.post('/api/notifications', (req, res) => {
    const { message, icon, userId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const notif = { id: Date.now(), message, icon: icon || '💬', time: new Date().toLocaleString(), userId: userId || 'all' };
    userNotifications.unshift(notif);
    if (userNotifications.length > 50) userNotifications.length = 50;
    debouncedSave('notifications', userNotifications);
    res.status(201).json({ notification: notif });
});

app.get('/api/notifications', (req, res) => {
    res.json({ notifications: userNotifications.slice(0, 20) });
});

// ===================== VIEWS =====================

app.post('/api/views/:photoId', (req, res) => {
    photoViews[req.params.photoId] = (photoViews[req.params.photoId] || 0) + 1;
    debouncedSave('views', [{ _id: 'views', data: photoViews }]);
    res.json({ views: photoViews[req.params.photoId] });
});

app.get('/api/views/:photoId', (req, res) => {
    res.json({ views: photoViews[req.params.photoId] || 0 });
});

// ===================== ADMIN ROUTES =====================

app.get('/api/admin/users', (req, res) => {
    res.json({ users });
});

app.post('/api/admin/users/:userId/promote', (req, res) => {
    const { plan } = req.body;
    const user = users.find(u => u.id == req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.plan = plan;
    debouncedSave('users', users);
    res.json({ success: true, user });
});

app.delete('/api/admin/users/:userId', (req, res) => {
    const idx = users.findIndex(u => u.id == req.params.userId);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(idx, 1);
    debouncedSave('users', users);
    res.json({ success: true });
});

// ===================== STATS =====================

app.get('/api/stats', async (req, res) => {
    if (db.isConnected()) {
        const stats = await db.getStats();
        res.json(stats);
    } else {
        const totalPhotos = sharedPhotos.length;
        const totalViews = Object.values(photoViews).reduce((a, b) => a + b, 0);
        const totalRatings = Object.values(photoRatings).reduce((a, b) => a + b.length, 0);
        const totalComments = Object.values(photoComments).reduce((a, b) => a + b.length, 0);
        const totalAlbums = albums.length;
        res.json({ totalPhotos, totalViews, totalRatings, totalComments, totalAlbums });
    }
});

// ===================== GRACEFUL SHUTDOWN =====================

process.on('SIGTERM', async () => {
    console.log('SIGTERM received — flushing data...');
    await flushPendingSaves();
    await db.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received — flushing data...');
    await flushPendingSaves();
    await db.disconnect();
    process.exit(0);
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

// Start the server
startServer();
