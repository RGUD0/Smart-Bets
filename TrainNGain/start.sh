#!/bin/bash

# Start the backend
echo "Starting backend..."
cd server
node index.js &

# Start the frontend
cd ..
echo "Starting frontend..."
npm start