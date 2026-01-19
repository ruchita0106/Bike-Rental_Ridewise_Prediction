@echo off
echo ========================================
echo Starting RideWise Application
echo ========================================
echo.

REM Start backend in a new window
echo Starting Backend Server...
start "RideWise Backend" cmd /k "cd backend && start.bat"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting Frontend...
echo.
call start-frontend.bat

