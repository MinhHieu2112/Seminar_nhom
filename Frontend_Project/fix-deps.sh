#!/bin/bash
# Dependency Fix Script for Codex Frontend

echo "==================================="
echo "Codex Frontend - Dependency Fix"
echo "==================================="
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found!"
    echo "Please run this script from the Frontend_Project directory:"
    echo "  cd Frontend_Project"
    echo "  bash fix-deps.sh"
    exit 1
fi

echo "[1/3] Removing old node_modules and package-lock.json..."
rm -rf node_modules package-lock.json
echo "✓ Cleaned up old dependencies"
echo ""

echo "[2/3] Installing dependencies with npm..."
npm install
INSTALL_STATUS=$?

if [ $INSTALL_STATUS -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
    echo ""
    echo "[3/3] Verifying installation..."
    echo ""
    echo "ESLint version:"
    npm list eslint
    echo ""
    echo "==================================="
    echo "✓ All done! Your project is ready"
    echo "==================================="
    echo ""
    echo "Next steps:"
    echo "  npm run dev     - Start development server"
    echo "  npm run build   - Build for production"
    echo "  npm run lint    - Run ESLint"
    echo ""
else
    echo "✗ npm install failed with status $INSTALL_STATUS"
    echo ""
    echo "Trying with --legacy-peer-deps flag..."
    npm install --legacy-peer-deps
    LEGACY_STATUS=$?
    
    if [ $LEGACY_STATUS -eq 0 ]; then
        echo "✓ Installation succeeded with legacy peer deps"
        echo "Note: Using legacy peer deps is a workaround."
        echo "The main issue should be resolved now."
    else
        echo "✗ Installation still failed"
        echo "Please try:"
        echo "  rm -rf node_modules package-lock.json"
        echo "  npm install --force"
        exit 1
    fi
fi
