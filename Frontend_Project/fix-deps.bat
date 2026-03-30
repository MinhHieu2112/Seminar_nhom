@echo off
REM Dependency Fix Script for Codex Frontend (Windows)

echo ===================================
echo Codex Frontend - Dependency Fix
echo ===================================
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo Error: package.json not found!
    echo Please run this script from the Frontend_Project directory:
    echo   cd Frontend_Project
    echo   fix-deps.bat
    pause
    exit /b 1
)

echo [1/3] Removing old node_modules and package-lock.json...
if exist "node_modules" (
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    del package-lock.json
)
echo ✓ Cleaned up old dependencies
echo.

echo [2/3] Installing dependencies with npm...
call npm install
if %ERRORLEVEL% EQU 0 (
    echo ✓ Dependencies installed successfully
    echo.
    echo [3/3] Verifying installation...
    echo.
    echo ESLint version:
    call npm list eslint
    echo.
    echo ===================================
    echo ✓ All done! Your project is ready
    echo ===================================
    echo.
    echo Next steps:
    echo   npm run dev     - Start development server
    echo   npm run build   - Build for production
    echo   npm run lint    - Run ESLint
    echo.
) else (
    echo ✗ npm install failed
    echo.
    echo Trying with --legacy-peer-deps flag...
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Installation succeeded with legacy peer deps
        echo Note: Using legacy peer deps is a workaround.
        echo The main issue should be resolved now.
    ) else (
        echo ✗ Installation still failed
        echo Please try:
        echo   rmdir /s /q node_modules
        echo   del package-lock.json
        echo   npm install --force
        pause
        exit /b 1
    )
)

pause
