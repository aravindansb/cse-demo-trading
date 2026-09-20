@echo off
title Disable Auto-Start on Windows Boot
echo ========================================================
echo   Disabling Automatic Startup on Windows Boot
echo ========================================================
echo.

node -e "const fs = require('fs'); const path = require('path'); const os = require('os'); const startupPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'CSE Demo Trading AutoStart.lnk'); if (fs.existsSync(startupPath)) { fs.unlinkSync(startupPath); console.log('Auto-start shortcut removed.'); } else { console.log('Auto-start was not enabled.'); }"

echo.
echo [OK] CSE Demo Trading auto-start disabled!
timeout /t 3 >nul
