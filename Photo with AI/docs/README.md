# PhotoStore - Free Stock Photos App

A Pexels-inspired photo gallery application with authentication and backend API.

## Features

- **Modern UI/UX** - Pexels-like design with green accents
- **Photo Gallery** - Masonry layout with 39+ photos
- **Categories** - Nature, Portrait, Architecture, Abstract, Travel, Wildlife, Food, Technology, Fashion
- **Search & Filter** - Search by title, artist, or category
- **Favorites** - Save photos to favorites (persisted in localStorage)
- **Lightbox** - Full-screen photo viewer with navigation
- **Authentication** - Login/Signup with JWT tokens
- **Backend API** - Express server with REST endpoints

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend Server

**Option 1: Using PM2 (Recommended for production)**
```bash
npm start
```

**Option 2: Using Node.js (Development)**
```bash
npm run dev
```

**Option 3: Using Batch File (Windows)**
```bash
start-server.bat
```

### 3. Open the App

Open `index.html` in your browser or use the launcher:

```bash
launch-app.bat
```

## Auto-Start Server on Windows

To make the server start automatically when you log in to Windows:

1. **Copy the autostart script:**
   - Copy `autostart-server.bat` to your Windows startup folder
   - Startup folder: `C:\Users\YOUR_USERNAME\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

2. **Or use Task Scheduler:**
   - Open Task Scheduler
   - Create Basic Task
   - Set trigger to "When I log on"
   - Action: Start a program
   - Program: `autostart-server.bat`
   - Browse to the project folder

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to existing account
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify JWT token

### User
- `GET /api/user/profile` - Get user profile

## Project Structure

```
Photo with AI/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── data.js            # Photo data
│   ├── state.js           # State variables
│   ├── gallery.js         # Gallery functions
│   ├── filters.js         # Filter functions
│   ├── search.js          # Search functions
│   ├── trending.js        # Trending tags
│   ├── favorites.js       # Favorites management
│   ├── lightbox.js        # Lightbox modal
│   ├── download.js        # Download function
│   ├── loadMore.js        # Load more photos
│   ├── toast.js           # Toast notifications
│   ├── auth.js            # Authentication
│   └── init.js            # Initialization
├── server.js              # Express backend
├── package.json           # Dependencies
├── ecosystem.config.js    # PM2 configuration
├── start-server.bat       # Start server script
├── autostart-server.bat   # Auto-start script
└── launch-app.bat         # Launch app with server
```

## Development

### Start Backend with Auto-reload
```bash
npm run dev
```

### Stop PM2 Server
```bash
npm stop
```

### Restart PM2 Server
```bash
npm restart
```

### View PM2 Logs
```bash
pm2 logs photostore-backend
```

## Deployment

For production deployment:

1. Set up a proper database (MongoDB, PostgreSQL, etc.)
2. Update JWT secret in `server.js`
3. Configure environment variables
4. Use PM2 for process management
5. Set up reverse proxy (Nginx)
6. Enable HTTPS

## Technologies

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **Authentication:** JWT, bcrypt
- **Process Management:** PM2
- **Styling:** Custom CSS with CSS Variables

## License

ISC
