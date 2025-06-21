# AWS Setup Instructions for Bittrr

## Prerequisites
1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Domain name (if using custom domain)

## Setup Steps

### 1. Create IAM User
1. Go to AWS IAM Console
2. Create new IAM user with programmatic access
3. Attach necessary policies:
   - AmazonS3FullAccess
   - AmazonEC2FullAccess
   - AmazonCloudFrontFullAccess
   - AmazonRoute53FullAccess
   - AmazonCertificateManagerFullAccess

### 2. Set Up EC2 Instance
1. Launch EC2 instance:
   ```bash
   aws ec2 run-instances \
     --image-id ami-0c55b159cbfafe1f0 \
     --instance-type t2.micro \
     --key-name bittrr-key \
     --security-group-ids sg-xxxxxxxx \
     --subnet-id subnet-xxxxxxxx \
     --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=bittrr-backend}]'
   ```

2. Install Node.js and PM2:
   ```bash
   curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   sudo npm install -g pm2
   ```

### 3. Set Up S3 Bucket
1. Create S3 bucket:
   ```bash
   aws s3 mb s3://bittrr-frontend
   ```

2. Configure bucket for static website hosting:
   ```bash
   aws s3 website s3://bittrr-frontend \
     --index-document index.html \
     --error-document index.html
   ```

### 4. Set Up CloudFront
1. Create CloudFront distribution pointing to S3 bucket
2. Configure SSL certificate
3. Set up custom domain (if applicable)

### 5. Set Up Route 53 (if using custom domain)
1. Create hosted zone
2. Add A record pointing to CloudFront distribution
3. Add CNAME record for www subdomain

### 6. Environment Setup
1. Copy `.env.aws` to `.env`
2. Fill in all required environment variables
3. Set up AWS credentials:
   ```bash
   aws configure
   ```

### 7. Deployment
1. Make deployment script executable:
   ```bash
   chmod +x deploy-aws.sh
   ```

2. Run deployment:
   ```bash
   ./deploy-aws.sh
   ```

## Security Considerations
1. Use security groups to restrict access
2. Enable HTTPS everywhere
3. Set up proper IAM roles and policies
4. Use AWS Secrets Manager for sensitive data
5. Enable AWS CloudWatch for monitoring

## Monitoring
1. Set up CloudWatch alarms
2. Configure logging
3. Monitor costs and usage

## Backup Strategy
1. Regular database backups
2. S3 versioning enabled
3. EC2 snapshots

## Maintenance
1. Regular security updates
2. Monitor and optimize costs
3. Regular backup verification
4. Performance monitoring

## Troubleshooting
1. Check CloudWatch logs
2. Verify security group settings
3. Check IAM permissions
4. Verify SSL certificate status
5. Check CloudFront distribution status 