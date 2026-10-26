@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
set "OUT=%~dp0env_report.txt"
> "%OUT%" echo Books App - Environment Report
>> "%OUT%" echo Generated: %date% %time%
>> "%OUT%" echo.

REM ---- Laragon root ----
set "LARAGON="
if exist "C:\laragon\bin" set "LARAGON=C:\laragon"
if exist "D:\laragon\bin" set "LARAGON=D:\laragon"
if exist "E:\laragon\bin" set "LARAGON=E:\laragon"
>> "%OUT%" echo LARAGON_ROOT=!LARAGON!

REM ---- PHP ----
set "PHP="
if defined LARAGON for /d %%D in ("!LARAGON!\bin\php\php-*") do set "PHP=%%D\php.exe"
if not defined PHP for /f "delims=" %%P in ('where php 2^>nul') do if not defined PHP set "PHP=%%P"
>> "%OUT%" echo PHP=!PHP!
if defined PHP "!PHP!" -v >> "%OUT%" 2>&1

REM ---- MySQL ----
set "MYSQL="
if defined LARAGON for /d %%D in ("!LARAGON!\bin\mysql\mysql-*") do set "MYSQL=%%D\bin\mysql.exe"
if not defined MYSQL for /f "delims=" %%P in ('where mysql 2^>nul') do if not defined MYSQL set "MYSQL=%%P"
>> "%OUT%" echo MYSQL=!MYSQL!

REM ---- Composer ----
set "COMPOSER="
if defined LARAGON if exist "!LARAGON!\bin\composer\composer.phar" set "COMPOSER=!LARAGON!\bin\composer\composer.phar"
>> "%OUT%" echo COMPOSER_PHAR=!COMPOSER!
>> "%OUT%" echo COMPOSER_ON_PATH:
where composer >> "%OUT%" 2>&1

REM ---- Node / npm ----
set "NPM="
if defined LARAGON for /d %%D in ("!LARAGON!\bin\nodejs\node-*") do set "NPM=%%D\npm.cmd"
if not defined NPM for /f "delims=" %%P in ('where npm 2^>nul') do if not defined NPM set "NPM=%%P"
>> "%OUT%" echo NPM=!NPM!
>> "%OUT%" echo NODE_VERSION:
node -v >> "%OUT%" 2>&1

REM ---- Project folders ----
>> "%OUT%" echo.
if exist "%~dp0..\Ch12_BooksAPI_Solution\public\index.php" (>> "%OUT%" echo BACKEND_OK=yes) else (>> "%OUT%" echo BACKEND_OK=NO)
if exist "%~dp0..\Ch13_FullStack_Solution\frontend\package.json" (>> "%OUT%" echo FRONTEND_OK=yes) else (>> "%OUT%" echo FRONTEND_OK=NO)
>> "%OUT%" echo.
>> "%OUT%" echo DONE.
start "" notepad "%OUT%"
