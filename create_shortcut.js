const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const targetBat = path.resolve(__dirname, 'start-cse-platform.bat');
const workingDir = path.resolve(__dirname);

// Detect actual desktop path (including OneDrive Desktop)
let desktopPath = path.join(os.homedir(), 'OneDrive', 'Desktop');
if (!fs.existsSync(desktopPath)) {
  desktopPath = path.join(os.homedir(), 'Desktop');
}

const shortcutPath = path.join(desktopPath, 'CSE Demo Trading.lnk');

const vbsScript = [
  'Set oWS = WScript.CreateObject("WScript.Shell")',
  'sLinkFile = "' + shortcutPath.replace(/\\/g, '\\\\') + '"',
  'Set oLink = oWS.CreateShortcut(sLinkFile)',
  'oLink.TargetPath = "' + targetBat.replace(/\\/g, '\\\\') + '"',
  'oLink.WorkingDirectory = "' + workingDir.replace(/\\/g, '\\\\') + '"',
  'oLink.Description = "Colombo Stock Exchange Demo Stock Trading Platform"',
  'oLink.Save'
].join('\r\n');

fs.writeFileSync(path.join(__dirname, 'make_shortcut.vbs'), vbsScript);
execSync('cscript //nologo make_shortcut.vbs', { cwd: __dirname, stdio: 'inherit' });
console.log('Successfully created Desktop shortcut at:', shortcutPath);
