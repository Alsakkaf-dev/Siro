@echo off
chcp 65001 >nul
set "OUT=%~dp0_diag_state.txt"
> "%OUT%" echo ===== COWORK DIAGNOSTIC %DATE% %TIME% =====

>> "%OUT%" echo.
>> "%OUT%" echo --- PORT 8000 (API) ---
netstat -ano | findstr ":8000" >> "%OUT%" 2>&1

>> "%OUT%" echo.
>> "%OUT%" echo --- RUNNING PROCESSES (php / cloudflared / node / studio64 / qemu / mysqld) ---
tasklist /fi "imagename eq php.exe" >> "%OUT%" 2>&1
tasklist /fi "imagename eq cloudflared.exe" >> "%OUT%" 2>&1
tasklist /fi "imagename eq node.exe" >> "%OUT%" 2>&1
tasklist /fi "imagename eq studio64.exe" >> "%OUT%" 2>&1
tasklist /fi "imagename eq qemu-system-x86_64.exe" >> "%OUT%" 2>&1
tasklist /fi "imagename eq mysqld.exe" >> "%OUT%" 2>&1

>> "%OUT%" echo.
>> "%OUT%" echo --- CLOUDFLARED LOG (current public URL) %USERPROFILE%\cf.log ---
if exist "%USERPROFILE%\cf.log" (
  findstr /i "trycloudflare.com" "%USERPROFILE%\cf.log" >> "%OUT%" 2>&1
) else (
  >> "%OUT%" echo cf.log NOT FOUND
)

>> "%OUT%" echo.
>> "%OUT%" echo --- .env.production URL ---
findstr /i "VITE_API_BASE_URL" "%~dp0..\Ch13_FullStack_Solution\frontend\.env.production" >> "%OUT%" 2>&1

>> "%OUT%" echo.
>> "%OUT%" echo --- URL BAKED INTO BUILT dist (what the app actually calls) ---
findstr /s /i "trycloudflare.com" "%~dp0..\Ch13_FullStack_Solution\frontend\dist\assets\*.js" >> "%OUT%" 2>&1
if errorlevel 1 >> "%OUT%" echo (no trycloudflare URL found baked in dist)

>> "%OUT%" echo.
>> "%OUT%" echo --- adb DEVICES (emulator online?) ---
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" devices >> "%OUT%" 2>&1
if errorlevel 1 >> "%OUT%" echo adb not found at default path

>> "%OUT%" echo.
>> "%OUT%" echo --- Is UTM Books app installed on emulator? ---
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell pm list packages | findstr /i "com.utm.books" >> "%OUT%" 2>&1
if errorlevel 1 >> "%OUT%" echo (com.utm.books not installed yet / adb unavailable)

>> "%OUT%" echo.
>> "%OUT%" echo ===== END DIAGNOSTIC =====
