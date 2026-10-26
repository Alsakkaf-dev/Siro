@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Personal Platform - Local server (127.0.0.1:4310)

echo.
echo  ==========================================
echo    Personal Platform  -  starting...
echo  ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] Node.js was not found on this computer.
  echo          Install Node.js 22 or newer from https://nodejs.org then run start.bat again.
  echo.
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) < 22 ? 1 : 0)"
if errorlevel 1 (
  echo  [ERROR] Your Node.js is too old. Version 22 or newer is required.
  node -v
  echo.
  pause
  exit /b 1
)

node scripts\ensure-deps.mjs
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)

node scripts\ensure-build.mjs
if errorlevel 1 (
  echo.
  echo  [ERROR] Build failed. Send the text above to your assistant.
  pause
  exit /b 1
)

echo.
echo  Opening http://127.0.0.1:4310 in your browser...
start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start http://127.0.0.1:4310"

echo  Server is running. Keep this window open. Close it to stop the platform.
echo.
node server
echo.
echo  The server has stopped.
pause
