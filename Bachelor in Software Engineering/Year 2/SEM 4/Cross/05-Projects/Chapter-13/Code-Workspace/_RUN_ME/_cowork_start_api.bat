@echo off
title BOOKS API (php -S :8000) - KEEP THIS WINDOW OPEN
REM --- ensure Laragon PHP is on PATH (pick whatever php-* exists) ---
for /d %%D in ("C:\laragon\bin\php\php-*") do set "PHPDIR=%%D"
if defined PHPDIR set "PATH=%PHPDIR%;%PATH%"
cd /d "C:\Users\Mohammed Alsakkaf\Desktop\chapter_13_Cross\Slim API backend"
echo ================================================================
echo  BOOKS API running on http://localhost:8000  (do NOT close)
echo ================================================================
php -S 0.0.0.0:8000 -t public
