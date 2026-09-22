@echo off
title Push Updates to Live CSE Trading Platform
cd /d "C:\Users\Dell\.gemini\antigravity\scratch\cse-demo-trading"

echo ========================================================
echo   Push Modifications to Live Web App (Vercel + Render)
echo ========================================================
echo.

git status -s
echo.

set /p COMMIT_MSG="Enter a description for your changes (or press Enter for default): "

if "%COMMIT_MSG%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set COMMIT_MSG=Update CSE platform %datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%
)

echo.
echo [1/3] Staging changes...
git add .

echo [2/3] Committing changes: "%COMMIT_MSG%"...
git commit -m "%COMMIT_MSG%"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! Pushed to GitHub.
    echo   - Vercel is now automatically updating your Frontend!
    echo   - Render is now automatically updating your Backend!
    echo   Check live in 1-2 minutes at: https://cse-demo-trading.vercel.app
    echo ========================================================
) else (
    echo ========================================================
    echo   Push encountered an issue. Check your network or GitHub login.
    echo ========================================================
)
echo.
pause
