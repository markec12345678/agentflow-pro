@echo off
echo ========================================
echo   AgentFlow Pro - Dashboard URL Test
echo ========================================
echo.

set passed=0
set failed=0

for %%u in (
  / /login /register /pricing /dashboard
  /dashboard/tourism /dashboard/receptor /dashboard/properties
  /dashboard/tourism/calendar /dashboard/tourism/generate
  /dashboard/tourism/inbox /dashboard/tourism/email
  /dashboard/tourism/landing /dashboard/tourism/seo
  /dashboard/receptor/quick-reservation
  /dashboard/properties/create
  /dashboard/reservations /dashboard/reservations/check-in
  /dashboard/workflows /dashboard/mcp-builder
  /dashboard/settings /dashboard/insights
  /onboarding /forgot-password /generate /content
) do (
  curl -s -o nul -w "%%{http_code}" http://localhost:3002%%u | findstr /R "^200" >nul
  if %errorlevel% equ 0 (
    echo [OK]  %%u
    set /a passed+=1
  ) else (
    echo [ERR] %%u
    set /a failed+=1
  )
)

echo.
echo ========================================
echo   SUMMARY
echo ========================================
echo Passed: %passed%
echo Failed: %failed%
echo Total:  %passed% + %failed%
echo.
