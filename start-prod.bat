@echo off
REM AgentFlow Pro - Production Server with Mock Database
REM Use this for UI testing without real database

echo ========================================
echo   AgentFlow Pro - Production Server
echo   (Mock Database Mode)
echo ========================================
echo.

REM Set mock database mode
set MOCK_DATABASE=true
set DATABASE_URL=mock://local

REM Start production server
echo Starting production server...
echo.

npm start
