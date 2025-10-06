# 🐳 Docker Deployment Guide for Career Lever AI

Complete guide for deploying Career Lever AI using Docker and Docker Compose.

## 📋 Prerequisites

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- 4GB+ RAM available
- 10GB+ disk space

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/joe29-rgb/Career-Lever-AI.git
cd Career-Lever-AI
```

### 2. Configure Environment

Create `.env` file from template:

```bash
cp .env.example .env
```

**Minimum required variables:**
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `PERPLEXITY_API_KEY` - Your Perplexity AI API key
- `MONGODB_URI` - Will be auto-configured if using Docker MongoDB

### 3. Start Services

**Production:**
```bash
docker-compose up -d
```

**Development (with hot reload):**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 4. Access Application

- **App**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **MongoDB** (dev): http://localhost:8081 (admin/admin123)
- **Redis** (dev): http://localhost:8082

---

## 📦 Services Overview

### Next.js Application (`app`)
- **Port**: 3000
- **Image**: Built from Dockerfile
- **Features**:
  - Multi-stage build for optimal size
  - Non-root user for security
  - Health checks included
  - Hot reload in dev mode

### MongoDB (`mongodb`)
- **Port**: 27017
- **Image**: mongo:7.0
- **Data**: Persisted in `mongodb_data` volume
- **Credentials**: Set via `MONGO_ROOT_USERNAME` and `MONGO_ROOT_PASSWORD`

### Redis (`redis`)
- **Port**: 6379
- **Image**: redis:7-alpine
- **Config**: 256MB max memory with LRU eviction
- **Password**: Set via `REDIS_PASSWORD`

---

## 🔧 Configuration

### Environment Variables

#### Core Settings
```env
NODE_ENV=production
APP_PORT=3000
LOG_LEVEL=info
```

#### Database
```env
MONGODB_URI=mongodb://admin:securepassword@mongodb:27017/careerlever?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=securepassword
MONGO_DB_NAME=careerlever
```

#### Redis
```env
REDIS_URL=redis://:redispassword@redis:6379
REDIS_PASSWORD=redispassword
```

#### NextAuth
```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
```

#### AI Services
```env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx  # Optional
```

#### Email (SMTP)
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@careerlever.ai
```

---

## 🛠️ Common Commands

### Start/Stop Services

```bash
# Start all services (detached)
docker-compose up -d

# Start specific service
docker-compose up -d app

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Rebuild & Restart

```bash
# Rebuild app after code changes
docker-compose build app

# Rebuild and restart
docker-compose up -d --build app

# Force rebuild (no cache)
docker-compose build --no-cache app
```

### Database Operations

```bash
# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p securepassword

# Redis CLI
docker-compose exec redis redis-cli -a redispassword

# Backup MongoDB
docker-compose exec mongodb mongodump --out=/data/backup

# Restore MongoDB
docker-compose exec mongodb mongorestore /data/backup
```

---

## 🔍 Health Checks & Monitoring

### Check Service Health

```bash
# Check all services
docker-compose ps

# Check app health
curl http://localhost:3000/api/health

# Check MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check Redis
docker-compose exec redis redis-cli -a redispassword ping
```

### View Resource Usage

```bash
# All containers
docker stats

# Specific container
docker stats careerlever-app
```

---

## 🚀 Production Deployment

### 1. Prepare Environment

```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 16     # For MONGO_ROOT_PASSWORD
openssl rand -hex 16     # For REDIS_PASSWORD
```

### 2. Configure Reverse Proxy

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Traefik Example (docker-compose):**
```yaml
services:
  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=myresolver"
```

### 3. Enable SSL/TLS

```bash
# Using Certbot
certbot --nginx -d yourdomain.com

# Or use Traefik/Caddy for automatic HTTPS
```

### 4. Set Resource Limits

Add to `docker-compose.yml`:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 5. Enable Logging

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🔐 Security Best Practices

### 1. Environment Security
- ✅ Never commit `.env` file to git
- ✅ Use strong passwords (32+ characters)
- ✅ Rotate secrets regularly
- ✅ Use Docker secrets for sensitive data

### 2. Network Security
- ✅ Use internal networks for service communication
- ✅ Only expose necessary ports
- ✅ Use reverse proxy with SSL/TLS
- ✅ Configure firewall (UFW/iptables)

### 3. Container Security
- ✅ Run as non-root user (already configured)
- ✅ Keep images updated
- ✅ Scan for vulnerabilities: `docker scan careerlever-app`
- ✅ Use minimal base images (Alpine)

### 4. Data Security
- ✅ Enable authentication on MongoDB and Redis
- ✅ Encrypt data at rest
- ✅ Regular backups
- ✅ Secure backup storage

---

## 📊 Performance Optimization

### 1. Enable Caching

```yaml
# Add CDN/caching headers in next.config.js
async headers() {
  return [{
    source: '/_next/static/(.*)',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
    ]
  }]
}
```

### 2. Database Indexing

Indexes are automatically created by the application. Monitor with:
```bash
docker-compose exec mongodb mongosh -u admin -p securepassword --eval "db.resumes.getIndexes()"
```

### 3. Redis Configuration

Adjust `maxmemory` in `docker-compose.yml` based on usage:
```yaml
command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
```

### 4. Node.js Tuning

```yaml
environment:
  NODE_OPTIONS: --max-old-space-size=2048
```

---

## 🐛 Troubleshooting

### App Won't Start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Missing environment variables
# 2. Port 3000 already in use
# 3. MongoDB connection failed
```

### Database Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check connectivity
docker-compose exec app ping mongodb

# Verify credentials in .env match docker-compose.yml
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Increase memory limit in docker-compose.yml
# Clear unused data
docker system prune -a
```

### Slow Performance

```bash
# Check container resources
docker stats

# Optimize database indexes
# Enable Redis caching
# Reduce log verbosity: LOG_LEVEL=warn
```

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [MongoDB Docker Guide](https://hub.docker.com/_/mongo)
- [Redis Docker Guide](https://hub.docker.com/_/redis)

---

## 🆘 Support

- **Issues**: https://github.com/joe29-rgb/Career-Lever-AI/issues
- **Documentation**: `/docs` folder
- **Health Check**: http://localhost:3000/api/health

---

## 📝 License

Copyright © 2025 Career Lever AI. All rights reserved.

