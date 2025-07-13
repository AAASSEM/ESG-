# ESG Platform Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Overview

This guide covers the deployment of the ESG Scoping & Task Management Platform for production environments. The platform is containerized using Docker and orchestrated with Docker Compose.

### Architecture Components
- **Frontend**: React TypeScript application with Nginx
- **Backend**: FastAPI application with Python 3.12
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Backup**: Automated backup service

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 4+ cores recommended
- **Memory**: 8GB+ RAM recommended
- **Storage**: 100GB+ available disk space
- **Network**: Public IP with ports 80, 443 open

### Software Requirements
- Docker 24.0+
- Docker Compose 2.0+
- SSL Certificate (for HTTPS)
- Domain name configured

### Access Requirements
- SSH access to deployment server
- Docker registry access (if using private registry)
- Database backup location access

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/esg-platform
sudo chown $USER:$USER /opt/esg-platform
cd /opt/esg-platform
```

### 2. SSL Certificate Setup

```bash
# Using Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Or copy your SSL certificates
sudo mkdir -p /etc/ssl/certs/esg-platform
sudo cp your-cert.crt /etc/ssl/certs/esg-platform/
sudo cp your-key.key /etc/ssl/private/esg-platform/
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.production .env

# Edit environment variables
nano .env
```

**Important Environment Variables to Update:**
```bash
# Security
SECRET_KEY=your_super_secret_key_change_in_production_minimum_32_characters

# Database
POSTGRES_PASSWORD=secure_production_password_change_me

# Redis
REDIS_PASSWORD=redis_production_password_change_me

# Domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SSL
SSL_CERT_PATH=/etc/ssl/certs/esg-platform/your-cert.crt
SSL_KEY_PATH=/etc/ssl/private/esg-platform/your-key.key
```

## Deployment Process

### 1. Automated Deployment

```bash
# Clone repository
git clone https://github.com/your-org/esg-platform.git
cd esg-platform

# Run deployment script
./scripts/deploy.sh production
```

### 2. Manual Deployment

```bash
# Pull latest changes
git pull origin main

# Copy environment file
cp .env.production .env

# Build and start services
docker-compose build
docker-compose up -d

# Run database migrations
docker-compose exec backend python -c "
from app.database import init_db
import asyncio
asyncio.run(init_db())
"
```

### 3. Verify Deployment

```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl -f http://localhost:8000/health
curl -f http://localhost/health
```

## Post-Deployment

### 1. Create Initial Admin User

```bash
# Access backend container
docker-compose exec backend python -c "
from app.auth.router import create_user
from app.database import AsyncSessionLocal
import asyncio

async def create_admin():
    async with AsyncSessionLocal() as db:
        await create_user(db, {
            'email': 'admin@yourdomain.com',
            'password': 'secure_admin_password',
            'role': 'admin',
            'full_name': 'System Administrator'
        })

asyncio.run(create_admin())
"
```

### 2. Configure Monitoring

```bash
# Access Grafana
open http://localhost:3000
# Login: admin / admin_password (from .env)
# Import dashboards from ./monitoring/grafana/dashboards/

# Access Prometheus
open http://localhost:9090
# Verify targets are up
```

### 3. Test Backup System

```bash
# Trigger manual backup
curl -X POST -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/admin/backup/create

# Check backup health
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/admin/backup/health
```

### 4. Security Hardening

```bash
# Run security audit
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/admin/security-audit

# Configure firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## Monitoring

### Application Monitoring

**Health Checks:**
- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost/health`
- Database: Built into Docker health checks

**Metrics Endpoints:**
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Application metrics: `http://localhost:8000/metrics`

**Log Aggregation:**
- Kibana: `http://localhost:5601`
- Elasticsearch: `http://localhost:9200`

### Key Metrics to Monitor

1. **Application Performance**
   - Response times
   - Error rates
   - Request volume
   - Active users

2. **System Resources**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

3. **Database Performance**
   - Connection pool usage
   - Query performance
   - Lock waits
   - Database size

4. **Security Metrics**
   - Failed authentication attempts
   - Rate limit violations
   - Suspicious activity
   - Audit log volume

## Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check logs
docker-compose logs <service_name>

# Check system resources
free -h
df -h

# Restart specific service
docker-compose restart <service_name>
```

#### Database Connection Issues

```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Check database logs
docker-compose logs postgres

# Reset database connection
docker-compose restart postgres backend
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Check application metrics
curl http://localhost:8000/metrics

# Scale backend workers
docker-compose up -d --scale backend=3
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/esg-platform/your-cert.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Restart nginx
docker-compose restart frontend
```

### Emergency Procedures

#### Rollback Deployment

```bash
# Stop current deployment
docker-compose down

# Checkout previous version
git checkout <previous_commit>

# Deploy previous version
./scripts/deploy.sh production
```

#### Restore from Backup

```bash
# List available backups
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/admin/backup/list

# Restore from backup
curl -X POST -H "Authorization: Bearer <admin_token>" \
  -d '{"backup_path": "/app/backups/backup_file.zip"}' \
  http://localhost:8000/api/admin/backup/restore
```

#### Scale Services

```bash
# Scale backend
docker-compose up -d --scale backend=4

# Scale with load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

### Support Contacts

- **Technical Lead**: tech@company.com
- **DevOps Team**: devops@company.com
- **Emergency**: +971-xxx-xxx-xxxx

### Additional Resources

- [Application Architecture](./ARCHITECTURE.md)
- [Security Guide](./SECURITY.md)
- [Backup & Recovery](./BACKUP.md)
- [Performance Tuning](./PERFORMANCE.md)