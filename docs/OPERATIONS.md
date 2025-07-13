# ESG Platform Operations Runbook

## Table of Contents
1. [Daily Operations](#daily-operations)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Backup & Recovery](#backup--recovery)
4. [Security Operations](#security-operations)
5. [Performance Management](#performance-management)
6. [Incident Response](#incident-response)
7. [Maintenance Tasks](#maintenance-tasks)

## Daily Operations

### Morning Health Check (09:00 AM)

```bash
#!/bin/bash
# Daily health check script

echo "=== ESG Platform Daily Health Check $(date) ==="

# Check service status
echo "1. Service Status:"
docker-compose ps

# Check system resources
echo "2. System Resources:"
free -h
df -h | grep -E "(Filesystem|/dev/)"

# Check application health
echo "3. Application Health:"
curl -s http://localhost:8000/health | jq '.'
curl -s http://localhost/health

# Check database connections
echo "4. Database Status:"
docker-compose exec -T postgres pg_isready -U postgres

# Check backup status
echo "5. Last Backup:"
ls -la ./backend/backups/ | tail -5

# Check error logs
echo "6. Recent Errors:"
docker-compose logs --since="24h" | grep -i error | tail -10

# Check security alerts
echo "7. Security Status:"
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/security-status | jq '.'

echo "=== Health Check Complete ==="
```

### Evening Monitoring (18:00 PM)

```bash
#!/bin/bash
# Evening monitoring script

echo "=== ESG Platform Evening Report $(date) ==="

# Performance metrics
echo "1. Performance Summary:"
curl -s http://localhost:9090/api/v1/query?query=rate(http_requests_total[1h]) | jq '.'

# User activity
echo "2. User Activity (Last 24h):"
# Query application logs for user statistics

# Data backup verification
echo "3. Backup Verification:"
./scripts/verify-backup.sh

# Security scan
echo "4. Security Summary:"
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/rbac-audit | jq '.compliance_score'

echo "=== Evening Report Complete ==="
```

## Monitoring & Alerting

### Key Metrics Dashboard

**Application Metrics:**
- Request rate: `rate(http_requests_total[5m])`
- Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
- Response time: `histogram_quantile(0.95, http_request_duration_seconds_bucket)`
- Active sessions: `active_user_sessions`

**System Metrics:**
- CPU usage: `100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
- Memory usage: `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
- Disk usage: `100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes)`

**Database Metrics:**
- Active connections: `pg_stat_activity_count`
- Query duration: `pg_stat_statements_mean_time`
- Database size: `pg_database_size_bytes`

### Alert Rules

```yaml
# Prometheus alert rules
groups:
- name: esg-platform
  rules:
  # High error rate
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  # High response time
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }} seconds"

  # Database connection issues
  - alert: DatabaseConnections
    expr: pg_stat_activity_count > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High database connection count"
      description: "{{ $value }} active database connections"

  # Disk space warning
  - alert: DiskSpaceWarning
    expr: 100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) > 80
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Disk space running low"
      description: "Disk usage is {{ $value }}%"
```

### Notification Channels

**Slack Integration:**
```yaml
# alertmanager.yml
route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    channel: '#esg-alerts'
    title: 'ESG Platform Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## Backup & Recovery

### Automated Backup Schedule

**Daily Backups (02:00 AM):**
```bash
#!/bin/bash
# Automated daily backup

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/app/backups/daily"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T postgres pg_dump -U postgres esg_platform \
  > $BACKUP_DIR/database_$DATE.sql

# Application data backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./backend/uploads/

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Verify backup integrity
if [ -f "$BACKUP_DIR/database_$DATE.sql" ]; then
    echo "Backup completed successfully: $DATE"
else
    echo "Backup failed: $DATE" >&2
    exit 1
fi
```

**Weekly Full Backup (Sunday 01:00 AM):**
```bash
#!/bin/bash
# Weekly full system backup

DATE=$(date +%Y%m%d)
BACKUP_DIR="/app/backups/weekly"

# Create comprehensive backup
docker-compose exec backend python -c "
from app.core.backup import BackupManager
import asyncio

async def backup():
    manager = BackupManager('$BACKUP_DIR')
    result = await manager.create_full_backup(include_files=True)
    print(f'Backup completed: {result}')

asyncio.run(backup())
"
```

### Recovery Procedures

**Database Recovery:**
```bash
# Stop application
docker-compose stop backend

# Restore database
docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS esg_platform;"
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE esg_platform;"
docker-compose exec -T postgres psql -U postgres esg_platform < backup_file.sql

# Start application
docker-compose start backend
```

**Full System Recovery:**
```bash
# Restore from backup archive
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"backup_path": "/app/backups/backup_archive.zip", "restore_files": true}' \
  http://localhost:8000/api/admin/backup/restore
```

## Security Operations

### Daily Security Checks

```bash
#!/bin/bash
# Daily security audit

echo "=== Security Audit $(date) ==="

# RBAC compliance check
echo "1. RBAC Compliance:"
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/rbac-audit | jq '.compliance_score'

# Failed login attempts
echo "2. Failed Login Attempts (Last 24h):"
docker-compose logs --since="24h" backend | grep "authentication failed" | wc -l

# Rate limit violations
echo "3. Rate Limit Violations:"
docker-compose logs --since="24h" backend | grep "rate limit exceeded" | wc -l

# Suspicious activity
echo "4. Suspicious Activity:"
docker-compose logs --since="24h" backend | grep -i "suspicious" | tail -5

# Security updates
echo "5. Security Updates Available:"
docker images --format "table {{.Repository}}\t{{.Tag}}" | grep -E "(backend|frontend)"

echo "=== Security Audit Complete ==="
```

### Incident Response

**Security Incident Checklist:**
1. **Immediate Response (0-15 minutes)**
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify security team
   - Document incident timeline

2. **Assessment (15-60 minutes)**
   - Determine scope and impact
   - Identify attack vectors
   - Check for data breaches
   - Assess system integrity

3. **Containment (1-4 hours)**
   - Block malicious traffic
   - Patch vulnerabilities
   - Reset compromised credentials
   - Implement additional monitoring

4. **Recovery (4-24 hours)**
   - Restore from clean backups
   - Verify system integrity
   - Gradually restore services
   - Monitor for reoccurrence

5. **Post-Incident (24+ hours)**
   - Conduct forensic analysis
   - Update security measures
   - Document lessons learned
   - Report to stakeholders

## Performance Management

### Performance Monitoring

**Database Performance:**
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check database size
SELECT pg_size_pretty(pg_database_size('esg_platform'));

-- Check connection stats
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;
```

**Application Performance:**
```bash
# Check response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:8000/api/companies/

# Check memory usage
docker stats --no-stream esg-backend

# Check load average
uptime
```

### Performance Optimization

**Database Optimization:**
```sql
-- Analyze query performance
ANALYZE;

-- Reindex if needed
REINDEX DATABASE esg_platform;

-- Update statistics
VACUUM ANALYZE;
```

**Application Optimization:**
```bash
# Scale backend services
docker-compose up -d --scale backend=4

# Restart services to clear memory
docker-compose restart backend

# Clear application cache
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/cache/clear
```

## Maintenance Tasks

### Weekly Maintenance (Sunday 03:00 AM)

```bash
#!/bin/bash
# Weekly maintenance script

echo "=== Weekly Maintenance $(date) ==="

# Update system packages
echo "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Clean Docker resources
echo "2. Cleaning Docker resources..."
docker system prune -f
docker volume prune -f

# Analyze database
echo "3. Database maintenance..."
docker-compose exec -T postgres psql -U postgres -d esg_platform -c "VACUUM ANALYZE;"

# Check disk space
echo "4. Disk space check..."
df -h

# Security updates
echo "5. Checking for security updates..."
docker-compose pull

# Log rotation
echo "6. Log rotation..."
docker-compose logs --no-color > ./logs/docker-compose-$(date +%Y%m%d).log
docker-compose logs --no-color | tail -1000 > ./logs/docker-compose-recent.log

echo "=== Weekly Maintenance Complete ==="
```

### Monthly Maintenance

```bash
#!/bin/bash
# Monthly maintenance tasks

echo "=== Monthly Maintenance $(date) ==="

# Full security audit
echo "1. Security audit..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/security-audit > ./reports/security-audit-$(date +%Y%m).json

# Performance report
echo "2. Performance report..."
# Generate monthly performance metrics

# Backup verification
echo "3. Backup verification..."
./scripts/verify-all-backups.sh

# Certificate renewal check
echo "4. SSL certificate check..."
openssl x509 -in /etc/ssl/certs/esg-platform/cert.crt -noout -dates

# Disaster recovery test
echo "5. DR test..."
./scripts/test-disaster-recovery.sh

echo "=== Monthly Maintenance Complete ==="
```

### Contact Information

**Emergency Contacts:**
- **Primary On-Call**: +971-xxx-xxx-xxxx
- **Technical Lead**: tech@company.com
- **DevOps Team**: devops@company.com
- **Security Team**: security@company.com

**Escalation Matrix:**
1. **Level 1**: On-call engineer (0-30 minutes)
2. **Level 2**: Technical lead (30-60 minutes)
3. **Level 3**: DevOps manager (1-2 hours)
4. **Level 4**: CTO (2+ hours)

**External Vendors:**
- **Cloud Provider**: support@cloudprovider.com
- **Security Vendor**: support@securityvendor.com
- **Monitoring Vendor**: support@monitoringvendor.com