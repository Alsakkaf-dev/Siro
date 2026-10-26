@echo off
chcp 65001 >nul
title Website (Vue) - KEEP THIS WINDOW OPEN
cd /d "%~dp0..\Ch13_FullStack_Solution\frontend"

if not exist "node_modules" (
  echo Installing website dependencies for the first time.
  echo This can take a few minutes - please wait...
  echo.
  call npm install
  echo.
)

echo ============================================================
echo   WEBSITE IS RUNNING
echo   Open in browser:  http://localhost:5173
echo   KEEP THIS WINDOW OPEN during your video.  Ctrl+C to stop.
echo ============================================================
echo.
call npm run dev
echo.
echo (Website stopped.)
pause
