@echo off
chcp 65001 >nul
title Step 1 - Setup Database
set "MYSQL=C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe"
set "SCHEMA=%~dp0..\Ch12_BooksAPI_Solution\sql\schema.sql"

echo ============================================================
echo   STEP 1 : Create the "books" database + sample data
echo ============================================================
echo.
if not exist "%MYSQL%" (
  echo ERROR: Could not find mysql.exe at:
  echo   %MYSQL%
  echo Open Laragon, click "Start All", then run this again.
  echo.
  pause
  exit /b 1
)

echo Importing... please wait a moment.
"%MYSQL%" -u root < "%SCHEMA%"
if errorlevel 1 (
  echo.
  echo *** IMPORT FAILED ***
  echo Make sure Laragon is running and MySQL is green, then try again.
) else (
  echo.
  echo *** SUCCESS ***  The "books" database is ready.
  echo Verifying...
  "%MYSQL%" -u root -e "USE books; SELECT COUNT(*) AS book_count FROM books; SELECT email, role FROM users;"
)
echo.
echo Done. You can close this window.
pause
