@echo off
cd /d "%~dp0"
echo [INFO] Starting FREE V3 launcher. Cloudflare will NOT be requested.
call "%~dp0START-HERE-GITHUB-FREE.cmd"
exit /b %ERRORLEVEL%
