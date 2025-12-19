@echo off
echo Fechando processos relacionados...
taskkill /F /IM "Spot White Automation.exe" 2>nul
taskkill /F /IM "electron.exe" 2>nul
timeout /t 3 /nobreak >nul

echo Limpando pasta release...
if exist "release\win-unpacked" (
    rd /s /q "release\win-unpacked" 2>nul
)
if exist "release" (
    rd /s /q "release" 2>nul
)

if exist "release" (
    echo.
    echo AVISO: Nao foi possivel excluir a pasta release completamente.
    echo Por favor, feche todos os programas e tente novamente.
    echo.
    pause
) else (
    echo.
    echo Pasta release excluida com sucesso!
    echo Agora voce pode executar: npm run build
    echo.
    pause
)

