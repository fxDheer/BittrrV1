#!/bin/bash

# Exit on error
set -e

# Configuration variables
BUCKET_NAME="bittrr-frontend"
DISTRIBUTION_DOMAIN="www.bittrr.com"
API_DOMAIN="api.bittrr.com"
REGION="us-east-1"  # CloudFront and ACM must be in us-east-1

echo "🚀 Starting CloudFront and S3 setup..."

# Create Origin Access Control (OAC)
echo "📝 Creating Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control \
    --name "BittrrFrontendOAC" \
    --origin-access-control-origin-type "s3" \
    --signing-behavior "always" \
    --signing-protocol "sigv4" \
    --query "OriginAccessControl.Id" \
    --output text)

echo "✅ OAC created with ID: $OAC_ID"

# Update S3 bucket policy
echo "📝 Updating S3 bucket policy..."
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::$(aws sts get-caller-identity --query Account --output text):distribution/*"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file://bucket-policy.json

echo "✅ S3 bucket policy updated"

# Create CloudFront distribution
echo "📝 Creating CloudFront distribution..."
cat > distribution-config.json << EOF
{
    "CallerReference": "$(date +%s)",
    "Aliases": {
        "Quantity": 1,
        "Items": ["${DISTRIBUTION_DOMAIN}"]
    },
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-${BUCKET_NAME}",
                "DomainName": "${BUCKET_NAME}.s3.${REGION}.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessControlId": "${OAC_ID}"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${BUCKET_NAME}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "Compress": true,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": 200,
                "ErrorCachingMinTTL": 10
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100",
    "ViewerCertificate": {
        "ACMCertificateArn": "arn:aws:acm:${REGION}:$(aws sts get-caller-identity --query Account --output text):certificate/*",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    }
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file://distribution-config.json \
    --query "Distribution.Id" \
    --output text)

echo "✅ CloudFront distribution created with ID: $DISTRIBUTION_ID"

# Clean up temporary files
rm bucket-policy.json distribution-config.json

echo "🎉 Setup completed successfully!"
echo "📝 Next steps:"
echo "1. Wait for CloudFront distribution to deploy (this may take 15-30 minutes)"
echo "2. Update your DNS records to point to the CloudFront distribution"
echo "3. Test the website through CloudFront domain"
echo "4. Monitor CloudFront metrics and logs for any issues"

# Save distribution ID for future reference
echo $DISTRIBUTION_ID > .cloudfront-distribution-id 