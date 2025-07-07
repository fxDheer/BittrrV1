# Project Cleanup Script
Write-Host "Cleaning up Bittrr project..." -ForegroundColor Green

# Files to remove (test files)
$testFiles = @(
    "test-image-access.js",
    "test-registration-local.ps1",
    "test-frontend-backend-integration.js",
    "test123.txt",
    "test-backend-endpoints.js",
    "test-aws-ses-email.js",
    "test-email-direct.js",
    "test-email-functionality.js",
    "test-email-simple.js",
    "test-google-oauth.js",
    "test-deployment.js",
    "test-frontend-detailed.js",
    "test-frontend.js",
    "test-index.html",
    "test-google-oauth-flow.html"
)

# Old/Redundant deployment scripts
$oldDeploymentScripts = @(
    "deploy-backend-simple.bat",
    "deploy-backend-fix.bat",
    "deploy-backend.sh",
    "deploy-aws.sh",
    "deploy-aws-simple.sh",
    "setup-google-oauth.sh",
    "setup-backend-https.sh",
    "setup-cloudfront.sh",
    "setup-domain.sh"
)

# Certificate/Config files
$certFiles = @(
    "cert-details.json",
    "certificates.json",
    "current-config.json",
    "updated-config.json",
    "final-cert-details.json",
    "final-cert-request.json",
    "new-cert-details.json",
    "new-cert-request.json"
)

# Large archive files
$archiveFiles = @(
    "client.zip",
    "server.zip"
)

# Documentation files (keeping only essential ones)
$docFiles = @(
    "NEXT_PHASE_README.md",
    "TECHNICAL_HANDOFF.md",
    "BITTTR_PUBLIC_DEPLOYMENT_SUMMARY.md",
    "PROJECT_STATUS.md",
    "EMAIL_SETUP.md",
    "GOOGLE_OAUTH_SETUP.md",
    "AWS-SETUP.md"
)

# Utility scripts
$utilityScripts = @(
    "check-deployment.ps1",
    "check-deployment.sh",
    "check-frontend-content.js",
    "check-server-routes.js",
    "check-s3-content.ps1",
    "diagnose-deployment.ps1",
    "diagnose-deployment.sh",
    "diagnose-deployment-simple.ps1",
    "get-cloudfront-id.ps1",
    "verify-project-status.js",
    "deployment-status-checker.js"
)

# Combine all files to remove
$filesToRemove = $testFiles + $oldDeploymentScripts + $certFiles + $archiveFiles + $docFiles + $utilityScripts

# Remove files
$removedCount = 0
$totalSize = 0

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        $fileSize = (Get-Item $file).Length
        $totalSize += $fileSize
        Remove-Item $file -Force
        Write-Host "Removed: $file" -ForegroundColor Yellow
        $removedCount++
    }
}

# Convert total size to MB
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "`nCleanup completed!" -ForegroundColor Green
Write-Host "Files removed: $removedCount" -ForegroundColor Green
Write-Host "Space freed: $totalSizeMB MB" -ForegroundColor Green

# Show remaining files
Write-Host "`nRemaining files in project root:" -ForegroundColor Cyan
Get-ChildItem -File | Select-Object Name, Length | Format-Table -AutoSize 