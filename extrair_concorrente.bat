@echo off
chcp 65001 >nul
echo Extraindo código do concorrente...

cd /d "%~dp0"

REM Procurar arquivo app.asar
for /r "C:\Program Files\dtf-dtg-indexcolor-ultra-pro" %%f in (app.asar) do (
    echo Encontrado: %%f
    echo Extraindo para: "%CD%\concorrente_extracted"
    
    REM Extrair usando npx asar
    npx asar extract "%%f" "%CD%\concorrente_extracted"
    
    echo.
    echo ✅ Extração concluída!
    echo 📁 Arquivos em: %CD%\concorrente_extracted
    echo.
    pause
    exit /b
)

echo ❌ Arquivo app.asar não encontrado
pause

