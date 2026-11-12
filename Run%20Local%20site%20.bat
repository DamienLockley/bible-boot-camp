@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Getting to Know Jesus - Local Website

set "PORT=8000"
set "PYTHON_CMD="

where py >nul 2>&1
if not errorlevel 1 (
    py -3 --version >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=py -3"
)
if not defined PYTHON_CMD (
    where python >nul 2>&1
    if not errorlevel 1 (
        python --version >nul 2>&1
        if not errorlevel 1 set "PYTHON_CMD=python"
    )
)

if not defined PYTHON_CMD (
    echo.
    echo Python was not found on this computer.
    echo Install Python from https://www.python.org/downloads/
    echo During installation, enable "Add Python to PATH".
    echo Then double-click this file again.
    echo.
    pause
    exit /b 1
)

echo.
echo =============================================
echo    GETTING TO KNOW JESUS - LOCAL TEST SITE
 echo =============================================
echo.
echo Website folder: "%CD%"
echo Local address:  http://localhost:%PORT%/
echo.
echo This tests the files in this folder ONLY.
echo Your public GitHub website is not changed.
echo.
echo Leave this window open while testing.
echo To stop the website, press Ctrl+C here.
echo.

rem Open the browser after the server has had time to start.
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8000/'"

%PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1
if errorlevel 1 (
    echo.
    echo The local site could not start. Port %PORT% may already be in use.
    echo If a previous server window is open, close it and try again.
    echo.
    pause
)
endlocal
