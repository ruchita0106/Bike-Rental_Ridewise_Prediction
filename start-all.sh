#!/bin/bash

echo "========================================"
echo "Starting RideWise Application"
echo "========================================"
echo ""

# Start backend in background
echo "Starting Backend Server..."
cd backend
./start.sh &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting Frontend..."
echo ""
./start-frontend.sh

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

