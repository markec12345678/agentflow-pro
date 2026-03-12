#!/bin/bash

# AgentFlow Pro - Production Deploy Script
# Deploys template systems to production

set -e

echo "🚀 AgentFlow Pro - Production Deploy"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if on main branch
echo -e "${YELLOW}Checking branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}Error: Must be on main branch to deploy${NC}"
  exit 1
fi
echo -e "${GREEN}✓ On main branch${NC}"
echo ""

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm run test:templates
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Tests passed${NC}"
echo ""

# Build
echo -e "${YELLOW}Building application...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Deployment failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Deployment successful${NC}"
echo ""

# Run smoke tests
echo -e "${YELLOW}Running smoke tests...${NC}"
npm run test:e2e:smoke
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Smoke tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Smoke tests passed${NC}"
echo ""

# Success
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "📊 Template Systems Deployed:"
echo "  ✉️  Email Templates (5)"
echo "  🔄 Workflow Templates (8)"
echo "  📊 Dashboard Templates (23)"
echo "  🤖 AI Prompt Templates (15)"
echo "  📱 SMS/WhatsApp Templates (20)"
echo "  🔔 Notification Templates (20)"
echo "  📄 Report Templates (11)"
echo "  📄 Document Templates (7)"
echo ""
echo "Total: 109 templates deployed"
echo ""
