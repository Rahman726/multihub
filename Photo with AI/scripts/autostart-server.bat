@echo off
echo Starting PhotoStore Backend Server...
cd /d "%~dp0"
start /min cmd /c "npm start"
exit
