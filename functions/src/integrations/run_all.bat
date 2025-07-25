@echo off
REM --- Run All: eMango Pay Integration ---

REM Activate Python venv
call venv\Scripts\activate

REM Start Python service in background
start "eMangoPayService" cmd /c "py emango_pay_service.py"

REM Wait for service to start
ping 127.0.0.1 -n 6 >nul

REM Run Node.js end-to-end test
node test_emango_endpoints.js

echo All tests complete. Check above for results. 