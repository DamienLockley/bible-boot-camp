@echo off
setlocal
set "ROOT=%~dp0.."
set "HERE=%~dp0"
if not exist "%HERE%index-normal.html" (
 echo ERROR: Missing index-normal.html. Do not restore without the original homepage.
 pause
 exit /b 1
)
if not exist "%ROOT%\index.html" (
 echo ERROR: Could not find index.html one folder above maintenance.
 pause
 exit /b 1
)
findstr /C:"Revelation Bible Studies: Maintenance mode marker" "%ROOT%\index.html" >nul 2>&1
if errorlevel 1 (
 echo ERROR: The active index.html is not the maintenance page.
 echo To avoid overwriting newer website changes, no files were changed.
 pause
 exit /b 1
)
copy /Y "%HERE%index-normal.html" "%ROOT%\index.html" >nul
if errorlevel 1 (
 echo ERROR: Could not restore homepage.
 pause
 exit /b 1
)
echo Normal homepage restored. Review changes in GitHub Desktop, then commit and push.
pause
