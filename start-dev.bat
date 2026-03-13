@echo off
REM AgentFlow Pro - Start Dev Server with proper env vars
REM This ensures DATABASE_URL is set correctly before starting

echo ========================================
echo   AgentFlow Pro - Dev Server
echo ========================================
echo.

REM Set DATABASE_URL
set DATABASE_URL=postgresql://postgres@localhost:5432/agentflow?connection_limit=20^&connect_timeout=15

REM Check if PostgreSQL is running
echo Checking PostgreSQL...
netstat -ano | findstr :5432 >nul
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not running!
    echo Please run:
    echo   ^& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\18\data"
    pause
    exit /b 1
)
echo OK - PostgreSQL is running
echo.

REM Start Next.js
echo Starting Next.js dev server...
echo DATABASE_URL: %DATABASE_URL%
echo.

npm run dev
