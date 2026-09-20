@echo off
title Colombo Stock Exchange Demo Trading Platform Launcher
echo ========================================================
echo   COLOMBO STOCK EXCHANGE (CSE) DEMO TRADING PLATFORM
echo ========================================================
echo.
echo [1/2] Starting Backend API Server on port 5000...
start "CSE Backend (:5000)" cmd /k "cd /d %~dp0backend && node dist/index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Next.js Frontend Terminal on port 3000...
start "CSE Frontend (:3000)" cmd /k "cd /d %~dp0frontend && npm.cmd start"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   CSE TRADING TERMINAL IS NOW LIVE!
echo   Local URL:    http://localhost:3000
echo   Network URL:  http://192.168.8.187:3000
echo   Backend API:  http://localhost:5000/api
echo ========================================================
echo.
echo Opening browser to http://localhost:3000...
start http://localhost:3000
