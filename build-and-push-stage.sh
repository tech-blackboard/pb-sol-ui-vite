#!/bin/bash

# Build and Push Docker Images to ECR
# For Docker Compose deployment on EC2 - STAGE Environment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
AWS_REGION="${AWS_REGION:-ap-south-2}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-495417556644}"
UI_REPO="pb-sol-ui-vite"

ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build and Push UI to ECR (STAGE)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Authenticate with ECR
echo -e "${YELLOW}Step 1: Authenticating with ECR...${NC}"
if aws ecr get-login-password --region $AWS_REGION 2>/dev/null | docker login --username AWS --password-stdin $ECR_REGISTRY 2>/dev/null; then
    echo -e "${GREEN}✓ Authenticated${NC}"
else
    echo -e "${RED}❌ ECR authentication failed${NC}"
    echo -e "${YELLOW}Attempting to refresh credentials...${NC}"
    # Try to refresh credentials by calling STS
    aws sts get-caller-identity > /dev/null 2>&1 || {
        echo -e "${RED}❌ Cannot authenticate with AWS. Please check IAM role or credentials.${NC}"
        exit 1
    }
    # Retry ECR login
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    echo -e "${GREEN}✓ Authenticated${NC}"
fi
echo ""

# Step 2: Build UI image
echo -e "${YELLOW}Step 2: Building UI image for STAGE...${NC}"
docker build --build-arg BUILD_ENV=stage -t $UI_REPO:latest .
echo -e "${GREEN}✓ UI image built${NC}"
echo ""

# Step 3: Tag image
echo -e "${YELLOW}Step 3: Tagging image...${NC}"
docker tag $UI_REPO:latest $ECR_REGISTRY/$UI_REPO:latest

# Also tag with timestamp for versioning
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag $UI_REPO:latest $ECR_REGISTRY/$UI_REPO:$TIMESTAMP
echo -e "${GREEN}✓ Image tagged${NC}"
echo ""

# Step 4: Push image
echo -e "${YELLOW}Step 4: Pushing image to ECR...${NC}"
docker push $ECR_REGISTRY/$UI_REPO:latest
docker push $ECR_REGISTRY/$UI_REPO:$TIMESTAMP
echo -e "${GREEN}✓ Image pushed${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build and Push Complete! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Image pushed:"
echo "  - $ECR_REGISTRY/$UI_REPO:latest"
echo "  - $ECR_REGISTRY/$UI_REPO:$TIMESTAMP"
echo ""
echo "Next step: Pull and start container"
echo "  docker-compose -f docker-compose.stage.yml pull"
echo "  docker-compose -f docker-compose.stage.yml up -d"
echo ""
