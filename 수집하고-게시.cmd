@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1 || (echo [ERROR] Node.js LTS: https://nodejs.org & pause & exit /b 1)
where git >nul 2>&1 || (echo [ERROR] Git: https://git-scm.com & pause & exit /b 1)
if not exist ".git" (echo [ERROR] First run github-bootstrap.cmd, or clone the GitHub repo using git. & pause & exit /b 1)
echo [1/4] Checking GitHub main updates
call git pull --ff-only origin main
if errorlevel 1 (echo [ERROR] Check local Git changes and try again. & pause & exit /b 1)
echo [2/4] Collecting public source pages on your PC
node scripts\collect.mjs
if errorlevel 1 (echo [ERROR] Collection failed; nothing published. & pause & exit /b 1)
echo [3/4] Committing refreshed JSON
call git add assets/deals.json data/custom-sources.json
call git diff --cached --quiet
if not errorlevel 1 (echo [OK] No changes to publish. & pause & exit /b 0)
call git commit -m "data: update MacBook deal feed from PC"
if errorlevel 1 (echo [ERROR] Set your Git user.name/email then retry. & pause & exit /b 1)
echo [4/4] Publishing to GitHub Pages via GitHub Actions
call git push origin main
if errorlevel 1 (echo [ERROR] GitHub push failed. Commit remains on PC; retry git push. & pause & exit /b 1)
echo [OK] Published to GitHub. Pages deploy runs in GitHub Actions.
echo Open your site and click the published-data refresh button after deploy succeeds.
pause
