@echo off
title Stop CSE Platform
echo ========================================================
echo   Stopping Colombo Stock Exchange Demo Trading Platform
echo ========================================================
echo.
echo Terminating processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a 2>nul
echo Terminating processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a 2>nul
echo.
echo All CSE servers stopped cleanly.
timeout /t 3 >nul
