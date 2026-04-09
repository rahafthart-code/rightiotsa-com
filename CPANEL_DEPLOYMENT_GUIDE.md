# 🚀 cPanel DEPLOYMENT GUIDE FOR rightiotsa.com

## ⚠️ **IMPORTANT: cPanel Deployment Challenges**

**Your Right platform requires**:
- ✅ Frontend: React/Vite (can work on cPanel)
- ✅ Backend: Python FastAPI with PostgreSQL (⚠️ **challenging on cPanel**)

**cPanel is designed for**:
- PHP websites
- WordPress
- Static HTML sites

**Your platform needs**:
- Python 3.8+ runtime
- PostgreSQL database
- Always-running FastAPI server
- WebSocket support (for real-time tracking)

**Recommendation**: Use Railway/Vercel instead (much easier), BUT I'll provide cPanel instructions if you must use it.

---

## 🎯 **TWO DEPLOYMENT APPROACHES**

### **Approach A: Hybrid (Recommended)**
- Frontend on cPanel (public_html)
- Backend on Railway (free tier)
- **Easiest and most reliable**

### **Approach B: Full cPanel (Complex)**
- Both frontend and backend on cPanel
- Requires Python support in cPanel
- May need SSH access
- **More complex, may not work**

---

## 🚀 **APPROACH A: HYBRID DEPLOYMENT** (30 minutes)

### **Part 1: Deploy Backend to Railway** (15 minutes)

**You need to do this in Terminal**:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Navigate to backend
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/backend

# Login (opens browser)
railway login

# Initialize and deploy
railway init
railway up

# Get backend URL
railway domain
# Copy this URL - example: rightiotsa-backend.up.railway.app
```

**Add Environment Variables in Railway Dashboard**:
1. Go to https://railway.app/dashboard
2. Click your project
3. Add PostgreSQL database (+ New → Database → PostgreSQL)
4. Click "Variables" → Add:
   - `JWT_SECRET_KEY`: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - `FRONTEND_URL`: `https://rightiotsa.com`
   - `WEBHOOK_BASE_URL`: `https://[your-railway-domain]`
   - `DASHBOARD_URL`: `https://rightiotsa.com/dashboard`
   - `DEV_TESTING_OTP`: `1234`
   - `PAYFLOWLY_API_KEY`: (from Payflowly dashboard)
   - `PAYFLOWLY_SECRET_KEY`: (from Payflowly dashboard)

---

### **Part 2: Build Frontend for cPanel** (5 minutes)

**In Terminal**:

```bash
# Navigate to frontend
cd /Users/rahafrroyalarts/Desktop/SmartHerd_MVP/frontend

# Update API URL to point to Railway backend
echo "VITE_API_URL=https://rightiotsa-backend.up.railway.app" > .env.production

# Build for production
npm run build

# This creates a 'dist' folder with static files
```

**Result**: You now have a `dist` folder with all your website files ready to upload.

---

### **Part 3: Upload Frontend to cPanel** (10 minutes)

**Method 1: Using FileZilla (Recommended)**

**Download FileZilla** (Free FTP client):
- Download: https://filezilla-project.org/download.php?type=client
- Install on your Mac

**Get FTP Credentials from cPanel**:
1. Login to: https://server352.web-hosting.com/cpanel
2. Search for "FTP Accounts" in top search bar
3. Click "FTP Accounts"
4. Find your main account credentials OR create new FTP account:
   - Username: `righogwr@rightiotsa.com` (or similar)
   - Password: (your cPanel password or create new)
   - Directory: `/public_html`

**Upload with FileZilla**:
1. Open FileZilla
2. File → Site Manager → New Site
3. Enter:
   - Host: `server352.web-hosting.com` OR `ftp.rightiotsa.com`
   - Port: `21`
   - Protocol: `FTP - File Transfer Protocol`
   - Encryption: `Use explicit FTP over TLS if available`
   - Logon Type: `Normal`
   - User: `righogwr@rightiotsa.com`
   - Password: (your FTP password)
4. Click "Connect"
5. In right panel (Remote site): Navigate to `/public_html`
6. **DELETE** everything in public_html folder
7. In left panel (Local site): Navigate to `/Users/rahafrroyalarts/Desktop/SmartHerd_MVP/frontend/dist`
8. Select ALL files in dist folder
9. Right-click → Upload
10. Wait for upload to complete (2-3 minutes)

**Method 2: Using cPanel File Manager** (Slower)

1. Login to cPanel: https://server352.web-hosting.com/cpanel
2. Click "File Manager"
3. Navigate to `public_html` folder
4. Select all files → Delete
5. Click "Upload"
6. Select all files from `frontend/dist` folder
7. Upload them
8. Go back to `public_html`
9. Files should now be there

---

### **Part 4: Configure DNS in cPanel** (5 minutes)

**In cPanel**:
1. Search for "Zone Editor" or "DNS Zone Editor"
2. Click it
3. Find domain: `rightiotsa.com`
4. Add/Edit these records:

**For Frontend** (Already configured usually):
```
Type: A
Name: @
Address: [Your server IP - should be auto-filled]
```

**For Backend API** (Point to Railway):
```
Type: CNAME
Name: api
CNAME: rightiotsa-backend.up.railway.app
```

**Save Changes**

---

### **Part 5: Test Your Site** (5 minutes)

**Wait 10-15 minutes for DNS propagation**

**Then test**:
```bash
# Open your live site
open https://rightiotsa.com

# Should load the landing page!
```

**Test registration**:
1. Click "إنشاء حساب"
2. Fill form
3. Submit
4. Enter OTP: `1234`
5. Should redirect to Dashboard

**✅ If this works, your site is LIVE!**

---

## 🚀 **APPROACH B: FULL CPANEL DEPLOYMENT** (Complex)

**⚠️ WARNING**: This is **much more complex** and may not work if your cPanel doesn't support:
- Python 3.8+
- pip installation
- Long-running processes
- PostgreSQL (MySQL won't work for our code)

### **Prerequisites Check**:

**Login to cPanel → Terminal** (or SSH):
```bash
# Check Python version
python3 --version
# Need: Python 3.8 or higher

# Check if pip works
pip3 --version

# Check available databases
# cPanel → Databases
# Need: PostgreSQL (not just MySQL)
```

**If you don't have Python 3.8+ or PostgreSQL → Use Approach A (Hybrid)**

---

### **If You Have Requirements**:

**1. Upload Backend Code**:
```bash
# In cPanel File Manager
# Create folder: /home/righogwr/backend
# Upload all files from backend folder
```

**2. Install Dependencies**:
```bash
# In cPanel Terminal (or SSH)
cd ~/backend
pip3 install -r requirements.txt --user
```

**3. Create Database**:
```bash
# In cPanel → PostgreSQL Databases
# Create database: righogwr_rightdb
# Create user: righogwr_dbuser
# Grant all privileges
# Copy connection string
```

**4. Configure Environment**:
```bash
# Create .env file in backend folder
nano ~/backend/.env

# Paste:
DATABASE_URL=postgresql://righogwr_dbuser:password@localhost:5432/righogwr_rightdb
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
FRONTEND_URL=https://rightiotsa.com
WEBHOOK_BASE_URL=https://rightiotsa.com
DASHBOARD_URL=https://rightiotsa.com/dashboard
DEV_TESTING_OTP=1234
PAYFLOWLY_API_KEY=your_key_here
PAYFLOWLY_SECRET_KEY=your_secret_here
```

**5. Run Backend** (This is the hard part):
```bash
# cPanel doesn't keep Python apps running!
# You need to set up a process manager

# Option 1: Use Passenger (if available)
# Option 2: Use supervisor
# Option 3: Use cronjob to restart every minute (not ideal)

# This is why Railway is better!
```

---

## 💡 **MY STRONG RECOMMENDATION**

**Use Hybrid Approach (A)**:

**Why?**
- ✅ Frontend works perfectly on cPanel
- ✅ Backend runs reliably on Railway (free)
- ✅ Much easier to deploy
- ✅ Better performance
- ✅ Free PostgreSQL database included
- ✅ Automatic SSL certificates
- ✅ Process management handled automatically

**cPanel is NOT designed for**:
- ❌ Python FastAPI applications
- ❌ Always-running API servers
- ❌ Real-time WebSocket connections
- ❌ Complex backend frameworks

---

## 📞 **LET ME HELP YOU THE RIGHT WAY**

I'll **guide you step-by-step** as you run the commands:

**Let's do this together**:

1. **Open Terminal** on your Mac
2. **Tell me** "I've opened Terminal"
3. **I'll give you** the first command to copy/paste
4. **You run it** and tell me what you see
5. **I guide you** to the next step

**This way**:
- ✅ You maintain control of your credentials
- ✅ You see exactly what's happening
- ✅ I guide you through any issues
- ✅ You learn how deployment works
- ✅ Site goes live in ~45 minutes

---

## 🎯 **YOUR DECISION**

**Option 1**: Let me guide you through terminal commands right now (I walk you through each step)

**Option 2**: Hire someone to run the commands for you

**Option 3**: Try to deploy backend to cPanel (very complex, may not work)

---

**Which option would you like? I'm ready to help you get rightiotsa.com live today, but I need you to execute the commands while I guide you.**

**First**: Please change your cPanel password for security! 🔒