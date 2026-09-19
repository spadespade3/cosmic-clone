@echo off
rem dandesigns - one-click local server. Closing this window stops the server.
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python not found on PATH.
  echo Serve this folder with any static server, or install Python first.
  pause
  exit /b 1
)

set "PORT="
for /f %%p in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$l=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,0);$l.Start();$p=$l.LocalEndpoint.Port;$l.Stop();$p"') do set "PORT=%%p"

echo.
echo   dandesigns - one-click launch
echo   Serving on   http://localhost:%PORT%
echo   Closing this window stops the server.
echo.
start "" "http://localhost:%PORT%/"
python -m http.server %PORT% --bind 0.0.0.0
pause