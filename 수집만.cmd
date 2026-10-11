@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1 || (echo [ERROR] Node.js LTS install: https://nodejs.org & pause & exit /b 1)
echo [MAC DEAL RADAR] Save fresh public information to this PC.
node scripts\collect.mjs
if errorlevel 1 (echo [ERROR] Collection failed. Previous data was preserved. & pause & exit /b 1)
echo [OK] Updated assets\deals.json on this PC.
echo The GitHub Pages website is not updated until you publish the file to GitHub.
pause
