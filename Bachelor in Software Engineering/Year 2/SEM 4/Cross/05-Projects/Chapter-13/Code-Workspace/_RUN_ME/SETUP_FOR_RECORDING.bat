@echo off
chcp 65001 >nul
title BOOKS - SETUP FOR RECORDING  (keep this open until you see ALL READY)
set "HERE=%~dp0"
set "ROOT=%HERE%.."
set "API=%ROOT%\Ch12_BooksAPI_Solution"
set "FE=%ROOT%\Ch13_FullStack_Solution\frontend"

REM --- put Laragon PHP + Node on PATH ---
for /d %%D in ("C:\laragon\bin\php\php-*") do set "PHPDIR=%%D"
if defined PHPDIR set "PATH=%PHPDIR%;%PATH%"
for /d %%D in ("C:\laragon\bin\nodejs\node-*") do set "NODEDIR=%%D"
if defined NODEDIR set "PATH=%NODEDIR%;%PATH%"

echo Cleaning old tunnel log...
del "%HERE%_cf.log" 2>nul

echo Starting the API on http://localhost:8000 ...
start "BOOKS API :8000 - KEEP OPEN" cmd /k "cd /d "%API%" && echo BOOKS API on http://localhost:8000  (do NOT close) && php -S 0.0.0.0:8000 -t public"

echo Starting the public Cloudflare tunnel ...
start "BOOKS TUNNEL - KEEP OPEN" powershell -NoExit -Command "& '%USERPROFILE%\cloudflared.exe' tunnel --url http://localhost:8000 2>&1 | Tee-Object -FilePath '%HERE%_cf.log'"

echo Waiting for the public URL (can take 10-30 seconds)...
set "TUN="
for /l %%i in (1,1,40) do (
  if not defined TUN (
    timeout /t 2 >nul
    for /f "tokens=*" %%u in ('powershell -NoProfile -Command "Select-String -Path '%HERE%_cf.log' -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches ^| %%{$_.Matches.Value} ^| Select-Object -First 1" 2^>nul') do set "TUN=%%u"
  )
)
if not defined TUN ( echo. & echo COULD NOT READ TUNNEL URL - look at the BOOKS TUNNEL window for the https link. & pause & exit /b 1 )
echo PUBLIC URL: %TUN%

echo Writing the URL into the app config...
> "%FE%\.env.production" echo VITE_API_BASE_URL=%TUN%

echo Building the frontend (npm run build) - please wait...
call cmd /c "cd /d "%FE%" && npm run build"

echo Syncing the build into the Android app (npx cap sync android)...
call cmd /c "cd /d "%FE%" && npx cap sync android"

echo Starting the web preview on http://localhost:4173 ...
start "BOOKS WEB :4173 - KEEP OPEN" cmd /k "cd /d "%FE%" && npm run preview"

echo.
echo =====================================================
echo                 ALL READY
echo  Database view : http://localhost:8000/dbview.php
echo  API           : http://localhost:8000
echo  PUBLIC API    : %TUN%
echo  WEB APP       : http://localhost:4173
echo  Mobile config : http://localhost:8000/capview.html
echo.
echo  NEXT: open Android Studio, start your emulator,
echo        then press the green Run button to launch UTM Books.
echo  Keep ALL the small windows open while you record.
echo =====================================================
pause
