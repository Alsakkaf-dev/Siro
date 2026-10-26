@echo off
title StudyQuest Launcher
cd /d "%~dp0StudyQuest"

echo Checking if StudyQuest is already running...
powershell -NoProfile -Command "try { Invoke-RestMethod 'http://localhost:5050/api/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 goto open

echo Starting the StudyQuest server (minimized window in your taskbar)...
start "StudyQuest Server" /min cmd /c "npm start"

echo Waiting for the server to come up...
powershell -NoProfile -Command "for($i=0;$i -lt 40;$i++){ try { Invoke-RestMethod 'http://localhost:5050/api/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 500 } }; exit 1"
if not %errorlevel%==0 (
  echo.
  echo Server did not start - check the "StudyQuest Server" window for errors.
  pause
  exit /b 1
)

:open
echo Opening http://localhost:5050 ...
start "" "http://localhost:5050"
exit /b 0
