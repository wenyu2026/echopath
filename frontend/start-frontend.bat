@echo off
rem ============================================
rem  EchoPath frontend launcher (Windows)
rem  - serves the UI on port 7200 and proxies /api to the backend
rem  - opens the browser automatically
rem  - keep this window open while using the app
rem ============================================
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js 24 or newer: https://nodejs.org
  pause
  exit /b 1
)
echo Starting EchoPath UI on http://localhost:7200 ...
echo (This window must stay open. Press Ctrl+C to stop.)
set ECHOPATH_API=http://localhost:3100
start "" http://localhost:7200/
node server.mjs --port 7200 --host 127.0.0.1
pause
