#!/bin/bash

# ESG Platform Deployment Script
# This script handles the complete deployment of the ESG platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${1:-production}
PROJECT_NAME="esg-platform"
BACKUP_DIR="./backups/pre-deployment"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.${DEPLOYMENT_ENV}" ]; then
        log_error "Environment file .env.${DEPLOYMENT_ENV} not found."
        exit 1
    fi
    
    log_success "All requirements satisfied"
}

create_backup() {
    log_info "Creating pre-deployment backup..."
    
    mkdir -p "${BACKUP_DIR}"
    
    # Backup database if exists
    if docker ps | grep -q esg-postgres; then
        log_info "Backing up database..."
        docker exec esg-postgres pg_dump -U postgres esg_platform > "${BACKUP_DIR}/database_$(date +%Y%m%d_%H%M%S).sql"
        log_success "Database backup completed"
    fi
    
    # Backup uploads if exists
    if [ -d "./backend/uploads" ]; then
        log_info "Backing up uploaded files..."
        tar -czf "${BACKUP_DIR}/uploads_$(date +%Y%m%d_%H%M%S).tar.gz" ./backend/uploads/
        log_success "Uploads backup completed"
    fi
    
    log_success "Pre-deployment backup completed"
}

stop_services() {
    log_info "Stopping existing services..."
    
    if docker-compose ps | grep -q Up; then
        docker-compose down
        log_success "Services stopped"
    else
        log_info "No running services found"
    fi
}

pull_latest_images() {
    log_info "Pulling latest images..."
    docker-compose pull
    log_success "Images updated"
}

build_services() {
    log_info "Building services..."
    docker-compose build --no-cache
    log_success "Services built"
}

start_services() {
    log_info "Starting services..."
    
    # Copy environment file
    cp ".env.${DEPLOYMENT_ENV}" .env
    
    # Start services
    docker-compose up -d
    
    log_success "Services started"
}

wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            log_success "Services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
    done
    
    log_error "Services failed to become healthy within timeout"
    return 1
}

run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose exec -T backend python -c "
from app.database import init_db
import asyncio
asyncio.run(init_db())
"
    
    log_success "Database migrations completed"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

show_status() {
    log_info "Deployment status:"
    docker-compose ps
    
    log_info "Service URLs:"
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost:8000"
    echo "API Documentation: http://localhost:8000/docs"
    echo "Grafana Dashboard: http://localhost:3000"
    echo "Prometheus: http://localhost:9090"
    echo "Kibana: http://localhost:5601"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

main() {
    log_info "Starting ESG Platform deployment (${DEPLOYMENT_ENV})..."
    
    # Pre-deployment checks
    check_requirements
    
    # Create backup
    create_backup
    
    # Stop existing services
    stop_services
    
    # Update and build
    pull_latest_images
    build_services
    
    # Start services
    start_services
    
    # Wait for services to be ready
    wait_for_services
    
    # Run migrations
    run_migrations
    
    # Health checks
    run_health_checks
    
    # Show status
    show_status
    
    # Cleanup
    cleanup
    
    log_success "ESG Platform deployment completed successfully!"
    log_info "Check the logs with: docker-compose logs -f"
}

# Trap errors and cleanup
trap 'log_error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"