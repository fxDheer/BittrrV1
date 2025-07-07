# Test Registration Functionality Locally
Write-Host "Testing registration functionality..." -ForegroundColor Green

# Start the server in background
Write-Host "Starting server..." -ForegroundColor Yellow
cd server
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden

# Wait for server to start
Start-Sleep -Seconds 5

# Test database connection
Write-Host "Testing database connection..." -ForegroundColor Yellow
try {
    $dbResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/test-db" -Method GET -TimeoutSec 10
    Write-Host "Database test response:" -ForegroundColor Green
    $dbResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Could not connect to server: $($_.Exception.Message)" -ForegroundColor Red
}

# Test registration
Write-Host "Testing registration..." -ForegroundColor Yellow
$testUser = @{
    name = "Test User"
    email = "test$(Get-Random)@example.com"
    password = "testpassword123"
} | ConvertTo-Json

try {
    $regResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $testUser -ContentType "application/json" -TimeoutSec 10
    Write-Host "Registration response:" -ForegroundColor Green
    $regResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorResponse = $reader.ReadToEnd()
        Write-Host "Error details: $errorResponse" -ForegroundColor Red
    }
}

# Stop the server
Write-Host "Stopping server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Test completed." -ForegroundColor Green 