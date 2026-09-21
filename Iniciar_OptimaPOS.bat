@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Optima POS - Sistema de Punto de Venta
color 0B

echo ===================================================================
echo               INICIANDO OPTIMA POS CLOUD v1.0
echo            Sistema de Punto de Venta y Gestion Comercial
echo ===================================================================
echo.

rem 1. Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js desde https://nodejs.org antes de continuar.
    echo.
    echo Presiona una tecla para salir...
    pause >nul
    exit /b 1
)

rem 2. Liberar puertos 3001 y 5173 de sesiones previas que hayan quedado abiertas
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do taskkill /f /pid %%a >nul 2>nul

rem 3. Verificar archivo de configuracion .env
if not exist ".env" (
    if exist ".env.example" (
        echo [AVISO] Creando archivo .env a partir de .env.example...
        copy ".env.example" ".env" >nul
        echo [!] Configura tus credenciales en .env si usas la nube.
        echo.
    )
)

rem 4. Verificar carpeta node_modules
if not exist "node_modules" (
    echo [1/3] Instalando dependencias necesarias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        echo Presiona una tecla para salir...
        pause >nul
        exit /b 1
    )
)

echo [1/3] Iniciando servidores de Optima POS (Frontend + Backend)...
start "OptimaPOS_Server" /min cmd /c "npm run dev"

echo [2/3] Esperando arranque de los servicios locales...
for /l %%i in (1,1,15) do (
    curl.exe -s -m 1 http://localhost:5173/ >nul 2>nul
    if not errorlevel 1 goto :server_ready
    ping -n 2 127.0.0.1 >nul
)

:server_ready
echo [3/3] Abriendo interfaz en el navegador...

rem 5. Buscar navegador para modo aplicacion
set BROWSER=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set BROWSER="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set BROWSER="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set BROWSER="%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set BROWSER="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set BROWSER="%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if defined BROWSER (
    start "" %BROWSER% --app=http://localhost:5173
) else (
    start http://localhost:5173
)

echo.
echo ===================================================================
echo   Optima POS se ha iniciado correctamente.
echo   No cierres esta ventana mientras uses el sistema.
echo ===================================================================
echo.
echo Presiona cualquier tecla para detener los servidores y salir...
pause >nul

echo.
echo Cerrando servidores...
taskkill /f /t /fi "WINDOWTITLE eq OptimaPOS_Server*" >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do taskkill /f /pid %%a >nul 2>nul
exit /b 0