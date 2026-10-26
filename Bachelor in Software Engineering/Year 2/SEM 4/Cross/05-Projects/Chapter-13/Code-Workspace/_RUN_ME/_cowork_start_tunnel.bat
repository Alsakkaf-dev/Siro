@echo off
title BOOKS PUBLIC TUNNEL (cloudflared) - KEEP THIS WINDOW OPEN
echo ================================================================
echo  Public HTTPS tunnel to the API. The https URL appears below.
echo  Do NOT close this window while recording.
echo ================================================================
powershell -NoExit -Command "& '%USERPROFILE%\cloudflared.exe' tunnel --url http://localhost:8000 2>&1 | Tee-Object '%USERPROFILE%\cf.log'"
