# Variables
$bucketName = "bittrr-frontend"
$domainName = "www.bittrr.com"

# Create CloudFront distribution
Write-Host "Creating CloudFront distribution..."

$distributionConfig = @{
    DistributionConfig = @{
        CallerReference = (Get-Date).ToString("yyyyMMddHHmmss")
        Origins = @{
            Quantity = 1
            Items = @(
                @{
                    Id = "S3-$bucketName"
                    DomainName = "$bucketName.s3.amazonaws.com"
                    S3OriginConfig = @{
                        OriginAccessIdentity = ""
                    }
                }
            )
        }
        DefaultCacheBehavior = @{
            ViewerProtocolPolicy = "redirect-to-https"
            AllowedMethods = @{
                Quantity = 2
                Items = @("GET", "HEAD")
                CachedMethods = @{
                    Quantity = 2
                    Items = @("GET", "HEAD")
                }
            }
            TargetOriginId = "S3-$bucketName"
            ForwardedValues = @{
                QueryString = $false
                Cookies = @{
                    Forward = "none"
                }
            }
            MinTTL = 0
            DefaultTTL = 86400
            MaxTTL = 31536000
            Compress = $true
        }
        Enabled = $true
        DefaultRootObject = "index.html"
    }
}

# Convert to JSON and save to temporary file
$jsonConfig = $distributionConfig | ConvertTo-Json -Depth 10
$tempFile = [System.IO.Path]::GetTempFileName()
$jsonConfig | Out-File -FilePath $tempFile -Encoding UTF8

# Create distribution using the JSON file
$distribution = aws cloudfront create-distribution --cli-input-json file://$tempFile

# Clean up temp file
Remove-Item $tempFile

Write-Host "CloudFront distribution created!"
Write-Host $distribution

# Extract distribution ID and domain name
$distributionObj = $distribution | ConvertFrom-Json
$distributionId = $distributionObj.Distribution.Id
$cloudfrontDomain = $distributionObj.Distribution.DomainName

Write-Host "Distribution ID: $distributionId"
Write-Host "Domain name: $cloudfrontDomain"
Write-Host "Please update your DNS records to point $domainName to $cloudfrontDomain" 