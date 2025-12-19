@echo off
echo ========================================
echo LIMPEZA AGRESSIVA DA PASTA RELEASE
echo ========================================
echo.

echo [1/4] Fechando processos relacionados...
taskkill /F /IM "Spot White Automation.exe" 2>nul
taskkill /F /IM "electron.exe" 2>nul
taskkill /F /IM "Spot White Automation Setup*.exe" 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Tomando posse dos arquivos...
if exist "release" (
    takeown /F "release" /R /D Y >nul 2>&1
    icacls "release" /grant Administrators:F /T >nul 2>&1
)

echo [3/4] Removendo atributos de somente leitura...
if exist "release" (
    attrib -R "release\*.*" /S /D >nul 2>&1
)

echo [4/4] Excluindo pasta release...
if exist "release\win-unpacked" (
    rd /s /q "release\win-unpacked" 2>nul
)
if exist "release" (
    rd /s /q "release" 2>nul
)

echo.
if exist "release" (
    echo ========================================
    echo FALHA: Nao foi possivel excluir completamente.
    echo ========================================
    echo.
    echo SOLUCOES:
    echo 1. Feche TODOS os programas (Photoshop, executavel, etc)
    echo 2. Reinicie o computador
    echo 3. Ou tente fazer o build mesmo assim (pode funcionar)
    echo.
) else (
    echo ========================================
    echo SUCESSO: Pasta release excluida!
    echo ========================================
    echo.
    echo Agora voce pode executar: npm run build
    echo.
)

pause

