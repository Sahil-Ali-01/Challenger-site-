# Docker Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Quiz Challenge Arena application using Docker for production.

---

## 📋 Prerequisites

- **Docker** (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+) - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **All environment variables ready**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│      Docker Container (Alpine)      │
│  ┌──────────────────────────────┐   │
│  │    Node.js 20 (Production)   │   │
│  │  ┌────────────────────────┐  │   │
│  │  │ Client (SPA - dist/)   │  │   │
│  │  │ Server (Express)       │  │   │
│  │  │ Socket.IO              │  │   │
│  │  └────────────────────────┘  │   │
│  │         Port: 3000           │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
        ↓
  External Services:
  - Supabase (Database)
  - Groq API (AI Questions)
```

---

## 🚀 Quick Start (Local Testing)

### 1. Create `.env.docker` file

```bash
# Copy your production environment variables
cp .env .env.docker

# Edit with your production values
nano .env.docker
```

**.env.docker contents:**
```
NODE_ENV=production
PORT=3000

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

GROQ_API_KEY=your_groq_key

JWT_SECRET=your_strong_secret_64_chars
SESSION_SECRET=your_strong_secret_64_chars

ALLOWED_ORIGINS=http://localhost:3000
VITE_ALLOWED_ORIGINS=http://localhost:3000

MATCH_TIMER=15
ELO_K_FACTOR=32
```

### 2. Build Docker Image

```bash
docker build -t quiz-challenge-arena:latest .
```

**Output should show:**
```
✅ Layer 1: Client builder
✅ Layer 2: Server builder  
✅ Layer 3: Production stage
✅ Image built successfully
```

### 3. Run Container Locally

**Option A: Direct Docker**
```bash
docker run -d \
  --name quiz-app \
  -p 3000:3000 \
  --env-file .env.docker \
  quiz-challenge-arena:latest
```

**Option B: Docker Compose**
```bash
# Set environment file
export $(cat .env.docker | grep -v '^#' | xargs)

# Start container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down
```

### 4. Test Application

```bash
# Health check
curl http://localhost:3000/api/ping
# Expected: { "message": "Hello from Fusion!" }

# Test quiz API
curl http://localhost:3000/api/questions

# Check logs
docker logs quiz-app
docker-compose logs app
```

---

## 📦 Build Options

### Production Build (Optimized)

```bash
docker build \
  --target=production \
  -t quiz-challenge-arena:prod \
  .
```

### Development Build (with source maps)

```bash
docker build \
  -f Dockerfile.dev \
  -t quiz-challenge-arena:dev \
  .
```

---

## ☁️ Deployment to Cloud Platforms

### Option 1: AWS ECS (Recommended)

#### Prerequisites:
```bash
# Install AWS CLI
aws --version

# Configure credentials
aws configure
```

#### Steps:

**1. Create ECR Repository**
```bash
aws ecr create-repository --repository-name quiz-challenge-arena --region us-east-1
```

**2. Push Image**
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ECR_URI>

# Tag image
docker tag quiz-challenge-arena:latest <YOUR_ECR_URI>/quiz-challenge-arena:latest

# Push
docker push <YOUR_ECR_URI>/quiz-challenge-arena:latest
```

**3. Deploy via ECS**
- AWS Console → ECS → Create Cluster
- Create Task Definition (Fargate, 0.5 GB, 256 MB)
- Create Service (1 task, load balancer)

### Option 2: Docker Hub

```bash
# Login
docker login

# Tag
docker tag quiz-challenge-arena:latest yourusername/quiz-challenge-arena:latest

# Push
docker push yourusername/quiz-challenge-arena:latest

# Deploy
docker run -d -p 80:3000 --env-file .env.docker yourusername/quiz-challenge-arena:latest
```

### Option 3: Railway (Easiest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Link Dockerfile
railway link

# Deploy
railway up
```

**Set environment variables in Railway Dashboard:**
- Add all variables from `.env.docker`

### Option 4: Render

1. Push code to GitHub
2. Go to render.com
3. Create → Web Service
4. Connect GitHub repo
5. Select **Docker** runtime
6. Add environment variables
7. Deploy

### Option 5: DigitalOcean App Platform

1. Connect GitHub
2. Select repository
3. Choose **Dockerfile**
4. Set environment variables
5. Deploy

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# Docker CLI
docker logs quiz-app -f
docker logs quiz-app --tail=100

# Docker Compose
docker-compose logs -f app
docker-compose logs app --tail=100
```

### Container Shell

```bash
# Access container shell
docker exec -it quiz-app sh

# Check running processes
docker exec quiz-app ps aux

# Check disk space
docker exec quiz-app df -h
```

### Health Status

```bash
# Check health
docker inspect --format='{{.State.Health.Status}}' quiz-app

# Expected: "healthy"
```

### Performance

```bash
# CPU and memory usage
docker stats quiz-app

# Container resource limits
docker inspect quiz-app | grep -A 10 "HostConfig"
```

---

## 🔐 Security Best Practices

### 1. Scan Image for Vulnerabilities

```bash
docker scan quiz-challenge-arena:latest
```

### 2. Use Non-Root User

Add to Dockerfile:
```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### 3. Environment Variables Security

**Never hardcode secrets in Dockerfile**
```dockerfile
# ❌ WRONG
ENV GROQ_API_KEY=gsk_...

# ✅ CORRECT - Pass at runtime
# Use --env-file or secrets manager
```

### 4. Image Size Optimization

**Current image size:** ~300-400MB (Alpine Linux)

**To reduce further:**
```bash
# Multi-stage build (already implemented)
# Use alpine base (already implemented)
# Remove unnecessary files (.dockerignore)
```

### 5. Network Security

```yaml
# In docker-compose.yml
networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

---

## 🚨 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs quiz-app

# Common issues:
# 1. Missing environment variables
# 2. Port already in use
# 3. Database unreachable
```

**Fix:**
```bash
# Check environment
docker exec quiz-app env | grep SUPABASE

# Test database connection
docker exec quiz-app curl -s $SUPABASE_URL
```

### Out of Memory

```bash
# Increase memory limit
docker run --memory=1g quiz-challenge-arena:latest

# Or in docker-compose
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Or use different port
docker run -p 8080:3000 quiz-challenge-arena:latest
```

### Slow Performance

```bash
# Check resource usage
docker stats quiz-app

# If CPU high: optimize Node.js
# If memory high: increase limit or check for leaks

# View detailed logs
NODE_DEBUG=http docker run quiz-challenge-arena:latest
```

---

## 📊 Production Checklist

- [ ] Environment variables configured
- [ ] `.env` file NOT in Docker image
- [ ] CORS origins set correctly
- [ ] Database backups enabled
- [ ] Error logging setup (Sentry/DataDog)
- [ ] Health checks working
- [ ] Image scanned for vulnerabilities
- [ ] Performance tested under load
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## 🔄 CI/CD Integration

### GitHub Actions Example

**.github/workflows/docker.yml:**
```yaml
name: Docker Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t quiz-arena:${{ github.sha }} .
      
      - name: Scan image
        run: docker scan quiz-arena:${{ github.sha }}
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag quiz-arena:${{ github.sha }} yourusername/quiz-arena:latest
          docker push yourusername/quiz-arena:latest
      
      - name: Deploy
        run: |
          # Your deployment script here
          ./scripts/deploy.sh
```

---

## 📈 Scaling

### Horizontal Scaling

```yaml
services:
  app:
    deploy:
      replicas: 3  # 3 instances
  
  loadbalancer:
    image: nginx:alpine
    ports:
      - "80:80"
    # Routes traffic to 3 app instances
```

### Using Kubernetes

```bash
# Create deployment
kubectl apply -f k8s-deployment.yaml

# Scale to 5 replicas
kubectl scale deployment quiz-app --replicas=5

# Check status
kubectl get pods
```

---

## 🧹 Cleanup

```bash
# Stop container
docker stop quiz-app
docker rm quiz-app

# Remove image
docker rmi quiz-challenge-arena:latest

# Clean up unused images
docker image prune

# Clean up all Docker resources
docker system prune -a
```

---

## 📞 Support

**Issues?**
1. Check logs: `docker logs quiz-app`
2. Test connectivity: `docker exec quiz-app curl http://api.example.com`
3. Verify environment: `docker exec quiz-app env`

**Still stuck?**
- Check [Docker docs](https://docs.docker.com/)
- Review [Node.js best practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- Check application logs in hosting platform

---

**Last Updated:** March 6, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
