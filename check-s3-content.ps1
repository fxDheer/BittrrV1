Write-Host "Checking S3 bucket contents for 'bittrr-frontend'..." -ForegroundColor Cyan

$bucket = "bittrr-frontend"
$expectedFiles = @("index.html", "favicon.ico", "manifest.json", "robots.txt")

$objects = aws s3 ls "s3://$bucket" --recursive | Select-String -Pattern ""

if ($objects) {
    Write-Host "S3 bucket contains the following files:" -ForegroundColor Green
    $objects | ForEach-Object { Write-Host $_.Line -ForegroundColor Gray }
    foreach ($file in $expectedFiles) {
        $found = $false
        foreach ($obj in $objects) {
            if ($obj.Line -like "*$file") { $found = $true }
        }
        if ($found) {
            Write-Host "✓ $file found" -ForegroundColor Green
        } else {
            Write-Host "! $file NOT found" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "S3 bucket is empty or cannot be listed." -ForegroundColor Red
}

Write-Host "Check complete!" -ForegroundColor Cyan