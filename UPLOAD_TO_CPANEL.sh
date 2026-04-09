#!/bin/bash

###############################################################################
# UPLOAD FRONTEND TO CPANEL
# This script builds and uploads your frontend to cPanel hosting
###############################################################################

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🚀 UPLOADING TO CPANEL (rightiotsa.com)                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# cPanel FTP Configuration
FTP_HOST="server352.web-hosting.com"
FTP_USER="righogwr"
FTP_PASS="pap1IPOuwPvI"
FTP_DIR="/public_html"

echo -e "${RED}⚠️  WARNING: You should change your cPanel password!${NC}"
echo -e "${RED}⚠️  These credentials were shared publicly and may be compromised.${NC}"
echo ""
read -p "Press Enter to continue (or Ctrl+C to cancel and change password first)..."
echo ""

###############################################################################
# STEP 1: BUILD FRONTEND
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: BUILDING FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/frontend || exit

# Check if we need to deploy backend first
echo -e "${YELLOW}NOTE: Backend needs to be deployed to Railway first!${NC}"
echo -e "${YELLOW}Backend provides the API that frontend connects to.${NC}"
echo ""
read -p "Have you deployed backend to Railway? (y/n): " BACKEND_DEPLOYED

if [ "$BACKEND_DEPLOYED" != "y" ]; then
    echo -e "${RED}Please deploy backend first! See NAMECHEAP_DEPLOYMENT_GUIDE.md${NC}"
    exit 1
fi

read -p "Enter your Railway backend URL (e.g., rightiotsa-backend.up.railway.app): " BACKEND_URL

# Update API URL
echo "VITE_API_URL=https://$BACKEND_URL" > .env.production

echo -e "${BLUE}Installing dependencies...${NC}"
npm install

echo -e "${BLUE}Building production frontend...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Build failed! Check for errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully!${NC}"
echo ""

###############################################################################
# STEP 2: UPLOAD TO CPANEL VIA FTP
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: UPLOADING TO CPANEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${YELLOW}lftp not found. Installing via Homebrew...${NC}"
    
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}Homebrew not installed. Installing Homebrew first...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    brew install lftp
fi

echo -e "${BLUE}Connecting to cPanel via FTP...${NC}"
echo -e "${YELLOW}This may take 2-3 minutes to upload all files...${NC}"
echo ""

# Upload using lftp
lftp -u "$FTP_USER,$FTP_PASS" "ftp://$FTP_HOST" <<EOF
set ssl:verify-certificate no
cd $FTP_DIR

# Delete existing files (optional - comment out if you want to keep)
# rm -rf *

# Upload all files from dist folder
lcd dist
mirror --reverse --delete --verbose ./ ./

quit
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Files uploaded successfully!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Upload failed! Check FTP credentials and try again.${NC}"
    exit 1
fi

###############################################################################
# STEP 3: CONFIGURE .htaccess FOR REACT ROUTING
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 3: CONFIGURING .htaccess"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create .htaccess for React Router
cat > /tmp/.htaccess << 'HTACCESS'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle React Router - redirect all requests to index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
  
  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
HTACCESS

# Upload .htaccess
lftp -u "$FTP_USER,$FTP_PASS" "ftp://$FTP_HOST" <<EOF
set ssl:verify-certificate no
cd $FTP_DIR
put /tmp/.htaccess
quit
EOF

echo -e "${GREEN}✓ .htaccess configured!${NC}"
echo ""

###############################################################################
# COMPLETION
###############################################################################

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     ✅ UPLOAD COMPLETE!                                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Frontend uploaded to cPanel successfully!${NC}"
echo ""
echo "Your site should be accessible at:"
echo "  🌐 https://rightiotsa.com"
echo ""
echo "Next Steps:"
echo "  1. Wait 10-15 minutes for DNS propagation"
echo "  2. Open https://rightiotsa.com in your browser"
echo "  3. Test registration flow"
echo "  4. Configure Payflowly dashboard (see guide)"
echo ""
echo "⚠️  IMPORTANT:"
echo "  • Backend is running on Railway (not cPanel)"
echo "  • API URL: https://$BACKEND_URL"
echo "  • Make sure Railway environment variables are configured"
echo ""
echo -e "${YELLOW}🔒 Don't forget to change your cPanel password!${NC}"
echo ""
