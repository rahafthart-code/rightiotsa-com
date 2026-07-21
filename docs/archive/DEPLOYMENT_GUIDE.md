# 🚀 RIGHT PLATFORM - LIVE DEPLOYMENT GUIDE

## 📅 Date: February 11, 2026
## 🎯 Objective: Deploy to Public Live URL

---

## 🌐 **QUICK DEPLOYMENT OPTIONS**

### **Option 1: Railway (Recommended - Fastest)**

**Why Railway?**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ PostgreSQL included
- ✅ Deploy in 5 minutes
- ✅ GitHub integration

**Steps**:

1. **Create Railway Account**:
   - Go to: https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**:
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Navigate to backend
   cd backend
   
   # Initialize Railway project
   railway init
   
   # Deploy
   railway up
   
   # Get your URL
   railway domain
   ```

3. **Add Environment Variables** (Railway Dashboard):
   ```
   DATABASE_URL=postgresql://...  (Railway auto-provides)
   JWT_SECRET_KEY=your-secret-key-here
   DEV_TESTING_OTP=1234
   PAYFLOWLY_API_KEY=your-key-here
   PAYFLOWLY_SECRET_KEY=your-secret-here
   WEBHOOK_BASE_URL=https://your-app.railway.app
   DASHBOARD_URL=https://your-frontend.vercel.app/dashboard
   ```

4. **Deploy Frontend to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Navigate to frontend
   cd frontend
   
   # Deploy
   vercel
   
   # Follow prompts, select production
   ```

5. **Update Frontend API URL**:
   - Edit `frontend/src/api.js`
   - Change `baseURL` to your Railway backend URL
   - Redeploy: `vercel --prod`

**Your Live URLs**:
- Backend: `https://your-app.railway.app`
- Frontend: `https://your-project.vercel.app`

---

### **Option 2: Render (Alternative)**

**Why Render?**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ PostgreSQL database included
- ✅ Simple dashboard

**Steps**:

1. **Create Render Account**:
   - Go to: https://render.com
   - Sign up with GitHub

2. **Deploy Backend**:
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3
   - Instance Type: Free
   - Add Environment Variables (same as Railway)

3. **Create PostgreSQL Database**:
   - Dashboard → New → PostgreSQL
   - Name: right-db
   - Copy `Internal Database URL`
   - Add to backend as `DATABASE_URL`

4. **Deploy Frontend**:
   - Use Vercel (steps above) or Netlify

---

### **Option 3: Heroku (Classic)**

**Steps**:

1. **Install Heroku CLI**:
   ```bash
   brew install heroku  # Mac
   # OR
   npm i -g heroku      # All platforms
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   heroku login
   heroku create right-backend
   heroku addons:create heroku-postgresql:mini
   
   # Add buildpack
   heroku buildpacks:set heroku/python
   
   # Deploy
   git push heroku main
   
   # Set environment variables
   heroku config:set JWT_SECRET_KEY=your-secret
   heroku config:set DEV_TESTING_OTP=1234
   ```

3. **Deploy Frontend**:
   - Use Vercel or Netlify (steps above)

---

## 🔧 **BACKEND CONFIGURATION**

### **Update `frontend/src/api.js`**:

Change from:
```javascript
const apiClient = axios.create({
  baseURL: "http://localhost:8000"
});
```

To:
```javascript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://your-backend.railway.app"
});
```

### **Add Environment Variable to Frontend**:

Create `frontend/.env.production`:
```bash
VITE_API_URL=https://your-backend.railway.app
```

---

## 📱 **PAYFLOWLY PRODUCTION SETUP**

### **1. Payflowly Dashboard Configuration**:

```
Login: https://payflowly.com/dashboard

Settings → Integration:
  App Name: Right
  Success Redirect URL: https://your-frontend.vercel.app/dashboard
  Webhook URL: https://your-backend.railway.app/webhook/payflowly
  Webhook Events: ✓ payment.success
  
Settings → API Keys:
  Copy: Production API Key (pk_live_xxxxx)
  Copy: Production Secret Key (sk_live_xxxxx)
```

### **2. Add to Backend Environment Variables**:

```bash
PAYFLOWLY_API_KEY=pk_live_xxxxxxxxxxxxx
PAYFLOWLY_SECRET_KEY=sk_live_xxxxxxxxxxxxx
WEBHOOK_BASE_URL=https://your-backend.railway.app
DASHBOARD_URL=https://your-frontend.vercel.app/dashboard
```

### **3. Test Webhook**:

```bash
# Test webhook endpoint
curl -X POST https://your-backend.railway.app/webhook/payflowly

# Should return: 405 Method Not Allowed (GET not allowed)
# This confirms endpoint exists
```

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

### **Backend Verification**:
- [ ] API docs accessible: `https://your-backend.railway.app/docs`
- [ ] Database connected (check logs)
- [ ] Environment variables set
- [ ] `/payment/create-link` endpoint working
- [ ] `/webhook/payflowly` endpoint accessible

### **Frontend Verification**:
- [ ] Site loads: `https://your-frontend.vercel.app`
- [ ] Registration form displays
- [ ] Email validation working (green checkmark)
- [ ] OTP code working (test with 1234)
- [ ] Dashboard accessible after login
- [ ] Map displays correctly (Arabic RTL)

### **Payflowly Integration**:
- [ ] Webhook URL configured in Payflowly dashboard
- [ ] Redirect URL configured
- [ ] Test payment link generation
- [ ] Test webhook with Payflowly test mode

---

## 🧪 **TESTING YOUR LIVE SITE**

### **Test 1: Registration Flow**:
```
1. Open: https://your-frontend.vercel.app/register
2. Fill form:
   - Name: محمد أحمد
   - Mobile: 0501234567
   - Email: test@example.com (watch green ✓)
   - City: الرياض
   - Asset Type: 🐴 خيل
3. Submit → Receive OTP email (or use 1234)
4. Enter OTP → See welcome message
5. Auto-redirect to Dashboard
```

### **Test 2: Session Persistence**:
```
1. Login to Dashboard
2. Close browser
3. Reopen: https://your-frontend.vercel.app
4. Verify: "Dashboard" button visible (still logged in)
5. Click Dashboard → Direct access
```

### **Test 3: Mock Payment**:
```
1. Get user_id from localStorage
2. Open: https://your-backend.railway.app/payment/mock?amount=695&email=test@example.com&plan=Horse&user_id=YOUR_ID
3. Verify: Redirects to Dashboard
4. Verify: Subscription activated
```

---

## 🔒 **SECURITY CHECKLIST**

### **Backend**:
- [ ] CORS configured for production domain only
- [ ] JWT secret key is strong (32+ characters)
- [ ] Database credentials secure
- [ ] HTTPS enforced (automatic on Railway/Render)
- [ ] Webhook signature verification enabled

### **Frontend**:
- [ ] API URL points to HTTPS backend
- [ ] No sensitive data in frontend code
- [ ] Environment variables properly configured
- [ ] LocalStorage data encrypted (JWT only)

---

## 📊 **MONITORING & LOGS**

### **Railway Dashboard**:
- Deployments → View build logs
- Metrics → Check CPU, Memory, Network
- Logs → Real-time application logs

### **Vercel Dashboard**:
- Deployments → View build status
- Functions → Check serverless function logs
- Analytics → Traffic and performance

---

## 🚨 **TROUBLESHOOTING**

### **Issue: Backend not responding**:
```bash
# Check Railway logs
railway logs

# Common fixes:
1. Verify environment variables set
2. Check database connection
3. Ensure PORT binding: --host 0.0.0.0 --port $PORT
```

### **Issue: Frontend can't connect to backend**:
```bash
# Check CORS configuration in backend
# Update main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Issue: Database connection error**:
```bash
# Railway: DATABASE_URL is auto-provided
# Render: Copy Internal Database URL from dashboard
# Heroku: Use heroku config to verify DATABASE_URL
```

---

## 💰 **COST ESTIMATE**

### **Free Tier (Recommended for MVP)**:
- Railway Backend: Free (500 hours/month)
- Railway PostgreSQL: Free (Small database)
- Vercel Frontend: Free (Unlimited static sites)
- **Total**: $0/month

### **Production Tier (For Scale)**:
- Railway Backend: $5/month (Hobby plan)
- Railway PostgreSQL: $5/month
- Vercel Frontend: $0 (Free tier sufficient)
- **Total**: ~$10/month

---

## 📞 **EXAMPLE LIVE URLS**

After deployment, your URLs will look like:

**Backend**:
- `https://right-backend-production.up.railway.app`
- API Docs: `https://right-backend-production.up.railway.app/docs`

**Frontend**:
- `https://right-platform.vercel.app`
- Register: `https://right-platform.vercel.app/register`
- Dashboard: `https://right-platform.vercel.app/dashboard`

---

## 🎯 **QUICK DEPLOY SCRIPT**

```bash
#!/bin/bash

echo "🚀 Deploying Right Platform..."

# Deploy Backend to Railway
cd backend
railway login
railway init
railway up
BACKEND_URL=$(railway domain)
echo "✅ Backend deployed: $BACKEND_URL"

# Deploy Frontend to Vercel
cd ../frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.production
vercel --prod
echo "✅ Frontend deployed"

echo "🎉 Deployment complete!"
echo "Backend: $BACKEND_URL"
echo "Frontend: Check Vercel dashboard for URL"
```

---

## 📄 **SUMMARY**

**Fastest Path to Live URL**:
1. ✅ Deploy backend to Railway (5 minutes)
2. ✅ Deploy frontend to Vercel (3 minutes)
3. ✅ Configure Payflowly webhook (2 minutes)
4. ✅ Test live site (2 minutes)
5. ✅ **Total**: ~15 minutes to live!

**Your Next Steps**:
1. Choose deployment platform (Railway recommended)
2. Create account and connect GitHub
3. Deploy backend and frontend
4. Update Payflowly webhook URLs
5. Test complete flow
6. Share live URL with users!

---

**Deployment Date**: February 11, 2026
**Status**: Ready to Deploy
**Estimated Time**: 15-20 minutes

🎊 **Your platform will be live and accessible worldwide!**
