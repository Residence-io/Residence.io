@echo off
title Residence.io - Smart Society Management System
color 0A

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     Residence.io - Starting Application      ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo  [1/3] Installing dependencies... (first time only, please wait)
    call npm install
    echo  [1/3] Dependencies installed!
) else (
    echo  [1/3] Dependencies already installed. Skipping...
)

echo.
echo  [2/3] Starting API server on port 3001...
start "Residence.io API" cmd /k "title API Server (port 3001) && node node_modules\@nestjs\cli\bin\nest.js start --watch"

:: Wait 8 seconds for API to initialize
echo  Waiting for API to initialize...
timeout /t 8 /nobreak > nul

echo.
echo  [3/3] Starting Web server on port 3000...
start "Residence.io Web" cmd /k "title Web Server (port 3000) && cd apps\web && node ..\..\node_modules\next\dist\bin\next dev"

:: Wait 5 seconds for web to initialize
timeout /t 5 /nobreak > nul

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║           App is starting up!                ║
echo  ║                                              ║
echo  ║  Web:  http://localhost:3000/login           ║
echo  ║  API:  http://localhost:3001/api/v1          ║
echo  ║                                              ║
echo  ║  Username: superadmin                        ║
echo  ║  Password: (see .env RESIDENCE_SEED_PASSWORD)║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul
start "" "http://localhost:3000/login"

echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop the servers.
echo.
pause
