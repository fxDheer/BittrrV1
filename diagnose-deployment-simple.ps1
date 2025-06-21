# Bittrr Deployment Diagnostic Tool for Windows
Write-Host "Starting Bittrr deployment diagnostics..." -ForegroundColor Cyan

# Check AWS CLI
Write-Host "`nChecking AWS Configuration..." -ForegroundColor Blue
try {
    $awsVersion = aws --version 2>$null
    if ($awsVersion) {
        Write-Host "✓ AWS CLI is installed" -ForegroundColor Green
        
        # Check AWS credentials
        $callerIdentity = aws sts get-caller-identity 2>$null
        if ($callerIdentity) {
            Write-Host "✓ AWS credentials are valid" -ForegroundColor Green
            $accountId = ($callerIdentity | ConvertFrom-Json).Account
            Write-Host "AWS Account ID: $accountId" -ForegroundColor Blue
        } else {
            Write-Host "x AWS credentials are not valid" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "x AWS CLI is not installed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "x AWS CLI check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check S3 bucket
Write-Host "`nChecking S3 Bucket..." -ForegroundColor Blue
$BUCKET_NAME = "bittrr-frontend"
try {
    $bucketExists = aws s3 ls "s3://$BUCKET_NAME" 2>$null
    if ($bucketExists) {
        Write-Host "✓ S3 bucket '$BUCKET_NAME' exists" -ForegroundColor Green
        
        # Check bucket contents
        $objects = aws s3 ls "s3://$BUCKET_NAME" --recursive 2>$null
        $objectCount = ($objects | Measure-Object).Count
        Write-Host "S3 bucket contains $objectCount objects" -ForegroundColor Blue
        
        # Check if index.html exists
        $indexExists = aws s3 ls "s3://$BUCKET_NAME/index.html" 2>$null
        if ($indexExists) {
            Write-Host "✓ index.html exists in S3 bucket" -ForegroundColor Green
        } else {
            Write-Host "! index.html not found in S3 bucket" -ForegroundColor Yellow
        }
    } else {
        Write-Host "x S3 bucket '$BUCKET_NAME' does not exist" -ForegroundColor Red
    }
} catch {
    Write-Host "x S3 bucket check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check CloudFront distribution
Write-Host "`nChecking CloudFront Distribution..." -ForegroundColor Blue
try {
    $distributions = aws cloudfront list-distributions 2>$null | ConvertFrom-Json
    $bittrrDistributions = $distributions.DistributionList.Items | Where-Object { 
        $_.Aliases.Items -contains "www.bittrr.com" -or $_.Aliases.Items -contains "bittrr.com" 
    }
    
    if ($bittrrDistributions) {
        Write-Host "✓ Found CloudFront distributions for Bittrr:" -ForegroundColor Green
        $bittrrDistributions | ForEach-Object {
            Write-Host "  ID: $($_.Id)" -ForegroundColor Gray
            Write-Host "  Domain: $($_.DomainName)" -ForegroundColor Gray
            Write-Host "  Status: $($_.Status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "! No CloudFront distributions found for Bittrr domains" -ForegroundColor Yellow
    }
} catch {
    Write-Host "x CloudFront check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check ACM certificates
Write-Host "`nChecking ACM Certificates..." -ForegroundColor Blue
try {
    $certificates = aws acm list-certificates --region us-east-1 2>$null | ConvertFrom-Json
    $bittrrCerts = $certificates.CertificateSummaryList | Where-Object { 
        $_.DomainName -eq "*.bittrr.com" -or $_.DomainName -eq "bittrr.com" 
    }
    
    if ($bittrrCerts) {
        Write-Host "✓ Found ACM certificates for Bittrr domains:" -ForegroundColor Green
        $bittrrCerts | ForEach-Object {
            Write-Host "  Domain: $($_.DomainName)" -ForegroundColor Gray
            Write-Host "  Status: $($_.Status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "! No ACM certificates found for Bittrr domains" -ForegroundColor Yellow
    }
} catch {
    Write-Host "x ACM certificate check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check DNS resolution
Write-Host "`nChecking DNS Resolution..." -ForegroundColor Blue
$domains = @("www.bittrr.com", "bittrr.com", "api.bittrr.com")
foreach ($domain in $domains) {
    try {
        $dnsResult = Resolve-DnsName -Name $domain -ErrorAction Stop
        Write-Host "✓ DNS resolution for $domain" -ForegroundColor Green
        $ip = $dnsResult.IPAddress
        if ($ip) {
            Write-Host "  Resolves to: $ip" -ForegroundColor Gray
        }
    } catch {
        Write-Host "x DNS resolution failed for $domain" -ForegroundColor Red
    }
}

# Check HTTPS access
Write-Host "`nChecking HTTPS Access..." -ForegroundColor Blue
foreach ($domain in $domains) {
    try {
        $response = Invoke-WebRequest -Uri "https://$domain" -UseBasicParsing -TimeoutSec 10
        Write-Host "✓ HTTPS access successful for $domain (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "! HTTPS access failed for $domain: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Check local files
Write-Host "`nChecking Local Files..." -ForegroundColor Blue
$files = @(
    "package.json",
    "Dockerfile",
    "docker-compose.yml",
    ".env",
    ".env.production"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "! $file not found" -ForegroundColor Yellow
    }
}

Write-Host "`nDiagnostic complete!" -ForegroundColor Cyan 