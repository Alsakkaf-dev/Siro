@echo off
title GreenStep - create + seed database
cd /d "%~dp0Code\GreenStep\Backend\sql"
set "MYSQL=mysql"
where mysql >nul 2>nul
if errorlevel 1 (
  for /d %%d in ("C:\laragon\bin\mysql\mysql-*") do set "MYSQL=%%d\bin\mysql.exe"
)
echo Using MySQL client: %MYSQL%
echo.
echo [1/2] Creating database + tables (schema.sql) ...
"%MYSQL%" -u root < schema.sql
echo [2/2] Seeding data (seed.sql) ...
"%MYSQL%" -u root < seed.sql
echo.
echo ================================================
echo   DONE. 'greenstep' database created + seeded.
echo   Login accounts (email / password):
echo     admin2@greenstep.com / password   (admin)
echo     member@greenstep.com / password   (user)
echo   Re-send Postman / reload the site now.
echo ================================================
pause
