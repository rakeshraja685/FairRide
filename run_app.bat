@echo off
echo ===================================================
echo   Starting FairRide Server to bypass CORS blocking...
echo ===================================================
echo.
echo Installing local server (takes 5 seconds)...
call npx http-server . -o
pause
