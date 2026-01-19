# Test both endpoints

# Test Day Prediction
$day_body = @{
    dteday = "2026-01-11"
    season = "summer"
    holiday = "0"
    workingday = "1"
    weathersit = "cloudy"
    temp = 20
    atemp = 18
    hum = 50
} | ConvertTo-Json

Write-Host "Testing /predict/day endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/predict/day" -Method POST -Body $day_body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode) - OK"
    Write-Host "Day Prediction: $($response.Content)"
} catch {
    Write-Host "Day Prediction FAILED: $_"
}

Start-Sleep -Seconds 1

# Test Hour Prediction
$hour_body = @{
    dteday = "2026-01-11"
    hr = 10
    season = "summer"
    holiday = "0"
    workingday = "1"
    weathersit = "cloudy"
    temp = 20
    atemp = 18
    hum = 50
    windspeed = 5
} | ConvertTo-Json

Write-Host "`nTesting /predict/hour endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/predict/hour" -Method POST -Body $hour_body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode) - OK"
    Write-Host "Hour Prediction: $($response.Content)"
} catch {
    Write-Host "Hour Prediction FAILED: $_"
}

# Test Health
Write-Host "`nTesting /health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/health" -Method GET
    Write-Host "Health Check: $($response.Content)"
} catch {
    Write-Host "Health Check FAILED: $_"
}
