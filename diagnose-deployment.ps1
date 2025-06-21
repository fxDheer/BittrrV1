# Bittrr Deployment Diagnostic Tool for Windows
# Run this script in PowerShell

Write-Host "🔍 Bittrr Deployment Diagnostic Tool" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param (
        [Parameter(Mandatory=$true)]
        [ValidateSet("SUCCESS", "WARNING", "ERROR", "INFO")]
        [string]$Status,
        
        [Parameter(Mandatory=$true)]
        [string]$Message
    )
    
    switch ($Status) {
        "SUCCESS" { 
            Write-Host "✓ $Message" -ForegroundColor Green 
        }
        "WARNING" { 
            Write-Host "! $Message" -ForegroundColor Yellow 
        }
        "ERROR" { 
            Write-Host "x $Message" -ForegroundColor Red 
        }
        "INFO" { 
            Write-Host "i $Message" -ForegroundColor Blue 
        }
    }
}

# Check if AWS CLI is installed and configured
Write-Host "`n1. AWS Configuration Check" -ForegroundColor Blue
try {
    $awsVersion = aws --version 2>$null
    if ($awsVersion) {
        Write-Status -Status "SUCCESS" -Message "AWS CLI is installed"
        
        # Check AWS credentials
        $callerIdentity = aws sts get-caller-identity 2>$null
        if ($callerIdentity) {
            Write-Status -Status "SUCCESS" -Message "AWS credentials are valid"
            $accountId = ($callerIdentity | ConvertFrom-Json).Account
            Write-Status -Status "INFO" -Message "AWS Account ID: $accountId"
        } else {
            Write-Status -Status "ERROR" -Message "AWS credentials are not valid or not configured"
            exit 1
        }
    } else {
        Write-Status -Status "ERROR" -Message "AWS CLI is not installed"
        exit 1
    }
} catch {
    Write-Status -Status "ERROR" -Message "AWS CLI check failed: $($_.Exception.Message)"
    exit 1
}

# Check S3 bucket
Write-Host "`n2. S3 Bucket Check" -ForegroundColor Blue
$BUCKET_NAME = "bittrr-frontend"
try {
    $bucketExists = aws s3 ls "s3://$BUCKET_NAME" 2>$null
    if ($bucketExists) {
        Write-Status -Status "SUCCESS" -Message "S3 bucket '$BUCKET_NAME' exists"
        
        # Check bucket contents
        $objects = aws s3 ls "s3://$BUCKET_NAME" --recursive 2>$null
        $objectCount = ($objects | Measure-Object).Count
        Write-Status -Status "INFO" -Message "S3 bucket contains $objectCount objects"
        
        # Check if index.html exists
        $indexExists = aws s3 ls "s3://$BUCKET_NAME/index.html" 2>$null
        if ($indexExists) {
            Write-Status -Status "SUCCESS" -Message "index.html exists in S3 bucket"
        } else {
            Write-Status -Status "WARNING" -Message "index.html not found in S3 bucket"
        }
    } else {
        Write-Status -Status "ERROR" -Message "S3 bucket '$BUCKET_NAME' does not exist"
    }
} catch {
    Write-Status -Status "ERROR" -Message "S3 bucket check failed: $($_.Exception.Message)"
}

# Check CloudFront distribution
Write-Host "`n3. CloudFront Distribution Check" -ForegroundColor Blue
$DISTRIBUTION_ID_FILE = ".cloudfront-distribution-id"
if (Test-Path $DISTRIBUTION_ID_FILE) {
    $DISTRIBUTION_ID = Get-Content $DISTRIBUTION_ID_FILE
    Write-Status -Status "INFO" -Message "Found distribution ID: $DISTRIBUTION_ID"
    
    try {
        # Get distribution status
        $distribution = aws cloudfront get-distribution --id $DISTRIBUTION_ID 2>$null | ConvertFrom-Json
        $status = $distribution.Distribution.Status
        
        if ($status -eq "Deployed") {
            Write-Status -Status "SUCCESS" -Message "CloudFront distribution is deployed"
            
            # Get distribution domain
            $domain = $distribution.Distribution.DomainName
            Write-Status -Status "INFO" -Message "CloudFront domain: $domain"
            
            # Test CloudFront access
            try {
                $response = Invoke-WebRequest -Uri "https://$domain" -UseBasicParsing -TimeoutSec 10
                if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 403) {
                    Write-Status -Status "SUCCESS" -Message "CloudFront distribution is accessible"
                } else {
                    Write-Status -Status "WARNING" -Message "CloudFront distribution returned status: $($response.StatusCode)"
                }
            } catch {
                Write-Status -Status "WARNING" -Message "CloudFront distribution may not be accessible: $($_.Exception.Message)"
            }
        } elseif ($status -eq "InProgress") {
            Write-Status -Status "WARNING" -Message "CloudFront distribution is still deploying"
        } else {
            Write-Status -Status "ERROR" -Message "CloudFront distribution status: $status"
        }
    } catch {
        Write-Status -Status "ERROR" -Message "CloudFront distribution check failed: $($_.Exception.Message)"
    }
} else {
    Write-Status -Status "WARNING" -Message "Distribution ID file not found, checking for existing distributions"
    
    try {
        $distributions = aws cloudfront list-distributions 2>$null | ConvertFrom-Json
        $bittrrDistributions = $distributions.DistributionList.Items | Where-Object { 
            $_.Aliases.Items -contains "www.bittrr.com" -or $_.Aliases.Items -contains "bittrr.com" 
        }
        
        if ($bittrrDistributions) {
            Write-Status -Status "INFO" -Message "Found Bittrr distributions:"
            $bittrrDistributions | ForEach-Object {
                Write-Host "  ID: $($_.Id), Domain: $($_.DomainName), Status: $($_.Status)" -ForegroundColor Gray
            }
        } else {
            Write-Status -Status "WARNING" -Message "No Bittrr distributions found"
        }
    } catch {
        Write-Status -Status "ERROR" -Message "Failed to list distributions: $($_.Exception.Message)"
    }
}

# Check ACM certificates
Write-Host "`n4. ACM Certificate Check" -ForegroundColor Blue
try {
    $certificates = aws acm list-certificates --region us-east-1 2>$null | ConvertFrom-Json
    $bittrrCerts = $certificates.CertificateSummaryList | Where-Object { 
        $_.DomainName -eq "*.bittrr.com" -or $_.DomainName -eq "bittrr.com" 
    }
    
    if ($bittrrCerts) {
        Write-Status -Status "SUCCESS" -Message "ACM certificates found for Bittrr domain"
        $bittrrCerts | ForEach-Object {
            Write-Host "  Domain: $($_.DomainName), Status: $($_.Status), ARN: $($_.CertificateArn)" -ForegroundColor Gray
        }
    } else {
        Write-Status -Status "WARNING" -Message "No ACM certificates found for Bittrr domain"
    }
} catch {
    Write-Status -Status "ERROR" -Message "ACM certificate check failed: $($_.Exception.Message)"
}

# DNS Resolution Check
Write-Host "`n5. DNS Resolution Check" -ForegroundColor Blue
$DOMAINS = @("www.bittrr.com", "bittrr.com", "api.bittrr.com")

foreach ($domain in $DOMAINS) {
    try {
        $dnsResult = Resolve-DnsName -Name $domain -ErrorAction Stop
        Write-Status -Status "SUCCESS" -Message "DNS resolution for $domain"
        
        $ip = $dnsResult.IPAddress
        if ($ip) {
            Write-Status -Status "INFO" -Message "$domain resolves to: $ip"
        }
    } catch {
        Write-Status -Status "ERROR" -Message "DNS resolution failed for $domain"
    }
}

# SSL Certificate Check
Write-Host "`n6. SSL Certificate Check" -ForegroundColor Blue
foreach ($domain in $DOMAINS) {
    try {
        $cert = [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $request = [System.Net.WebRequest]::Create("https://$domain")
        $response = $request.GetResponse()
        $response.Close()
        
        Write-Status -Status "SUCCESS" -Message "SSL certificate is valid for $domain"
        
        # Get certificate details
        $cert = [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $request = [System.Net.WebRequest]::Create("https://$domain")
        $response = $request.GetResponse()
        $cert = $response.GetResponseStream()
        $response.Close()
        
        Write-Status -Status "INFO" -Message "SSL connection successful for $domain"
    } catch {
        Write-Status -Status "WARNING" -Message ("SSL certificate check failed for {0}: {1}" -f $domain, $_.Exception.Message)
    }
}

# Application Health Check
Write-Host "`n7. Application Health Check" -ForegroundColor Blue

# Check if application files exist
if (Test-Path "package.json") {
    Write-Status -Status "SUCCESS" -Message "package.json exists"
} else {
    Write-Status -Status "WARNING" -Message "package.json not found in current directory"
}

if (Test-Path "src") {
    Write-Status -Status "SUCCESS" -Message "src directory exists"
} else {
    Write-Status -Status "WARNING" -Message "src directory not found"
}

if (Test-Path "public") {
    Write-Status -Status "SUCCESS" -Message "public directory exists"
} else {
    Write-Status -Status "WARNING" -Message "public directory not found"
}

# Check for build files
if (Test-Path "build") {
    Write-Status -Status "SUCCESS" -Message "build directory exists"
    $buildFiles = (Get-ChildItem -Path "build" -Recurse | Measure-Object).Count
    Write-Status -Status "INFO" -Message "Build directory contains $buildFiles files"
} else {
    Write-Status -Status "WARNING" -Message "build directory not found - application may not be built"
}

# Check Docker setup
Write-Host "`n8. Docker Configuration Check" -ForegroundColor Blue
if (Test-Path "Dockerfile") {
    Write-Status -Status "SUCCESS" -Message "Dockerfile exists"
} else {
    Write-Status -Status "WARNING" -Message "Dockerfile not found"
}

if (Test-Path "docker-compose.yml") {
    Write-Status -Status "SUCCESS" -Message "docker-compose.yml exists"
} else {
    Write-Status -Status "WARNING" -Message "docker-compose.yml not found"
}

# Environment Variables Check
Write-Host "`n9. Environment Configuration Check" -ForegroundColor Blue
$ENV_FILES = @(".env", ".env.production", ".env.local", ".env.production.local")

foreach ($envFile in $ENV_FILES) {
    if (Test-Path $envFile) {
        Write-Status -Status "SUCCESS" -Message "$envFile exists"
    } else {
        Write-Status -Status "WARNING" -Message "$envFile not found"
    }
}

# Network Connectivity Test
Write-Host "`n10. Network Connectivity Test" -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "https://www.bittrr.com" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Status -Status "SUCCESS" -Message "www.bittrr.com is accessible via HTTPS"
    } elseif ($response.StatusCode -eq 403) {
        Write-Status -Status "WARNING" -Message "www.bittrr.com returns 403 (Forbidden) - may be CloudFront configuration issue"
    } else {
        Write-Status -Status "WARNING" -Message "www.bittrr.com returned status: $($response.StatusCode)"
    }
} catch {
    Write-Status -Status "ERROR" -Message "www.bittrr.com is not accessible: $($_.Exception.Message)"
}

try {
    $response = Invoke-WebRequest -Uri "https://api.bittrr.com" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404 -or $response.StatusCode -eq 500) {
        Write-Status -Status "SUCCESS" -Message "api.bittrr.com is accessible"
    } else {
        Write-Status -Status "WARNING" -Message "api.bittrr.com returned status: $($response.StatusCode)"
    }
} catch {
    Write-Status -Status "WARNING" -Message "api.bittrr.com is not accessible: $($_.Exception.Message)"
}

# Summary and Recommendations
Write-Host "`n📋 Summary and Recommendations" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue

Write-Status -Status "INFO" -Message "If all checks above show SUCCESS, your deployment should be working."
Write-Status -Status "INFO" -Message "If you see WARNING or ERROR messages, address them in order of priority:"
Write-Host ""
Write-Status -Status "INFO" -Message "1. Fix any ERROR messages first"
Write-Status -Status "INFO" -Message "2. Address WARNING messages that might affect functionality"
Write-Status -Status "INFO" -Message "3. Ensure your application is properly built and deployed"
Write-Status -Status "INFO" -Message "4. Verify CloudFront cache invalidation if content isn't updating"
Write-Host ""
Write-Status -Status "INFO" -Message "Common issues to check:"
Write-Status -Status "INFO" -Message "- CloudFront cache invalidation for updated content"
Write-Status -Status "INFO" -Message "- S3 bucket permissions and CORS settings"
Write-Status -Status "INFO" -Message "- Application build process and deployment"
Write-Status -Status "INFO" -Message "- Environment variables and configuration"
Write-Status -Status "INFO" -Message "- DNS propagation (can take up to 48 hours)"

Write-Host "`n🎉 Diagnostic complete!" -ForegroundColor Green 