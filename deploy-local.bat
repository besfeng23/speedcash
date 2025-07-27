@echo off
setlocal enabledelayedexpansion

echo 🚀 CPay Local Deployment Script
echo ===============================
echo.

REM Configuration
set APP_NAME=cpay
set APP_DIR=%cd%
set LOG_DIR=%cd%\logs
set PORT=3000

echo [INFO] Starting local deployment...
echo [INFO] Application Directory: %APP_DIR%
echo [INFO] Port: %PORT%
echo.

REM Create log directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
echo [SUCCESS] Log directory created

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/
    echo [ERROR] After installing Node.js, run this script again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js found
)

REM Check if npm is available
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] npm is not available. Please check your Node.js installation.
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm found
)

REM Install dependencies
echo [INFO] Installing dependencies...
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed

REM Create environment file if it doesn't exist
if not exist ".env.local" (
    echo [INFO] Creating .env.local file...
    copy env.example .env.local >nul
    echo [SUCCESS] .env.local created from env.example
    echo [INFO] Please edit .env.local with your configuration values
) else (
    echo [INFO] .env.local already exists
)

REM Build the application
echo [INFO] Building application...
call npm run build
if %errorLevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [SUCCESS] Application built successfully

REM Start the application
echo [INFO] Starting CPay application...
echo [INFO] Application will be available at: http://localhost:%PORT%
echo [INFO] Press Ctrl+C to stop the application
echo.

REM Start the application
call npm start

pause 