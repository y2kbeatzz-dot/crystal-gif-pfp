@echo off
setlocal
title Crystal GIF PFP - FIX EVERYTHING
cd /d "%~dp0"

echo.
echo ==================================================
echo   Crystal GIF PFP - FIX EVERYTHING
echo ==================================================
echo.
echo This updater:
echo   - downloads the newest Crystal GIF PFP source
echo   - updates your existing unpacked Chrome copy when found
echo   - keeps a backup of the old extension folder
echo   - reuses your EXISTING Cloudflare D1 database
echo   - applies the safe database schema
echo   - deploys the newest Worker
echo   - checks that Worker v4+ is live
echo.
echo It does NOT create a second Cloudflare database.
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo You already used npm/wrangler before, so normally Node should be installed.
  pause
  exit /b 1
)

node.exe "%~dp0scripts\fix-everything.mjs"
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
echo Chrome Extensions should be open now.
echo Click Reload on Crystal GIF PFP in BOTH Chrome profiles,
echo then refresh both YouTube windows.
echo.
echo On your main profile:
echo   choose the GIF ^> Share my GIF ^> enter @handle ^> Share
echo.
echo On the other/viewer profile:
echo   ONLY enable "See other members' GIFs".
echo   It does not need to be signed into YouTube.
echo.
pause
