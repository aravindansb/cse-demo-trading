@echo off
title Push CSE Demo Trading to GitHub
cd /d "C:\Users\Dell\.gemini\antigravity\scratch\cse-demo-trading"

echo ========================================================
echo    Pushing CSE Demo Trading to GitHub (aravindansb)
echo ========================================================
echo.
echo Target Repository: https://github.com/aravindansb/cse-demo-trading.git
echo Branch: main
echo.
echo If a browser window opens, click "Sign in with your browser" to authorize.
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! All files pushed to GitHub successfully.
    echo ========================================================
) else (
    echo ========================================================
    echo   If you saw an error:
    echo   1. Make sure https://github.com/aravindansb/cse-demo-trading
    echo      exists on your GitHub account.
    echo   2. If it does not exist yet, create it at:
    echo      https://github.com/new (Name: cse-demo-trading)
    echo ========================================================
)
echo.
pause
