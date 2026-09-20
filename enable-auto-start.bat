@echo off
title Enable Auto-Start on Windows Boot
echo ========================================================
echo   Enabling Automatic Startup on Windows Boot
echo ========================================================
echo.

node -e "const fs = require('fs'); const path = require('path'); const os = require('os'); const { execSync } = require('child_process'); const targetBat = path.resolve(__dirname, 'start-cse-platform.bat'); const workingDir = path.resolve(__dirname); const startupPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'CSE Demo Trading AutoStart.lnk'); const vbsScript = ['Set oWS = WScript.CreateObject(\"WScript.Shell\")', 'sLinkFile = \"' + startupPath.replace(/\\/g, '\\\\\\\\') + '\"', 'Set oLink = oWS.CreateShortcut(sLinkFile)', 'oLink.TargetPath = \"' + targetBat.replace(/\\/g, '\\\\\\\\') + '\"', 'oLink.WorkingDirectory = \"' + workingDir.replace(/\\/g, '\\\\\\\\') + '\"', 'oLink.Description = \"Auto-start CSE Demo Trading Platform\"', 'oLink.Save'].join('\r\n'); fs.writeFileSync(path.join(__dirname, 'autostart.vbs'), vbsScript); execSync('cscript //nologo autostart.vbs', { cwd: __dirname, stdio: 'inherit' }); try { fs.unlinkSync(path.join(__dirname, 'autostart.vbs')); } catch(e){}"

echo.
echo [OK] CSE Demo Trading will now automatically launch on Windows boot!
timeout /t 4 >nul
