@echo off
title Buffy - local coding agent
cd /d %~dp0
call .venv\Scripts\activate.bat
python -m buffy chat
pause
