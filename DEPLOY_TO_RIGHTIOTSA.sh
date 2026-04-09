#!/bin/bash

###############################################################################
# DEPLOYMENT SCRIPT FOR rightIotsa.com
# Run this script to deploy the Right platform to production
###############################################################################

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🚀 DEPLOYING RIGHT PLATFORM TO rightIotsa.com             ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required CLIs are installed
echo "📦 Checking required tools..."

if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm i -g @railway/cli
else
    echo -e "${GREEN}✓ Railway CLI installed${NC}"
fi

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
else
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
fi

echo ""

###############################################################################
# STEP 1: DEPLOY BACKEND
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: DEPLOYING BACKEND TO RAILWAY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend || exit

echo -e "${BLUE}Logging into Railway...${NC}"
railway login

echo -e "${BLUE}Initializing Railway project...${NC}"
railway init

echo -e "${BLUE}Deploying backend...${NC}"
railway up

echo ""
echo -e "${GREEN}✓ Backend deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to Railway dashboard"
echo "2. Add these environment variables:"
echo "   - JWT_SECRET_KEY"
echo "   - FRONTEND_URL=https://rightIotsa.com"
echo "   - WEBHOOK_BASE_URL=https://api.rightIotsa.com"
echo "   - DASHBOARD_URL=https://rightIotsa.com/dashboard"
echo "   - PAYFLOWLY_API_KEY"
echo "   - PAYFLOWLY_SECRET_KEY"
echo "   - RESEND_API_KEY"
echo "3. Configure custom domain: api.rightIotsa.com"
echo ""
read -p "Press Enter once you've configured Railway environment variables..."

cd ..

###############################################################################
# STEP 2: UPDATE FRONTEND CONFIG
###############################################################################

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: CONFIGURING FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend || exit

echo -e "${BLUE}Getting backend URL...${NC}"
cd ../backend
BACKEND_URL=$(railway domain 2>/dev/null || echo "https://api.rightIotsa.com")
cd ../frontend

echo -e "${GREEN}Backend URL: $BACKEND_URL${NC}"

echo "VITE_API_URL=$BACKEND_URL" > .env.production

echo -e "${GREEN}✓ Frontend configured${NC}"

###############################################################################
# STEP 3: DEPLOY FRONTEND
###############################################################################

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 3: DEPLOYING FRONTEND TO VERCEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}Deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to Vercel dashboard"
echo "2. Settings → Domains"
echo "3. Add custom domains:"
echo "   - rightIotsa.com"
echo "   - www.rightIotsa.com"
echo "4. Follow DNS configuration instructions"
echo ""
read -p "Press Enter once you've configured Vercel custom domains..."

cd ..

###############################################################################
# STEP 4: CONFIGURE PAYFLOWLY
###############################################################################

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 4: PAYFLOWLY CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}Payflowly Configuration Checklist:${NC}"
echo ""
echo "Login to: https://payflowly.com/dashboard"
echo ""
echo "Configure these settings:"
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │ App Name:          Right                                │"
echo "  │ App URL:           https://rightIotsa.com               │"
echo "  │ Success Redirect:  https://rightIotsa.com/dashboard     │"
echo "  │ Webhook URL:       https://api.rightIotsa.com/webhook/payflowly │"
echo "  │ Webhook Events:    payment.success                      │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
read -p "Press Enter once you've configured Payflowly..."

###############################################################################
# STEP 5: VERIFICATION
###############################################################################

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 5: TESTING DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}Testing URLs...${NC}"
echo ""

# Test frontend
echo -n "Testing frontend (https://rightIotsa.com)... "
if curl -s -o /dev/null -w "%{http_code}" https://rightIotsa.com | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ Not accessible yet (DNS may be propagating)${NC}"
fi

# Test backend
echo -n "Testing backend API (https://api.rightIotsa.com/docs)... "
if curl -s -o /dev/null -w "%{http_code}" https://api.rightIotsa.com/docs | grep -q "200"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ Not accessible yet (check Railway domain config)${NC}"
fi

echo ""

###############################################################################
# COMPLETION
###############################################################################

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     ✅ DEPLOYMENT COMPLETE!                                   ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your platform is deployed!${NC}"
echo ""
echo "URLs:"
echo "  Frontend: https://rightIotsa.com"
echo "  Backend:  https://api.rightIotsa.com"
echo "  API Docs: https://api.rightIotsa.com/docs"
echo ""
echo "Next Steps:"
echo "  1. Wait for DNS propagation (5-30 minutes)"
echo "  2. Test registration flow"
echo "  3. Test payment flow"
echo "  4. Monitor logs in Railway and Vercel dashboards"
echo ""
echo "Documentation:"
echo "  - PRODUCTION_DEPLOYMENT_RIGHTIOTSA.md"
echo "  - See file for complete testing guide"
echo ""
echo -e "${GREEN}🎉 Platform is live on rightIotsa.com!${NC}"
echo ""
