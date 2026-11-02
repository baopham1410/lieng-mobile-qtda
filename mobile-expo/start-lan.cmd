@echo off
cd /d "%~dp0"

REM CMD: set hostname so QR is exp://IP:8081 (not 127.0.0.1)
for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' } | Select-Object -First 1 -ExpandProperty IPAddress)"') do set "REACT_NATIVE_PACKAGER_HOSTNAME=%%i"

if not defined REACT_NATIVE_PACKAGER_HOSTNAME set "REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.247"

echo.
echo  Metro host: %REACT_NATIVE_PACKAGER_HOSTNAME%
echo  QR must look like: exp://%REACT_NATIVE_PACKAGER_HOSTNAME%:8081
echo  (If Expo still prints 127.0.0.1, type that URL manually in Expo Go)
echo.

call npm.cmd exec -- expo start --lan --port 8081
