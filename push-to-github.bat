@echo off
setlocal enabledelayedexpansion
title Push CSE Demo Trading to GitHub
echo ========================================================
echo       CSE Demo Stock Trading - Push to GitHub
echo ========================================================
echo.

where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo.
    echo Installing Git automatically using winget...
    winget install --id Git.Git -e --source winget
    echo.
    echo Please restart your terminal/command prompt after Git finishes installing.
    pause
    exit /b
)

echo [OK] Git is detected!
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/username/cse-demo-trading.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] Repository URL cannot be empty!
    pause
    exit /b
)

echo.
echo [1/4] Initializing Git repository...
git init
git branch -M main

echo [2/4] Staging clean project files...
git add .

echo [3/4] Creating initial commit...
git commit -m "Initial commit: Full-featured Colombo Stock Exchange (CSE) Demo Stock Trading Platform"

echo [4/4] Connecting remote origin and pushing to GitHub...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ========================================================
echo   Push Complete! Check your repository on GitHub.
echo ========================================================
pause
