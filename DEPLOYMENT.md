# Deployment Guide

This guide covers deploying the application **without Docker** to any Node.js hosting platform.

## Prerequisites

- Node.js 18+ installed
- pnpm package manager installed
- Supabase database configured
- Groq API key for AI features

## Build Process

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build for Production
```bash
pnpm build
```

This creates two builds:
- **Frontend (React/Vite):** `dist/spa/` - Static files for web serving
- **Backend (Express/Node.js):** `dist/server/node-build.mjs` - Server application

### 3. Environment Setup

Create a `.env` file in the project root with production values:

```env
# Server
NODE_ENV=production
PORT=3000

# CORS
VITE_ALLOWED_ORIGINS=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Frontend Supabase (exposed to client)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Secrets
JWT_SECRET=generate_with_openssl_rand_-hex_32
SESSION_SECRET=generate_with_openssl_rand_-hex_32

# AI
GROQ_API_KEY=gsk_...

# Multiplayer
MATCH_TIMER=15
ELO_K_FACTOR=32
```

## Deployment Options

### Option 1: Netlify (Recommended for Frontend)

For **frontend-only** deployment on Netlify:

1. Connect your GitHub repo to Netlify
2. Build command: `pnpm install && pnpm build:client`
3. Publish directory: `dist/spa`

### Option 2: Self-Hosted Server (Node.js)

For **full-stack** deployment with Express backend:

```bash
# Build the application
pnpm build

# Start the production server
node dist/server/node-build.mjs
```

The server will:
- Serve the frontend from `dist/spa/`
- Expose API routes at `/api/*`
- Initialize Socket.IO for real-time multiplayer on the same port

**Hosting options:**
- **Render.com** - Free tier available, supports Node.js
- **Railway.app** - Affordable, easy Node.js deployment
- **AWS EC2** - Full control, scalable
- **DigitalOcean** - Affordable VPS
- **Heroku** - Simple deployment (note: free tier discontinued)

### Option 3: Vercel (Frontend + Serverless API)

For **frontend on Vercel** with serverless backend:

1. Push to GitHub
2. Import project in Vercel dashboard
3. Set environment variables in Vercel settings
4. Deploy

Note: The Socket.IO multiplayer feature requires persistent connections, which Vercel's serverless functions don't support. Use this option for frontend-only or use a separate Node.js server for the backend.

## Production Checklist

- [ ] Environment variables configured in hosting platform
- [ ] Database migrations completed
- [ ] Supabase credentials verified
- [ ] CORS origins updated
- [ ] SSL/HTTPS enabled
- [ ] Error tracking configured (optional)
- [ ] Monitoring/logging set up
- [ ] Database backups enabled
- [ ] Rate limiting configured for API
- [ ] Socket.IO deployed on persistent Node.js server (not serverless)

## Running in Production

### Using Process Manager (Recommended)

Use **PM2** to manage the Node.js process:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/server/node-build.mjs --name "quiz-app"

# View logs
pm2 logs quiz-app

# Restart on system boot
pm2 startup
pm2 save
```

### Using systemd (Linux)

Create `/etc/systemd/system/quiz-app.service`:

```ini
[Unit]
Description=Quiz Challenge Arena
After=network.target

[Service]
Type=simple
User=app-user
WorkingDirectory=/path/to/app
ExecStart=/usr/bin/node dist/server/node-build.mjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl daemon-reload
systemctl enable quiz-app
systemctl start quiz-app
```

## Troubleshooting

### "Socket.IO connection refused"
- Ensure CORS origins are correctly configured
- Check that the port is not blocked by firewall
- Verify Socket.IO is connecting to the same server

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check Supabase is running and accessible
- Ensure IP is whitelisted (if using Supabase)

### "Build fails with module errors"
- Run `pnpm install` to ensure all dependencies are installed
- Check that all environment variables are set during build
- Try removing `node_modules` and `pnpm-lock.yaml`, then reinstall

## Performance Optimization

- Enable gzip compression in your reverse proxy (nginx, Apache)
- Set up a CDN for static files in `dist/spa/`
- Configure database connection pooling (Supabase handles this)
- Monitor Socket.IO connection metrics
- Use PM2 clustering for multi-core utilization

## Security

- Never commit `.env` file to version control
- Use strong `JWT_SECRET` and `SESSION_SECRET` (generate with `openssl rand -hex 32`)
- Enable HTTPS in production
- Configure CORS to only allow your domains
- Implement rate limiting on API endpoints
- Keep dependencies updated (`pnpm update`)
