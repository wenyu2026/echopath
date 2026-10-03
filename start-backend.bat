@echo off
rem ============================================
rem  EchoPath backend launcher (Windows)
rem  - starts the API server on port 3100
rem  - keep this window open while using the app
rem ============================================
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js 24 or newer: https://nodejs.org
  echo         (direct link for Windows: https://nodejs.org/en/download)
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 23 (
  echo [ERROR] Node.js version is too old: %NODE_MAJOR%
  echo         This project needs Node.js 23.6+ ^(24 recommended^). Please upgrade.
  pause
  exit /b 1
)
echo Starting EchoPath backend on http://localhost:3100 ...
echo (This window must stay open. Press Ctrl+C to stop.)
set PORT=3100
node --env-file=.env server\api.ts
pause
