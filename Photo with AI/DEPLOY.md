# 🚀 PhotoStore Deployment Guide

## Problem
When you close VSCode, the local server stops and all features break. You need the app to be **always online** so anyone can install it on any device.

## Solution: Deploy to Render.com (FREE)

Render.com hosts your app 24/7 with HTTPS — required for PWA install on all devices.

### Step 1: Push to GitHub

1. Create a GitHub account at https://github.com (if you don't have one)
2. Create a new repository called `photostore`
3. Push your code:

```bash
cd "C:\Users\DELL\Desktop\Photo with AI"
git init
git add .
git commit -m "PhotoStore PWA ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/photostore.git
git push -u origin main
```

### Step 2: Deploy on Render.com

1. Go to https://render.com and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Settings:
   - **Name:** `photostore`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Click **"Create Web Service"**
6. Wait 2-3 minutes for deployment to finish
7. You'll get a URL like `https://photostore.onrender.com`

### Step 3: Install on Any Device

Once deployed, anyone can install the app:

**Android:**
- Open the URL in Chrome
- Tap the menu (⋮) → "Install app" or "Add to Home screen"

**iPhone/iPad:**
- Open the URL in Safari
- Tap the Share button (⬆) → "Add to Home Screen"

**Windows/Mac/Linux:**
- Open the URL in Chrome/Edge
- Click the install icon (⬇) in the address bar

**Smart TV:**
- Open the URL in the TV browser
- The app works perfectly in the browser

### That's it! 🎉

Your app is now:
- ✅ Always online (24/7)
- ✅ Installable on all devices
- ✅ All features working
- ✅ Free hosting

## Alternative: Railway.app (also free)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Done! Railway auto-detects Node.js

## ⚠️ Important Notes

**Render Free Tier ($0/month):**
- Your app runs 24/7 and is installable on all devices
- Personal data (favorites, albums, comments, ratings) is saved in your browser — safe across restarts
- Server-side shared data (photos shared by all users, user accounts) may reset when Render redeploys
- First visit after idle takes ~30 seconds (cold start)

**Render Starter Plan ($7/month):**
- Persistent disk — shared data never resets
- No cold starts — always fast
- Better for production use with multiple users

**JWT Secret:** When Render redeploys, it generates a new JWT_SECRET. This means users will need to log in again after a deploy. This is normal and expected.

## Troubleshooting

**App shows "offline" after deploy:**
- Wait 2-3 minutes, Render needs time to start
- Check Render logs for errors

**Features not working:**
- The data persists in a file on the server
- First load may take 30 seconds (free tier cold start)
- After that, it stays fast

**Need help?** Check Render docs: https://render.com/docs
