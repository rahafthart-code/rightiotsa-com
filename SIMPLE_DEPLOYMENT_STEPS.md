# 📱 SIMPLE DEPLOYMENT STEPS (FOR YOU TO DO)

## 🎯 **Goal**: Get rightiotsa.com live in 1 hour

---

## ⚠️ **FIRST: CHANGE YOUR PASSWORDS!**

You shared 3 passwords publicly. Change them NOW:
1. Namecheap password
2. cPanel password
3. Enable 2FA everywhere

---

## 🚀 **RECOMMENDED: HYBRID APPROACH**

**Backend → Railway (Free, Easy, Reliable)**  
**Frontend → cPanel (Your existing hosting)**

---

## 📋 **STEP-BY-STEP INSTRUCTIONS**

### **STEP 1: Deploy Backend to Railway** (You do this)

**Open Terminal on your Mac** and run these commands **one by one**:

```bash
# Command 1: Install Railway CLI
npm i -g @railway/cli

# Command 2: Navigate to backend folder
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/backend

# Command 3: Login to Railway (browser opens - YOU login)
railway login

# Command 4: Create project
railway init

# When prompted, type: rightiotsa-backend
# Press Enter

# Command 5: Deploy
railway up

# Wait 3-5 minutes...

# Command 6: Get your backend URL
railway domain

# COPY THE URL IT SHOWS!
# Example: rightiotsa-backend-production.up.railway.app
```

**Then go to Railway website**:
1. Open https://railway.app/dashboard
2. Click your project
3. Click "+ New" → "Database" → "PostgreSQL"
4. Click "Variables"
5. Add these variables:

```
JWT_SECRET_KEY = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
FRONTEND_URL = https://rightiotsa.com
WEBHOOK_BASE_URL = https://rightiotsa-backend-production.up.railway.app
DASHBOARD_URL = https://rightiotsa.com/dashboard
DEV_TESTING_OTP = 1234
```

**✅ Backend is now running on Railway!**

---

### **STEP 2: Build Frontend** (You do this)

**In Terminal**:

```bash
# Command 1: Navigate to frontend
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/frontend

# Command 2: Update API URL (use YOUR Railway URL from Step 1)
echo "VITE_API_URL=https://rightiotsa-backend-production.up.railway.app" > .env.production

# Command 3: Install dependencies
npm install

# Command 4: Build for production
npm run build

# Wait 1-2 minutes...
# This creates a 'dist' folder
```

**✅ Frontend is now built and ready!**

---

### **STEP 3: Upload to cPanel** (You do this)

**Option A: Use My Upload Script** (Easiest)

```bash
# In Terminal, run:
./UPLOAD_TO_CPANEL.sh

# Follow the prompts
# Script will upload everything automatically
```

**Option B: Manual Upload via cPanel**

1. Login to https://server352.web-hosting.com/cpanel
2. Click "File Manager"
3. Navigate to `public_html` folder
4. Delete all existing files
5. Click "Upload"
6. Select ALL files from: `/Users/rahafrroyalarts/Desktop/SmartHerd_MVP/frontend/dist`
7. Upload them (may take 5 minutes)
8. Go back to public_html
9. Create file named `.htaccess` with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**✅ Frontend is now uploaded to cPanel!**

---

### **STEP 4: Configure DNS** (You do this)

**In cPanel**:
1. Search for "Zone Editor"
2. Click it
3. Find rightiotsa.com
4. Add CNAME record:
   - Type: CNAME
   - Name: api
   - Points to: rightiotsa-backend-production.up.railway.app
   - TTL: 14400

**✅ DNS is now configured!**

---

### **STEP 5: Wait for DNS** (10-30 minutes)

Check propagation:
```bash
open https://dnschecker.org
# Enter: rightiotsa.com
# Wait until most locations show green
```

---

### **STEP 6: Test Your Live Site**

```bash
# Open your live site
open https://rightiotsa.com

# Should show landing page!
```

**Test registration**:
1. Click "Sign Up"
2. Fill form
3. Enter OTP: 1234
4. See welcome message
5. Redirect to Dashboard

**✅ If this works, your site is LIVE!**

---

### **STEP 7: Configure Payflowly** (You do this)

**YOU must login to Payflowly dashboard and configure**:

```
App URL:            https://rightiotsa.com
Success Redirect:   https://rightiotsa.com/dashboard
Webhook URL:        https://rightiotsa-backend-production.up.railway.app/webhook/payflowly
```

**Copy API keys and add to Railway backend Variables**:
- PAYFLOWLY_API_KEY
- PAYFLOWLY_SECRET_KEY

---

## ✅ **SUMMARY**

**What YOU need to do**:

1. Open Terminal
2. Run: `./UPLOAD_TO_CPANEL.sh`
3. OR follow manual steps above
4. Configure Payflowly dashboard yourself
5. Test https://rightiotsa.com

**What I CANNOT do**:
- Login to cPanel for you
- Login to Payflowly for you
- Execute commands requiring authentication

**Total time**: ~1 hour

---

## 🔒 **SECURITY REMINDER**

**After deployment, immediately**:
1. Change cPanel password
2. Change Namecheap password
3. Enable 2FA on both
4. Review account activity logs

---

**Start with Step 1 now! Run the commands in Terminal and tell me if you have any questions!**
