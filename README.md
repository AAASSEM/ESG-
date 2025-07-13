# ESG Scoping & Task Management Platform

![ESG Platform](https://img.shields.io/badge/ESG-Platform-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A comprehensive Environmental, Social, and Governance (ESG) compliance platform designed specifically for UAE Small and Medium Enterprises (SMEs). This platform streamlines ESG assessment, task management, and compliance reporting in accordance with UAE sustainability frameworks.

## 🌟 Features

### Core Functionality
- **Dynamic ESG Scoping Wizard**: Sector-specific questionnaires based on business type
- **Intelligent Task Generation**: AI-driven task creation from ESG assessment responses
- **Evidence Management**: Secure file upload and management with audit trails
- **PDF Report Generation**: Comprehensive compliance reports for stakeholders
- **Progress Tracking**: Real-time dashboard with analytics and insights

### Business Sectors Supported
- 🏨 Hospitality (Hotels & Restaurants)
- 🏗️ Construction & Real Estate
- 🏭 Manufacturing
- 🛒 Retail & E-commerce
- 🚛 Transportation & Logistics
- 💼 Professional Services
- 🎓 Education
- ⚕️ Healthcare

### Compliance Frameworks
- **Dubai Sustainable Tourism**: Hospitality sector compliance
- **Green Key Global**: International environmental certification
- **UAE ESG Guidelines**: National sustainability standards
- **Dubai Green Building Regulations**: Construction compliance
- **Custom Framework Support**: Extensible framework system

## 🚀 Quick Start

### Prerequisites
- Docker 24.0+
- Docker Compose 2.0+
- 8GB+ RAM
- 100GB+ available disk space

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/esg-platform.git
   cd esg-platform
   ```

2. **Configure environment**
   ```bash
   cp .env.production .env
   # Edit .env with your production settings
   nano .env
   ```

3. **Deploy the platform**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh production
   ```

4. **Access the platform**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Monitoring: http://localhost:3000 (Grafana)

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS with Glassmorphism design
- TanStack Query for state management
- Vite for build tooling
- Jest for testing

**Backend:**
- FastAPI with Python 3.12
- SQLAlchemy with async PostgreSQL
- JWT authentication with RBAC
- Pydantic for data validation
- Pytest for testing

**Infrastructure:**
- Docker containerization
- PostgreSQL 15 database
- Redis for caching
- Nginx reverse proxy
- Prometheus & Grafana monitoring
- ELK stack for logging

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │────│   FastAPI       │────│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│   Redis Cache   │──────────────┘
                        └─────────────────┘
                                 │
                    ┌─────────────────────────────┐
                    │     Monitoring Stack        │
                    │  Prometheus, Grafana, ELK   │
                    └─────────────────────────────┘
```

## 📋 Project Structure

```
esg-platform/
├── backend/                     # FastAPI backend application
│   ├── app/
│   │   ├── auth/               # Authentication & authorization
│   │   ├── core/               # Core utilities (security, backup, etc.)
│   │   ├── middleware/         # Security middleware
│   │   ├── models/             # Database models
│   │   ├── routers/            # API endpoints
│   │   ├── schemas/            # Pydantic schemas
│   │   └── templates/          # Report templates
│   ├── tests/                  # Backend tests
│   ├── data/                   # ESG content configuration
│   └── Dockerfile
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   └── types/              # TypeScript types
│   ├── tests/                  # Frontend tests
│   └── Dockerfile
├── docs/                       # Documentation
├── scripts/                    # Deployment scripts
├── monitoring/                 # Monitoring configuration
└── docker-compose.yml         # Container orchestration
```

## 🔧 Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your_super_secret_key_change_in_production

# Database
DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/esg_platform
REDIS_URL=redis://default:password@redis:6379/0

# Security
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_PER_MINUTE=60

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=/app/uploads

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=secure_password
```

### ESG Content Configuration

The platform uses a markdown-driven approach for ESG content management:

```markdown
#### **1\. Hospitality Sector (Hotels & Restaurants)**

**Intersecting Frameworks:**
* **Dubai Sustainable Tourism**: Green Tourism Certification
* **Green Key Global**: International Environmental Standards

| Question | Category | Framework | Evidence Required |
|----------|----------|-----------|-------------------|
| Do you monitor electricity consumption? | Energy | Green Key: 7.1 | Utility bills |
| Do you have water conservation measures? | Water | DST: Water Management | Policy documents |
```

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, User)
- Company-scoped data access
- Session management with timeout

### Security Hardening
- Comprehensive input validation and sanitization
- File upload security with malicious content detection
- Rate limiting with endpoint-specific limits
- Security headers and CSP policies
- Audit logging for compliance

### Data Protection
- Encryption at rest and in transit
- Secure file storage with integrity verification
- GDPR-compliant data handling
- Automated backup and disaster recovery

## 📊 Monitoring & Operations

### Health Monitoring
- Application health checks
- Database performance monitoring
- System resource tracking
- Real-time alerting

### Logging & Auditing
- Structured JSON logging
- Audit trail for compliance
- Centralized log aggregation
- Security event monitoring

### Backup & Recovery
- Automated daily backups
- Point-in-time recovery
- Disaster recovery procedures
- Backup integrity verification

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/ -v --cov=app
```

### Frontend Testing
```bash
cd frontend
npm test -- --coverage
```

### Integration Testing
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📈 Performance

### Scalability
- Horizontal scaling with Docker Swarm/Kubernetes
- Database connection pooling
- Redis caching layer
- CDN integration for static assets

### Optimization
- Lazy loading and code splitting
- Database query optimization
- Image optimization and compression
- Gzip compression for web assets

## 🔄 CI/CD Pipeline

The platform includes a complete CI/CD pipeline with:

- **Automated Testing**: Unit, integration, and security tests
- **Code Quality**: Linting, formatting, and coverage checks
- **Security Scanning**: Vulnerability detection and dependency scanning
- **Automated Deployment**: Staging and production deployments
- **Performance Testing**: Load testing and performance monitoring

## 📚 Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Operations Runbook](./docs/OPERATIONS.md)
- [API Documentation](http://localhost:8000/docs)
- [Security Guide](./docs/SECURITY.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Technical Issues**: Create an issue on GitHub
- **Documentation**: Check the `/docs` directory
- **Emergency Support**: contact@company.com

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core ESG assessment platform
- ✅ Task management system
- ✅ PDF report generation
- ✅ Security hardening
- ✅ Production deployment

### Phase 2 (Q2 2024)
- 🔄 Mobile application
- 🔄 Advanced analytics dashboard
- 🔄 Third-party integrations
- 🔄 Multi-language support

### Phase 3 (Q3 2024)
- 🔄 AI-powered recommendations
- 🔄 Automated compliance checking
- 🔄 Blockchain integration for certificates
- 🔄 Advanced workflow automation

## 🌍 Impact

This platform aims to accelerate ESG adoption among UAE SMEs by:
- Simplifying complex compliance requirements
- Providing sector-specific guidance
- Automating reporting processes
- Reducing implementation costs
- Improving sustainability outcomes

---

**Built with ❤️ for a sustainable future in the UAE**