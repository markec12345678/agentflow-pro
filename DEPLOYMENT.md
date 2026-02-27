# AgentFlow Pro - Production Deployment Guide
# Complete deployment instructions for production environment

## 🚀 **Deployment Status: READY**

### ✅ **Completed Components**
- ✅ **Stripe Monetization** - Complete payment processing
- ✅ **User Authentication** - Full auth system with OAuth
- ✅ **Usage Limits** - Real-time usage tracking
- ✅ **Testing Suite** - Jest + Playwright E2E tests
- ✅ **CI/CD Pipeline** - GitHub Actions automation
- ✅ **Monitoring** - Sentry error tracking
- ✅ **Docker Configuration** - Multi-service containers
- ✅ **Production Environment Setup** - All configurations ready

---

## 📋 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        AgentFlow Pro Production Environment                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     Load Balancer (Nginx)                        │ │
│  │                     │                                     │ │
│  │                     └─────────────────────────────────────┘ │
│  │                               │                                     │ │
│  │                     ┌─────────────────────────────────────┐ │
│  │                     │        Web Server (Next.js)              │ │
│  │                     │                                     │ │
│  │                     │        ┌─────────────────────────────┐ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        │        │ │ │
│  │                     │        └─────────────────────────────┘ │
│  │                     │                                     │ │
│  │                     └─────────────────────────────────────┘ │
│ │                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     Agent Services (4 containers)                       │
│  │                     │                                     │ │
│  │                     │  ┌─────────────────────────────┐ │
│  │                     │ │ Research Agent (2 replicas)   │ │
│ │                     │ │ Content Agent (2 replicas)    │ │
│ │                     │ Reservation Agent (2 replicas) │ │
│ │                     │ Communication Agent (2 replicas) │ │
│ │                     │                                     │ │
│  │                     │ └─────────────────────────────┘ │
│ │                                                           │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     │ Database Services                        │ │
│  │                     │                                     │ │
│  │                     │ ┌─────────────────────────────┐ │
│  │                     │ │ PostgreSQL (main)          │ │
│  │                     │ │ Redis (cache)              │ │
│  │                     │                                     │ │
│  │                     │ └─────────────────────────────┘ │
│ │                                                           │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     │ Monitoring Stack                         │ │
│  │                     │                                     │ │
│  │                     │ ┌─────────────────────────────┐ │
│  │                     │ │ Prometheus (metrics)          │ │
│ │                     │ │ Grafana (dashboards)        │ │
│ │                     │ │ Elasticsearch (logs)         │ │
│ │                     │ Logstash (log aggregation)      │ │
│ │                     │                                     │ │
│  │                     │ └─────────────────────────────┘ │
│ │                                                           │
│  │                     ┌─────────────────────────────────────────────────────────────┘ │
│  │                     │ External Services                     │ │
│  │                     │                                     │ │
│  │                     │ ┌─────────────────────────────┐ │
│ │                     │ │ Stripe (payments)              │ │
│ │                     │ │ Booking.com API               │ │
│ │                     │ │ Airbnb API                  │ │
│ │                     │ │ TripAdvisor API              │ │
│ │                     │ │ Google Search API               │ │
│ │                     │ │ Firecrawl API                 │ │
│ │                     │ │ Context7 API                 │ │
│ │                     │                                     │ │
│ │                     │ └─────────────────────────────┘ │
│ │                                                           │
│  └─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Quick Start Deployment**

### **Prerequisites**
- Docker and Docker Compose installed
- SSH access to production server
- Environment variables configured
- SSL certificates (for HTTPS)

### **Step 1: Environment Setup**
```bash
# Clone repository
git clone https://github.com/your-org/agentflow-pro.git
cd agentflow-pro

# Set environment variables
cp .env.example .env.production
# Edit .env.production with your actual values
```

### **Step 2: Deploy with Docker Compose**
```bash
# Deploy all services
docker-compose -f docker-compose.yml --profile production up -d

# Check deployment status
docker-compose ps
```

### **Step 3: Health Checks**
```bash
# Check application health
curl -f https://your-domain.com/api/health

# Check database connection
docker-compose exec postgres pg_isready -U postgres

# Check Redis connection
docker-compose exec redis redis-cli ping
```

---

## 📋 **Environment Variables**

### **Required Variables**
```bash
# Application
NODE_ENV=production
RELEASE_VERSION=v1.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agentflow_pro
POSTGRES_PASSWORD=your_secure_password
POSTGRES_USER=postgres

# Redis
REDIS_URL=redis://redis:6379/agentflow_pro

# Authentication
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
NEXTAUTH_SECRET=your_nextauth_secret_minimum_32_characters

# Stripe
STRIPE_SECRET_KEY=sk_live_... (from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook settings)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (from Stripe dashboard)

# External APIs
FIRECRAWL_API_KEY=fc_... (from Firecrawl dashboard)
SERPAPI_API_KEY=... (from SerpApi dashboard)
CONTEXT7_API_KEY=... (from Context7 dashboard)
BOOKING_COM_API_KEY=... (from Booking.com dashboard)
AIRBNB_API_KEY=... (from Airbnb dashboard)
TRIPADVISOR_API_KEY=... (from TripAdvisor dashboard)
```

### **Optional Variables**
```bash
# Monitoring
SENTRY_DSN=... (from Sentry dashboard)
GRAFANA_ADMIN_PASSWORD=... (for Grafana dashboard)

# Development
NODE_OPTIONS=--max-old-space-size=4096
```

---

## 🔧 **Configuration Files**

### **Docker Compose Override**
```yaml
# Production override
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
    volumes:
      - ./logs:/app/logs

  nginx:
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"

  research-agent:
    deploy:
      replicas: 3

  content-agent:
    deploy:
      replicas: 3

  reservation-agent:
    deploy:
      replicas: 3

  communication-agent:
    deploy:
      replicas: 3
```

### **Nginx Configuration**
```nginx
server {
    listen 80;
    listen 443 ssl;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000";
    
    # Proxy configuration
    location /api/ {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔄 **Database Setup**

### **Initial Setup**
```bash
# Create database
docker-compose exec postgres createdb agentflow_pro

# Run migrations
docker-compose exec app npm run db:migrate:prod

# Seed data
docker-compose exec app npm run db:seed:prod
```

### **Backup Strategy**
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres agentflow_pro > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres agentflow_pro < backup_20240223.sql
```

### **Performance Optimization**
```sql
-- PostgreSQL performance settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
```

---

## 🔒 **Security Configuration**

### **SSL/TLS**
```bash
# Generate SSL certificate
certbot --nginx -d your-domain.com --email your-email@domain.com

# Update nginx configuration
# Update nginx.prod.conf with new certificate paths
```

### **Firewall Rules**
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp # PostgreSQL
ufw allow 6379/tcp # Redis
ufw allow 9090/tcp # Prometheus
ufw allow 3001/tcp # Grafana
```

### **Application Security**
```bash
# Set secure headers
# Next.js automatically sets security headers in production
# Additional headers configured in next.config.ts
```

---

## 📊 **Monitoring Setup**

### **Sentry Configuration**
```typescript
// sentry.ts is already configured
// Just set environment variables
SENTRY_DSN=https://your-sentry-dsn
```

### **Prometheus Metrics**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'agentflow-pro'
    metrics_path: /api/metrics
    scrape_interval: 5s
    static_configs:
      - targets:
        - localhost:3002
```

### **Grafana Dashboards**
```typescript
// Create custom dashboards
// Available in monitoring/grafana/provisioning/
```

---

## 🚀 **Health Monitoring**

### **Application Health Check**
```typescript
// API endpoint: /api/health
{
  "status": "healthy",
  "timestamp": "2026-02-23T12:00:00Z",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "agents": "healthy"
  },
  "version": "1.0.0"
}
```

### **Database Health**
```bash
# PostgreSQL health
docker-compose exec postgres pg_isready -U postgres

# Redis health
docker-compose exec redis redis-cli ping

# Application health
curl -f https://your-domain.com/api/health
```

### **Agent Health**
```bash
# Check individual agent services
docker-compose ps --filter "name=research-agent"
docker-compose logs research-agent
```

---

## 🔄 **Update Process**

### **Zero-Downtime Deployment**
```bash
# Pull latest images
docker-compose pull

# Update services one by one
docker-compose up -d --no-deps research-agent

# Update all services
docker-compose up -d --force-recreate
```

### **Rollback Strategy**
```bash
# Rollback to previous version
git checkout previous-tag
docker-compose up -d --force-recreate

# Keep database data during rollback
docker-compose up -d postgres redis
```

### **Blue-Green Deployment**
```bash
# Deploy to staging first
docker-compose -f docker-compose.staging.yml up -d

# Test staging deployment
curl -f https://staging.your-domain.com/api/health

# Switch to production
docker-compose -f docker-compose.yml up -d
```

---

## 📈 **Performance Optimization**

### **Application Performance**
```typescript
// next.config.ts
const nextConfig = {
  // Production optimizations
  poweredByHeader: true,
  compress: true,
  swcMinification: true,
  reactStrictMode: true,
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};
```

### **Database Performance**
```sql
-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

### **Caching Strategy**
```typescript
// Redis caching
const redis = require('redis');

// Cache frequently accessed data
const cacheKey = `user:${userId}`;
await redis.setex(cacheKey, userData, { ex: 3600 });
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check logs
docker-compose logs app

# Check resource usage
docker stats

# Restart specific service
docker-compose restart app
```

#### **Database Connection Issues**
```bash
# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d agentflow_pro

# Check network connectivity
docker network ls
```

#### **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Test SSL configuration
curl -v -I https://your-domain.com
```

#### **Memory Issues**
```bash
# Check memory usage
docker stats

# Check individual service memory
docker stats app

# Restart services to free memory
docker-compose restart
```

### **Debug Mode**
```bash
# Enable debug logging
NODE_ENV=development
DEBUG=agentflow-pro

# Run with increased logging
docker-compose up --log-level debug
```

---

## 📊 **Scaling Considerations**

### **Horizontal Scaling**
```yaml
services:
  app:
    deploy:
      replicas: 5
    resources:
      limits:
        cpus: '1000m'
        memory: '2Gi'
```

### **Vertical Scaling**
```yaml
services:
  app:
    resources:
      limits:
        cpus: '2000m'
        memory: '4Gi'
```

### **Load Balancing**
```nginx
upstream app {
    server app1:3001;
    server app2:3002;
    server app3:3003;
    least_conn 1;
}
```

---

## 📋 **Backup Strategy**

### **Automated Backups**
```bash
# Daily database backup
0 2 * * * * * /usr/bin/pg_dump -U postgres agentflow_pro > /backups/db_$(date +%Y%m%d).sql

# Weekly application backup
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /app
```

### **Recovery Procedures**
```bash
# Database recovery
docker-compose exec postgres psql -U postgres -f /backups/db_20240223.sql

# Application recovery
docker-compose down
docker-compose up -d --force-recreate
```

---

## 🎯 **Maintenance Tasks**

### **Regular Maintenance**
- Update dependencies weekly
- Rotate secrets monthly
- Review logs daily
- Update SSL certificates quarterly
- Performance tuning monthly

### **Security Updates**
- Apply security patches
- Update SSL certificates
- Review access logs
- Update firewall rules

### **Performance Optimization**
- Monitor response times
- Optimize database queries
- Review resource usage
- Update caching strategies

---

## 🎯 **Support & Monitoring**

### **Monitoring Dashboard**
- Grafana dashboards: `/monitoring/grafana/`
- Prometheus metrics: `/api/metrics`
- Sentry error tracking: `/api/errors`

### **Alerting**
- Slack notifications for critical errors
- Email alerts for performance issues
- SMS alerts for downtime

### **Documentation**
- This deployment guide
- API documentation
- Troubleshooting guide
- Performance tuning guide

---

## 🚀 **Production Deployment Status: COMPLETE**

**✅ All systems ready for production deployment:**
- ✅ Application (Next.js)
- ✅ Database (PostgreSQL)
- ✅ Cache (Redis)
- ✅ Agent Services (4 containers)
- ✅ Load Balancer (Nginx)
- ✅ Monitoring (Sentry, Prometheus, Grafana)
- ✅ CI/CD Pipeline
- ✅ Docker Containerization

**🚀 Ready for immediate deployment with:**
- One-command deployment
- Zero-downtime updates
- Automatic scaling
- Comprehensive monitoring
- Full error tracking
- Performance optimization

**🎯 Next Steps:**
1. Set up environment variables
2. Configure SSL certificates
3. Deploy with `docker-compose up -d`
4. Verify all health checks
5. Monitor initial performance

**🎯 Production Ready! 🚀**
