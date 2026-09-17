@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  echo Download it from https://nodejs.org/
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4317"
node server.mjs
pause
