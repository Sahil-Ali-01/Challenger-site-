# Production Readiness Checklist

## 🔴 CRITICAL ISSUES (Must Fix Before Production)

### 1. **SECURITY: Environment Variables in Git** ⚠️ CRITICAL
**Issue:** `.env` file is being tracked in Git (`!.env` in `.gitignore`)
- All secrets are exposed: DB credentials, API keys, JWT secrets
- Database password is visible in plaintext
- Groq API key is exposed
- Supabase keys are exposed

**Fix Required:**
```bash
# 1. Remove .env from git history
git rm --cached .env
git commit -m "Remove .env from version control"

# 2. Update .gitignore
```
Edit `.gitignore`:
```
.env
.env.local
.env.*.local
```

**Then set environment variables on:**
- Netlify: Dashboard → Site Settings → Build & Deploy → Environment
- Your hosting provider environment variables

---

### 2. **SECURITY: CORS Configuration** ⚠️ HIGH
**Issue:** CORS is set to `"*"` (wildcard) in `vite.config.ts`
- Allows any domain to access your API
- Exposes API to cross-site attacks

**vite.config.ts Line 47-49:**
```typescript
cors: {
  origin: "*",  // ❌ TOO PERMISSIVE
  methods: ["GET", "POST"]
}
```

**Fix Required:**
```typescript
cors: {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
  methods: ["GET", "POST"],
  credentials: true
}
```

Add to `.env`:
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

### 3. **SECURITY: Weak Secrets**
**Issue:** JWT_SECRET and SESSION_SECRET are weak
- Current: `7c08e4c2b59953a0800c2684` (only 24 chars)
- Should be: 64+ random characters

**Generate strong secrets:**
```bash
# Linux/Mac
openssl rand -hex 32

# Online generator: https://www.uuidgenerator.net/
```

---

### 4. **SECURITY: Demo Fallback User** ⚠️ HIGH
**Issue:** Hardcoded demo user in `server/index.ts` line 30
```typescript
(req as any).user = { id: 'u123', username: 'Sahil Ali' };  // ❌ SECURITY ISSUE
```

**Fix Required:** Remove fallback or require authentication for production

---

### 5. **CORS: Missing CORS Configuration in Express**
**Issue:** `app.use(cors())` with no options = allows all origins

**Fix Required in `server/index.ts`:**
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:8080',
  credentials: true
}));
```

---

## 🟡 IMPORTANT ISSUES (Should Fix Before Production)

### 6. **Missing Rate Limiting**
- API endpoints have no rate limiting
- Vulnerable to DDoS/brute force attacks

**Recommended:**
```bash
npm install express-rate-limit
```

---

### 7. **Console Logs in Production**
- Debug logs will slow down performance
- May expose sensitive information

**Recommendation:** Create logger utility for production:
```typescript
// server/lib/logger.ts
export const logger = {
  log: process.env.NODE_ENV === 'development' ? console.log : () => {},
  error: console.error,
  warn: process.env.WARN_ONLY ? console.warn : () => {}
}
```

---

### 8. **No Input Validation**
- API endpoints don't validate user input
- Vulnerable to injection attacks

**Recommendation:** Add validation to all API routes:
```typescript
import { z } from 'zod';  // Already installed

const questionSchema = z.object({
  category: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(10)
});
```

---

### 9. **Error Responses Expose Stack Traces**
- Errors might expose implementation details
- Use generic error messages in production

---

### 10. **No HTTPS Enforcement**
- Site should redirect HTTP → HTTPS
- Add to hosting provider settings

---

## ✅ GOOD PRACTICES ALREADY IN PLACE

✅ TypeScript compilation checking  
✅ Environment variable structure  
✅ Database connection pooling (Supabase)  
✅ API key separation (VITE_* for frontend)  
✅ Fallback error handling with mock data  
✅ Socket.IO connection retry logic  
✅ Supabase SERVICE_ROLE_KEY (for server only)  

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Remove `.env` from Git history
- [ ] Fix CORS to specific domains only
- [ ] Generate strong JWT_SECRET (64+ chars)
- [ ] Remove hardcoded demo user
- [ ] Set environment variables on hosting
- [ ] Add HTTPS enforcement
- [ ] Add rate limiting
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure database backups
- [ ] Test build: `pnpm build`
- [ ] Run TypeScript: `pnpm typecheck`
- [ ] Verify all API endpoints work
- [ ] Test authentication flows
- [ ] Performance test with different network speeds
- [ ] Security audit

---

## 📊 Build & Deployment Info

**Build Command:**
```bash
pnpm build
```

**Start Command:**
```bash
npm start
```

**Environment Variables Required:**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
JWT_SECRET
SESSION_SECRET
ALLOWED_ORIGINS (for production)
NODE_ENV=production
```

---

## 📝 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| TypeScript | ✅ | Compiles cleanly |
| Dependencies | ✅ | All installed |
| API Routes | ⚠️ | Missing rate limiting & validation |
| Security | 🔴 | Secrets in Git, CORS misconfigured |
| Error Handling | ⚠️ | Console logs exposed |
| Database | ✅ | Supabase configured |
| Authentication | ⚠️ | Demo fallback user present |
| Deployment | ⚠️ | Netlify config present, needs env vars |

---

**RECOMMENDATION:** Fix 🔴 CRITICAL issues before deployment to production.
