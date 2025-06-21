Write-Host "Getting CloudFront Distribution ID..." -ForegroundColor Cyan

try {
    $distributions = aws cloudfront list-distributions --output json | ConvertFrom-Json
    $bittrrDist = $distributions.DistributionList.Items | Where-Object { 
        $_.Aliases.Items -contains "www.bittrr.com" -or $_.Aliases.Items -contains "bittrr.com" 
    }
    
    if ($bittrrDist) {
        Write-Host "Found CloudFront Distribution:" -ForegroundColor Green
        Write-Host "ID: $($bittrrDist.Id)" -ForegroundColor Yellow
        Write-Host "Domain: $($bittrrDist.DomainName)" -ForegroundColor Yellow
        Write-Host "Status: $($bittrrDist.Status)" -ForegroundColor Yellow
        
        Write-Host "`nComplete S3 Bucket Policy:" -ForegroundColor Cyan
        Write-Host "{" -ForegroundColor Gray
        Write-Host '    "Version": "2012-10-17",' -ForegroundColor Gray
        Write-Host '    "Id": "PolicyForCloudFrontPrivateContent",' -ForegroundColor Gray
        Write-Host '    "Statement": [' -ForegroundColor Gray
        Write-Host '        {' -ForegroundColor Gray
        Write-Host '            "Sid": "AllowCloudFrontServicePrincipal",' -ForegroundColor Gray
        Write-Host '            "Effect": "Allow",' -ForegroundColor Gray
        Write-Host '            "Principal": {' -ForegroundColor Gray
        Write-Host '                "Service": "cloudfront.amazonaws.com"' -ForegroundColor Gray
        Write-Host '            },' -ForegroundColor Gray
        Write-Host '            "Action": "s3:GetObject",' -ForegroundColor Gray
        Write-Host '            "Resource": "arn:aws:s3:::bittrr-frontend/*",' -ForegroundColor Gray
        Write-Host '            "Condition": {' -ForegroundColor Gray
        Write-Host '                "StringEquals": {' -ForegroundColor Gray
        Write-Host "                    \"AWS:SourceArn\": \"arn:aws:cloudfront::031237326901:distribution/$($bittrrDist.Id)\"" -ForegroundColor Yellow
        Write-Host '                }' -ForegroundColor Gray
        Write-Host '            }' -ForegroundColor Gray
        Write-Host '        }' -ForegroundColor Gray
        Write-Host '    ]' -ForegroundColor Gray
        Write-Host '}' -ForegroundColor Gray
    } else {
        Write-Host "No CloudFront distribution found for bittrr.com domains" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
} 