@echo off
chcp 65001 >nul
echo ============================================================
echo TESTE: Processamento Halftone no Documento Ativo
echo ============================================================
echo.
echo INSTRUÇÕES:
echo 1. Abra o Photoshop
echo 2. Abra QUALQUER arquivo de imagem
echo 3. Execute este script
echo.
echo ============================================================
echo.

cd /d "%~dp0"
python test_photoshop_real.py

pause

