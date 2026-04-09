# 🚀 QUICK DEPLOYMENT GUIDE TO rightIotsa.com
## Get Live in 30 Minutes

---

## ⚠️ **IMPORTANT: YOU MUST DO THESE STEPS**

I (the AI assistant) cannot:
- ❌ Login to your Railway/Vercel accounts
- ❌ Login to your domain registrar  
- ❌ Login to your Payflowly dashboard
- ❌ Execute deployment commands on your computer

**BUT**: I've prepared everything you need. Just follow these 3 steps below.

---

## 📋 **BEFORE YOU START**

**You will need**:
1. ✅ Your computer terminal access
2. ✅ Domain registrar login (where you bought rightIotsa.com)
3. ✅ Payflowly dashboard login
4. ✅ 30 minutes of time

**Optional (but recommended)**:
- Railway account (free): https://railway.app
- Vercel account (free): https://vercel.com
- Resend account for emails (free): https://resend.com

---

## 🚀 **STEP 1: RUN DEPLOYMENT SCRIPT** (15 minutes)

### **Option A: Automated Deployment (Easiest)**

```bash
# Open Terminal on your Mac
# Navigate to your project folder
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP

# Run the deployment script
./DEPLOY_TO_RIGHTIOTSA.sh
```

**The script will**:
1. Install Railway CLI and Vercel CLI (if needed)
2. Ask you to login to Railway → **You login**
3. Deploy backend to Railway
4. Ask you to login to Vercel → **You login**
5. Deploy frontend to Vercel
6. Give you the deployment URLs

**What you need to do during script**:
- When prompted "Login to Railway", click the browser link and login
- When prompted "Login to Vercel", click the browser link and login
- When prompted "Add environment variables", copy/paste the values shown

---

### **Option B: Manual Step-by-Step** (If script doesn't work)

#### **1A. Deploy Backend to Railway**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login (opens browser)
railway login

# Navigate to backend folder
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/backend

# Initialize Railway project
railway init
# When prompted:
# - Project name: rightiotsa-backend
# - Framework: Python

# Deploy
railway up

# Wait 2-3 minutes for deployment to complete

# Get your backend URL
railway domain
# Example output: rightiotsa-backend-production.up.railway.app
# COPY THIS URL - you'll need it!
```

#### **1B. Add Environment Variables to Railway Backend**

```bash
# Go to Railway dashboard in browser
open https://railway.app/dashboard

# Click your project (rightiotsa-backend)
# Click "Variables" tab
# Add these variables (click "+ New Variable" for each):

DATABASE_URL
(This should be auto-filled if you added PostgreSQL)

JWT_SECRET_KEY
(Generate one: use any random 32-character string)
Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

FRONTEND_URL
https://rightIotsa.com

WEBHOOK_BASE_URL
https://api.rightIotsa.com

DASHBOARD_URL
https://rightIotsa.com/dashboard

DEV_TESTING_OTP
1234

DEV_ENABLE_TEST_LOGIN
1

RESEND_API_KEY
(Get from https://resend.com - optional for production email)

PAYFLOWLY_API_KEY
(You'll add this in Step 3)

PAYFLOWLY_SECRET_KEY
(You'll add this in Step 3)
```

#### **1C. Deploy Frontend to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend folder
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/frontend

# Edit .env.production with your backend URL
# Replace with the Railway URL you got in step 1A
echo "VITE_API_URL=https://rightiotsa-backend-production.up.railway.app" > .env.production

# Deploy to Vercel
vercel

# When prompted:
# - Set up and deploy: Y
# - Scope: (your account)
# - Link to existing project: N
# - Project name: rightiotsa
# - Directory: ./
# - Override settings: N

# Wait for deployment to complete (2-3 minutes)

# Deploy to production
vercel --prod

# Copy the deployment URL shown
# Example: rightiotsa.vercel.app
```

---

## 🌐 **STEP 2: DNS MAPPING** (5 minutes)

### **Where to do this**: Your domain registrar (where you bought rightIotsa.com)

**Common registrars**:
- GoDaddy: https://dcc.godaddy.com/manage/dns
- Namecheap: https://ap.www.namecheap.com/domains/list
- Other: Login to where you bought the domain

### **DNS Records to Add**:

**For Frontend (rightIotsa.com)**:

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 300

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: 300
```

**For Backend API (api.rightIotsa.com)**:

```
Type: CNAME
Name: api
Value: rightiotsa-backend-production.up.railway.app
(Use your actual Railway domain from Step 1A)
TTL: 300
```

### **How to add DNS records** (General steps):

1. Login to your domain registrar
2. Find "DNS Management" or "DNS Settings" or "Manage DNS"
3. Click "Add Record" or "Add DNS Record"
4. Enter the Type, Name, and Value from above
5. Save
6. Repeat for all 3 records

### **Configure Custom Domains in Hosting Platforms**:

**Vercel** (Frontend):
```bash
# Go to Vercel dashboard
open https://vercel.com/dashboard

# Click your project (rightiotsa)
# Click "Settings" → "Domains"
# Add domain: rightIotsa.com
# Add domain: www.rightIotsa.com
# Click "Add"
# Follow verification steps if prompted
```

**Railway** (Backend):
```bash
# Go to Railway dashboard
open https://railway.app/dashboard

# Click your project (rightiotsa-backend)
# Click "Settings" → "Domains"
# Click "Custom Domain"
# Enter: api.rightIotsa.com
# Click "Add"
```

### **Verify DNS Propagation**:

```bash
# Wait 5-30 minutes for DNS to propagate
# Check status:
open https://dnschecker.org

# Enter: rightIotsa.com
# Should show 76.76.21.21 globally

# Enter: api.rightIotsa.com
# Should show Railway domain
```

---

## 💳 **STEP 3: PAYFLOWLY FINAL SYNC** (10 minutes)

### **Login to Payflowly Dashboard**:

```bash
open https://payflowly.com/dashboard
```

### **Configure Settings**:

**1. General Settings**:
```
App Name:    Right
Currency:    SAR
Country:     Saudi Arabia
```

**2. Integration Settings**:
```
App URL:              https://rightIotsa.com
Success Redirect URL: https://rightIotsa.com/dashboard
Cancel Redirect URL:  https://rightIotsa.com/pricing
Webhook URL:          https://api.rightIotsa.com/webhook/payflowly
Webhook Events:       ✓ payment.success (check this box)
```

**3. Get API Keys**:
```
Go to: API Keys or Credentials section

Copy:
- Publishable Key: pk_live_xxxxxxxxxxxxx
- Secret Key: sk_live_xxxxxxxxxxxxx
```

**4. Add API Keys to Railway Backend**:
```bash
# Go back to Railway dashboard
open https://railway.app/dashboard

# Click your backend project
# Click "Variables"
# Add:

PAYFLOWLY_API_KEY
pk_live_xxxxxxxxxxxxx (paste your publishable key)

PAYFLOWLY_SECRET_KEY
sk_live_xxxxxxxxxxxxx (paste your secret key)

# Click "Deploy" or wait for auto-deploy
```

**5. Test Webhook** (Optional):
```bash
# In Payflowly dashboard, find "Webhook Testing" or "Test Webhook"
# Send a test webhook
# Check Railway logs to see if webhook was received
```

---

## ✅ **STEP 4: VERIFICATION** (5 minutes)

### **Test Your Live Site**:

**1. Frontend Access**:
```bash
# Open your live site
open https://rightIotsa.com

# Expected: Landing page loads
# Check: SSL certificate (green padlock in browser)
```

**2. Registration Flow**:
```
1. Click "إنشاء حساب" (Sign Up)
2. Fill all 5 fields:
   - Name: محمد أحمد
   - Mobile: 0501234567
   - Email: test@rightIotsa.com
   - City: الرياض
   - Asset Type: 🐴 خيل
3. Submit
4. Enter OTP: 1234
5. See welcome message
6. Redirect to Dashboard

Expected: ✅ All steps work smoothly
```

**3. Dashboard Check**:
```
Expected:
✓ 3 demo animals visible
✓ Map displays with Arabic labels ("الرياض")
✓ All assets show "Connected" + "Excellent Health"
✓ No false alerts
```

**4. Backend API Check**:
```bash
# Test API docs
open https://api.rightIotsa.com/docs

# Expected: Swagger UI loads
```

**5. Payment Test** (Use Payflowly test card):
```
1. Go to pricing page
2. Select a plan (e.g., Horse - 695 SAR)
3. Click payment
4. Use test card from Payflowly docs
5. Complete payment
6. Should redirect back to Dashboard
7. Check subscription status shows "Active"
```

---

## 🚨 **TROUBLESHOOTING**

### **Issue: DNS not working after 30 minutes**

**Solution**:
```bash
# Clear your browser cache
# Try incognito/private browsing
# Check DNS: https://dnschecker.org
# Verify DNS records in registrar match exactly
```

### **Issue: Backend API returns 404**

**Solution**:
```bash
# Check Railway deployment logs
# Verify environment variables are set
# Check custom domain is added in Railway
# Wait 5 more minutes for DNS
```

### **Issue: Frontend shows "Network Error"**

**Solution**:
```bash
# Check VITE_API_URL in Vercel environment variables
# Should be: https://api.rightIotsa.com
# Redeploy frontend if you changed it:
cd frontend && vercel --prod
```

### **Issue: Payment not working**

**Solution**:
```bash
# Verify Payflowly API keys are in Railway
# Check webhook URL is exactly: https://api.rightIotsa.com/webhook/payflowly
# Test webhook in Payflowly dashboard
# Check Railway logs for webhook calls
```

### **Issue: OTP email not received**

**Solution**:
```bash
# For testing: OTP code is always 1234
# For production: Add RESEND_API_KEY to Railway
# Get free API key from https://resend.com
```

---

## 📞 **GET HELP**

**Railway Issues**:
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**Vercel Issues**:
- Docs: https://vercel.com/docs
- Support: help@vercel.com

**DNS Issues**:
- DNS Checker: https://dnschecker.org
- Wait time: Up to 48 hours (usually 5-30 minutes)

**Payflowly Issues**:
- Check your Payflowly dashboard for support options
- Test mode: Use test cards before going live

---

## 🎯 **QUICK CHECKLIST**

- [ ] Ran deployment script OR deployed manually
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Added environment variables to Railway
- [ ] Added DNS records in domain registrar
- [ ] Configured custom domains in Railway & Vercel
- [ ] Configured Payflowly dashboard settings
- [ ] Added Payflowly API keys to Railway
- [ ] Tested https://rightIotsa.com (loads)
- [ ] Tested registration flow (works)
- [ ] Tested dashboard (shows 3 animals)
- [ ] Tested payment flow (redirects)

---

## 🎊 **ESTIMATED TIME**

- **Step 1 (Deployment)**: 15 minutes
- **Step 2 (DNS)**: 5 minutes + 5-30 min propagation
- **Step 3 (Payflowly)**: 10 minutes
- **Step 4 (Testing)**: 5 minutes

**Total Active Time**: ~35 minutes  
**Total Wait Time**: 5-30 minutes (DNS propagation)

---

## ✅ **ONCE COMPLETE**

You will have:
- ✅ Live platform at https://rightIotsa.com
- ✅ API at https://api.rightIotsa.com
- ✅ SSL certificates active (HTTPS)
- ✅ Registration working with email OTP
- ✅ Payflowly payments active
- ✅ Dashboard with 3 demo animals
- ✅ Session persistence working
- ✅ All features ready for customer testing

---

**Deployment Date**: February 11, 2026  
**Status**: ⏳ **AWAITING YOUR ACTION**  
**Prepared By**: AI Assistant  
**Next Step**: Run `./DEPLOY_TO_RIGHTIOTSA.sh` in Terminal

🚀 **Everything is ready! Follow the steps above to go live!**
