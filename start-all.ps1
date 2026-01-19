Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting RideWise Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend in a new window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\start.bat"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Write-Host ""
& "$PSScriptRoot\start-frontend.bat"

