@echo off
title GreenStep - composer install (creates vendor\)
cd /d "%~dp0Code\GreenStep\Backend"
echo ================================================
echo   Installing backend dependencies -> creates vendor\
echo   (Slim 4, firebase/php-jwt, phpdotenv)
echo ================================================
where composer >nul 2>nul
if errorlevel 1 (
  if exist "C:\laragon\bin\composer\composer.bat" (
    call "C:\laragon\bin\composer\composer.bat" install --no-interaction
  ) else (
    echo composer not found in PATH. Open Laragon Menu ^> Terminal and run:  composer install
    pause
    exit /b
  )
) else (
  call composer install --no-interaction
)
echo.
echo ================================================
echo   DONE. vendor\ created - the API works now.
echo   Re-send your Postman request / reload the site.
echo ================================================
pause
