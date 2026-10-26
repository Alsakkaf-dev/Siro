@echo off
chcp 65001 >nul
title Backend API - KEEP THIS WINDOW OPEN
set "PHPDIR=C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64"
set "PATH=%PHPDIR%;%PATH%"
cd /d "%~dp0..\Ch12_BooksAPI_Solution"

if not exist ".env" copy ".env.example" ".env" >nul

if not exist "vendor" (
  echo Installing backend dependencies for the first time. Please wait...
  echo.
  php "C:\laragon\bin\composer\composer.phar" install --no-interaction
  echo.
)

echo ============================================================
echo   BACKEND API IS RUNNING
echo   Open in browser:  http://localhost:8000
echo   KEEP THIS WINDOW OPEN during your video.  Ctrl+C to stop.
echo ============================================================
echo.
php -S localhost:8000 -t public
echo.
echo (Server stopped.)
pause
