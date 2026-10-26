@echo off
title GreenStep Frontend - Vite
cd /d "%~dp0Code\GreenStep\Frontend"
echo Starting GreenStep frontend (opens on http://localhost:5173) ...
call npm run dev
pause
