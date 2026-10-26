@echo off
title GreenStep API - localhost:8080
cd /d "%~dp0Code\GreenStep\Backend"
set "PHPEXE=php"
where php >nul 2>nul
if errorlevel 1 (
  for /d %%d in ("C:\laragon\bin\php\php-*") do set "PHPEXE=%%d\php.exe"
)
echo ================================================
echo   GreenStep API  -^>  http://localhost:8080
echo   Using PHP: %PHPEXE%
echo   Keep THIS window open during your demo.
echo   Test in browser: http://localhost:8080/api/health
echo ================================================
"%PHPEXE%" -S localhost:8080 -t public public\index.php
echo.
echo (If it failed: open Laragon Menu ^> Terminal, cd into Backend, run:)
echo    php -S localhost:8080 -t public public\index.php
pause
