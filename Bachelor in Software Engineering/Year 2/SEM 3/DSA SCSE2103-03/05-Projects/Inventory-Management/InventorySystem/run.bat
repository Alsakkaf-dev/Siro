@echo off
cls
g++ main.cpp -std=c++20 -o main
if %errorlevel% neq 0 exit /b %errorlevel%
.\main