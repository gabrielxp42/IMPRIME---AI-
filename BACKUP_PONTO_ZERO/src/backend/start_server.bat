@echo off
echo ========================================
echo   SAM Background Removal API Server
echo ========================================
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv" (
    echo [1/4] Criando ambiente virtual...
    python -m venv venv
)

echo [2/4] Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo [3/4] Instalando dependencias...
pip install -q -r requirements.txt

echo [4/4] Iniciando servidor FastAPI...
echo.
echo ========================================
echo   Servidor iniciado em http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo   Pressione Ctrl+C para parar
echo ========================================
echo.

python sam_server.py

pause
