@echo off
echo 🚀 Starting QuizAI...
echo.
echo Starting Python Backend...
cd backend
python main.py &
echo.
echo Starting Hub Server...
cd ..
node hub-server.js &
echo.
echo ✅ Both started!
echo.
echo 📍 Open browser to: http://localhost:9000
echo 🔐 Click: Scores & settings → Sign Up / Log In
pause