Write-Host "Checking Bittrr deployment status..." -ForegroundColor Cyan

# Check AWS CLI
Write-Host "`nAWS CLI Check:" -ForegroundColor Blue
try {
    $awsVersion = aws --version
    Write-Host "AWS CLI is installed" -ForegroundColor Green
    
    $identity = aws sts get-caller-identity
    Write-Host "AWS credentials are valid" -ForegroundColor Green
} catch {
    Write-Host "Error: AWS CLI not installed or credentials invalid" -ForegroundColor Red
    exit
}

# Check S3
Write-Host "`nS3 Check:" -ForegroundColor Blue
try {
    $bucket = aws s3 ls s3://bittrr-frontend
    Write-Host "S3 bucket exists" -ForegroundColor Green
} catch {
    Write-Host "Error: Cannot access S3 bucket" -ForegroundColor Red
}

# Check CloudFront
Write-Host "`nCloudFront Check:" -ForegroundColor Blue
try {
    $dist = aws cloudfront list-distributions
    Write-Host "CloudFront distribution found" -ForegroundColor Green
} catch {
    Write-Host "Error: Cannot access CloudFront" -ForegroundColor Red
}

# Check DNS
Write-Host "`nDNS Check:" -ForegroundColor Blue
$domains = @("www.bittrr.com", "bittrr.com", "api.bittrr.com")
foreach ($domain in $domains) {
    try {
        $dns = Resolve-DnsName $domain
        Write-Host "$domain resolves successfully" -ForegroundColor Green
    } catch {
        Write-Host "Error: Cannot resolve $domain" -ForegroundColor Red
    }
}

Write-Host "`nCheck complete!" -ForegroundColor Cyan 