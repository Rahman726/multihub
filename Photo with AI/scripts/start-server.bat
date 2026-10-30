@echo off
echo Starting PhotoStore Backend Server...
cd /d "%~dp0"
call npm install
call npm start
echo Server started successfully!
pause
