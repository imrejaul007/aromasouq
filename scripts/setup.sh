#!/bin/bash

# AromaSouQ Platform - Setup Script
# This script sets up the development environment

set -e

echo "🚀 AromaSouQ Platform - Development Environment Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS or Linux
OS="$(uname)"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION installed"
else
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION installed"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
else
    print_warning "Docker not found. You can install it from https://www.docker.com/get-started"
    print_warning "Continuing without Docker (you'll need to install databases manually)"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose installed: $DOCKER_COMPOSE_VERSION"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "⚙️  Setting up environment variables..."
echo ""

# Copy .env.example to .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    print_success "Created .env.local from .env.example"
    print_warning "Please edit .env.local with your configuration"
else
    print_warning ".env.local already exists, skipping"
fi

echo ""
echo "🐳 Starting Docker containers..."
echo ""

# Start Docker containers
if command -v docker-compose &> /dev/null; then
    docker-compose up -d

    if [ $? -eq 0 ]; then
        print_success "Docker containers started successfully"

        echo ""
        echo "Waiting for databases to be ready..."
        sleep 10

        print_success "Databases should be ready now"
    else
        print_error "Failed to start Docker containers"
        exit 1
    fi
else
    print_warning "Docker Compose not available, skipping container startup"
    print_warning "Please ensure PostgreSQL, MongoDB, Redis, and Elasticsearch are running"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "=================================================="
echo "Next steps:"
echo ""
echo "1. Edit .env.local with your configuration"
echo "2. Run 'npm run db:migrate' to set up the database schema"
echo "3. Run 'npm run db:seed' to populate with sample data (optional)"
echo "4. Run 'npm run dev' to start all services"
echo ""
echo "Access points:"
echo "  - Web App: http://localhost:3000"
echo "  - Admin Panel: http://localhost:3001"
echo "  - API Gateway: http://localhost:8000"
echo ""
echo "Database management:"
echo "  - PostgreSQL: localhost:5432 (user: postgres, password: postgres)"
echo "  - MongoDB: localhost:27017 (user: mongo, password: mongo)"
echo "  - Redis: localhost:6379 (password: redis)"
echo "  - Elasticsearch: http://localhost:9200"
echo "  - MinIO (S3): http://localhost:9001 (user: minioadmin, password: minioadmin)"
echo ""
echo "To stop all containers: npm run docker:down"
echo "To view logs: docker-compose logs -f"
echo ""
echo "For more information, see BUILD_GUIDE.md"
echo "=================================================="
