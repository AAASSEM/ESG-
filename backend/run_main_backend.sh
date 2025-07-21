#!/bin/bash
# Script to set up and run the fixed main backend

echo "🔧 Setting up fixed main backend..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p uploads/evidence

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run the main backend
echo "🚀 Starting main backend on port 8000..."
echo "📌 API will be available at: http://localhost:8000"
echo "📌 API docs will be at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run with proper Python path
PYTHONPATH=. python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000