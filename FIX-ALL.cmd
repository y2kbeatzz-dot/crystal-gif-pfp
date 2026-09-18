@echo off
setlocal
title Crystal GIF PFP - Fix All
cd /d "%~dp0"

echo.
echo ==============================================
echo   Crystal GIF PFP v2.2 - FIX ALL
echo ==============================================
echo.
echo This keeps your existing Cloudflare account and D1 database.
echo It updates the Worker and then opens the extension folder.
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js first, then run this file again.
  pause
  exit /b 1
)

node.exe ".\scripts\fix-all.mjs"
if errorlevel 1 (
  echo.
  echo The repair stopped because of the error above.
  echo Send the full window output to ChatGPT and it can be fixed from there.
  pause
  exit /b 1
)

echo.
echo ==============================================
echo   DONE
echo ==============================================
echo Reload Crystal GIF PFP in chrome://extensions,
echo then refresh both YouTube windows.
echo.
pause
