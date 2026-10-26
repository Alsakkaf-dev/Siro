@echo off
chcp 65001 >nul
set "HERE=%~dp0"
set "API=%HERE%..\Ch12_BooksAPI_Solution"

REM --- ensure Laragon PHP is on PATH (pick whatever php-* exists) ---
for /d %%D in ("C:\laragon\bin\php\php-*") do set "PHPDIR=%%D"
if defined PHPDIR set "PATH=%PHPDIR%;%PATH%"

REM --- clear any stale tunnel log so we read only the fresh URL ---
del "%HERE%_cf.log" 2>nul

REM --- start the API server in its own persistent window ---
start "BOOKS API :8000 - KEEP OPEN" cmd /k "cd /d "%API%" && echo BOOKS API on http://localhost:8000  (do NOT close) && php -S 0.0.0.0:8000 -t public"

REM --- start the Cloudflare tunnel in its own persistent window, tee URL to mounted log ---
start "BOOKS TUNNEL - KEEP OPEN" powershell -NoExit -Command "& '%USERPROFILE%\cloudflared.exe' tunnel --url http://localhost:8000 2>&1 | Tee-Object -FilePath '%HERE%_cf.log'"

> "%HERE%_up_done.txt" echo Launched API + tunnel at %DATE% %TIME%
