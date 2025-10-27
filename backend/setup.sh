#!/bin/bash

echo "🚀 Expert BI Backend Setup Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "⚠️ MySQL is not installed or not in PATH. Please ensure MySQL is installed and running."
fi

# Navigate to backend directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running the server"
    echo "   Required settings:"
    echo "   - Database credentials (DB_HOST, DB_USERNAME, DB_PASSWORD)"
    echo "   - JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)"
    echo "   - Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Backend setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Create MySQL database: CREATE DATABASE expert_bi;"
echo "3. Run: npm run seed (to create tables and sample data)"
echo "4. Run: npm run dev (to start development server)"
echo ""
echo "The API will be available at: http://localhost:5000"
echo "API Documentation: http://localhost:5000/api"
echo "Health Check: http://localhost:5000/api/health"