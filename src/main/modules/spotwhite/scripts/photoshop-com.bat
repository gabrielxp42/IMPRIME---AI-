@echo off
REM Script batch para automação do Photoshop via COM usando VBScript
REM Uso: photoshop-com.bat <Action> <FilePath> <OutputPath> [ActionName] [ActionSet]

if "%~1"=="" (
    echo Uso: photoshop-com.bat ^<Action^> ^<FilePath^> ^<OutputPath^> [ActionName] [ActionSet]
    exit /b 1
)

set SCRIPT_DIR=%~dp0
set VBS_SCRIPT=%SCRIPT_DIR%photoshop-com.vbs

if not exist "%VBS_SCRIPT%" (
    echo Erro: Script VBScript nao encontrado: %VBS_SCRIPT%
    exit /b 1
)

REM Executar VBScript via cscript
cscript //nologo "%VBS_SCRIPT%" %*

if errorlevel 1 (
    exit /b 1
)

exit /b 0






