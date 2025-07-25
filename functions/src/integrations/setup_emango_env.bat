@echo off
REM --- eMango Pay Python Environment Setup Script ---

REM Check for Python
where py >nul 2>nul
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python 3.8+ from https://www.python.org/downloads/ and rerun this script.
    exit /b 1
)

REM Create virtual environment
py -m venv venv

REM Activate virtual environment
call venv\Scripts\activate

REM Upgrade pip
py -m pip install --upgrade pip

REM Install requirements
pip install -r requirements.txt

REM Create .env template
if not exist .env (
    echo EMANGO_MERCH_SEQ=your_merchant_id> .env
    echo EMANGO_SECRET_KEY=your_secret_key>> .env
    echo EMANGO_API_BASE_URL=https://test.e-mango.ph>> .env
    echo PORT=5000>> .env
    echo .env file created. Please fill in your credentials.
) else (
    echo .env file already exists. Please verify your credentials.
)

echo Setup complete. To activate the environment, run:
echo   call venv\Scripts\activate
echo To start the service, run:
echo   py emango_pay_service.py 