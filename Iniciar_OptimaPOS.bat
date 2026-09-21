@echo off
chcp 65001 >nul
title Optima POS - Sistema de Punto de Venta y Gestión
color 0B

echo ===================================================================
echo               🛒 INICIANDO OPTIMA POS CLOUD v1.0
echo            Sistema de Punto de Venta & Gestión Comercial
echo ===================================================================
echo.

:: 1. Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js desde https://nodejs.org antes de continuar.
    pause
    exit /b 1
)

:: 2. Posicionarse en la carpeta del script
cd /d "%~dp0"

:: 3. Verificar archivo de configuración .env
if not exist ".env" (
    if exist ".env.example" (
        echo [AVISO] No se encontró el archivo .env. Creando uno a partir de .env.example...
        copy ".env.example" ".env" >nul
        echo [!] Recuerda colocar tus credenciales de Supabase en el archivo .env si usas la nube.
        echo.
    )
)

:: 4. Verificar node_modules
if not exist "node_modules\" (
    echo [1/3] Instalando dependencias necesarias (primera ejecución)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Falló la instalación de dependencias.
        pause
        exit /b 1
    )
)

echo [1/3] Iniciando servidores de Optima POS (Frontend + Backend)...
:: Iniciar el proceso concurrente en segundo plano minimizado
start /min "OptimaPOS_Core" cmd /c "npm run dev"

echo [2/3] Esperando arranque de los servicios locales (4 segundos)...
timeout /t 4 /nobreak >nul

echo [3/3] Abriendo interfaz de Punto de Venta en modo aplicación...

:: 4. Buscar Google Chrome para abrir en modo App Window (Sin barra de direcciones)
set BROWSER_CMD=""

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set BROWSER_CMD="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set BROWSER_CMD="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_CMD="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_CMD="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_CMD="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if %BROWSER_CMD% neq "" (
    :: Inicia en ventana limpia independiente (Modo App)
    start "" %BROWSER_CMD% --app=http://localhost:5173
) else (
    :: Navegador por defecto del sistema
    start http://localhost:5173
)

echo.
echo ===================================================================
echo  ✅ Optima POS se ha iniciado correctamente.
echo  ⚠️  No cierres esta ventana de consola mientras uses el sistema.
echo ===================================================================
echo.
echo Presiona cualquier tecla para detener los servidores y salir...
pause >nul

:: Terminar procesos al cerrar el lanzador
taskkill /f /fi "WINDOWTITLE eq OptimaPOS_Core*" >nul 2>nul
exit /b 0
