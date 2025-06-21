# AWS Initial Setup Script

# Check if AWS CLI is installed
try {
    aws --version
    Write-Host "AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI is not installed. Please install it from https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Red
    exit
}

# Create necessary directories
New-Item -ItemType Directory -Force -Path ".\aws-config"

# Create AWS configuration file
$awsConfig = @"
[default]
region = us-east-1
output = json
"@

$awsConfig | Out-File -FilePath "$env:USERPROFILE\.aws\config" -Force

Write-Host "Please run 'aws configure' and enter your AWS credentials:" -ForegroundColor Yellow
Write-Host "AWS Access Key ID: [Your Access Key ID]" -ForegroundColor Yellow
Write-Host "AWS Secret Access Key: [Your Secret Access Key]" -ForegroundColor Yellow
Write-Host "Default region name: us-east-1" -ForegroundColor Yellow
Write-Host "Default output format: json" -ForegroundColor Yellow

# Create IAM user setup instructions
$iamInstructions = @"
# IAM User Setup Instructions

1. Go to AWS Console
2. Navigate to IAM service
3. Create a new IAM user with the following permissions:
   - AmazonS3FullAccess
   - AmazonEC2FullAccess
   - AmazonCloudFrontFullAccess
   - AmazonRoute53FullAccess
   - AmazonCertificateManagerFullAccess

4. Enable programmatic access
5. Save the Access Key ID and Secret Access Key
6. Run 'aws configure' with these credentials
"@

$iamInstructions | Out-File -FilePath ".\aws-config\iam-setup.md" -Force

Write-Host "`nIAM setup instructions have been saved to .\aws-config\iam-setup.md" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Create IAM user with necessary permissions" -ForegroundColor Yellow
Write-Host "2. Configure AWS CLI with your credentials" -ForegroundColor Yellow
Write-Host "3. Run 'aws configure' to set up your credentials" -ForegroundColor Yellow 