# 🚂 Railway - Visual Step-by-Step Checklist

**Use this checklist to follow along - check off each step!**

---

## ✅ Pre-Deployment (Do These First!)

- [ ] **Step 1: Verify application is production-ready**
  ```bash
  pnpm build
  # Should complete successfully with no errors
  
  pnpm typecheck
  # Should show: Exit Code: 0
  ```

- [ ] **Step 2: Generate Production Secrets**
  ```bash
  # Open terminal and run (TWICE)
  openssl rand -hex 32
  
  # Output 1 (save as JWT_SECRET):
  # ____________________________________________________________________
  
  # Output 2 (save as SESSION_SECRET):
  # ____________________________________________________________________
  ```

- [ ] **Step 3: Backup Your Secrets**
  - [ ] Save JWT_SECRET in password manager
  - [ ] Save SESSION_SECRET in password manager
  - [ ] Do NOT commit to Git

---

## 🌐 Railway Account Setup

- [ ] **Step 4: Go to Railway**
  - [ ] Open https://railway.app in browser
  - [ ] Look for blue "Start Free" button (top right area)
  - [ ] Click it

- [ ] **Step 5: Sign Up for Railway Account**
  - [ ] Choose sign-up method:
    - [ ] GitHub (recommended - tick this if using)
    - [ ] Google
    - [ ] Email
  - [ ] Follow prompts to create account
  - [ ] Verify email if using email method

- [ ] **Step 6: Connect GitHub to Railway**
  - [ ] After login, you should see "Authorize Railway with GitHub" prompt
  - [ ] Click "Authorize" or "Connect GitHub"
  - [ ] Grant permissions when asked
  - [ ] Confirm you see your GitHub repositories listed

---

## 🚀 Create Railroad Project

- [ ] **Step 7: Start New Project**
  - [ ] You should be in Railway dashboard
  - [ ] Look for large "New Project" button
  - [ ] Click it
  - [ ] See options:
    ```
    Deploy from GitHub
    Create Empty Project
    Create with Template
    ```

- [ ] **Step 8: Deploy from GitHub**
  - [ ] Click "Deploy from GitHub" option
  - [ ] Look for your `quiz-challenge-arena` repository
  - [ ] If not listed:
    - [ ] Click "Configure GitHub Permissions"
    - [ ] Grant access to more repositories
    - [ ] Refresh page
  - [ ] Click to select the repository

- [ ] **Step 9: Watch Initial Build**
  - [ ] Railway automatically starts building
  - [ ] You should see:
    ```
    ✓ Repository connected
    ✓ Detecting...
    ✓ Building Docker image
    ✓ Pushing to registry
    ✓ Starting deployment
    ```
  - [ ] This takes **2-3 minutes** - don't close browser!
  - [ ] When done, you'll see green checkmark

---

## 🔑 Configure Environment Variables

- [ ] **Step 10: Open Variables Tab**
  - [ ] Look for tabs: "Deployments" "Variables" "Logs" etc
  - [ ] Click "Variables" tab
  - [ ] You should see empty list or input fields

- [ ] **Step 11: Choose How to Add Variables**
  - [ ] Option A (Easier): Look for "Raw Editor" or "Paste"
  - [ ] Option B: Add one by one using "New Variable" button

**Option A - Paste All At Once:**

- [ ] **Step 12A: Use Raw Editor**
  - [ ] Click "Raw Editor" or look for "Paste variables" option
  - [ ] Clear any existing content
  - [ ] Paste this (with YOUR values filled in):

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
JWT_SECRET=REPLACE_ME_WITH_YOUR_64_CHAR_SECRET_FROM_STEP_2
SESSION_SECRET=REPLACE_ME_WITH_YOUR_64_CHAR_SECRET_FROM_STEP_2
ALLOWED_ORIGINS=https://temporary-url.up.railway.app
VITE_ALLOWED_ORIGINS=https://temporary-url.up.railway.app
MATCH_TIMER=15
ELO_K_FACTOR=32
```

- [ ] Replace:
  - [ ] `JWT_SECRET` = Your first `openssl rand` output
  - [ ] `SESSION_SECRET` = Your second `openssl rand` output

- [ ] Click "Save" or "Deploy"
- [ ] Railway redeploys with new variables

---

**Option B - Add One By One:**

- [ ] **Step 12B: Use Form Input**
  - [ ] Click "New Variable" button
  - [ ] Enter Key: `NODE_ENV`
  - [ ] Enter Value: `production`
  - [ ] Press Enter/Save
  - [ ] Repeat for each variable (see list above)
  - [ ] Takes longer but easier if preferring UI

---

## 🌍 Find Your Application URL

- [ ] **Step 13: Get Your Railway URL**
  - [ ] Go to "Deployments" tab
  - [ ] Your deployment should show "Running" ✓
  - [ ] Look for a public URL link:
    ```
    https://your-project-name.up.railway.app
    https://quiz-app-x1y2z3.up.railway.app
    https://similar-looking-url.up.railway.app
    ```
  - [ ] Copy this URL - save it!

- [ ] **URL not visible?**
  - [ ] Check "Settings" tab → "Domains" section
  - [ ] Or check "Deployments" tab → Full deployment details

- [ ] **Record Your URL:**
  ```
  My Railway URL: _________________________________
  ```

---

## ⚙️ Update CORS Settings

- [ ] **Step 14: Update Environment Variables with Real URL**
  - [ ] Go back to "Variables" tab
  - [ ] Find these variables:
    - [ ] `ALLOWED_ORIGINS`
    - [ ] `VITE_ALLOWED_ORIGINS`
  - [ ] Update both with your Railway URL from Step 13:
    ```
    ALLOWED_ORIGINS=https://your-actual-railway-url.up.railway.app
    VITE_ALLOWED_ORIGINS=https://your-actual-railway-url.up.railway.app
    ```
  - [ ] Click "Save" or "Deploy"
  - [ ] Railway automatically redeploys

---

## ✅ Test Your Deployment

- [ ] **Step 15: Health Check (Terminal)**
  ```bash
  curl https://your-railway-url.up.railway.app/api/ping
  
  # Should return exactly:
  # {"message":"Hello from Fusion!"}
  ```
  - [ ] If success → ✓ Continue
  - [ ] If failed → Go to Troubleshooting section

- [ ] **Step 16: Test in Browser**
  - [ ] Open https://your-railway-url.up.railway.app
  - [ ] Wait for page to load (5 seconds)
  - [ ] Check browser console (Press F12):
    - [ ] No red errors?
    - [ ] See any CORS errors? → Go to Troubleshooting
    - [ ] See any 404? → App files missing
  - [ ] Try clicking buttons:
    - [ ] Try "Quiz" button
    - [ ] Try "Battle" button
    - [ ] Try login

- [ ] **Step 17: API Test**
  ```bash
  curl https://your-railway-url.up.railway.app/api/questions
  # Should return JSON with questions array
  ```

- [ ] **Step 18: Check Logs for Errors**
  - [ ] Go to "Logs" tab in Railway dashboard
  - [ ] Look for any red error messages
  - [ ] Scroll up to see startup logs
  - [ ] Healthy app should show:
    ```
    Supabase initialized with SERVICE ROLE
    Socket.io listening on port 3000
    ```

---

## 🎉 Success! You're Deployed!

- [ ] **Step 19: Celebrate!**
  - [ ] Your app is now live!
  - [ ] URL: _________________________________
  - [ ] You can share this URL with others

- [ ] **Step 20: Test Features**
  - [ ] Load page - works? ✓
  - [ ] Login - works? ✓
  - [ ] Create account - works? ✓
  - [ ] Take quiz - questions load? ✓
  - [ ] Battle multiplayer - works? ✓
  - [ ] View leaderboard - works? ✓

- [ ] **Step 21: Setup Auto-Deploy (Already Enabled!)**
  - [ ] Railway automatically watches GitHub
  - [ ] Every push = automatic deployment
  - [ ] Test:
    ```bash
    # Make small change
    echo "# Updated" >> README.md
    git add .
    git commit -m "test auto deploy"
    git push
    # Watch Railroad dashboard - new deployment starts!
    ```

---

## 🚨 If Something Goes Wrong

### Problem: App Won't Start (Red icon)

- [ ] **Check Logs:**
  - [ ] Dashboard → Logs tab
  - [ ] Look for red error messages
  - [ ] Common errors:
    - [ ] "Cannot find module" → Missing dependency
    - [ ] "ENOENT" → File/env missing
    - [ ] "ECONNREFUSED" → Database unavailable

- [ ] **Check Variables:**
  - [ ] Variables tab → All present?
  - [ ] Missing SUPABASE_URL? Add it
  - [ ] Invalid GROQ_API_KEY? Fix it

- [ ] **Redeploy:**
  - [ ] Deployments tab
  - [ ] Click "Redeploy" button
  - [ ] Wait 2-3 minutes
  - [ ] Check logs again

### Problem: CORS Errors in Console

- [ ] **Check ALLOWED_ORIGINS:**
  - [ ] Variables tab
  - [ ] ALLOWED_ORIGINS must be your Railway URL
  - [ ] Not localhost, not *, not different domain

- [ ] **Update and redeploy:**
  ```
  ALLOWED_ORIGINS=https://your-railway-url.up.railway.app
  VITE_ALLOWED_ORIGINS=https://your-railway-url.up.railway.app
  ```

### Problem: 500 Error from API

- [ ] **Database connection issue:**
  - [ ] Check SUPABASE_URL and keys correct?
  - [ ] Can you access Supabase directly?

- [ ] **Check Groq API:**
  - [ ] Is GROQ_API_KEY still valid?
  - [ ] Check Groq console

- [ ] **Check Logs:**
  - [ ] Look for specific error message
  - [ ] Search online for error

---

## 📞 Need More Help?

- [ ] Read: `RAILWAY_DEPLOYMENT_GUIDE.md` (full guide)
- [ ] Check: `PRODUCTION_DOCKER_GUIDE.md` (platform guides)
- [ ] Railway Docs: https://docs.railway.app
- [ ] Railway Discord: https://discord.gg/railway

---

## 📊 Final Verification

Complete this final checklist:

```
✓ Application deploys successfully
✓ URL is public and accessible
✓ Health endpoint works (/api/ping)
✓ No CORS errors
✓ Database connected
✓ AI questions load
✓ Quiz functionality works
✓ Battle functionality works
✓ Leaderboard shows data
✓ Mobile responsive
✓ Logs show no errors
✓ Auto-deploy enabled
✓ Environment variables set
✓ HTTPS enabled (lock icon in browser)
```

**If all checked → Your app is successfully deployed! 🎉**

---

**Generated:** March 6, 2026  
**Platform:** Railway  
**Last Updated:** Today
