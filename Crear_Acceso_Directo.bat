@echo off
chcp 65001 >nul
title Crear Acceso Directo - Optima POS
color 0A

echo ===================================================================
echo             CREAR ACCESO DIRECTO - OPTIMA POS
echo ===================================================================
echo.
echo Generando acceso directo en el Escritorio con el logo oficial...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut(\"$desktop\Optima POS.lnk\"); $s.TargetPath = '%~dp0Iniciar_OptimaPOS.bat'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0optima.ico'; $s.Description = 'Sistema de Punto de Venta & Gestión Optima POS'; $s.Save()"

if %errorlevel% equ 0 (
    echo.
    echo ✅ ¡Listo! El acceso directo "Optima POS" con su icono oficial
    echo    ha sido creado en tu Escritorio exitosamente.
) else (
    echo.
    echo ❌ Hubo un inconveniente al generar el acceso directo.
)
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
exit /b 0
