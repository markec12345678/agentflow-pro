@echo off
REM AgentFlow Pro - Start with MOCK database (no real database needed!)
REM Use this for UI testing only

echo ========================================
echo   AgentFlow Pro - MOCK MODE
echo   (No database connection required)
echo ========================================
echo.

REM Set mock mode
set MOCK_DATABASE=true
set DATABASE_URL=mock://local

REM Kill any existing node processes
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start dev server
echo Starting dev server in MOCK mode...
echo.
echo Test URLs:
echo   - http://localhost:3002/test (Test page)
echo   - http://localhost:3002/dashboard (Main dashboard)
echo   - http://localhost:3002/login (Login page)
echo.

npm run dev
