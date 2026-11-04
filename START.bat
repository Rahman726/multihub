@echo off
color 1F
title QuizAI App Launcher
cls
echo ==========================================
echo   🚀 QuizAI App - Startup Launcher
echo ==========================================
echo.
echo [1] Starting Python Backend (port 8000)...
cd backend
python main.py >nul 2>&1 &
BACKEND_PID=$!
sleep 3
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo ✅ Python Backend started on port 8000
else
    echo ❌ Failed to start Python Backend
    echo Check if port 8000 is already in use
    pause
    exit
fi
cd ..
echo.
echo [2] Starting Node.js Hub Server (port 9000)...
node hub-server.js >nul 2>&1 &
HUB_PID=$!
sleep 3
if kill -0 $HUB_PID 2>/dev/null; then
    echo ✅ Hub Server started on port 9000
else
    echo ❌ Failed to start Hub Server
    echo Killing backend...
    kill $BACKEND_PID 2>/dev/null
    pause
    exit
fi
echo.
echo ==========================================
echo ✅  ALL SYSTEMS GO!
echo ==========================================
echo.
echo 📍 App:      http://localhost:9000
echo 📍 Backend:  http://localhost:8000
echo.
echo 🎯 Open your browser and go to: http://localhost:9000
echo 🔐 Then click: Scores & settings → Sign Up / Log In
echo.
pause