@echo off
setlocal
cd /d "%~dp0"
echo.
echo GTKJ English Desktop Review - localhost preview
echo Open your browser at http://localhost:8765/
echo Press Ctrl+C here to stop the preview server.
echo.
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8765/"
  py -3 -m http.server 8765 --bind 127.0.0.1
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8765/"
  python -m http.server 8765 --bind 127.0.0.1
  goto :eof
)
echo Python was not found. Use your existing Site Manager local-host preview instead.
echo Select this extracted site's index.html as the site root.
pause
