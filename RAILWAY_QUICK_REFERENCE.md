# 🚂 Railway - Quick Reference Card

**Print or bookmark this page for quick reference!**

---

## 🚀 Deploy in 10 Steps

### Step 1: Generate Secrets (Track these!)
```bash
openssl rand -hex 32  # → Copy for JWT_SECRET
openssl rand -hex 32  # → Copy for SESSION_SECRET
```

### Step 2: Sign Up
- Go to https://railway.app
- Click "Start Free"
- Connect GitHub

### Step 3: Create Project
- Click "New Project"
- Select "Deploy from GitHub"
- Choose `quiz-challenge-arena` repo

### Step 4: Wait for Build
- Railway auto-builds your Dockerfile
- Takes 2-3 minutes
- Shows progress in dashboard

### Step 5: Add Variables
Dashboard → **Variables** tab
```
NODE_ENV=production
PORT=3000
```

Add these with your values:
```
SUPABASE_URL=[from .env.example]
SUPABASE_ANON_KEY=[from .env.example]
SUPABASE_SERVICE_ROLE_KEY=[from .env.example]
VITE_SUPABASE_URL=[from .env.example]
VITE_SUPABASE_ANON_KEY=[from .env.example]
GROQ_API_KEY=[from https://console.groq.com]
JWT_SECRET=[from step 1]
SESSION_SECRET=[from step 1]
ALLOWED_ORIGINS=https://[YOUR_RAILWAY_URL]
VITE_ALLOWED_ORIGINS=https://[YOUR_RAILWAY_URL]
MATCH_TIMER=15
ELO_K_FACTOR=32
```

### Step 6: Find Your URL
Dashboard → **Deployments** or **Settings** → Look for domain
```
https://your-project-name.up.railway.app
```

### Step 7: Update CORS
Variables tab:
- `ALLOWED_ORIGINS=https://your-project-name.up.railway.app`
- `VITE_ALLOWED_ORIGINS=https://your-project-name.up.railway.app`

### Step 8: Redeploy
Click "Redeploy" after updating variables

### Step 9: Test Health Endpoint
```bash
curl https://your-project-name.up.railway.app/api/ping
# Should return: {"message":"Hello from Fusion!"}
```

### Step 10: Visit App
Open https://your-project-name.up.railway.app in browser
✅ Done!

---

## 📋 Required Environment Variables

**Copy this template and fill in values:**

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
JWT_SECRET=REPLACE_ME_64_CHAR_STRING
SESSION_SECRET=REPLACE_ME_64_CHAR_STRING
ALLOWED_ORIGINS=https://REPLACE_WITH_YOUR_RAILWAY_URL
VITE_ALLOWED_ORIGINS=https://REPLACE_WITH_YOUR_RAILWAY_URL
MATCH_TIMER=15
ELO_K_FACTOR=32
```

---

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **App won't start** | Check Logs tab → Look for error |
| **CORS errors** | Update ALLOWED_ORIGINS to Railway URL |
| **API returns 500** | Database connection issue - check Supabase keys |
| **Slow performance** | Check Metrics → Upgrade if CPU/Memory maxed |
| **Questions not loading** | Verify Groq API key is valid |
| **App keeps crashing** | Redeploy → Dashboard → Deployments → Redeploy |
| **Can't find Railway URL** | Dashboard → Deployments tab → Look for link |

---

## ✅ Verification Tests

After deployment, run these commands:

```bash
# 1. Health Check
curl https://your-app.up.railway.app/api/ping
# Response: {"message":"Hello from Fusion!"}

# 2. Questions API
curl https://your-app.up.railway.app/api/questions
# Response: Array of 5 questions

# 3. Browser Test
# Open: https://your-app.up.railway.app
# Check: Page loads, no CORS errors
```

---

## 🎯 Railway Dashboard Navigation

```
railroad.app/dashboard
├── New Project          → Deploy new app
├── [Your Project Name]  → Click to enter project
│   ├── Deployments      → See deployment history
│   ├── Variables        → Manage environment variables
│   ├── Logs             → View application logs
│   ├── Metrics          → CPU, Memory, Network usage
│   ├── Settings         → Project configuration
│   │   ├── Domains      → View/add custom domains
│   │   └── General      → Pause, delete project
│   └── Plugins          → Add databases, caches, etc.
```

---

## 📱 Mobile Verification

After deploy, test on mobile:

1. Open: https://your-app.up.railway.app
2. Phone rotations work? ✓
3. Buttons clickable? ✓
4. Quiz loads? ✓
5. Battle works? ✓

---

## 🚀 Auto-Deployment

Railway auto-watches your GitHub repo!

```bash
# To trigger auto-deploy, just push to GitHub:
git add .
git commit -m "update"
git push

# Railway automatically redeploys! No action needed!
```

---

## 📞 Support & Links

| Resource | Link |
|----------|------|
| Railway Docs | https://docs.railway.app |
| Railway Discord | https://discord.gg/railway |
| GitHub Integration | https://docs.railway.app/guides/git |
| Pricing | https://railway.app/pricing |

---

## ⏱️ Expected Timeline

```
Sign up:           2 minutes
Create project:    1 minute
Setup variables:   3 minutes
Deploy:            3 minutes (automatic)
Test:              2 minutes
─────────────────────────━
Total:             ~11 minutes
```

---

## 🎉 You Did It!

Your app is now live on Railway!

Share your URL: `https://your-app-name.up.railway.app`

---

**Last Updated:** March 6, 2026
