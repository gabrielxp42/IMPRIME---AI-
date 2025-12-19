@echo off
echo Iniciando Servidor TESTER (InSPyReNet High Quality)...
echo Porta: 8001
echo --
cd /d "%~dp0"
python src/backend/tester_server.py
pause
