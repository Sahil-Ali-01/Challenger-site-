# 🚀 Production Deployment - Quiz Challenge Arena

**Status:** ✅ Ready for Docker Production Deployment  
**Last Updated:** March 6, 2026  
**Version:** 1.0

---

## 📋 Quick Commands

```bash
# 1. Check everything is ready
./deploy.sh check

# 2. Build Docker image
./deploy.sh build production

# 3. Test locally
./deploy.sh run

# 4. Deploy to production (choose platform below)
```

---

## 🐳 Docker Setup Summary

| File | Purpose |
|------|---------|
| `Dockerfile` | Production-optimized multi-stage build |
| `docker-compose.yml` | Production container orchestration |
| `docker-compose.dev.yml` | Development with hot-reload |
| `Dockerfile.dev` | Development image with all dependencies |
| `deploy.sh` | Automated deployment script |
| `k8s-deployment.yaml` | Kubernetes manifests |

---

## 🚀 Deployment Platforms (Choose One)

### Platform Comparison

| Platform | Difficulty | Cost | Best For | Deployment Time |
|----------|-----------|------|----------|-----------------|
| **Docker Hub** | Easy | Free | Simple deployments | 1 min |
| **Railway** | Very Easy | $5-20/mo | First-timers | 2 mins |
| **Render** | Easy | Free tier available | Small apps | 3 mins |
| **AWS ECS** | Medium | $30+/mo | Scalability | 10 mins |
| **DigitalOcean** | Medium | $5+/mo | Simple VPS | 5 mins |
| **Kubernetes** | Hard | Varies | Enterprise | 15 mins |

---

## 1️⃣ Railway (Recommended for Beginners)

### ✅ Pros:
- Simplest deployment
- Free tier available
- Auto-deploys from GitHub
- Built-in SSL/HTTPS

### ❌ Cons:
- Limited customization
- Limited free tier

### Setup:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Create .env.production with secrets
# (or set in Railway dashboard)

# 5. Deploy
railway up
```

**Environment Variables in Railway Dashboard:**
- Go to Project Settings → Variables
- Add all variables from `.env.example`
- For production, update:
  - `ALLOWED_ORIGINS=https://yourdomain.railway.app`
  - `VITE_ALLOWED_ORIGINS=https://yourdomain.railway.app`

**Deploy URL:** `https://your-project-name-production.railway.app`

---

## 2️⃣ Render (Easy & Free)

### ✅ Pros:
- Free tier includes free domain
- Easy GitHub integration
- Automatic SSL
- Simple UI

### Setup:

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Select your GitHub repo
4. Configure:
   - **Build Command:** `pnpm build`
   - **Start Command:** `node dist/server/node-build.mjs`
   - **Environment:** Node
5. Add environment variables (same as `.env.example`)
6. Deploy!

**Deploy URL:** `https://your-service-name.onrender.com`

---

## 3️⃣ DigitalOcean App Platform

### ✅ Pros:
- $5-12/month pricing
- Simple Docker support
- Good documentation
- SSH access available

### Setup:

1. Go to [digitalocean.com](https://www.digitalocean.com/products/app-platform)
2. Click "Create App"
3. Choose GitHub repository
4. Select "Dockerfile"
5. Configure environment variables
6. Deploy!

**Deploy URL:** `https://your-app-xxxx.ondigitalocean.app`

---

## 4️⃣ AWS ECS (Most Scalable)

### ✅ Pros:
- Highly scalable
- Auto-scaling available
- Load balancer included
- Pay per use

### ❌ Cons:
- More complex setup
- Higher minimum cost

### Setup:

```bash
# 1. Configure AWS CLI
aws configure

# 2. Create ECR Repository
aws ecr create-repository \
  --repository-name quiz-challenge-arena \
  --region us-east-1

# 3. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ECR_URI>

# 4. Build and tag image
docker build -t quiz-app:latest .
docker tag quiz-app:latest <ECR_URI>/quiz-app:latest

# 5. Push to ECR
docker push <ECR_URI>/quiz-app:latest

# 6. Create ECS Cluster, Task Definition, and Service
# (Use AWS Console or Terraform for this)
```

**Deploy URL:** `https://your-loadbalancer-1234.us-east-1.elb.amazonaws.com`

---

## 5️⃣ Docker Hub + Any VPS

### ✅ Pros:
- Maximum control
- Good learning experience
- Works everywhere

### Setup:

```bash
# 1. Create Docker Hub account
# https://hub.docker.com

# 2. Login locally
docker login

# 3. Build and tag
docker build -t yourusername/quiz-arena:latest .

# 4. Push
docker push yourusername/quiz-arena:latest

# 5. On your server (VPS, dedicated host, etc):
docker pull yourusername/quiz-arena:latest
docker run -d \
  --name quiz-app \
  -p 80:3000 \
  --env-file .env.production \
  --restart=always \
  yourusername/quiz-arena:latest

# 6. Setup reverse proxy (Nginx)
# (See nginx-config below)
```

**Nginx Reverse Proxy Config:**

```nginx
upstream quiz_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://quiz_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io {
        proxy_pass http://quiz_app/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 6️⃣ Kubernetes (Enterprise)

### ✅ Pros:
- Production-grade orchestration
- Auto-scaling
- High availability
- Load balancing built-in

### Setup:

```bash
# 1. Update k8s-deployment.yaml with your image
sed -i 's|your-registry|yourusername|g' k8s-deployment.yaml

# 2. Create namespace
kubectl apply -f k8s-deployment.yaml

# 3. Check deployment
kubectl get pods -n quiz-arena
kubectl logs -f deployment/quiz-app -n quiz-arena

# 4. Forward port for testing
kubectl port-forward svc/quiz-app-service 3000:80 -n quiz-arena

# 5. Install ingress controller (optional)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# 6. Update and apply ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

---

## 🔄 CI/CD Setup (GitHub Actions)

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/quiz-arena:latest
    
    - name: Deploy to Railway
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      run: |
        npm install -g @railway/cli
        railway up
```

---

## 📊 Environment Variables Required

```
# Essential - MUST HAVE
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
GROQ_API_KEY=
JWT_SECRET= (64+ chars)
SESSION_SECRET= (64+ chars)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# CORS - Update for your domain
ALLOWED_ORIGINS=https://yourdomain.com
VITE_ALLOWED_ORIGINS=https://yourdomain.com

# Optional but recommended
NODE_ENV=production
PORT=3000
MATCH_TIMER=15
ELO_K_FACTOR=32
```

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Strong SESSION_SECRET (64+ characters)
- [ ] CORS origins set to your domain
- [ ] Database backups enabled
- [ ] Error logging configured (Sentry/DataDog)
- [ ] Groq API key active
- [ ] TypeScript: `pnpm typecheck` passes
- [ ] Build works: `pnpm build` succeeds
- [ ] Local test: `./deploy.sh run` works
- [ ] Security scan: `docker scan quiz-arena`

---

## 🚀 Deployment Steps (General)

### Step 1: Build
```bash
./deploy.sh build production
```

### Step 2: Test Locally
```bash
./deploy.sh run
# Test at http://localhost:3000
curl http://localhost:3000/api/ping
```

### Step 3: Deploy
```bash
# Choose your platform and follow steps above
# Examples:
./deploy.sh push dockerhub your-username
railway up
# or use Render/DigitalOcean UI
```

### Step 4: Verify Production
```bash
# Test your live domain
curl https://yourdomain.com/api/ping
curl https://yourdomain.com/api/questions
```

---

## 🔍 Monitoring Post-Deployment

### Logs
```bash
# Docker
docker logs quiz-app -f

# Docker Compose
docker-compose logs app -f

# Kubernetes
kubectl logs -f deployment/quiz-app -n quiz-arena
```

### Health
```bash
# Check endpoint
curl https://yourdomain.com/api/ping

# Monitor dashboard (platform-specific)
# Railway: railway.app dashboard
# Render: render.com dashboard
# AWS: CloudWatch
```

### Metrics
- Response time
- Error rate
- CPU usage
- Memory usage
- Active connections

---

## 🚨 Rollback Procedure

```bash
# Docker Hub + VPS
docker stop quiz-app
docker rm quiz-app
docker pull yourusername/quiz-arena:previous
docker run ... yourusername/quiz-arena:previous

# Railway
railway rollback

# Render
Select previous deployment in dashboard

# Kubernetes
kubectl rollout history deployment/quiz-app -n quiz-arena
kubectl rollout undo deployment/quiz-app -n quiz-arena
```

---

## 📞 Troubleshooting

### Container won't start
```bash
docker logs quiz-app
# Check: environment variables, port conflicts, database connection
```

### Slow performance
```bash
docker stats quiz-app
# Check CPU/Memory usage
```

### Database connection error
```bash
# Test connectivity
docker exec quiz-app curl $SUPABASE_URL
```

### CORS errors
```bash
# Verify ALLOWED_ORIGINS matches your domain
docker exec quiz-app env | grep ORIGINS
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Production Best Practices](https://12factor.net/)

---

## 🎯 Next Steps

1. **Choose platform:** Railway/Render (easiest) or AWS/DigitalOcean (more control)
2. **Generate secrets:** `openssl rand -hex 32`
3. **Build locally:** `./deploy.sh build production`
4. **Deploy:** Follow platform-specific steps above
5. **Monitor:** Watch logs and metrics
6. **Optimize:** Performance tune based on metrics

---

**You're now ready to deploy to production! 🚀**

Questions? Check the platform documentation or DOCKER_DEPLOYMENT_GUIDE.md.
