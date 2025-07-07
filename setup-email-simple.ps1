# Simple Email Setup Script for Bittrr

Write-Host "🚀 Bittrr Email Setup" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
$envFile = "server\.env"
if (Test-Path $envFile) {
    Write-Host "✅ Found .env file" -ForegroundColor Green
} else {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item "server\env-template.txt" $envFile
    Write-Host "✅ Created .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "📧 Gmail Setup Steps:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Enable 2-Factor Authentication on your Gmail account" -ForegroundColor Yellow
Write-Host "   • Go to: https://myaccount.google.com/security" -ForegroundColor White
Write-Host "   • Enable '2-Step Verification'" -ForegroundColor White
Write-Host ""

Write-Host "2. Generate App Password" -ForegroundColor Yellow
Write-Host "   • In Google Account settings > Security" -ForegroundColor White
Write-Host "   • Under '2-Step Verification', click 'App passwords'" -ForegroundColor White
Write-Host "   • Select 'Mail' and 'Other', name it 'Bittrr'" -ForegroundColor White
Write-Host "   • Copy the 16-character password" -ForegroundColor White
Write-Host ""

Write-Host "3. Edit the .env file" -ForegroundColor Yellow
Write-Host "   • Open: $envFile" -ForegroundColor White
Write-Host "   • Replace 'your-email@gmail.com' with your Gmail address" -ForegroundColor White
Write-Host "   • Replace 'your-16-character-app-password' with your App Password" -ForegroundColor White
Write-Host ""

Write-Host "Would you like to open the .env file now? (y/n)" -ForegroundColor Cyan
$openFile = Read-Host

if ($openFile -eq "y" -or $openFile -eq "Y") {
    Write-Host "Opening .env file..." -ForegroundColor Yellow
    notepad $envFile
    Write-Host "✅ Please save the file after editing" -ForegroundColor Green
}

Write-Host ""
Write-Host "After editing the .env file, run: node test-email-simple.js" -ForegroundColor Green
Write-Host "to test your email configuration." -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 