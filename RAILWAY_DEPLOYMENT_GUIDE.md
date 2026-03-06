# 🚂 Railway Deployment - Complete Step-by-Step Guide

**Date:** March 6, 2026  
**Project:** Quiz Challenge Arena  
**Platform:** Railway  
**Estimated Time:** 10-15 minutes

---

## Why Railway?

- ✅ **Easiest deployment** - UI-based, no CLI needed
- ✅ **Free tier available** - $5 free credits monthly
- ✅ **Auto-deploys** - Push to GitHub = automatic deployment
- ✅ **SSL included** - HTTPS by default
- ✅ **Environment variables** - Easy management
- ✅ **Logs included** - Integrated logging
- ✅ **Perfect for beginners** - Great UX

---

## 📋 Pre-Deployment Checklist

Before starting, verify you have:

- [ ] Railway account (create at https://railway.app)
- [ ] GitHub account with repository
- [ ] Production secrets (64+ characters each):
  ```bash
  # Generate these now if you haven't
  openssl rand -hex 32  # For JWT_SECRET
  openssl rand -hex 32  # For SESSION_SECRET
  ```
- [ ] Environment variables list ready
- [ ] Production build tested locally
- [ ] Git repository pushed to GitHub

---

## 🔐 Step 1: Generate Production Secrets (5 minutes)

### Generate Strong Secrets

Open terminal and run TWICE:
```bash
openssl rand -hex 32
```

You'll get output like:
```
a3f7b9e2c1d5e8f0a9b7c5d3e1f8a0b9c7d5e3f1a9b7c5d3e1f8a0b9c7d5
```

**Save both outputs:**
- First output → **JWT_SECRET**
- Second output → **SESSION_SECRET**

⚠️ **DO NOT share these values or commit them to Git!**

---

## 🌐 Step 2: Create Railway Account (2 minutes)

### 2.1 Sign Up
1. Go to https://railway.app
2. Click **"Start Free"** button
3. Choose sign-up method:
   - GitHub (recommended - easier)
   - Google
   - Email

### 2.2 Connect GitHub (If Not Auto-Connected)
1. After login, click your profile icon (top right)
2. Go to **"Integrations"** or **"Account"**
3. Click **"Connect GitHub"**
4. Authorize Railway to access your GitHub
5. Confirm you can see your repositories

### 2.3 Verify Account
- [ ] Logged into Railway
- [ ] GitHub connected
- [ ] Can see your GitHub repositories
- [ ] Email verified (if using email signup)

---

## 📦 Step 3: Create Railway Project (3 minutes)

### 3.1 Create New Project
1. Go to https://railway.app/dashboard
2. Click **"New Project"** button (large blue button)
3. Select deployment source

### 3.2 Connect GitHub Repository
1. When prompted, click **"Deploy from GitHub"** (or "GitHub" option)
2. Select your `quiz-challenge-arena` repository
3. If not listed, click **"Configure GitHub Permissions"** to grant access to more repos
4. Click to select your repository

### 3.3 Watch Initial Deploy
Railway will start automatically building:
```
✓ Repository connected
✓ Building Docker image
✓ Starting deployment
⏳ Your app is deploying...
```

**Important:** This first build might take 2-3 minutes. Don't close the window!

---

## 🔑 Step 4: Set Environment Variables (5 minutes)

### 4.1 Navigate to Environment Variables
1. In your Railway project, click on your **app service** (if multiple services shown)
2. Look for tabs or sidebar: Find **"Variables"** or **"Settings"**
3. Click **"Variables"** tab

### 4.2 Add Environment Variables

You'll see an empty environment variables list. Add each variable:

**Method 1: Add One by One**
- [ ] Click **"New Variable"** or **"+"** button
- [ ] Enter **Key** (e.g., `NODE_ENV`)
- [ ] Enter **Value**
- [ ] Press Enter
- [ ] Repeat for each variable

**Method 2: Paste Multiple (Recommended)**
- [ ] Look for **"Raw Editor"** or **"Paste"** option
- [ ] Paste this template and fill in YOUR values:

```
NODE_ENV=production
PORT=3000
PING_MESSAGE=Hello from Fusion!
SUPABASE_URL=https://mrbtjnpfjaeskfqarwss.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yYnRqbnBmamFlc2tmcWFyd3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzQwMjcsImV4cCI6MjA4ODI1MDAyN30.QHklBY2y-ehvju_28CR_dhlkw3b1rba0RTCRBj1vx0Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yYnRqbnBmamFlc2tmcWFyd3NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY3NDAyNywiZXhwIjoyMDg4MjUwMDI3fQ.p10ooyaHtl3C4RSYprlRw5PVgyQj7v7IUkd04fjElmU
VITE_SUPABASE_URL=https://mrbtjnpfjaeskfqarwss.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yYnRqbnBmamFlc2tmcWFyd3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzQwMjcsImV4cCI6MjA4ODI1MDAyN30.QHklBY2y-ehvju_28CR_dhlkw3b1rba0RTCRBj1vx0Q
GROQ_API_KEY=YOUR_GROQ_API_KEY_FROM_CONSOLE
JWT_SECRET=REPLACE_WITH_YOUR_64_CHARACTER_SECRET_HERE
SESSION_SECRET=REPLACE_WITH_YOUR_64_CHARACTER_SECRET_HERE
ALLOWED_ORIGINS=https://your-app-name.up.railway.app
VITE_ALLOWED_ORIGINS=https://your-app-name.up.railway.app
MATCH_TIMER=15
ELO_K_FACTOR=32
```

### 4.3 Essential Variables to Replace

**CRITICAL - Replace these NOW:**

| Variable | Replace With | How to Find |
|----------|--------------|-------------|
| `JWT_SECRET` | Your 64-char secret | `openssl rand -hex 32` output 1 |
| `SESSION_SECRET` | Your 64-char secret | `openssl rand -hex 32` output 2 |
| `ALLOWED_ORIGINS` | Your Railway URL | See Step 5 (after deployment) |
| `VITE_ALLOWED_ORIGINS` | Your Railway URL | See Step 5 (after deployment) |

### 4.4 Add Each Required Variable

**Copy and paste these one by one if not using raw editor:**

```
✓ NODE_ENV                    = production
✓ PORT                        = 3000
✓ PING_MESSAGE                = Hello from Fusion!
✓ SUPABASE_URL                = https://mrbtjnpfjaeskfqarwss.supabase.co
✓ SUPABASE_ANON_KEY           = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✓ SUPABASE_SERVICE_ROLE_KEY   = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✓ VITE_SUPABASE_URL           = https://mrbtjnpfjaeskfqarwss.supabase.co
✓ VITE_SUPABASE_ANON_KEY      = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✓ GROQ_API_KEY                = [YOUR_API_KEY_FROM_GROQ_CONSOLE]
✓ JWT_SECRET                  = [YOUR_GENERATED_64_CHAR_SECRET]
✓ SESSION_SECRET              = [YOUR_GENERATED_64_CHAR_SECRET]
✓ ALLOWED_ORIGINS             = https://your-app-name.up.railway.app (update later)
✓ VITE_ALLOWED_ORIGINS        = https://your-app-name.up.railway.app (update later)
✓ MATCH_TIMER                 = 15
✓ ELO_K_FACTOR                = 32
```

### 4.5 Save Variables
- After entering all variables, click **"Save"** or **"Deploy"**
- Railway will automatically redeploy with new environment variables

---

## 🚀 Step 5: Verify Deployment & Get Your URL (3 minutes)

### 5.1 Wait for Deployment
1. Go to **"Deployments"** tab in your Railway project
2. Watch the deployment progress:
   ```
   ✓ Building                    [████████████████] 100%
   ✓ Building Docker image       [████████████████] 100%
   ✓ Pushing to registry         [████████████████] 100%
   ✓ Starting deployment         [████████████████] 100%
   ✓ Running health check        [████████████████] 100%
   ```

### 5.2 Find Your Public URL
1. After deployment completes, look for:
   - **"Deployments"** tab
   - Or **"Settings"** → **"Domains"** section
   - Look for a URL like:
     ```
     https://quiz-challenge-arena-production.up.railway.app
     ```

2. Click on the URL or copy it

### 5.3 Find Your Railway Domain
1. Under **"Settings"** look for **"Domains"** section
2. You should see a public domain assigned
3. Examples:
   - `https://your-project-name-production.up.railway.app`
   - `https://quiz-arena-x1y2z3.up.railway.app`
   - Your custom domain (if configured)

**Copy this URL - you'll need it!**

### 5.4 Update CORS Configuration
1. Go back to **"Variables"** tab
2. Update these variables with your actual Railway URL:
   - `ALLOWED_ORIGINS` = `https://your-actual-url.up.railway.app`
   - `VITE_ALLOWED_ORIGINS` = `https://your-actual-url.up.railway.app`
3. Click **"Save"** → Railway redeploys automatically

---

## ✅ Step 6: Test Your Deployment (5 minutes)

### 6.1 Health Check
```bash
# Test the health endpoint
curl https://your-app-name.up.railway.app/api/ping

# Expected response:
# {"message":"Hello from Fusion!"}
```

### 6.2 Test in Browser
1. Open https://your-app-name.up.railway.app in browser
2. Check if page loads without CORS errors
3. Check browser console (F12) for errors
4. Try logging in
5. Try starting a quiz
6. Verify questions are loading

### 6.3 Quick API Tests
```bash
# Test questions endpoint
curl https://your-app-name.up.railway.app/api/questions

# Should return JSON with 5 questions array

# Test leaderboard
curl https://your-app-name.up.railway.app/api/leaderboard

# Should return leaderboard data
```

### 6.4 Check Logs for Errors
1. In Railway dashboard, go to **"Logs"** or **"Monitoring"**
2. Look for any error messages
3. Common errors:
   - `Error: SUPABASE_URL is not defined` → Check environment variables
   - `CORS error` → Update ALLOWED_ORIGINS
   - `Connection refused` → Wait for full startup (30-60 seconds)

---

## 🔄 Step 7: Set Up Auto-Deployment (Optional but Recommended)

### 7.1 How It Works
- Railway already watches your GitHub repo
- Every push to main/master branch = automatic deployment
- You don't need to do anything!

### 7.2 Verify Auto-Deployment is Enabled
1. Go to **"Settings"** → **"Git"** or **"Webhooks"**
2. Should see GitHub connected with auto-deploy enabled
3. If not enabled, click to enable

### 7.3 Test Auto-Deployment
```bash
# Make a small test change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test deployment"
git push

# Watch Railway dashboard - new deployment should start automatically!
```

---

## 📊 Step 8: Monitor Your Application

### 8.1 View Logs
1. In Railway, click **"Logs"** tab
2. Watch logs in real-time:
   ```
   > node dist/server/node-build.mjs
   Supabase initialized
   Express server listening on port 3000
   ```

### 8.2 View Metrics
1. Click **"Metrics"** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Network I/O
   - Request count

### 8.3 View Deployments
1. Click **"Deployments"** tab
2. See all deployment history
3. Rollback to previous version if needed

---

## 🎯 Common Tasks on Railway

### View Application Status
```
Dashboard → Select Project → Status should show "Running"
```

### Restart Application
1. Go to **"Deployments"**
2. Click the latest deployment
3. Click **"Restart Deployment"** or similar button

### View Environment Variables
```
Dashboard → Variables → See all your environment variables
```

### Stop Application (if needed)
1. Go to **"Settings"**
2. Look for **"Pause"** or **"Stop"** button
3. Click to pause deployment

### Redeploy Current Code
1. Go to **"Deployments"**
2. Click **"Redeploy"** on latest deployment
3. Wait for redeployment

### Check Resource Usage
```
Settings → Resource Usage or Metrics tab
See: CPU, Memory, Network usage
```

---

## 🚨 Troubleshooting

### Application won't start / Crashes immediately

**Symptom:** Deployment shows red icon, logs show errors

**Solutions:**
```bash
# 1. Check environment variables are set
Dashboard → Variables → Verify all required vars present

# 2. Check logs for specific error
Dashboard → Logs → Look for error message

# 3. Common causes:
# - Missing SUPABASE_URL
# - Missing JWT_SECRET or SESSION_SECRET
# - Database connection failed
# - GROQ API key invalid

# 4. Fix and redeploy
Dashboard → Deployments → Click "Redeploy"
```

### CORS errors in browser console

**Symptom:** Error like "Access to XMLHttpRequest blocked by CORS"

**Solution:**
```bash
# Update ALLOWED_ORIGINS in variables
Dashboard → Variables → Find ALLOWED_ORIGINS
# Change from localhost to your Railway URL
# Example: https://quiz-app-production.up.railway.app

# Then redeploy
Dashboard → Deployments → Redeploy
```

### Questions not loading / API returns 500

**Symptom:** 500 error when fetching questions

**Check:**
1. Database connection (SUPABASE_URL + keys correct?)
2. Groq API key valid? (gsk_...)
3. Check logs for specific error
4. Try health endpoint: `/api/ping` - should return success

### Application slow

**Symptom:** Responses taking >2-3 seconds

**Solutions:**
1. Check Metrics tab - is CPU/Memory maxed?
2. Upgrade Railway plan if hitting resource limits
3. Check logs for expensive operations
4. Monitor database queries

### "Cannot find module" errors

**Symptom:** Error like `Cannot find module '@supabase/supabase-js'`

**Solution:**
```bash
# This usually means build failed
# Check if Dockerfile looks for dependencies in right place

# In Railway dashboard:
# 1. Go to Deployments
# 2. Look at build logs
# 3. Scroll to find where build failed
# 4. Check if all dependencies installed

# Trigger rebuild:
# Push a small change to GitHub
git commit --allow-empty -m "trigger rebuild"
git push
```

### Port already in use error

**Symptom:** Error about port 3000 in use

**Solution:**
- Railway automatically assigns a free port
- The error in logs is usually not critical
- If app won't start, check if NODE_ENV and PORT are set correctly

### Database connection timeout

**Symptom:** Error about Supabase connection timeout

**Solutions:**
1. Verify SUPABASE_URL is correct (check .env.example)
2. Verify SUPABASE_SERVICE_ROLE_KEY is valid
3. Check if Supabase server is up (https://status.supabase.com)
4. Check Railway network connectivity

---

## 📈 Performance Optimization (Optional)

### Monitor Performance
```
Dashboard → Metrics
- Watch CPU usage
- Watch Memory usage
- Watch Network traffic
- Watch Request latency
```

### Upgrade if Needed
If hitting resource limits:
1. Railway dashboard → **"Billing"**
2. Increase plan tier
3. Or add more resources

### Enable Caching (Advanced)
1. Railway offers Redis add-on
2. Or use Cloudflare for caching
3. Reduces database load

---

## 🔒 Security Checklist (After Deployment)

- [ ] CORS is set to your domain only (not wildcard)
- [ ] Environment variables are NOT visible in public code
- [ ] Database credentials are secrets (not in .env)
- [ ] JWT_SECRET is 64+ characters
- [ ] SESSION_SECRET is 64+ characters
- [ ] Logs don't show sensitive data
- [ ] HTTPS is auto-enabled (🔒 icon in browser)
- [ ] No demo/test users in production

---

## 📞 Getting Help

### If Something Goes Wrong

1. **Check Railway Documentation**
   - https://docs.railway.app

2. **Check Logs**
   - Dashboard → Logs → Scroll for errors

3. **Verify Environment Variables**
   - Dashboard → Variables → All present?

4. **Common Issues**
   - This guide's "Troubleshooting" section
   - Original guides: PRODUCTION_DOCKER_GUIDE.md

5. **Restart Deployment**
   - Dashboard → Deployments → Redeploy

---

## ✅ Deployment Checklist

Before considering deployment complete:

- [ ] Deployment shows "Running" (green status)
- [ ] Health check returns success (`/api/ping`)
- [ ] Application loads in browser
- [ ] No CORS errors in console
- [ ] Questions API returns data
- [ ] Logs show no errors
- [ ] Environment variables all set
- [ ] Auto-deployment enabled
- [ ] Can see your public Railway URL

---

## 🎉 SUCCESS!

Your application is now live on Railway!

### Your Production URL:
```
https://your-app-name.up.railway.app
```

### Next Steps:
1. Test thoroughly in production
2. Share with users
3. Monitor logs daily
4. Setup monitoring email alerts (optional)
5. Keep dependencies updated

### Monitor Production:
```
Check daily:
✓ Dashboard → Status (should be green)
✓ Dashboard → Logs (check for errors)
✓ Dashboard → Metrics (CPU/Memory normal)
```

---

## 📚 Additional Resources

| Resource | URL |
|----------|-----|
| Railway Docs | https://docs.railway.app |
| Railway Community | https://railway.app/community |
| This Project's Guides | PRODUCTION_DOCKER_GUIDE.md |
| Git Deployment | https://docs.railway.app/guides/git |

---

**Deployed Successfully! 🚂 Your quiz app is now live on Railway! 🎉**

Questions? Check the Railway dashboard or this guide's troubleshooting section.

---

**Generated:** March 6, 2026  
**Platform:** Railway  
**Status:** Complete Step-by-Step Guide
