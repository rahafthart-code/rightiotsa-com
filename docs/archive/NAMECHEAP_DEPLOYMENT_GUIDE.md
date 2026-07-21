# 🚀 DEPLOYMENT GUIDE FOR rightiotsa.com (Namecheap)

## 🎯 **Simple Step-by-Step Guide for Non-Technical Users**

---

## ⚠️ **SECURITY FIRST**

**Before anything else**:
1. Go to https://www.namecheap.com
2. Login
3. Go to Profile → Security → Change Password
4. Enable Two-Factor Authentication (2FA)

**Why?** You shared credentials publicly - they may be compromised.

---

## 📋 **WHAT WE'LL DO** (45 minutes total)

1. ✅ Deploy Backend (Railway) - 15 minutes
2. ✅ Deploy Frontend (Vercel) - 10 minutes  
3. ✅ Configure DNS (Namecheap) - 10 minutes
4. ✅ Configure Email - 5 minutes
5. ✅ Configure Payflowly - 5 minutes

---

## 🚀 **STEP 1: DEPLOY BACKEND TO RAILWAY** (15 minutes)

### **1A. Create Railway Account**

1. Open: https://railway.app
2. Click "Login"
3. Select "Login with GitHub" (easiest) or "Login with Email"
4. Complete signup

### **1B. Deploy Backend**

**Open Terminal on your Mac**:
```bash
# Navigate to your project
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP

# Install Railway CLI
npm i -g @railway/cli

# Login to Railway (opens browser)
railway login
```

**In the browser window that opens**:
- Click "Authorize" or "Allow"
- Return to Terminal

**Continue in Terminal**:
```bash
# Navigate to backend folder
cd backend

# Initialize Railway project
railway init
```

**When prompted**:
- "Create a new project or select existing?" → Choose "Create new project"
- "Project name?" → Type: `rightiotsa-backend`
- "Environment?" → Press Enter (default: production)

**Deploy**:
```bash
# Deploy your backend
railway up

# Wait 3-5 minutes for deployment
# You'll see progress in terminal

# Get your backend URL
railway domain
```

**Copy the URL shown** (example: `rightiotsa-backend-production.up.railway.app`)

### **1C. Add PostgreSQL Database**

**In Browser - Railway Dashboard**:
1. Go to https://railway.app/dashboard
2. Click your project: `rightiotsa-backend`
3. Click "+ New" → "Database" → "PostgreSQL"
4. Wait 1 minute for database to provision
5. The `DATABASE_URL` will be automatically added to your backend

### **1D. Add Environment Variables**

**Still in Railway Dashboard**:
1. Click your backend service (not the database)
2. Click "Variables" tab
3. Click "+ New Variable"

**Add these variables one by one**:

```
JWT_SECRET_KEY
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
(Use this example or generate your own 32-character string)

FRONTEND_URL
https://rightiotsa.com

WEBHOOK_BASE_URL
https://api.rightiotsa.com

DASHBOARD_URL
https://rightiotsa.com/dashboard

DEV_TESTING_OTP
1234

DEV_ENABLE_TEST_LOGIN
1

RESEND_API_KEY
(Leave empty for now - we'll configure email in Step 4)
```

**After adding all variables**:
- Click "Deploy" button (if it appears)
- OR wait 1 minute for auto-deploy

**✅ Backend is now live!**

---

## 🌐 **STEP 2: DEPLOY FRONTEND TO VERCEL** (10 minutes)

### **2A. Create Vercel Account**

1. Open: https://vercel.com
2. Click "Sign Up"
3. Select "Continue with GitHub" or "Continue with Email"
4. Complete signup

### **2B. Deploy Frontend**

**In Terminal**:
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend folder
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/frontend

# Update production API URL
# (Use the Railway URL you copied in Step 1B)
echo "VITE_API_URL=https://rightiotsa-backend-production.up.railway.app" > .env.production

# Deploy to Vercel
vercel
```

**Follow the prompts**:
- "Set up and deploy?" → Type: `Y` and press Enter
- "Which scope?" → Select your account
- "Link to existing project?" → Type: `N` and press Enter
- "What's your project's name?" → Type: `rightiotsa`
- "In which directory is your code located?" → Press Enter (default: ./)
- "Want to override settings?" → Type: `N` and press Enter

**Wait 2-3 minutes for deployment**

**Deploy to production**:
```bash
vercel --prod
```

**Copy the URL shown** (example: `rightiotsa.vercel.app`)

**✅ Frontend is now live on Vercel!**

---

## 🌐 **STEP 3: CONFIGURE DNS IN NAMECHEAP** (10 minutes)

### **3A. Login to Namecheap**

1. Open: https://www.namecheap.com
2. Login with your credentials
3. **IMPORTANT**: Change your password after this deployment!

### **3B. Go to DNS Management**

1. Click "Domain List" in left sidebar
2. Find `rightiotsa.com`
3. Click "Manage" button next to it
4. Click "Advanced DNS" tab

### **3C. Add DNS Records**

**Delete any existing A records and CNAME records first!**

**Then add these 3 records**:

**Record 1 - Frontend (Main Domain)**:
```
Type:  A Record
Host:  @
Value: 76.76.21.21
TTL:   Automatic
```

**Record 2 - Frontend (WWW)**:
```
Type:  CNAME Record
Host:  www
Value: cname.vercel-dns.com
TTL:   Automatic
```

**Record 3 - Backend API**:
```
Type:  CNAME Record
Host:  api
Value: rightiotsa-backend-production.up.railway.app
(Use your actual Railway domain from Step 1B)
TTL:   Automatic
```

**Click "Save All Changes"**

### **3D. Configure Custom Domains in Platforms**

**Vercel (Frontend)**:
1. Go to https://vercel.com/dashboard
2. Click your project: `rightiotsa`
3. Click "Settings" → "Domains"
4. Click "Add"
5. Type: `rightiotsa.com` → Click "Add"
6. Type: `www.rightiotsa.com` → Click "Add"
7. Vercel will verify DNS automatically (may take 5-10 minutes)

**Railway (Backend)**:
1. Go to https://railway.app/dashboard
2. Click your project: `rightiotsa-backend`
3. Click "Settings" → "Domains"
4. Click "+ Add Custom Domain"
5. Type: `api.rightiotsa.com`
6. Click "Add Domain"
7. Railway will verify DNS automatically (may take 5-10 minutes)

### **3E. Wait for DNS Propagation**

**Time**: 5-30 minutes (usually 10-15 minutes)

**Check status**:
1. Open: https://dnschecker.org
2. Enter: `rightiotsa.com`
3. Wait until most locations show green ✓

**Meanwhile, continue to Step 4!**

---

## 📧 **STEP 4: CONFIGURE EMAIL** (5 minutes)

### **Option A: Use Namecheap Email (Recommended for @rightiotsa.com)**

**Namecheap provides free email forwarding**:

1. In Namecheap, go to "Domain List"
2. Click "Manage" for rightiotsa.com
3. Find "Email Forwarding" section
4. Click "Add Forwarder"
5. Setup:
   - Alias: `info`
   - Forwards to: Your personal email
6. Save

**Test**:
- Send email to info@rightiotsa.com
- Should arrive at your personal email

**For OTP Sending** (via Resend):

1. Go to https://resend.com
2. Sign up (free plan: 100 emails/day)
3. Verify your domain: rightiotsa.com
4. Get API key
5. Add to Railway backend:
   - Variable: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx` (from Resend dashboard)

---

### **Option B: Use Existing Email (Testing)**

For now, keep using:
```
DEV_TESTING_OTP=1234
```

This allows anyone to register with any email and use code `1234`.

**Change this to production email later!**

---

## 💳 **STEP 5: CONFIGURE PAYFLOWLY** (5 minutes)

### **5A. Login to Payflowly**

1. Open your Payflowly dashboard
2. Login with your credentials

### **5B. Configure Integration Settings**

**General Settings**:
```
App Name:    Right
Currency:    SAR
```

**Integration Settings**:
```
App URL:              https://rightiotsa.com
Success Redirect URL: https://rightiotsa.com/dashboard
Cancel Redirect URL:  https://rightiotsa.com/pricing
Webhook URL:          https://api.rightiotsa.com/webhook/payflowly
Webhook Events:       ✓ payment.success (check this box)
```

### **5C. Get Production API Keys**

1. Go to "API Keys" or "Credentials" section
2. Copy these two keys:
   - **Publishable Key**: `pk_live_xxxxxxxxxxxxx`
   - **Secret Key**: `sk_live_xxxxxxxxxxxxx`

### **5D. Add API Keys to Railway**

1. Go back to Railway dashboard: https://railway.app/dashboard
2. Click your backend project
3. Click "Variables"
4. Add these 2 new variables:

```
PAYFLOWLY_API_KEY
pk_live_xxxxxxxxxxxxx (paste your publishable key)

PAYFLOWLY_SECRET_KEY
sk_live_xxxxxxxxxxxxx (paste your secret key)
```

5. Backend will auto-redeploy (wait 1-2 minutes)

**✅ Payflowly is now connected!**

---

## ✅ **STEP 6: FINAL VERIFICATION** (5 minutes)

### **Wait for DNS**:
- Check https://dnschecker.org
- Enter: rightiotsa.com
- Wait until most locations are green ✓

### **Test Your Live Site**:

**1. Open Live URL**:
```bash
open https://rightiotsa.com
```

**Expected**: Landing page loads with Right logo

**2. Test Registration**:
1. Click "إنشاء حساب" (Sign Up)
2. Fill form:
   - Name: محمد أحمد
   - Mobile: 0501234567
   - Email: test@rightiotsa.com
   - City: الرياض
   - Asset Type: 🐴 خيل
3. Submit
4. Enter OTP: `1234`
5. See welcome message: "مرحباً بك في عائلة رايت..."
6. Redirect to Dashboard

**Expected**: ✅ Complete flow works!

**3. Test Backend API**:
```bash
open https://api.rightiotsa.com/docs
```

**Expected**: Swagger API documentation loads

**4. Test Payment** (Optional - use Payflowly test card):
1. In Dashboard, select a subscription plan
2. Click payment button
3. Should redirect to Payflowly payment page
4. Use test card (get from Payflowly docs)
5. Should redirect back to Dashboard
6. Subscription should show as "Active"

---

## 🎊 **SUCCESS!**

If all tests pass, your platform is **LIVE** at:
- 🌐 https://rightiotsa.com
- 📊 https://api.rightiotsa.com/docs

---

## 🚨 **TROUBLESHOOTING**

### **Issue: DNS not working after 30 minutes**

**Check**:
```bash
# Open Terminal
nslookup rightiotsa.com
nslookup api.rightiotsa.com
```

**Solution**:
- Verify DNS records in Namecheap exactly match the guide
- Clear browser cache (Cmd+Shift+R)
- Try incognito mode
- Check https://dnschecker.org

---

### **Issue: "Connection Refused" or "Cannot connect to API"**

**Check**:
- Backend deployed successfully in Railway
- Environment variables are all set in Railway
- Railway service is running (check dashboard)

**Solution**:
```bash
# Check Railway logs
# Go to Railway dashboard → Your project → Deployments → View Logs
```

---

### **Issue: OTP not received**

**For Testing** (Current setup):
- Use code: `1234` for any email
- This bypasses email sending

**For Production**:
- Configure Resend API key in Railway
- Or use Namecheap email forwarding
- Test by sending OTP to your own email first

---

### **Issue: Payment not redirecting**

**Check**:
- Payflowly redirect URL is exactly: `https://rightiotsa.com/dashboard`
- Payflowly API keys are added to Railway
- Backend environment variable `DASHBOARD_URL` is correct

---

## 📞 **NEED HELP?**

If you encounter issues:

1. **Check Deployment Logs**:
   - Railway: Dashboard → Deployments → Logs
   - Vercel: Dashboard → Deployments → Function Logs

2. **Check DNS Propagation**:
   - https://dnschecker.org
   - May take up to 48 hours (usually 10-30 minutes)

3. **Test Components Separately**:
   - Backend: https://api.rightiotsa.com/docs
   - Frontend: https://rightiotsa.vercel.app (temporary URL)

---

## ✅ **QUICK CHECKLIST**

- [ ] Deployed backend to Railway
- [ ] Added PostgreSQL database
- [ ] Added all environment variables
- [ ] Deployed frontend to Vercel
- [ ] Configured DNS records in Namecheap
- [ ] Added custom domains in Railway & Vercel
- [ ] Configured Payflowly dashboard
- [ ] Added Payflowly API keys to Railway
- [ ] Waited for DNS propagation
- [ ] Tested https://rightiotsa.com
- [ ] Tested registration flow
- [ ] Tested Dashboard
- [ ] Changed Namecheap password!

---

## 🎯 **ESTIMATED TIMELINE**

- Deploy backend: 15 minutes
- Deploy frontend: 10 minutes
- Configure DNS: 10 minutes
- DNS propagation: 10-30 minutes (wait time)
- Configure Payflowly: 5 minutes
- Testing: 5 minutes

**Total**: ~45-60 minutes (including wait time)

---

**Deployment Date**: February 11, 2026  
**Domain**: rightiotsa.com  
**Status**: ⏳ **Ready to Deploy - Follow Steps Above**

🚀 **Follow each step carefully and you'll be live!**
