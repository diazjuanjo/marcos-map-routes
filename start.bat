@echo off
cd /d "%~dp0"
set PORT=5173

:: Ver si ya esta corriendo
netstat -ano | findstr ":%PORT%" >nul 2>&1
if %errorlevel%==0 (
    start http://localhost:%PORT%
    exit /b
)

:: Ver si existe dist
if not exist "dist\" (
    echo Compilando app...
    npx --yes vite build 2>nul
    if %errorlevel% neq 0 (
        echo Error: primero ejecuta run.bat para instalar dependencias
        pause
        exit /b
    )
)

echo Servidor iniciado en http://localhost:%PORT%
start http://localhost:%PORT%

:: Intentar con Node.js (npx serve), si no con Python
where npx >nul 2>&1
if %errorlevel%==0 (
    cd dist
    npx --yes serve
) else (
    cd dist
    python -m http.server %PORT%
)

pause
