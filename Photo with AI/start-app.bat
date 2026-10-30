@echo off
setlocal enabledelayedexpansion
title PhotoStore Launcher
cd /d "%~dp0"

echo ============================================
echo        PhotoStore — Start Application
echo ============================================
echo.

REM ---- Check Node.js ----
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found

REM ---- Install dependencies if needed ----
if not exist "node_modules" (
    echo.
    echo Installing dependencies (first time setup)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

REM ---- Check if server is already running ----
echo.
echo Checking if server is already running...
netstat -an 2>nul | findstr "LISTENING" | findstr ":8000 " >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Server is already running on port 8000
) else (
    echo Starting backend server...
    start "PhotoStore Server" cmd /c "node server.js"
    
    REM Wait for server to start
    echo Waiting for server to be ready...
    set "ready="
    for /l %%i in (1,1,10) do (
        timeout /t 1 /nobreak >nul
        netstat -an 2>nul | findstr "LISTENING" | findstr ":8000 " >nul 2>nul
        if not errorlevel 1 (
            set "ready=1"
            goto :server_ready
        )
    )
    :server_ready
    if defined ready (
        echo [OK] Server is running on http://localhost:8000
    ) else (
        echo [WARNING] Server may not have started. Check for errors.
    )
)

REM ---- Open browser ----
echo.
echo Opening PhotoStore in your browser...
start "" "http://localhost:8000"

echo.
echo ============================================
echo  PhotoStore is ready!
echo  http://localhost:8000
echo ============================================
echo.
echo  Tips:
echo  - Login/Signup to access all features
echo  - Use "AI Generate" to create images with AI
echo  - Upload your own photos to the gallery
echo.
echo  Close this window to keep the server running,
echo  or press Ctrl+C in the server window to stop it.
echo.
pause
