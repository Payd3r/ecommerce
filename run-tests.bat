@echo off
setlocal

REM Definisci il percorso allo script PowerShell
set PS_SCRIPT=Test\RunTests.ps1

REM Ottieni il primo parametro se presente
set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all

REM Controlla se il secondo parametro è "rebuild"
set REBUILD=
if /i "%2"=="rebuild" set REBUILD=-Rebuild

REM Visualizza le informazioni sul test da eseguire
echo Esecuzione test: %TEST_TYPE%
if defined REBUILD echo Con ricostruzione dei container

REM Esegui lo script PowerShell con i parametri
powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -TestType %TEST_TYPE% %REBUILD%

endlocal 