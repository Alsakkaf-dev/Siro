@echo off
title BOOKS - BUILD + SYNC + PREVIEW  (wait for BUILD DONE)
set "FE=C:\Users\Mohammed Alsakkaf\Desktop\chapter_13_Cross\Ch13_FullStack_Solution\frontend"
cd /d "%FE%"
echo Building the frontend with the new tunnel URL...
call npm run build
echo.
echo Syncing the build into the Android app...
call npx cap sync android
echo.
echo Starting the web preview on http://localhost:4173 ...
start "BOOKS WEB :4173 - KEEP OPEN" cmd /k "cd /d "%FE%" && npm run preview"
echo.
echo ==================== BUILD DONE ====================
echo  Preview is starting on http://localhost:4173
echo  Keep all the small windows open while you record.
echo  Next: in Android Studio press Run to (re)launch UTM Books.
echo ===================================================
pause
