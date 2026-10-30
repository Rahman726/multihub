@echo off
echo Starting PhotoStore App...
cd /d "%~dp0"

echo Checking if server is running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Server is already running.
) else (
    echo Starting backend server...
    start /min cmd /c "npm start"
    echo Waiting for server to start...
    timeout /t 3 /nobreak >nul
)

echo Opening PhotoStore in browser...
start index.html

echo PhotoStore is ready!
timeout /t 2 /nobreak >nul
