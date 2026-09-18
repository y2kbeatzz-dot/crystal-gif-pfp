@echo off
setlocal
title Crystal GIF PFP - FIX EVERYTHING v2.2.5
cd /d "%~dp0"

echo.
echo ==================================================
echo   Crystal GIF PFP - FIX EVERYTHING v2.2.5
echo ==================================================
echo.
echo This updates your existing Crystal extension and Cloudflare Worker.
echo It reuses your EXISTING crystal-shared-pfp D1 database.
echo It does NOT create a second database.
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  pause
  exit /b 1
)

set "FIXSCRIPT=%~dp0scripts\fix-everything.mjs"

if not exist "%FIXSCRIPT%" (
  echo ERROR: scripts\fix-everything.mjs is missing.
  echo Re-extract the v2.2.5 ZIP and keep the scripts folder next to this CMD.
  pause
  exit /b 1
)

node.exe "%FIXSCRIPT%"
if errorlevel 1 (
  echo.
  echo ==================================================
  echo   FIX STOPPED
  echo ==================================================
  echo Send the full error above back to ChatGPT.
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
