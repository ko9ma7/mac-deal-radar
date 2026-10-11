@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ============================================================
echo   MAC DEAL RADAR - GITHUB PAGES + LOCAL PC ONLY
echo  V3.0.0 - NO CLOUDFLARE - NEW STARTER
echo ============================================================
echo.
echo [RUNNING FROM] %CD%
echo [CHECK] Project version and folder
echo.
if not exist "package.json" goto wrongfolder
if not exist "scripts\github-bootstrap.ps1" goto wrongfolder
where node.exe >nul 2>&1
if errorlevel 1 goto missingnode
for /f "delims=" %%V in ('node -p "require('./package.json').version" 2^>nul') do set "APP_VERSION=%%V"
if not "%APP_VERSION%"=="3.0.0" (
  echo [ERROR] Wrong project version: %APP_VERSION%
  echo [FIX] Extract mac-deal-radar-free-v3.zip into a NEW folder.
  echo [FIX] Use START-HERE-GITHUB-FREE.cmd from that folder ONLY.
  goto fail
)
echo [OK] Project version %APP_VERSION%
echo [CHECK] Windows PowerShell availability
where powershell.exe >nul 2>&1
if errorlevel 1 goto missingps
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\github-bootstrap.ps1"
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo [OK] GitHub deployment checks completed.
) else (
  echo [ERROR] Deployment failed. Read the failure above.
  echo [TIP] For GitHub authentication, run: gh auth login
  echo [TIP] For username, run: gh api user --jq .login
)
echo.
pause
exit /b %RC%
:wrongfolder
echo [ERROR] No current-version project files were found in this folder.
goto fail
:missingnode
echo [ERROR] Node.js is required. You already had Node installed in your previous logs.
goto fail
:missingps
echo [ERROR] Windows PowerShell is required.
:fail
pause
exit /b 1
