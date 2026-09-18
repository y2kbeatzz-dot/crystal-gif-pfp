@echo off
setlocal
title Crystal GIF PFP - FIX EVERYTHING
cd /d "%~dp0"

echo.
echo ==================================================
echo   Crystal GIF PFP - FIX EVERYTHING
echo ==================================================
echo.
echo This updater downloads the newest repair script from GitHub,
echo updates Crystal GIF PFP, reuses your EXISTING Cloudflare D1
echo database, deploys the newest Worker, and checks it live.
echo.
echo It does NOT create a second Cloudflare database.
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  pause
  exit /b 1
)

set "FIXSCRIPT=%~dp0scripts\fix-everything.mjs"

if not exist "%FIXSCRIPT%" (
  set "FIXSCRIPT=%TEMP%\crystal-gif-pfp-fix-everything.mjs"
  echo Downloading newest repair script...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing 'https://raw.githubusercontent.com/y2kbeatzz-dot/crystal-gif-pfp/main/scripts/fix-everything.mjs' -OutFile '%FIXSCRIPT%'"
  if errorlevel 1 (
    echo ERROR: Could not download the repair script from GitHub.
    pause
    exit /b 1
  )
)

node.exe "%FIXSCRIPT%"
if errorlevel 1 (
  echo.
  echo ==================================================
  echo   FIX STOPPED
  echo ==================================================
  echo Send the error shown above back to ChatGPT.
  pause
  exit /b 1
)

echo.
echo ==================================================
echo   FIX COMPLETE
echo ==================================================
echo.
echo Reload Crystal GIF PFP in BOTH Chrome profiles,
echo then refresh both YouTube windows.
echo.
pause
