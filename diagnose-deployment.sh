#!/bin/bash

# Exit on error
set -e

echo "🔍 Bittrr Deployment Diagnostic Tool"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Check if AWS CLI is installed and configured
echo -e "\n${BLUE}1. AWS Configuration Check${NC}"
if command -v aws &> /dev/null; then
    print_status "SUCCESS" "AWS CLI is installed"
    
    # Check AWS credentials
    if aws sts get-caller-identity &> /dev/null; then
        print_status "SUCCESS" "AWS credentials are valid"
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        print_status "INFO" "AWS Account ID: $ACCOUNT_ID"
    else
        print_status "ERROR" "AWS credentials are not valid or not configured"
        exit 1
    fi
else
    print_status "ERROR" "AWS CLI is not installed"
    exit 1
fi

# Check S3 bucket
echo -e "\n${BLUE}2. S3 Bucket Check${NC}"
BUCKET_NAME="bittrr-frontend"
if aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    print_status "SUCCESS" "S3 bucket '$BUCKET_NAME' exists"
    
    # Check bucket contents
    OBJECT_COUNT=$(aws s3 ls "s3://$BUCKET_NAME" --recursive | wc -l)
    print_status "INFO" "S3 bucket contains $OBJECT_COUNT objects"
    
    # Check if index.html exists
    if aws s3 ls "s3://$BUCKET_NAME/index.html" &> /dev/null; then
        print_status "SUCCESS" "index.html exists in S3 bucket"
    else
        print_status "WARNING" "index.html not found in S3 bucket"
    fi
else
    print_status "ERROR" "S3 bucket '$BUCKET_NAME' does not exist"
fi

# Check CloudFront distribution
echo -e "\n${BLUE}3. CloudFront Distribution Check${NC}"
DISTRIBUTION_ID_FILE=".cloudfront-distribution-id"
if [ -f "$DISTRIBUTION_ID_FILE" ]; then
    DISTRIBUTION_ID=$(cat "$DISTRIBUTION_ID_FILE")
    print_status "INFO" "Found distribution ID: $DISTRIBUTION_ID"
    
    # Get distribution status
    DISTRIBUTION_STATUS=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.Status' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$DISTRIBUTION_STATUS" = "Deployed" ]; then
        print_status "SUCCESS" "CloudFront distribution is deployed"
        
        # Get distribution domain
        DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)
        print_status "INFO" "CloudFront domain: $DISTRIBUTION_DOMAIN"
        
        # Test CloudFront access
        if curl -s -o /dev/null -w "%{http_code}" "https://$DISTRIBUTION_DOMAIN" | grep -q "200\|403"; then
            print_status "SUCCESS" "CloudFront distribution is accessible"
        else
            print_status "WARNING" "CloudFront distribution may not be accessible"
        fi
    elif [ "$DISTRIBUTION_STATUS" = "InProgress" ]; then
        print_status "WARNING" "CloudFront distribution is still deploying"
    else
        print_status "ERROR" "CloudFront distribution status: $DISTRIBUTION_STATUS"
    fi
else
    print_status "WARNING" "Distribution ID file not found, checking for existing distributions"
    
    # List all distributions
    DISTRIBUTIONS=$(aws cloudfront list-distributions --query 'DistributionList.Items[?Aliases.Items[?contains(@, `bittrr.com`)]].[Id,DomainName,Status]' --output table 2>/dev/null || echo "No distributions found")
    echo "$DISTRIBUTIONS"
fi

# Check ACM certificates
echo -e "\n${BLUE}4. ACM Certificate Check${NC}"
CERTIFICATES=$(aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?DomainName==`*.bittrr.com` || DomainName==`bittrr.com`].[CertificateArn,DomainName,Status]' --output table 2>/dev/null || echo "No certificates found")
if echo "$CERTIFICATES" | grep -q "ISSUED"; then
    print_status "SUCCESS" "ACM certificate is issued"
    echo "$CERTIFICATES"
else
    print_status "WARNING" "ACM certificate status check"
    echo "$CERTIFICATES"
fi

# DNS Resolution Check
echo -e "\n${BLUE}5. DNS Resolution Check${NC}"
DOMAINS=("www.bittrr.com" "bittrr.com" "api.bittrr.com")

for domain in "${DOMAINS[@]}"; do
    if nslookup "$domain" &> /dev/null; then
        print_status "SUCCESS" "DNS resolution for $domain"
        
        # Get IP address
        IP=$(nslookup "$domain" | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        if [ ! -z "$IP" ]; then
            print_status "INFO" "$domain resolves to: $IP"
        fi
    else
        print_status "ERROR" "DNS resolution failed for $domain"
    fi
done

# SSL Certificate Check
echo -e "\n${BLUE}6. SSL Certificate Check${NC}"
for domain in "${DOMAINS[@]}"; do
    if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates &> /dev/null; then
        print_status "SUCCESS" "SSL certificate is valid for $domain"
        
        # Check certificate expiration
        EXPIRY=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        print_status "INFO" "Certificate expires: $EXPIRY"
    else
        print_status "WARNING" "SSL certificate check failed for $domain"
    fi
done

# Application Health Check
echo -e "\n${BLUE}7. Application Health Check${NC}"

# Check if application files exist
if [ -f "package.json" ]; then
    print_status "SUCCESS" "package.json exists"
else
    print_status "WARNING" "package.json not found in current directory"
fi

if [ -d "src" ]; then
    print_status "SUCCESS" "src directory exists"
else
    print_status "WARNING" "src directory not found"
fi

if [ -d "public" ]; then
    print_status "SUCCESS" "public directory exists"
else
    print_status "WARNING" "public directory not found"
fi

# Check for build files
if [ -d "build" ]; then
    print_status "SUCCESS" "build directory exists"
    BUILD_FILES=$(ls -la build/ | wc -l)
    print_status "INFO" "Build directory contains $BUILD_FILES files"
else
    print_status "WARNING" "build directory not found - application may not be built"
fi

# Check Docker setup
echo -e "\n${BLUE}8. Docker Configuration Check${NC}"
if [ -f "Dockerfile" ]; then
    print_status "SUCCESS" "Dockerfile exists"
else
    print_status "WARNING" "Dockerfile not found"
fi

if [ -f "docker-compose.yml" ]; then
    print_status "SUCCESS" "docker-compose.yml exists"
else
    print_status "WARNING" "docker-compose.yml not found"
fi

# Environment Variables Check
echo -e "\n${BLUE}9. Environment Configuration Check${NC}"
ENV_FILES=(".env" ".env.production" ".env.local" ".env.production.local")

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        print_status "SUCCESS" "$env_file exists"
    else
        print_status "WARNING" "$env_file not found"
    fi
done

# Network Connectivity Test
echo -e "\n${BLUE}10. Network Connectivity Test${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://www.bittrr.com" | grep -q "200"; then
    print_status "SUCCESS" "www.bittrr.com is accessible via HTTPS"
elif curl -s -o /dev/null -w "%{http_code}" "https://www.bittrr.com" | grep -q "403"; then
    print_status "WARNING" "www.bittrr.com returns 403 (Forbidden) - may be CloudFront configuration issue"
else
    print_status "ERROR" "www.bittrr.com is not accessible"
fi

if curl -s -o /dev/null -w "%{http_code}" "https://api.bittrr.com" | grep -q "200\|404\|500"; then
    print_status "SUCCESS" "api.bittrr.com is accessible"
else
    print_status "WARNING" "api.bittrr.com is not accessible"
fi

# Summary and Recommendations
echo -e "\n${BLUE}📋 Summary and Recommendations${NC}"
echo "====================================="

print_status "INFO" "If all checks above show SUCCESS, your deployment should be working."
print_status "INFO" "If you see WARNING or ERROR messages, address them in order of priority:"
echo ""
print_status "INFO" "1. Fix any ERROR messages first"
print_status "INFO" "2. Address WARNING messages that might affect functionality"
print_status "INFO" "3. Ensure your application is properly built and deployed"
print_status "INFO" "4. Verify CloudFront cache invalidation if content isn't updating"
echo ""
print_status "INFO" "Common issues to check:"
print_status "INFO" "- CloudFront cache invalidation for updated content"
print_status "INFO" "- S3 bucket permissions and CORS settings"
print_status "INFO" "- Application build process and deployment"
print_status "INFO" "- Environment variables and configuration"
print_status "INFO" "- DNS propagation (can take up to 48 hours)"

echo -e "\n${GREEN}🎉 Diagnostic complete!${NC}" 