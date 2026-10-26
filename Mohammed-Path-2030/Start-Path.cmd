@echo off
setlocal
cd /d "%~dp0"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -B server.py --open
  goto done
)
where py >nul 2>nul
if not errorlevel 1 (
  py -3 -B server.py --open
  goto done
)
where python >nul 2>nul
if not errorlevel 1 (
  python -B server.py --open
  goto done
)
echo Python 3 is required. Install it, then run this file again.
:done
pause
