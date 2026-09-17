@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js LTS from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
node "%~dp0scripts\setup-cloudflare.mjs"
echo.
pause
