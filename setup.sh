#!/bin/bash

# Shofy E-commerce Environment Setup Script
# ==========================================

echo "🚀 Setting up Shofy E-commerce project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if ! node -e "process.exit(process.version.split('.')[0].slice(1) >= 16 ? 0 : 1)" 2>/dev/null; then
    print_error "Node.js version 16 or higher is required. Current version: $NODE_VERSION"
    exit 1
fi

print_status "Node.js version: $NODE_VERSION"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."

cd backend || exit

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created backend .env file from .env.example"
        print_warning "Please edit backend/.env file with your actual values"
    else
        print_error "No .env.example file found in backend directory"
    fi
else
    print_status "Backend .env file already exists"
fi

# Install backend dependencies
if [ -f "package.json" ]; then
    print_info "Installing backend dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "Backend dependencies installed successfully"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
else
    print_error "No package.json found in backend directory"
    exit 1
fi

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."

cd ../frontend || exit

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_status "Created frontend .env.local file from .env.example"
        print_warning "Please edit frontend/.env.local file with your actual values"
    else
        print_error "No .env.example file found in frontend directory"
    fi
else
    print_status "Frontend .env.local file already exists"
fi

# Install frontend dependencies
if [ -f "package.json" ]; then
    print_info "Installing frontend dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
else
    print_error "No package.json found in frontend directory"
    exit 1
fi

# Return to project root
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
print_info "Next steps:"
echo "1. Edit backend/.env file with your actual configuration values"
echo "2. Edit frontend/.env.local file with your actual configuration values"
echo "3. Set up required services (MongoDB, Cloudinary, Stripe, etc.)"
echo "4. Start the development servers:"
echo ""
echo "   Backend:  cd backend && npm run start-dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""
print_info "For detailed setup instructions, see ENVIRONMENT_SETUP.md"

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    if pgrep mongod > /dev/null; then
        print_status "MongoDB is running"
    else
        print_warning "MongoDB is not running. You may need to start it."
    fi
else
    print_warning "MongoDB not found. You may need to install it or use MongoDB Atlas."
fi

echo ""
print_status "Environment setup script completed!"