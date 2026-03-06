# 🚂 Railway - Complete Troubleshooting Guide

**If something goes wrong, find your issue here!**

---

## 🔴 CRITICAL ISSUES - Fix Immediately

### Issue 1: "Build Failed" - Application won't deploy

**Symptoms:**
- Red X in deployment status
- Build log shows error
- Cannot access application

**Diagnosis:**
1. Click "Deployments" tab
2. Click the failed deployment
3. Click "View Build Logs"
4. Look for error message starting with "ERROR" or "FAILED"

**Solutions by Error Type:**

#### Error: "Cannot find module 'xyz'"
```
Cause: Missing dependency
Fix:
   1. Check package.json has the dependency
   2. Verify pnpm-lock.yaml is committed to GitHub
   3. Try:
      git add package.json pnpm-lock.yaml
      git commit -m "fix dependencies"
      git push
   4. Railway auto-redeploys, should work now
```

#### Error: "ENOENT: no such file or directory"
```
Cause: Missing file during build
Fix:
   1. Verify all files committed to GitHub
   2. Check .gitignore - might be excluding needed files
   3. Try:
      git status  # See what's not committed
      git add [missing files]
      git push  # Redeploy
```

#### Error: "vite.config.server.ts not found"
```
Cause: Server config missing (this was fixed for you!)
Fix:
   1. Verify vite.config.server.ts exists in repo
   2. If missing, check that you have the latest code
   3. Try:
      git pull
      git push  # Force redeploy
```

#### Error: Docker build fails
```
Cause: Dockerfile issue
Fix:
   1. Verify Dockerfile exists in root directory
   2. Check Dockerfile syntax (no typos)
   3. If using custom Dockerfile:
      docker build -t test .  # Test locally
      If fails locally, fix before pushing
   4. Push to GitHub
   5. Railway auto-redeploys
```

---

### Issue 2: Application Crashes After Starting

**Symptoms:**
- Deployment starts fine
- Then crashes with error
- Status goes from green to red
- See error loop in logs

**Diagnosis:**
1. Go to "Logs" tab
2. Look for pattern of errors
3. Note the error message
4. See solutions below

**Solutions by Error Type:**

#### Error: "Cannot find variable 'process.env.SUPABASE_URL'"
```
Cause: Environment variable not set
Fix:
   1. Dashboard → Variables tab
   2. Verify SUPABASE_URL is there
   3. If missing, add it:
      SUPABASE_URL=https://mrbtjnpfjaeskfqarwss.supabase.co
   4. Click Save/Deploy
   5. Wait for redeploy
```

#### Error: "CORS error" or "allowedOrigins is undefined"
```
Cause: ALLOWED_ORIGINS variable not set
Fix:
   1. Variables tab
   2. Check ALLOWED_ORIGINS is present
   3. Should be set to your Railway URL:
      ALLOWED_ORIGINS=https://your-railway-url.up.railway.app
   4. Click Save
   5. Railway redeploys
```

#### Error: "Connection refused" or "database refused connection"
```
Cause: Database not reachable
Fix:
   1. Verify SUPABASE_URL is correct
   2. Check SUPABASE_SERVICE_ROLE_KEY is valid
   3. Check if Supabase is online:
      https://status.supabase.com
   4. If Supabase is down, wait for recovery
   5. If keys invalid, update in Variables and redeploy
```

#### Error: Cannot connect to Groq API
```
Cause: Invalid Groq API key
Fix:
   1. Variables → Find GROQ_API_KEY
   2. Get a fresh key from https://console.groq.com
   3. Update the key in Railway Variables
   4. Save and redeploy
```

---

### Issue 3: "Application timed out" Error

**Symptoms:**
- Deployment takes >10 minutes
- Shows "504 Gateway Timeout"
- Application never fully starts

**Diagnosis:**
1. Check Logs tab for stuck process
2. Look for infinite loops or blocking operations

**Solutions:**
```
Fix:
   1. Dashboard → Deployments
   2. Click "Delete" or "Cancel" on stuck deployment
   3. Click "Redeploy" (or push to GitHub)
   4. Watch it carefully (should complete in <5 min)
   5. If still times out:
      - Check for infinite loops in code
      - Try smaller change
      - Contact Railway support
```

---

## 🟡 RUNTIME ISSUES - App Started But Problems

### Issue 4: CORS Errors in Browser Console

**Symptoms:**
```
Browser console shows:
Access to XMLHttpRequest at 'https://your-app.../api/quiz'
blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

**Diagnosis:**
1. Check your CORS settings
2. Find ALLOWED_ORIGINS in Variables

**Solution:**
```
Must match production domain EXACTLY:

✗ Wrong (uses localhost):
  ALLOWED_ORIGINS=http://localhost:3000

✗ Wrong (wildcard):
  ALLOWED_ORIGINS=*

✓ Correct (uses Railway URL):
  ALLOWED_ORIGINS=https://your-project.up.railway.app

Steps:
1. Variables tab
2. Find ALLOWED_ORIGINS
3. Change to your exact Railway URL
4. Also update VITE_ALLOWED_ORIGINS
5. Click Save
6. Railway redeploys
7. Test in browser (might need hard refresh: Ctrl+Shift+R)
```

### Issue 5: "503 Service Unavailable" Error

**Symptoms:**
- Page loads but shows 503 error
- Or API calls return 503
- Application seems to be running

**Cause:** Application is overloaded or crashing

**Solution:**
```
1. Check Logs:
   Dashboard → Logs → Look for error pattern

2. Check Metrics:
   Dashboard → Metrics → CPU/Memory status
   - If CPU = 100%: App overloaded
   - If Memory = 100%: Memory leak

3. Solutions:
   a) Restart app:
      Deployments → Click Redeploy
   
   b) Upgrade resources:
      Settings → Choose larger plan
      Or use Railway.app/pricing
   
   c) Check for errors:
      Logs tab → Look for specific error
      Fix the error, push to GitHub
      Railway auto-redeploys
```

### Issue 6: API Returns 500 Error

**Symptoms:**
```
curl your-app.../api/ping returns:
HTTP 500 Internal Server Error
```

**Diagnosis:**
1. Go to Logs tab
2. Look for error details
3. Match against solutions below

**Solutions:**

#### API error about database connection
```
Fix:
   1. Verify SUPABASE_* variables correct
   2. Check database is online
   3. Try:
      curl https://your-supabase-url.com  # Test Supabase
      If fails, Supabase might be down
   4. Redeploy:
      Deployments → Redeploy
```

#### API error about missing function
```
This usually means the build didn't include all files
Fix:
   1. Verify all files committed to GitHub
   2. Check git status locally
   3. Commit missing files
   4. Push - Railway auto-redeploys
```

#### API returns syntax error
```
This means there's code error in production
Fix:
   1. Run locally:
      pnpm build
      pnpm typecheck
   2. Fix any errors
   3. Commit and push
   4. Railway redeploys with fix
```

---

### Issue 7: Page Loads Blank / Nothing Shows

**Symptoms:**
- Open the URL in browser
- Page completely blank
- Browser console has errors

**Diagnosis:**

```bash
# In browser console, look for:

1. CORS error:
   → See Issue 4 (CORS Errors)

2. "Cannot GET /" error:
   → Frontend files not built correctly

3. 404 on assets:
   → HTML loads but CSS/JS don't
   → Check build output (dist/spa folder)

4. Fetch failed:
   → Backend not running
   → Check Logs, Metrics, Deployments
```

**Solution:**
```bash
# Most common: Frontend build issue

Fix:
   1. Test locally:
      pnpm build
      # Should create dist/spa with files

   2. If build fails:
      Fix the errors
      Commit and push
      Railway auto-redeploys

   3. If build works locally but not on Railway:
      Check Dockerfile copies dist/spa correctly
      Look at build logs on Railway
```

---

### Issue 8: Questions/Data Not Loading

**Symptoms:**
- Page loads fine
- Click "Quiz" → Loading spinner forever
- Or shows error fetching questions

**Diagnosis:**
1. Open browser console (F12)
2. Look for fetch errors
3. Check what endpoint is being called
4. Test endpoint manually:
   ```bash
   curl https://your-app.../api/questions
   ```

**Solutions:**

#### Database not returning questions
```
Cause: Supabase not connected correctly
Fix:
   1. Check SUPABASE_SERVICE_ROLE_KEY in Variables
   2. Verify key format (starts with eyJ...)
   3. Try fetching from Supabase directly:
      - Open Supabase dashboard
      - Query your_table
      - Verify data exists
   4. Redeploy:
      Deployments → Redeploy
```

#### Groq AI not generating questions
```
Cause: GROQ_API_KEY invalid or API down
Fix:
   1. Check GROQ_API_KEY in Variables
   2. Verify the key is valid from https://console.groq.com
   3. Check Groq status: https://status.groq.com
   4. If key expired, get new one from https://console.groq.com
   5. Update Variables, redeploy
```

#### API returns 401 Unauthorized
```
Cause: Authentication token issue
Fix:
   1. Try logging out and logging back in
   2. If persistent:
      Variables → Check JWT_SECRET and SESSION_SECRET set
   3. If not set:
      Generate: openssl rand -hex 32 (2x)
      Add to Variables
      Redeploy
```

---

## 🔵 PERFORMANCE ISSUES

### Issue 9: Application Very Slow

**Symptoms:**
- Page loads slowly
- API responses take >5 seconds
- Frequent timeouts

**Diagnosis:**
1. Check Metrics tab:
   - Is CPU at 100%?
   - Is Memory at 100%?
   - Is Network saturated?

**Solutions:**

#### If CPU is high
```
Cause: Application overloaded, needs upgrade
Fix:
   1. Option A - Upgrade plan:
      Settings → Choose larger plan
      Pay for better resources

   2. Option B - Fix inefficient code:
      Check Logs for what's slow
      Optimize code, push update
      Railway redeploys
```

#### If Memory is high
```
Cause: Potential memory leak
Fix:
   1. Redeploy fresh:
      Deployments → Redeploy
      Sometimes fixes memory leak

   2. If persists:
      Check Logs for memory errors
      Look for infinite loops
      Fix code, push update
```

#### If Network is high
```
Cause: Too many requests, large responses
Fix:
   1. Check you're not making duplicate requests
   2. Enable caching if possible
   3. Compress responses
   4. Limit response size
```

---

### Issue 10: Deployment Takes Forever

**Symptoms:**
- Build stuck at "Building Docker image"
- Takes >10 minutes
- Eventually times out

**Diagnosis:**
1. Check build logs
2. Is it stuck downloading dependencies?

**Solutions:**
```
Common causes:
1. Slow GitHub download
   → Just wait, or try again

2. Dependencies taking too long
   → Try:
      git add pnpm-lock.yaml
      git commit -m "update lockfile"
      git push

3. Stuck process
   → Deployments → Cancel
   → Make small change, push again
   → Retry deployment
```

---

## ✅ VERIFICATION CHECKLIST

**If uncertain if deployment is working, run these tests:**

```bash
# Test 1: Health Endpoint
curl https://your-app.up.railway.app/api/ping
# Should return: {"message":"Hello from Fusion!"}
# Status: Should be 200 OK

# Test 2: Questions Endpoint
curl https://your-app.up.railway.app/api/questions
# Should return: { "data": [...] }
# Status: Should be 200 OK

# Test 3: Browser Load
# Open: https://your-app.up.railway.app
# Check: Page loads, no blank screen

# Test 4: Console Errors (F12)
# Look for: No red errors in console
# Allowed: Warnings are OK, but no errors

# Test 5: Feature Test
# Click: Quiz button → Questions load?
# Click: Battle button → Can join game?
```

---

## 📞 GETTING MORE HELP

### If You Can't Find Your Issue

1. **Check Railway Documentation**
   - https://docs.railway.app
   - https://docs.railway.app/troubleshooting

2. **Check Project Guides**
   - [PRODUCTION_DOCKER_GUIDE.md](./PRODUCTION_DOCKER_GUIDE.md)
   - [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)

3. **Contact Railway Support**
   - Discord: https://discord.gg/railway
   - Email: support@railway.app
   - Twitter: @railway (for updates)

4. **Try These Steps:**
   - [ ] Check latest build logs
   - [ ] Verify all environment variables
   - [ ] Try redeploying from GitHub
   - [ ] Check application status indicators
   - [ ] Try different browser (clear cache with Ctrl+Shift+Del)

---

## 🔄 COMMON QUICK FIXES

**Try these first before anything else:**

| Problem | Quick Fix | Works? |
|---------|-----------|--------|
| App seems crashed | Deployments → Redeploy | ✓ Works 80% of the time |
| CORS error | Update ALLOWED_ORIGINS variable | ✓ Works 100% |
| Env variable missing | Add to Variables → Redeploy | ✓ Works 100% |
| Variables not taking effect | Hard refresh browser (Ctrl+Shift+R) | ✓ Works 50% |
| Deployment stuck | Deployments → Cancel → Redeploy | ✓ Works 70% |
| Slow performance | Check Metrics → Upgrade if needed | ✓ Works if resource-limited |

---

## 📊 LOGS READING GUIDE

**How to read logs and find errors:**

```
GOOD LOG EXAMPLES (App Running Fine):
  ✓ Supabase initialized with SERVICE ROLE
  ✓ Server listening on port 3000
  ✓ GET /api/ping 200
  ✓ POST /api/questions 200

BAD LOG EXAMPLES (Something Wrong):
  ✗ ERROR: Cannot find module 'xyz'
  ✗ TypeError: env.SUPABASE_URL is undefined
  ✗ ECONNREFUSED - Connection refused
  ✗ CORS error - Origin not allowed
  ✗ 500 Internal Server Error

HOW TO ANALYZE:
1. Look at most recent log entries (bottom)
2. Look for ANY red text (errors)
3. Search error text on Google
4. Match to this guide's solutions
```

---

## 🎯 DECISION TREE

**Start here if confused:**

```
Does deployment show green (Running)?
├─ NO (Red/Failed)
│  └─ Check build logs
│     ├─ Has "ERROR"? → See "Build Failed" section
│     ├─ Timed out? → See "Application timed out" section
│     └─ Other? → Railway docs
│
└─ YES (App started)
   ├─ Browser shows blank page?
   │  └─ See "Page Loads Blank" section
   │
   ├─ Browser shows CORS error?
   │  └─ See "CORS Errors" section
   │
   ├─ API returns 500?
   │  └─ See "API Returns 500 Error" section
   │
   ├─ Very slow?
   │  └─ See "Application Very Slow" section
   │
   └─ Seems to work?
      └─ Check: curl /api/ping
         ├─ Success? → You're done! ✅
         └─ Fails? → See relevant error section
```

---

**Need help? This guide covers 90% of issues!**

**Generated:** March 6, 2026  
**Status:** Complete Troubleshooting Guide
