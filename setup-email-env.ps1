# Email Environment Setup Script for Bittrr
# This script will help you set up Gmail App Password and environment variables

Write-Host "🚀 Bittrr Email Setup Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Step 1: Check if .env file exists
$envFile = "server\.env"
if (Test-Path $envFile) {
    Write-Host "✅ Found existing .env file" -ForegroundColor Green
} else {
    Write-Host "📝 Creating new .env file..." -ForegroundColor Yellow
    Copy-Item "server\env-template.txt" $envFile
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
}

Write-Host ""
Write-Host "📧 Gmail Setup Instructions:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Enable 2-Factor Authentication" -ForegroundColor Yellow
Write-Host "   • Go to https://myaccount.google.com/" -ForegroundColor White
Write-Host "   • Navigate to 'Security'" -ForegroundColor White
Write-Host "   • Enable '2-Step Verification'" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Generate App Password" -ForegroundColor Yellow
Write-Host "   • In Google Account settings, go to 'Security'" -ForegroundColor White
Write-Host "   • Under '2-Step Verification', click 'App passwords'" -ForegroundColor White
Write-Host "   • Select 'Mail' as the app and 'Other' as the device" -ForegroundColor White
Write-Host "   • Enter 'Bittrr' as the name" -ForegroundColor White
Write-Host "   • Click 'Generate'" -ForegroundColor White
Write-Host "   • Copy the 16-character password (you'll only see it once!)" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Configure Environment Variables" -ForegroundColor Yellow
Write-Host "   • Open the file: $envFile" -ForegroundColor White
Write-Host "   • Replace 'your-email@gmail.com' with your Gmail address" -ForegroundColor White
Write-Host "   • Replace 'your-16-character-app-password' with your App Password" -ForegroundColor White
Write-Host ""

# Ask user if they want to proceed with manual setup
Write-Host "Would you like to:" -ForegroundColor Cyan
Write-Host "1. Open the .env file for manual editing" -ForegroundColor White
Write-Host "2. Continue with current setup" -ForegroundColor White
Write-Host "3. Exit setup" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "Opening .env file for editing..." -ForegroundColor Yellow
        notepad $envFile
        Write-Host "✅ Please edit the file and save it, then run this script again to test." -ForegroundColor Green
    }
    "2" {
        Write-Host "Proceeding with current setup..." -ForegroundColor Yellow
        Test-EmailConfiguration
    }
    "3" {
        Write-Host "Setup cancelled. You can run this script again later." -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        exit
    }
}

function Test-EmailConfiguration {
    Write-Host ""
    Write-Host "🧪 Testing Email Configuration..." -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    
    # Load environment variables from .env file
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
    
    # Check if variables are set
    $emailUser = [Environment]::GetEnvironmentVariable("EMAIL_USER", "Process")
    $emailPassword = [Environment]::GetEnvironmentVariable("EMAIL_PASSWORD", "Process")
    
    Write-Host "📧 Email Configuration Status:" -ForegroundColor Yellow
    if ($emailUser) {
        Write-Host "  EMAIL_USER: ✅ Set" -ForegroundColor Green
    } else {
        Write-Host "  EMAIL_USER: ❌ Not set" -ForegroundColor Red
    }
    
    if ($emailPassword) {
        Write-Host "  EMAIL_PASSWORD: ✅ Set" -ForegroundColor Green
    } else {
        Write-Host "  EMAIL_PASSWORD: ❌ Not set" -ForegroundColor Red
    }
    
    if (-not $emailUser -or -not $emailPassword) {
        Write-Host ""
        Write-Host "❌ Email environment variables not configured!" -ForegroundColor Red
        Write-Host "Please edit the .env file and set your Gmail credentials." -ForegroundColor Yellow
        Write-Host "Then run this script again to test." -ForegroundColor Yellow
        return
    }
    
    # Test email functionality
    Write-Host ""
    Write-Host "📤 Testing email connection..." -ForegroundColor Yellow
    
    try {
        # Create a simple test script
        $testScript = @"
const nodemailer = require('nodemailer');

async function testConnection() {
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: '$emailUser',
            pass: '$emailPassword'
        }
    });
    
    try {
        await transporter.verify();
        console.log('✅ Email connection verified successfully!');
        return true;
    } catch (error) {
        console.error('❌ Email connection failed:', error.message);
        return false;
    }
}

testConnection();
"@
        
        $testScript | Out-File -FilePath "temp-email-test.js" -Encoding UTF8
        
        # Run the test
        $result = node "temp-email-test.js" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Email configuration is working!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Setup Complete!" -ForegroundColor Green
            Write-Host "Your email service is now configured and ready to use." -ForegroundColor Green
            Write-Host "New users will receive welcome emails when they sign up with Google OAuth." -ForegroundColor Green
        } else {
            Write-Host "❌ Email configuration failed!" -ForegroundColor Red
            Write-Host "Please check:" -ForegroundColor Yellow
            Write-Host "1. Your Gmail address is correct" -ForegroundColor White
            Write-Host "2. You're using an App Password (not your regular password)" -ForegroundColor White
            Write-Host "3. 2-Factor Authentication is enabled on your Gmail account" -ForegroundColor White
        }
        
        # Clean up
        Remove-Item "temp-email-test.js" -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "❌ Error testing email configuration: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 