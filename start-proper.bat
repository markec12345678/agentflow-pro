@echo off
REM AgentFlow Pro - Production Server
REM Uses local database with proper connection pooling

echo ========================================
echo   AgentFlow Pro - Production Server
echo ========================================
echo.

REM Set database URL
set DATABASE_URL=postgresql://postgres:trust@localhost:5432/agentflow_local?schema=public

REM Kill existing node processes
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start production server
echo Starting production server...
echo Database: agentflow_local@localhost:5432
echo.
echo Test URLs:
echo   - http://localhost:3002
echo   - http://localhost:3002/dashboard
echo   - http://localhost:3002/login
echo.

npm start
