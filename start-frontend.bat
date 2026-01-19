@echo off
echo Starting RideWise Frontend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Start the development server
echo Starting Vite development server...
call npm run dev

