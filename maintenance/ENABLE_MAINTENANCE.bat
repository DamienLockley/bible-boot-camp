@echo off
setlocal
set "ROOT=%~dp0.."
set "HERE=%~dp0"
if not exist "%ROOT%\index.html" (
 echo ERROR: Could not find index.html one folder above maintenance.
 echo Put the maintenance folder directly inside your GitHub repository root.
 pause
 exit /b 1
)
if not exist "%HERE%index-maintenance.html" (
 echo ERROR: Missing index-maintenance.html
 pause
 exit /b 1
)
findstr /C:"Getting to Know Jesus: Maintenance mode marker" "%ROOT%\index.html" >nul 2>&1
if not errorlevel 1 (
 echo Maintenance mode is already active. No files changed.
 pause
 exit /b 0
)
copy /Y "%ROOT%\index.html" "%HERE%index-normal.html" >nul
if errorlevel 1 goto :failed
copy /Y "%HERE%index-maintenance.html" "%ROOT%\index.html" >nul
if errorlevel 1 goto :failed
echo Maintenance page enabled. The original homepage was saved as maintenance\index-normal.html.
echo Review changes in GitHub Desktop, then commit and push.
pause
exit /b 0
:failed
echo ERROR: Could not copy files. No GitHub changes were published.
pause
exit /b 1
