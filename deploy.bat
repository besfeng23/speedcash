@echo off
setlocal enabledelayedexpansion

REM CPay Windows Server Deployment Script
REM This script automates the deployment of CPay to a Windows server

echo 🚀 CPay Windows Server Deployment Script
echo ========================================
echo.

REM Configuration
set APP_NAME=cpay
set APP_DIR=C:\inetpub\wwwroot\cpay
set LOG_DIR=C:\logs\cpay
set BACKUP_DIR=C:\backups\cpay
set DOMAIN=%1

REM Check if domain is provided
if "%DOMAIN%"=="" (
    echo [ERROR] Please provide a domain name as an argument
    echo Usage: %0 yourdomain.com
    exit /b 1
)

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator
    exit /b 1
)

echo [INFO] Starting deployment for domain: %DOMAIN%
echo.

REM Create directories
echo [INFO] Creating necessary directories...
if not exist "%APP_DIR%" mkdir "%APP_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo [SUCCESS] Directories created successfully

REM Backup existing installation
if exist "%APP_DIR%\*" (
    echo [INFO] Creating backup of existing installation...
    set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set TIMESTAMP=!TIMESTAMP: =0!
    powershell -Command "Compress-Archive -Path '%APP_DIR%\*' -DestinationPath '%BACKUP_DIR%\cpay_backup_!TIMESTAMP!.zip'"
    echo [SUCCESS] Backup created: cpay_backup_!TIMESTAMP!.zip
)

REM Install Node.js if not present
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Installing Node.js...
    REM Download and install Node.js 20
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'nodejs.msi'"
    msiexec /i nodejs.msi /quiet /norestart
    del nodejs.msi
    echo [SUCCESS] Node.js installed successfully
) else (
    echo [INFO] Node.js already installed
)

REM Install PM2 globally
echo [INFO] Installing PM2...
npm install -g pm2
echo [SUCCESS] PM2 installed successfully

REM Deploy application
echo [INFO] Deploying CPay application...
cd /d "%APP_DIR%"

REM Copy application files (assuming they're in the current directory)
echo [INFO] Copying application files...
xcopy /E /I /Y "%~dp0*" "%APP_DIR%"

REM Install dependencies
echo [INFO] Installing npm dependencies...
npm install --production

REM Build application
echo [INFO] Building application...
npm run build

echo [SUCCESS] Application deployed successfully

REM Setup PM2
echo [INFO] Setting up PM2...
cd /d "%APP_DIR%"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

REM Create Windows service
echo [INFO] Creating Windows service...
pm2-service-install -n cpay

echo [SUCCESS] PM2 configured successfully

REM Setup IIS (if available)
echo [INFO] Setting up IIS configuration...
if exist "C:\Windows\System32\inetsrv\appcmd.exe" (
    REM Create application pool
    %windir%\system32\inetsrv\appcmd.exe add apppool /name:"cpay" /managedRuntimeVersion:"v4.0" /managedPipelineMode:"Integrated"
    
    REM Create website
    %windir%\system32\inetsrv\appcmd.exe add site /name:"cpay" /physicalPath:"%APP_DIR%" /bindings:"http/*:80:%DOMAIN%"
    
    REM Assign application pool
    %windir%\system32\inetsrv\appcmd.exe set app "cpay/" /applicationPool:"cpay"
    
    echo [SUCCESS] IIS configured successfully
) else (
    echo [WARNING] IIS not found, skipping IIS configuration
)

REM Setup Windows Firewall
echo [INFO] Setting up Windows Firewall...
netsh advfirewall firewall add rule name="CPay HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="CPay HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="CPay Node.js" dir=in action=allow protocol=TCP localport=3000
echo [SUCCESS] Firewall configured successfully

REM Create scheduled task for SSL renewal
echo [INFO] Setting up SSL renewal task...
schtasks /create /tn "CPay SSL Renewal" /tr "certbot renew" /sc daily /st 02:00 /ru "SYSTEM"
echo [SUCCESS] SSL renewal task created

REM Display deployment summary
echo.
echo [SUCCESS] CPay deployment completed successfully!
echo.
echo === Deployment Summary ===
echo Application URL: https://%DOMAIN%
echo Application Directory: %APP_DIR%
echo Log Directory: %LOG_DIR%
echo Backup Directory: %BACKUP_DIR%
echo.
echo === Useful Commands ===
echo View logs: pm2 logs cpay
echo Restart app: pm2 restart cpay
echo Stop app: pm2 stop cpay
echo IIS status: iisreset
echo.
echo === Next Steps ===
echo 1. Update your DNS to point %DOMAIN% to this server
echo 2. Configure your environment variables in %APP_DIR%\.env.local
echo 3. Test the application at https://%DOMAIN%
echo 4. Set up automated backups
echo 5. Configure monitoring and alerting
echo.

pause 