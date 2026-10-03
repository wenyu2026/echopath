@echo off
setlocal
rem ============================================
rem  EchoPath backend launcher (Windows)
rem  - starts the API server on port 3100
rem  - keep this window open while using the app
rem
rem  NOTE: keep this file pure ASCII. cmd.exe parses .bat as the
rem  system codepage (GBK on zh-CN); UTF-8 Chinese comments would
rem  corrupt the script and it would silently exit.
rem ============================================
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js 24 or newer:
  echo         https://nodejs.org
  pause
  exit /b 1
)

rem Version check. for /f may yield a trailing space, so normalise with set /a;
rem comparing the raw value can break "if" and make the script exit silently.
set NODE_MAJOR=0
for /f "tokens=1" %%v in ('node -p "process.versions.node.split('.')[0]"') do set /a NODE_MAJOR=%%v

if %NODE_MAJOR% LSS 23 (
  echo [ERROR] Node.js is too old: found v%NODE_MAJOR%, need 23.6+ ^(24 recommended^).
  echo         Please upgrade: https://nodejs.org
  pause
  exit /b 1
)

rem A fresh clone has no .env; create one from the template so the
rem server can start (AI features need a key, everything else works without).
if not exist ".env" (
  echo [WARN] .env not found - creating one from .env.example ...
  if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo [WARN] Created .env. Fill TOKENDANCE_API_KEY to enable AI features.
    echo        Everything else runs without a key - see README.
    echo.
  ) else (
    echo [WARN] .env.example is also missing. Continuing without a key.
    echo.
  )
)

echo Starting EchoPath backend on http://localhost:3100 ...
echo (This window must stay open. Press Ctrl+C to stop.)
set PORT=3100
node --env-file=.env server\api.ts

echo.
echo [backend stopped]
pause
