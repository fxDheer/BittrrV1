#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Bittrr Complete Deployment Script
    
.DESCRIPTION
    This script deploys both frontend and backend components of the Bittrr application
    with comprehensive error handling and status verification.
    
.PARAMETER FrontendOnly
    Deploy only the frontend
    
.PARAMETER BackendOnly
    Deploy only the backend
    
.PARAMETER SkipTests
    Skip running tests before deployment
    
.EXAMPLE
    .\quick-deploy-all.ps1
    Deploy both frontend and backend
    
.EXAMPLE
    .\quick-deploy-all.ps1 -FrontendOnly
    Deploy only the frontend
#>

param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$SkipTests
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Colors = @{
    Reset = "`e[0m"
    Bright = "`e[1m"
    Red = "`e[31m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Magenta = "`e[35m"
    Cyan = "`e[36m"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "Reset"
    )
    Write-Host "$($Colors[$Color])$Message$($Colors.Reset)"
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." "Blue"
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js: $nodeVersion" "Green"
    }
    catch {
        Write-ColorOutput "❌ Node.js not found. Please install Node.js first." "Red"
        exit 1
    }
    
    # Check if npm is installed
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✅ npm: $npmVersion" "Green"
    }
    catch {
        Write-ColorOutput "❌ npm not found. Please install npm first." "Red"
        exit 1
    }
    
    # Check if AWS CLI is installed (for frontend deployment)
    if (-not $BackendOnly) {
        try {
            $awsVersion = aws --version
            Write-ColorOutput "✅ AWS CLI: $awsVersion" "Green"
        }
        catch {
            Write-ColorOutput "⚠️  AWS CLI not found. Frontend deployment may fail." "Yellow"
        }
    }
    
    # Check if Vercel CLI is installed (for backend deployment)
    if (-not $FrontendOnly) {
        try {
            $vercelVersion = vercel --version
            Write-ColorOutput "✅ Vercel CLI: $vercelVersion" "Green"
        }
        catch {
            Write-ColorOutput "⚠️  Vercel CLI not found. Backend deployment may fail." "Yellow"
        }
    }
}

function Test-ProjectStructure {
    Write-ColorOutput "📁 Checking project structure..." "Blue"
    
    $requiredDirs = @("client", "server")
    $missingDirs = @()
    
    foreach ($dir in $requiredDirs) {
        if (Test-Path $dir) {
            Write-ColorOutput "✅ $dir/ directory found" "Green"
        }
        else {
            Write-ColorOutput "❌ $dir/ directory not found" "Red"
            $missingDirs += $dir
        }
    }
    
    if ($missingDirs.Count -gt 0) {
        Write-ColorOutput "❌ Missing required directories: $($missingDirs -join ', ')" "Red"
        exit 1
    }
}

function Install-Dependencies {
    param([string]$ProjectPath, [string]$ProjectName)
    
    Write-ColorOutput "📦 Installing dependencies for $ProjectName..." "Blue"
    
    Push-Location $ProjectPath
    
    try {
        # Remove existing node_modules and package-lock.json for clean install
        if (Test-Path "node_modules") {
            Write-ColorOutput "🧹 Cleaning existing node_modules..." "Yellow"
            Remove-Item -Recurse -Force "node_modules"
        }
        
        if (Test-Path "package-lock.json") {
            Remove-Item "package-lock.json"
        }
        
        # Install dependencies
        Write-ColorOutput "📥 Installing npm packages..." "Blue"
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Dependencies installed successfully" "Green"
        }
        else {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-ColorOutput "❌ Failed to install dependencies: $($_.Exception.Message)" "Red"
        throw
    }
    finally {
        Pop-Location
    }
}

function Test-Project {
    param([string]$ProjectPath, [string]$ProjectName)
    
    if ($SkipTests) {
        Write-ColorOutput "⏭️  Skipping tests for $ProjectName" "Yellow"
        return
    }
    
    Write-ColorOutput "🧪 Running tests for $ProjectName..." "Blue"
    
    Push-Location $ProjectPath
    
    try {
        # Check if test script exists
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            Write-ColorOutput "🔬 Running npm test..." "Blue"
            npm test
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Tests passed" "Green"
            }
            else {
                throw "Tests failed with exit code $LASTEXITCODE"
            }
        }
        else {
            Write-ColorOutput "⚠️  No test script found, skipping tests" "Yellow"
        }
    }
    catch {
        Write-ColorOutput "❌ Tests failed: $($_.Exception.Message)" "Red"
        throw
    }
    finally {
        Pop-Location
    }
}

function Deploy-Frontend {
    Write-ColorOutput "🚀 Deploying frontend..." "Blue"
    
    Push-Location "client"
    
    try {
        # Build the project
        Write-ColorOutput "🔨 Building frontend..." "Blue"
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        
        Write-ColorOutput "✅ Frontend built successfully" "Green"
        
        # Deploy to AWS S3 + CloudFront
        Write-ColorOutput "☁️  Deploying to AWS S3..." "Blue"
        
        # Check if deployment script exists
        if (Test-Path "deploy-frontend.ps1") {
            & .\deploy-frontend.ps1
        }
        elseif (Test-Path "deploy-frontend.sh") {
            bash deploy-frontend.sh
        }
        else {
            Write-ColorOutput "⚠️  No deployment script found. Manual deployment required." "Yellow"
        }
        
        Write-ColorOutput "✅ Frontend deployment completed" "Green"
    }
    catch {
        Write-ColorOutput "❌ Frontend deployment failed: $($_.Exception.Message)" "Red"
        throw
    }
    finally {
        Pop-Location
    }
}

function Deploy-Backend {
    Write-ColorOutput "🚀 Deploying backend..." "Blue"
    
    Push-Location "server"
    
    try {
        # Check if Vercel CLI is available
        try {
            $vercelVersion = vercel --version
            Write-ColorOutput "✅ Vercel CLI available: $vercelVersion" "Green"
        }
        catch {
            Write-ColorOutput "❌ Vercel CLI not found. Please install it first: npm i -g vercel" "Red"
            throw "Vercel CLI not available"
        }
        
        # Deploy to Vercel
        Write-ColorOutput "☁️  Deploying to Vercel..." "Blue"
        vercel --prod
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Backend deployment completed" "Green"
        }
        else {
            throw "Vercel deployment failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-ColorOutput "❌ Backend deployment failed: $($_.Exception.Message)" "Red"
        throw
    }
    finally {
        Pop-Location
    }
}

function Test-Deployment {
    Write-ColorOutput "🔍 Testing deployment..." "Blue"
    
    # Wait a moment for deployment to complete
    Start-Sleep -Seconds 10
    
    # Run deployment status checker
    if (Test-Path "deployment-status-checker.js") {
        Write-ColorOutput "📊 Running deployment status check..." "Blue"
        node deployment-status-checker.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ All systems operational!" "Green"
        }
        else {
            Write-ColorOutput "⚠️  Some deployment issues detected. Check the report above." "Yellow"
        }
    }
    else {
        Write-ColorOutput "⚠️  Deployment status checker not found" "Yellow"
    }
}

function Show-Summary {
    param([hashtable]$Results)
    
    Write-ColorOutput "`n📊 Deployment Summary" "Bright"
    Write-ColorOutput "=" * 50 "Cyan"
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-ColorOutput "Completed: $timestamp" "Cyan"
    
    if ($Results.Frontend) {
        Write-ColorOutput "🌐 Frontend: ✅ Deployed" "Green"
    }
    
    if ($Results.Backend) {
        Write-ColorOutput "⚙️  Backend: ✅ Deployed" "Green"
    }
    
    Write-ColorOutput "`n🎯 Next Steps:" "Bright"
    Write-ColorOutput "1. Test the application manually" "Cyan"
    Write-ColorOutput "2. Monitor logs for any issues" "Cyan"
    Write-ColorOutput "3. Check user feedback" "Cyan"
    Write-ColorOutput "4. Run deployment status checker: node deployment-status-checker.js" "Cyan"
}

# Main execution
try {
    Write-ColorOutput "🚀 Bittrr Complete Deployment Script" "Bright"
    Write-ColorOutput "Starting deployment process..." "Cyan"
    
    # Check prerequisites
    Test-Prerequisites
    
    # Check project structure
    Test-ProjectStructure
    
    # Initialize results
    $DeploymentResults = @{
        Frontend = $false
        Backend = $false
    }
    
    # Deploy frontend
    if (-not $BackendOnly) {
        Write-ColorOutput "`n🌐 Frontend Deployment" "Bright"
        Write-ColorOutput "=" * 30 "Cyan"
        
        Install-Dependencies "client" "Frontend"
        Test-Project "client" "Frontend"
        Deploy-Frontend
        $DeploymentResults.Frontend = $true
    }
    
    # Deploy backend
    if (-not $FrontendOnly) {
        Write-ColorOutput "`n⚙️  Backend Deployment" "Bright"
        Write-ColorOutput "=" * 30 "Cyan"
        
        Install-Dependencies "server" "Backend"
        Test-Project "server" "Backend"
        Deploy-Backend
        $DeploymentResults.Backend = $true
    }
    
    # Test deployment
    Test-Deployment
    
    # Show summary
    Show-Summary $DeploymentResults
    
    Write-ColorOutput "`n🎉 Deployment completed successfully!" "Green"
}
catch {
    Write-ColorOutput "`n💥 Deployment failed: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Check the error details above and try again." "Yellow"
    exit 1
} 