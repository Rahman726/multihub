// ===================== MongoDB Database Helper =====================
// Falls back to JSON files when MongoDB is not available (local dev)

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Data directory for JSON fallback
const DATA_DIR = path.join(__dirname, '..', 'data');

// Collections / JSON files
const COLLECTIONS = {
    photos: 'photos.json',
    users: 'users.json',
    tags: 'photoTags.json',
    ratings: 'photoRatings.json',
    comments: 'photoComments.json',
    albums: 'albums.json',
    notifications: 'userNotifications.json',
    views: 'photoViews.json'
};

let client = null;
let mongoDb = null;
let useMongo = false;

// ─── Connection ────────────────────────────────────────────────

async function connect() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.log('📁 MONGODB_URI not set — using JSON file storage');
        useMongo = false;
        return false;
    }

    try {
        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });

        await client.connect();
        mongoDb = client.db();
        useMongo = true;
        console.log('✅ Connected to MongoDB Atlas');
        return true;
    } catch (err) {
        console.warn('⚠️ MongoDB connection failed, falling back to JSON files:', err.message);
        useMongo = false;
        return false;
    }
}

async function disconnect() {
    if (client) {
        await client.close();
        client = null;
        mongoDb = null;
        useMongo = false;
    }
}

function isConnected() {
    return useMongo && client && mongoDb;
}

// ─── JSON helpers (fallback) ───────────────────────────────────

function loadJSON(collection) {
    const filePath = path.join(DATA_DIR, COLLECTIONS[collection]);
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (e) {
        console.warn(`Failed to load ${COLLECTIONS[collection]}:`, e.message);
    }

    // Default values
    switch (collection) {
        case 'photos': return [];
        case 'users': return [];
        case 'albums': return [];
        case 'notifications': return [];
        case 'tags': return {};
        case 'ratings': return {};
        case 'comments': return {};
        case 'views': return {};
        default: return {};
    }
}

function saveJSON(collection, data) {
    const filePath = path.join(DATA_DIR, COLLECTIONS[collection]);
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error(`Failed to save ${COLLECTIONS[collection]}:`, e.message);
    }
}

// ─── MongoDB CRUD ──────────────────────────────────────────────

function getCollection(name) {
    if (!mongoDb) return null;
    return mongoDb.collection(name);
}

// Find all documents in a collection
async function findAll(collection) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return [];
        return await coll.find({}).toArray();
    }
    return loadJSON(collection);
}

// Find a single document by ID
async function findById(collection, id) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return null;
        return await coll.findOne({ id: Number(id) });
    }
    const data = loadJSON(collection);
    if (Array.isArray(data)) {
        return data.find(item => item.id == id) || null;
    }
    return null;
}

// Insert a document
async function insertOne(collection, doc) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return doc;
        await coll.insertOne(doc);
        return doc;
    }
    const data = loadJSON(collection);
    if (Array.isArray(data)) {
        data.push(doc);
        saveJSON(collection, data);
    }
    return doc;
}

// Insert many documents
async function insertMany(collection, docs) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return docs;
        await coll.insertMany(docs);
        return docs;
    }
    const data = loadJSON(collection);
    if (Array.isArray(data)) {
        data.push(...docs);
        saveJSON(collection, data);
    }
    return docs;
}

// Update a document
async function updateOne(collection, filter, update) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return null;
        return await coll.updateOne(filter, { $set: update });
    }
    const data = loadJSON(collection);
    if (Array.isArray(data)) {
        const idx = data.findIndex(item => {
            return Object.keys(filter).every(k => item[k] == filter[k]);
        });
        if (idx >= 0) {
            data[idx] = { ...data[idx], ...update };
            saveJSON(collection, data);
        }
    }
    return null;
}

// Delete a document
async function deleteOne(collection, filter) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return null;
        return await coll.deleteOne(filter);
    }
    const data = loadJSON(collection);
    if (Array.isArray(data)) {
        const idx = data.findIndex(item => {
            return Object.keys(filter).every(k => item[k] == filter[k]);
        });
        if (idx >= 0) {
            data.splice(idx, 1);
            saveJSON(collection, data);
        }
    }
    return null;
}

// Replace entire collection data (for photos array)
async function replaceAll(collection, docs) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return;
        await coll.deleteMany({});
        if (docs.length > 0) {
            await coll.insertMany(docs);
        }
    } else {
        saveJSON(collection, docs);
    }
}

// Push to array field within a document
async function pushToArray(collection, filter, field, value) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return;
        await coll.updateOne(filter, { $push: { [field]: value } });
    } else {
        const data = loadJSON(collection);
        const item = Array.isArray(data) ? data.find(d => {
            return Object.keys(filter).every(k => d[k] == filter[k]);
        }) : null;
        if (item) {
            if (!item[field]) item[field] = [];
            if (!item[field].includes(value)) {
                item[field].push(value);
            }
            saveJSON(collection, data);
        }
    }
}

// Remove from array field
async function pullFromArray(collection, filter, field, value) {
    if (isConnected()) {
        const coll = getCollection(collection);
        if (!coll) return;
        await coll.updateOne(filter, { $pull: { [field]: value } });
    } else {
        const data = loadJSON(collection);
        const item = Array.isArray(data) ? data.find(d => {
            return Object.keys(filter).every(k => d[k] == filter[k]);
        }) : null;
        if (item && item[field]) {
            item[field] = item[field].filter(v => v != value);
            saveJSON(collection, data);
        }
    }
}

// Get aggregate stats
async function getStats() {
    if (isConnected()) {
        const photos = await getCollection('photos')?.countDocuments() || 0;
        const users = await getCollection('users')?.countDocuments() || 0;
        const albums = await getCollection('albums')?.countDocuments() || 0;
        const viewsAgg = await getCollection('views')?.aggregate([
            { $group: { _id: null, total: { $sum: '$count' } } }
        ]).toArray() || [];
        const totalViews = viewsAgg[0]?.total || 0;
        return { totalPhotos: photos, totalViews, totalUsers: users, totalAlbums: albums };
    }

    const photos = loadJSON('photos');
    const views = loadJSON('views');
    const users = loadJSON('users');
    const totalViews = Object.values(views).reduce((a, b) => a + (b || 0), 0);
    return {
        totalPhotos: photos.length,
        totalViews,
        totalUsers: users.length,
        totalAlbums: (loadJSON('albums') || []).length
    };
}

module.exports = {
    connect,
    disconnect,
    isConnected,
    findAll,
    findById,
    insertOne,
    insertMany,
    updateOne,
    deleteOne,
    replaceAll,
    pushToArray,
    pullFromArray,
    getStats,
    // JSON-only helpers for direct access
    loadJSON,
    saveJSON,
    COLLECTIONS,
    DATA_DIR
};
