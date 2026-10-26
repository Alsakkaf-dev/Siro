@echo off
set "HERE=%~dp0"
set "OUT=%HERE%_verify.txt"
set "URL=https://inch-dosage-paul-justin.trycloudflare.com"
> "%OUT%" echo === LOCAL API http://localhost:8000/api/books?q=clean ===
curl -s -m 12 "http://localhost:8000/api/books?q=clean" >> "%OUT%" 2>&1
>> "%OUT%" echo.
>> "%OUT%" echo.
>> "%OUT%" echo === LOCAL STATUS ===
curl -s -m 12 -o nul -w "HTTP %%{http_code}" "http://localhost:8000/api/books?q=clean" >> "%OUT%" 2>&1
>> "%OUT%" echo.
>> "%OUT%" echo === TUNNEL %URL%/api/books?q=clean ===
curl -s -m 20 "%URL%/api/books?q=clean" >> "%OUT%" 2>&1
>> "%OUT%" echo.
>> "%OUT%" echo.
>> "%OUT%" echo === TUNNEL STATUS ===
curl -s -m 20 -o nul -w "HTTP %%{http_code}" "%URL%/api/books?q=clean" >> "%OUT%" 2>&1
>> "%OUT%" echo.
>> "%OUT%" echo === DONE ===
