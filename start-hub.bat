@echo off
echo 🚀 Starting QuizAI Hub Server...
echo.
echo 1. Starting Python QuizAI Backend on port 8000...
cd backend
python main.py
echo Python backend started.
cd ..

echo 2. Starting Node.js Hub Server on port 9000...
node hub-server.js

echo.
echo ✅ Both servers are now running!
echo.
echo 📍 Access the app at: http://localhost:9000
echo 📍 Quiz backend at: http://localhost:8000
echo.
pause