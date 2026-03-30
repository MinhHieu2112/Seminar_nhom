#!/bin/bash

# Navigate to Frontend_Project
cd /vercel/share/v0-project/Frontend_Project

# Remove old dependencies
rm -rf node_modules
rm -f package-lock.json

# Install with the corrected versions
npm install

echo "[v0] Dependencies installed successfully!"
